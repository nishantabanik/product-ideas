import { db, ensureSchema } from "../db";
import { listChannels, listPosts } from "../postiz";
import { commentStats } from "../comments/store";
import { platformOf, stripHtml } from "../sync";
import type { AdvisoryInput, DailyFact, PostFact, Scheduled, XWeek } from "./types.ts";

async function scheduled(now: Date): Promise<Scheduled[] | null> {
  try {
    const end = new Date(now.getTime() + 14 * 86_400_000);
    const [channels, posts] = await Promise.all([listChannels(), listPosts(now.toISOString(), end.toISOString(), 0)]);
    const by = new Map(channels.map((c) => [c.id, c]));
    return posts
      .filter((p) => p.state === "QUEUE" && p.publishDate && new Date(p.publishDate) > now)
      .map((p) => ({ platform: platformOf(by.get(p.integration?.id ?? "")?.identifier ?? p.integration?.providerIdentifier ?? ""), date: p.publishDate!, text: stripHtml(p.content ?? "") }))
      .filter((p): p is Scheduled => p.platform === "x" || p.platform === "linkedin");
  } catch {
    return null; // Postiz not reachable, so we do not claim the queue is empty
  }
}

/** Everything the advisory looks at, in one round of queries. */
export async function loadInput(now = new Date()): Promise<AdvisoryInput> {
  await ensureSchema();
  const sql = db();
  const [posts, daily, weeks, queue, comments] = await Promise.all([
    sql<(Omit<PostFact, "publishedAt"> & { published_at: Date | null })[]>`
      select id, platform, content, published_at, url, impressions, engagements, likes, comments, shares, clicks, source
      from posts where state = 'PUBLISHED' and published_at is not null and published_at > now() - interval '400 days'
      order by published_at desc limit 3000`,
    sql<DailyFact[]>`
      select to_char(day, 'YYYY-MM-DD') as day, impressions, engagements from daily_metrics
      where platform = 'linkedin' and day > current_date - 800 order by day`,
    sql<XWeek[]>`
      select ab.week, sum(ab.impressions)::int as impressions, sum(ab.likes)::int as likes, sum(ab.comments)::int as comments,
             sum(ab.shares)::int as shares, sum(ab.bookmarks)::int as bookmarks
      from account_buckets ab join channels c on c.id = ab.channel_id where c.platform = 'x' group by ab.week order by ab.week`,
    scheduled(now),
    commentStats().catch(() => []),
  ]);
  return {
    now: now.toISOString(),
    posts: posts.map((p) => ({ ...p, publishedAt: p.published_at ? new Date(p.published_at).toISOString() : null })).filter((p) => p.platform === "linkedin" || p.platform === "x"),
    linkedinDaily: daily,
    xWeeks: weeks,
    scheduled: queue,
    comments,
  };
}
