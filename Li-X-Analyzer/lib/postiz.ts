const CLOUD_API = "https://api.postiz.com/public/v1";

/** Postiz cloud's dashboard (platform.postiz.com) is not its API, so map it to the API address. */
export function resolveBase(raw?: string) {
  const url = (raw || CLOUD_API).trim().replace(/\/+$/, "");
  return /^https?:\/\/(platform|app)\.postiz\.com$/i.test(url) ? CLOUD_API : url;
}

const base = () => resolveBase(process.env.POSTIZ_API_URL);

export type PostizChannel = {
  id: string;
  name: string;
  identifier: string;
  picture?: string;
  profile?: string;
  disabled?: boolean;
};

export type PostizPost = {
  id: string;
  content?: string;
  publishDate?: string;
  state?: string;
  releaseURL?: string | null;
  integration?: { id: string; providerIdentifier?: string; name?: string };
};

export type AnalyticsSeries = {
  label: string;
  data: Array<{ total: string | number; date: string }>;
};

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const key = process.env.POSTIZ_API_KEY;
  if (!key) throw new Error("POSTIZ_API_KEY is not set");
  const res = await fetch(`${base()}${path}`, {
    ...init,
    headers: { Authorization: key, "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Postiz ${res.status} on ${path}: ${(await res.text()).slice(0, 300)}`);
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

// Channels rarely change and every call counts against Postiz's hourly limit, so keep them for a few minutes.
let channelCache: { at: number; data: PostizChannel[] } | null = null;
export async function listChannels() {
  if (channelCache && Date.now() - channelCache.at < 5 * 60_000) return channelCache.data;
  const data = await call<PostizChannel[]>("/integrations");
  channelCache = { at: Date.now(), data };
  return data;
}

// Pages ask for the same window again and again while we click around, and every call counts against Postiz's hourly limit.
const postCache = new Map<string, { at: number; data: PostizPost[] }>();
export async function listPosts(startDate: string, endDate: string, maxAgeMs = 30_000) {
  const key = `${startDate}|${endDate}`;
  const hit = postCache.get(key);
  if (hit && Date.now() - hit.at < maxAgeMs) return hit.data;
  const q = new URLSearchParams({ startDate, endDate });
  const out = await call<{ posts: PostizPost[] }>(`/posts?${q}`);
  const data = out.posts ?? [];
  postCache.set(key, { at: Date.now(), data });
  if (postCache.size > 40) postCache.delete(postCache.keys().next().value!);
  return data;
}

/** Forget cached lists, for example right after we schedule something. */
export const clearPostCache = () => postCache.clear();

export const channelAnalytics = (id: string, days: number) =>
  call<AnalyticsSeries[] | { missing: true }>(`/analytics/${id}?date=${days}`);

export const postAnalytics = (postId: string, days: number) =>
  call<AnalyticsSeries[] | { missing: true }>(`/analytics/post/${postId}?date=${days}`);

export type ScheduleInput = {
  content: string;
  thread?: string[]; // X only: one entry per post, replaces content when it has two or more
  date: string; // ISO
  channels: Array<Pick<PostizChannel, "id" | "identifier">>;
  now?: boolean;
};

export function buildSchedulePayload(input: ScheduleInput) {
  return {
    type: input.now ? "now" : "schedule",
    shortLink: false,
    date: input.date,
    tags: [],
    posts: input.channels.map((c) => ({
      integration: { id: c.id },
      value: (c.identifier === "x" && input.thread && input.thread.length > 1 ? input.thread : [input.content]).map((content) => ({ content, image: [] })),
      settings:
        c.identifier === "x"
          ? { __type: "x", who_can_reply_post: "everyone" }
          : { __type: c.identifier, post_as_images_carousel: false },
    })),
  };
}

export const schedulePost = async (input: ScheduleInput) => {
  const out = await call<unknown>("/posts", { method: "POST", body: JSON.stringify(buildSchedulePayload(input)) });
  clearPostCache();
  return out;
};

const METRIC_KEYS: Array<[string, RegExp]> = [
  ["impressions", /impression|view/i],
  ["likes", /like|reaction/i],
  ["comments", /comment|repl/i],
  ["shares", /share|repost|retweet|quote/i],
  ["clicks", /click/i],
  ["bookmarks", /bookmark/i],
];

/** Collapse Postiz analytics series into one number per metric (latest data point). Retweets and quotes both count as shares, so they add up. */
export function summarizeSeries(series: AnalyticsSeries[] | { missing: true }) {
  const out: Partial<Record<"impressions" | "likes" | "comments" | "shares" | "clicks" | "bookmarks", number>> = {};
  if (!Array.isArray(series)) return out;
  for (const s of series) {
    const hit = METRIC_KEYS.find(([, re]) => re.test(s.label));
    if (!hit || !s.data?.length) continue;
    const last = s.data[s.data.length - 1];
    const key = hit[0] as keyof typeof out;
    out[key] = (out[key] ?? 0) + Math.round(Number(last.total) || 0);
  }
  return out;
}
