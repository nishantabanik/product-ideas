import { db, ensureSchema } from "./db";
import { channelAnalytics, listChannels, listPosts, postAnalytics, summarizeSeries } from "./postiz";
import { externalId } from "./ids";
import { recordSnapshots } from "./pulse/store";
import { totalsFromSeries, weeklyBuckets, WEEKS, type Totals } from "./xaccount";

export const platformOf = (identifier: string) =>
  identifier.startsWith("linkedin") ? "linkedin" : identifier;

const DAY = 86_400_000;

type Row = Record<string, string | number | null>;

/** Runs `fn` over `items`, at most `limit` at a time. */
async function pool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  const queue = [...items];
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (let item = queue.shift(); item !== undefined; item = queue.shift()) await fn(item);
  }));
}

// Each Postiz call counts toward its hourly limit (about 90), so only post numbers that can still change are refreshed.
const MAX_POST_REFRESH = 40;
const RECENT_MS = 21 * DAY;

export async function syncFromPostiz(lookbackDays = 90, force = false) {
  await ensureSchema();
  const sql = db();
  const result = { channels: 0, posts: 0, postsWithMetrics: 0, xAccounts: 0, errors: [] as string[] };

  const channels = (await listChannels()).filter((c) => !c.disabled);
  if (channels.length) {
    await sql`insert into channels ${sql(channels.map((c): Row => ({ id: c.id, name: c.name, platform: platformOf(c.identifier), picture: c.picture ?? null, profile: c.profile ?? null })), "id", "name", "platform", "picture", "profile")}
      on conflict (id) do update set name = excluded.name, picture = excluded.picture, profile = excluded.profile`;
    result.channels = channels.length;
  }
  const platformByChannel = new Map(channels.map((c) => [c.id, platformOf(c.identifier)]));

  // Independent work runs side by side: channel level numbers for non X channels (LinkedIn personal profiles return nothing from
  // Postiz, which is expected), the X account totals, and the list of posts.
  const end = new Date(Date.now() + 7 * DAY);
  const start = new Date(Date.now() - lookbackDays * DAY);
  const [, , posts] = await Promise.all([
    pool(channels.filter((c) => c.identifier !== "x"), 3, async (c) => {
      try {
        const series = await channelAnalytics(c.id, 30);
        if (!Array.isArray(series)) return;
        const points: Row[] = [];
        for (const sr of series) for (const pt of sr.data ?? []) {
          const day = new Date(pt.date);
          if (!Number.isNaN(day.getTime())) points.push({ channel_id: c.id, label: sr.label, day: day.toISOString().slice(0, 10), total: Number(pt.total) || 0 });
        }
        const unique = [...new Map(points.map((p) => [`${p.label}|${p.day}`, p])).values()];
        if (unique.length) {
          await sql`insert into channel_metrics ${sql(unique, "channel_id", "label", "day", "total")}
            on conflict (channel_id, label, day) do update set total = excluded.total`;
        }
      } catch (e) {
        result.errors.push(`channel ${c.name}: ${(e as Error).message}`);
      }
    }),
    pool(channels.filter((c) => c.identifier === "x"), 2, async (c) => {
      try {
        const outcome = await refreshXAccount(c.id, force);
        if (outcome === "refreshed") result.xAccounts++;
        if (outcome === "failed") result.errors.push(`X account ${c.name}: Postiz returned inconsistent totals, kept the previous numbers`);
      } catch (e) {
        result.errors.push(`X account ${c.name}: ${(e as Error).message}`);
      }
    }),
    listPosts(start.toISOString(), end.toISOString(), 0),
  ]);

  const mine = posts.filter((p) => p.integration?.id && platformByChannel.has(p.integration.id));
  if (!mine.length) return result;

  const known = await sql<{ id: string; impressions: number | null }[]>`select id, impressions from posts where id = any(${mine.map((p) => p.id)})`;
  const measured = new Map(known.map((k) => [k.id, k.impressions !== null]));

  const rows: Row[] = [...new Map(mine.map((p): [string, Row] => [p.id, {
    id: p.id, channel_id: p.integration!.id, platform: platformByChannel.get(p.integration!.id)!, content: stripHtml(p.content ?? ""),
    published_at: p.publishDate ?? null, state: p.state ?? null, url: p.releaseURL ?? null, external_id: externalId(p.releaseURL), source: "postiz",
  }])).values()];
  for (let i = 0; i < rows.length; i += 500) {
    await sql`insert into posts ${sql(rows.slice(i, i + 500), "id", "channel_id", "platform", "content", "published_at", "state", "url", "external_id", "source")}
      on conflict (id) do update set content = excluded.content, published_at = excluded.published_at, state = excluded.state, url = excluded.url, external_id = coalesce(excluded.external_id, posts.external_id), updated_at = now()`;
  }
  result.posts = rows.length;

  const candidates = mine
    .filter((p) => p.state === "PUBLISHED")
    .filter((p) => !measured.get(p.id) || Date.now() - new Date(p.publishDate ?? 0).getTime() < RECENT_MS)
    .sort((a, b) => Number(measured.get(a.id) ?? false) - Number(measured.get(b.id) ?? false) || (b.publishDate ?? "").localeCompare(a.publishDate ?? ""))
    .slice(0, MAX_POST_REFRESH);

  const metrics: Row[] = [];
  await pool(candidates, 5, async (p) => {
    try {
      const m = summarizeSeries(await postAnalytics(p.id, 30));
      if (Object.keys(m).length) metrics.push({ id: p.id, impressions: m.impressions ?? null, likes: m.likes ?? null, comments: m.comments ?? null, shares: m.shares ?? null, clicks: m.clicks ?? null });
    } catch (e) {
      result.errors.push(`post ${p.id}: ${(e as Error).message}`);
    }
  });
  if (metrics.length) {
    await sql`update posts set impressions = v.impressions::int, likes = v.likes::int, comments = v.comments::int, shares = v.shares::int, clicks = v.clicks::int, updated_at = now()
      from (values ${sql(metrics.map((m) => [m.id, m.impressions, m.likes, m.comments, m.shares, m.clicks] as never))}) as v(id, impressions, likes, comments, shares, clicks)
      where posts.id = v.id`;
    result.postsWithMetrics = metrics.length;
    // Every refresh also leaves a snapshot, so each post builds a growth curve over the days after it went out.
    await recordSnapshots(metrics.map((m) => ({ postId: String(m.id), impressions: m.impressions as number | null, likes: m.likes as number | null, comments: m.comments as number | null, shares: m.shares as number | null, clicks: m.clicks as number | null })), 60).catch(() => 0);
  }
  return result;
}

