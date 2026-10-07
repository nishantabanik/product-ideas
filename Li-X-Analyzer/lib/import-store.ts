import { db, ensureSchema } from "./db";
import { externalId } from "./ids";
import type { DailyRow, FollowerRow, ImportedPost, ParseResult } from "./import-parse";

export type Counts = { total: number; added: number; updated: number; unchanged: number };
export type StoreResult = {
  daily: Counts & { from: string | null; to: string | null };
  posts: Counts;
  followers: Counts;
  notes: string[];
};

type Row = Record<string, string | number | null>;
const CHUNK = 500;
const chunks = <T,>(list: T[]) => Array.from({ length: Math.ceil(list.length / CHUNK) }, (_, i) => list.slice(i * CHUNK, (i + 1) * CHUNK));

/**
 * Saves a parsed export. Everything is keyed, so uploading the same file again, or an overlapping one later, changes nothing it
 * already has: one row per platform and day, one row per post. When two exports disagree the higher number is kept, because
 * LinkedIn keeps counting impressions for a few days after a post, so an older file can never overwrite a settled value and the
 * result is the same in whatever order files are uploaded. Each batch is a single database round trip.
 */
export async function storeImport(parsed: ParseResult): Promise<StoreResult> {
  await ensureSchema();
  const sql = db();

  // One row per key inside the batch, because a single INSERT cannot touch the same row twice.
  const daily = [...new Map(parsed.daily.map((d) => [`${d.platform}|${d.day}`, d])).values()];
  const posts = [...new Map(parsed.posts.map((p) => [p.id, p])).values()];

  const dailyCounts = { total: daily.length, added: 0, updated: 0, unchanged: 0 };
  for (const part of chunks<DailyRow>(daily)) {
    const rows = await sql<{ inserted: boolean }[]>`
      insert into daily_metrics ${sql(part as unknown as Row[], "platform", "day", "impressions", "engagements", "likes", "comments", "shares", "clicks")}
      on conflict (platform, day) do update set
        impressions = greatest(excluded.impressions, daily_metrics.impressions),
        engagements = greatest(excluded.engagements, daily_metrics.engagements),
        likes = greatest(excluded.likes, daily_metrics.likes),
        comments = greatest(excluded.comments, daily_metrics.comments),
        shares = greatest(excluded.shares, daily_metrics.shares),
        clicks = greatest(excluded.clicks, daily_metrics.clicks),
        updated_at = now()
      where (daily_metrics.impressions, daily_metrics.engagements, daily_metrics.likes, daily_metrics.comments, daily_metrics.shares, daily_metrics.clicks)
        is distinct from (greatest(excluded.impressions, daily_metrics.impressions), greatest(excluded.engagements, daily_metrics.engagements),
          greatest(excluded.likes, daily_metrics.likes), greatest(excluded.comments, daily_metrics.comments),
          greatest(excluded.shares, daily_metrics.shares), greatest(excluded.clicks, daily_metrics.clicks))
      returning (xmax = 0) as inserted`;
    const added = rows.filter((r) => r.inserted).length;
    dailyCounts.added += added;
    dailyCounts.updated += rows.length - added;
  }
  dailyCounts.unchanged = dailyCounts.total - dailyCounts.added - dailyCounts.updated;

  const postCounts = { total: posts.length, added: 0, updated: 0, unchanged: 0 };
  for (const part of chunks<ImportedPost>(posts)) {
    const values = part.map((p) => ({
      id: p.id, platform: p.platform, content: p.content, published_at: p.publishedAt, url: p.url, external_id: externalId(p.url), source: "import", state: "PUBLISHED",
      impressions: p.impressions, engagements: p.engagements, likes: p.likes, comments: p.comments, shares: p.shares, clicks: p.clicks,
    }));
    const rows = await sql<{ inserted: boolean }[]>`
      insert into posts ${sql(values as Row[], "id", "platform", "content", "published_at", "url", "external_id", "source", "state", "impressions", "engagements", "likes", "comments", "shares", "clicks")}
      on conflict (id) do update set
        content = case when excluded.content <> '' then excluded.content else posts.content end,
        published_at = coalesce(excluded.published_at, posts.published_at),
        url = coalesce(excluded.url, posts.url),
        external_id = coalesce(excluded.external_id, posts.external_id),
        impressions = greatest(excluded.impressions, posts.impressions),
        engagements = greatest(excluded.engagements, posts.engagements),
        likes = greatest(excluded.likes, posts.likes),
        comments = greatest(excluded.comments, posts.comments),
        shares = greatest(excluded.shares, posts.shares),
        clicks = greatest(excluded.clicks, posts.clicks),
        updated_at = now()
      where (posts.impressions, posts.engagements, posts.likes, posts.comments, posts.shares, posts.clicks)
        is distinct from (greatest(excluded.impressions, posts.impressions), greatest(excluded.engagements, posts.engagements),
          greatest(excluded.likes, posts.likes), greatest(excluded.comments, posts.comments),
          greatest(excluded.shares, posts.shares), greatest(excluded.clicks, posts.clicks))
      returning (xmax = 0) as inserted`;
    const added = rows.filter((r) => r.inserted).length;
    postCounts.added += added;
    postCounts.updated += rows.length - added;
  }
  postCounts.unchanged = postCounts.total - postCounts.added - postCounts.updated;

  const followers = [...new Map((parsed.followers ?? []).map((f) => [`${f.platform}|${f.day}`, f])).values()];
  const followerCounts = { total: followers.length, added: 0, updated: 0, unchanged: 0 };
  for (const part of chunks<FollowerRow>(followers)) {
    const values = part.map((f) => ({ ...f, source: "import" }));
    const rows = await sql<{ inserted: boolean }[]>`
      insert into follower_log ${sql(values as unknown as Row[], "platform", "day", "total", "gained", "lost", "source")}
      on conflict (platform, day) do update set
        total = greatest(excluded.total, follower_log.total),
        gained = greatest(excluded.gained, follower_log.gained),
        lost = greatest(excluded.lost, follower_log.lost)
      where (follower_log.total, follower_log.gained, follower_log.lost)
        is distinct from (greatest(excluded.total, follower_log.total), greatest(excluded.gained, follower_log.gained), greatest(excluded.lost, follower_log.lost))
      returning (xmax = 0) as inserted`;
    const added = rows.filter((r) => r.inserted).length;
    followerCounts.added += added;
    followerCounts.updated += rows.length - added;
  }
  followerCounts.unchanged = followerCounts.total - followerCounts.added - followerCounts.updated;

  const days = daily.map((d) => d.day).sort();
  return { daily: { ...dailyCounts, from: days[0] ?? null, to: days[days.length - 1] ?? null }, posts: postCounts, followers: followerCounts, notes: parsed.notes };
}
