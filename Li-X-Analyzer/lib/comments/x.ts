import { oauth1Header, type Creds } from "./oauth1.ts";
import type { NewComment } from "./types.ts";

/**
 * Our own X developer app, signed in as our own account with OAuth 1.0a keys (the four values the X developer console shows
 * under Keys and tokens). X charges per use: about half a cent for every post read and a little more for every post we send.
 */
export const xConfigured = () => Boolean(process.env.X_API_KEY && process.env.X_API_SECRET && process.env.X_ACCESS_TOKEN && process.env.X_ACCESS_SECRET);
const base = () => (process.env.X_API_BASE || "https://api.x.com").replace(/\/$/, "");
const creds = (): Creds => ({ key: process.env.X_API_KEY!, secret: process.env.X_API_SECRET!, token: process.env.X_ACCESS_TOKEN!, tokenSecret: process.env.X_ACCESS_SECRET! });

export function explainX(status: number, body: string) {
  const snippet = body.replace(/\s+/g, " ").slice(0, 220);
  if (status === 401) return `X rejected our keys (HTTP 401). Check X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN and X_ACCESS_SECRET. ${snippet}`;
  if (status === 402) return "X says our API credits ran out (HTTP 402). Add credits in the X developer console.";
  if (status === 403) return `X refused this (HTTP 403). The app needs Read and write permission, and the access token must be generated after that change. ${snippet}`;
  if (status === 429) return "X is rate limiting us (HTTP 429). Try again in a few minutes.";
  return `X answered HTTP ${status}. ${snippet}`;
}

async function call<T>(method: "GET" | "POST", path: string, query: Record<string, string> = {}, json?: unknown): Promise<T> {
  const url = new URL(base() + path);
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    method,
    headers: { authorization: oauth1Header(method, url.toString().split("?")[0], Object.fromEntries(url.searchParams), creds()), ...(json ? { "content-type": "application/json" } : {}) },
    body: json ? JSON.stringify(json) : undefined,
    signal: AbortSignal.timeout(30_000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(explainX(res.status, text));
  return JSON.parse(text) as T;
}

export const xMe = async () => (await call<{ data: { id: string; username: string; name: string } }>("GET", "/2/users/me")).data;

type Tweet = {
  id: string; text: string; author_id?: string; created_at?: string; conversation_id?: string; in_reply_to_user_id?: string;
  referenced_tweets?: { type: string; id: string }[]; public_metrics?: { like_count?: number };
};
type MentionsResponse = { data?: Tweet[]; includes?: { users?: { id: string; username: string; name: string }[] }; meta?: { newest_id?: string; result_count?: number } };

/** Replies and mentions of our account since a given tweet id. Each tweet read is billed, so only new ones are asked for. */
export async function xMentions(userId: string, sinceId: string | null, max: number) {
  const q: Record<string, string> = {
    max_results: String(Math.min(100, Math.max(5, max))),
    "tweet.fields": "author_id,created_at,conversation_id,in_reply_to_user_id,referenced_tweets,public_metrics",
    expansions: "author_id",
    "user.fields": "username,name",
  };
  if (sinceId) q.since_id = sinceId;
  const r = await call<MentionsResponse>("GET", `/2/users/${userId}/mentions`, q);
  return { tweets: r.data ?? [], users: new Map((r.includes?.users ?? []).map((u) => [u.id, u])), newestId: r.meta?.newest_id ?? null };
}

export async function xReply(text: string, inReplyToId: string) {
  const r = await call<{ data: { id: string } }>("POST", "/2/tweets", {}, { text, reply: { in_reply_to_tweet_id: inReplyToId } });
  return r.data.id;
}

/** Maps what X returned to comments. `ours` resolves one of our posts from a tweet id. */
export function mentionsToComments(
  m: Awaited<ReturnType<typeof xMentions>>, myId: string, ours: (tweetId: string) => { id: string } | null,
): NewComment[] {
  return m.tweets
    .filter((t) => t.author_id !== myId)
    .map((t): NewComment => {
      const repliedTo = t.referenced_tweets?.find((r) => r.type === "replied_to")?.id ?? null;
      const root = t.conversation_id ?? repliedTo;
      const post = (repliedTo && ours(repliedTo)) || (root && ours(root)) || null;
      const u = t.author_id ? m.users.get(t.author_id) : undefined;
      return {
        platform: "x", postId: post?.id || null, postRef: repliedTo ?? root, externalId: t.id,
        authorName: u?.name ?? "Unknown", authorHandle: u ? `@${u.username}` : null, authorUrl: u ? `https://x.com/${u.username}` : null,
        body: t.text, commentedAt: t.created_at ?? null, source: "x_api", commentUrl: u ? `https://x.com/${u.username}/status/${t.id}` : null,
        likes: t.public_metrics?.like_count ?? null,
      };
    });
}
