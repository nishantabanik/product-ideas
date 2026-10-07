import { db, ensureSchema } from "./db";
import type { Bucket, Unit } from "./ranges";

export type Coverage = { min: string | null; max: string | null; days: number };
export type TopPost = {
  id: string; platform: string; content: string; url: string | null; published_at: string | null;
  impressions: number | null; engagements: number | null; likes: number | null; comments: number | null; shares: number | null; clicks: number | null;
};

export async function coverage(platform: string): Promise<Coverage> {
  await ensureSchema();
  const [r] = await db()<{ min: string | null; max: string | null; days: number }[]>`
    select to_char(min(day), 'YYYY-MM-DD') as min, to_char(max(day), 'YYYY-MM-DD') as max, count(*)::int as days
    from daily_metrics where platform = ${platform}`;
  return r ?? { min: null, max: null, days: 0 };
}

/** Daily numbers grouped into days, weeks or months. One query, however long the range. */
export async function dailyBuckets(platform: string, from: string, to: string, unit: Unit): Promise<Bucket[]> {
  await ensureSchema();
  return db()<Bucket[]>`
    select to_char(date_trunc(${unit}::text, day)::date, 'YYYY-MM-DD') as start,
           coalesce(sum(impressions), 0)::float8 as impressions,
           coalesce(sum(engagements), 0)::float8 as engagements,
           case when count(likes) = 0 then null else sum(likes)::float8 end as likes,
           case when count(comments) = 0 then null else sum(comments)::float8 end as comments,
           case when count(shares) = 0 then null else sum(shares)::float8 end as shares,
           case when count(clicks) = 0 then null else sum(clicks)::float8 end as clicks,
           count(*) filter (where impressions is not null or engagements is not null or likes is not null or comments is not null)::int as days
    from daily_metrics
    where platform = ${platform} and day between ${from}::date and ${to}::date
    group by 1 order by 1`;
}

export async function topPosts(platform: string, from: string, to: string, limit = 300): Promise<TopPost[]> {
  await ensureSchema();
  return db()<TopPost[]>`
    select id, platform, content, url, published_at, impressions, engagements, likes, comments, shares, clicks
    from posts
    where platform = ${platform} and state = 'PUBLISHED' and published_at is not null
      and (published_at at time zone 'UTC')::date between ${from}::date and ${to}::date
    order by coalesce(impressions, 0) desc, coalesce(engagements, 0) desc
    limit ${limit}`;
}

export async function postTotals(platform: string) {
  await ensureSchema();
  const [r] = await db()<{ posts: number; first: string | null; last: string | null }[]>`
    select count(*)::int as posts, to_char(min(published_at), 'YYYY-MM-DD') as first, to_char(max(published_at), 'YYYY-MM-DD') as last
    from posts where platform = ${platform} and state = 'PUBLISHED'`;
  return r ?? { posts: 0, first: null, last: null };
}

export async function bestDay(platform: string, from: string, to: string) {
  await ensureSchema();
  const [r] = await db()<{ day: string; impressions: number }[]>`
    select to_char(day, 'YYYY-MM-DD') as day, impressions from daily_metrics
    where platform = ${platform} and day between ${from}::date and ${to}::date and impressions is not null
    order by impressions desc, day desc limit 1`;
  return r ?? null;
}