export function stripHtml(s: string) {
  return s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

const REFRESH_AFTER_MS = 6 * 3_600_000;

/**
 * Loads the totals of all our original X posts (not only the ones made through Postiz) for the last 7, 14, ... 84 days
 * and stores the 12 separate weeks. Skipped when the stored numbers are fresh, unless forced.
 */
async function refreshXAccount(channelId: string, force: boolean): Promise<"refreshed" | "fresh" | "failed"> {
  const sql = db();
  if (!force) {
    const [row] = await sql<{ age: number | null }[]>`select extract(epoch from now() - max(captured_at))::float as age from account_buckets where channel_id = ${channelId}`;
    if (row?.age !== null && row?.age !== undefined && row.age * 1000 < REFRESH_AFTER_MS) return "fresh";
  }

  const running: Totals[] = new Array(WEEKS);
  const queue = Array.from({ length: WEEKS }, (_, i) => i);
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      for (let i = queue.shift(); i !== undefined; i = queue.shift()) {
        running[i] = totalsFromSeries(await channelAnalytics(channelId, 7 * (i + 1)));
      }
    }),
  );

  const weeks = weeklyBuckets(running);
  if (!weeks) return "failed";
  for (const [i, w] of weeks.entries()) {
    await sql`insert into account_buckets (channel_id, week, impressions, likes, comments, shares, bookmarks, captured_at)
      values (${channelId}, ${i + 1}, ${w.impressions}, ${w.likes}, ${w.comments}, ${w.shares}, ${w.bookmarks}, now())
      on conflict (channel_id, week) do update set impressions = excluded.impressions, likes = excluded.likes,
        comments = excluded.comments, shares = excluded.shares, bookmarks = excluded.bookmarks, captured_at = now()`;
  }
  return "refreshed";
}
