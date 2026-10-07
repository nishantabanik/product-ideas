export type PostRow = {
  id: string; platform: string; content: string; published_at: Date | null; url: string | null;
  impressions: number | null; engagements?: number | null; likes: number | null; comments: number | null; shares: number | null; clicks: number | null;
};

export const engagement = (p: PostRow) => p.engagements ?? (p.likes ?? 0) + (p.comments ?? 0) + (p.shares ?? 0) + (p.clicks ?? 0);

/** Engagement divided by impressions, or null when impressions are unknown or zero. */
export const rate = (p: PostRow) => (p.impressions ? engagement(p) / p.impressions : null);

export function summarize(posts: PostRow[]) {
  const withData = posts.filter((p) => p.impressions !== null);
  const impressions = withData.reduce((a, p) => a + (p.impressions ?? 0), 0);
  const eng = withData.reduce((a, p) => a + engagement(p), 0);
  return {
    posts: posts.length,
    measured: withData.length,
    impressions,
    engagement: eng,
    rate: impressions ? eng / impressions : null,
    avgImpressions: withData.length ? Math.round(impressions / withData.length) : null,
  };
}

/** Average engagement rate by weekday (0 = Sunday), only for posts with impressions. */
export function byWeekday(posts: PostRow[]) {
  const buckets = Array.from({ length: 7 }, () => ({ sum: 0, n: 0 }));
  for (const p of posts) {
    const r = rate(p);
    if (r === null || !p.published_at) continue;
    const d = new Date(p.published_at).getUTCDay();
    buckets[d].sum += r;
    buckets[d].n++;
  }
  return buckets.map((b) => (b.n ? b.sum / b.n : null));
}
