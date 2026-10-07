import { db, ensureSchema } from "../db";
import type { SnapRow } from "./curve.ts";

export type Alert = { id: string; postId: string | null; kind: string; title: string; detail: string; level: "good" | "warn" | "info"; seen: boolean; createdAt: string };
const newId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 14);

export type SnapshotInput = { postId: string; impressions: number | null; likes: number | null; comments: number | null; shares: number | null; clicks: number | null };

/** One row per post per check. Posts checked less than `minGapMinutes` ago are skipped, so frequent runs do not pile up rows. */
export async function recordSnapshots(rows: SnapshotInput[], minGapMinutes = 8) {
  if (!rows.length) return 0;
  await ensureSchema();
  const sql = db();
  const recent = await sql<{ post_id: string }[]>`select distinct post_id from post_snapshots where post_id = any(${rows.map((r) => r.postId)}) and taken_at > now() - make_interval(mins => ${minGapMinutes})`;
  const skip = new Set(recent.map((r) => r.post_id));
  const fresh = rows.filter((r) => !skip.has(r.postId));
  if (!fresh.length) return 0;
  await sql`insert into post_snapshots ${sql(fresh.map((r) => ({ post_id: r.postId, impressions: r.impressions, likes: r.likes, comments: r.comments, shares: r.shares, clicks: r.clicks })), "post_id", "impressions", "likes", "comments", "shares", "clicks")} on conflict do nothing`;
  await sql`delete from post_snapshots where taken_at < now() - interval '180 days'`;
  return fresh.length;
}

export async function snapshotsFor(postId: string): Promise<SnapRow[]> {
  await ensureSchema();
  const rows = await db()<{ taken_at: Date; impressions: number | null; likes: number | null; comments: number | null; shares: number | null; clicks: number | null }[]>`
    select taken_at, impressions, likes, comments, shares, clicks from post_snapshots where post_id = ${postId} order by taken_at`;
  return rows.map((r) => ({ takenAt: new Date(r.taken_at).toISOString(), impressions: r.impressions, likes: r.likes, comments: r.comments, shares: r.shares, clicks: r.clicks }));
}

/** Snapshots of older posts that have a long history, for learning our own curve. */
export async function snapshotHistory(limitPosts = 60): Promise<{ postId: string; publishedAt: string; snaps: { takenAt: string; impressions: number | null }[] }[]> {
  await ensureSchema();
  const rows = await db()<{ post_id: string; published_at: Date; taken_at: Date; impressions: number | null }[]>`
    select s.post_id, p.published_at, s.taken_at, s.impressions
    from post_snapshots s join posts p on p.id = s.post_id
    where p.published_at is not null and p.id in (select post_id from post_snapshots group by post_id having count(*) >= 3 order by max(taken_at) desc limit ${limitPosts})
    order by s.post_id, s.taken_at`;
  const by = new Map<string, { postId: string; publishedAt: string; snaps: { takenAt: string; impressions: number | null }[] }>();
  for (const r of rows) {
    const e = by.get(r.post_id) ?? { postId: r.post_id, publishedAt: new Date(r.published_at).toISOString(), snaps: [] };
    e.snaps.push({ takenAt: new Date(r.taken_at).toISOString(), impressions: r.impressions });
    by.set(r.post_id, e);
  }
  return [...by.values()];
}

/** Typical final impressions of our recent posts on a platform, the baseline a new post is compared with. */
export async function typicalFinal(platform: string): Promise<{ median: number | null; n: number }> {
  await ensureSchema();
  const [r] = await db()<{ m: number | null; n: number }[]>`
    select (percentile_cont(0.5) within group (order by impressions))::float8 as m, count(*)::int as n from (
      select impressions from posts where platform = ${platform} and state = 'PUBLISHED' and impressions > 0 and published_at < now() - interval '3 days'
      order by published_at desc limit 40) t`;
  return { median: r?.m ?? null, n: r?.n ?? 0 };
}

const toAlert = (r: { id: string; post_id: string | null; kind: string; title: string; detail: string; level: Alert["level"]; seen: boolean; created_at: Date }): Alert =>
  ({ id: r.id, postId: r.post_id, kind: r.kind, title: r.title, detail: r.detail, level: r.level, seen: r.seen, createdAt: new Date(r.created_at).toISOString() });

/** Adds an alert once per post and kind. Returns true when it is new. */
export async function addAlert(a: { postId: string; kind: string; title: string; detail: string; level: Alert["level"] }) {
  await ensureSchema();
  const r = await db()`insert into alerts (id, post_id, kind, title, detail, level) values (${newId()}, ${a.postId}, ${a.kind}, ${a.title}, ${a.detail}, ${a.level}) on conflict (post_id, kind) do nothing returning id`;
  return r.length > 0;
}

export async function listAlerts(limit = 100): Promise<Alert[]> {
  await ensureSchema();
  const rows = await db()<Parameters<typeof toAlert>[0][]>`select * from alerts order by created_at desc limit ${limit}`;
  return rows.map(toAlert);
}
export async function unseenAlerts(): Promise<number> {
  await ensureSchema();
  const [r] = await db()<{ n: number }[]>`select count(*)::int as n from alerts where not seen`;
  return r?.n ?? 0;
}
export async function markAllSeen() {
  await ensureSchema();
  await db()`update alerts set seen = true where not seen`;
}
