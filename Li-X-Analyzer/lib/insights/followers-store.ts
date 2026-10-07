import { db, ensureSchema } from "../db";
import type { FollowerDay, PostIn } from "./followers";

export type Platform = "linkedin" | "x";

export async function loadFollowerRows(platform: Platform): Promise<FollowerDay[]> {
  await ensureSchema();
  return db()<FollowerDay[]>`
    select to_char(day, 'YYYY-MM-DD') as day, total, gained, lost from follower_log where platform = ${platform} order by day`;
}

export async function loadPostsFor(platform: Platform): Promise<(PostIn & { id: string })[]> {
  await ensureSchema();
  const rows = await db()<{ id: string; platform: string; published_at: Date | null; content: string }[]>`
    select id, platform, published_at, content from posts
    where platform = ${platform} and published_at is not null and (state is null or state = 'PUBLISHED')
    order by published_at`;
  return rows.map((r) => ({ ...r, published_at: r.published_at ? new Date(r.published_at).toISOString() : null }));
}

/** One day typed in by hand. Keeps any gained or lost numbers an import already stored for that day. */
export async function saveFollowerDay(platform: Platform, day: string, total: number) {
  await ensureSchema();
  await db()`insert into follower_log (platform, day, total, source) values (${platform}, ${day}::date, ${total}, 'manual')
    on conflict (platform, day) do update set total = excluded.total, source = 'manual'`;
}

export async function deleteFollowerDay(platform: Platform, day: string) {
  await ensureSchema();
  await db()`delete from follower_log where platform = ${platform} and day = ${day}::date`;
}
