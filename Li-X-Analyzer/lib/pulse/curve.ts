/** A post's growth over time, from the snapshots we took, and a fair comparison with the post before it. */
export type SnapRow = { takenAt: string; impressions: number | null; likes: number | null; comments: number | null; shares: number | null; clicks: number | null };
export type CurvePoint = { hours: number; impressions: number | null; likes: number | null; comments: number | null; shares: number | null };

export function curvePoints(snaps: SnapRow[], publishedAt: string | null): CurvePoint[] {
  if (!publishedAt) return [];
  const t0 = new Date(publishedAt).getTime();
  return snaps
    .map((s) => ({ hours: (new Date(s.takenAt).getTime() - t0) / 3_600_000, impressions: s.impressions, likes: s.likes, comments: s.comments, shares: s.shares }))
    .filter((p) => p.hours >= 0)
    .sort((a, b) => a.hours - b.hours);
}

/** Impressions at a given age in hours, interpolated between snapshots, and only when snapshots sit close enough to trust. */
export function impressionsAt(points: CurvePoint[], hours: number, tolerance = 1): number | null {
  const p = points.filter((x) => x.impressions != null);
  if (!p.length) return null;
  const before = [...p].reverse().find((x) => x.hours <= hours);
  const after = p.find((x) => x.hours >= hours);
  if (before && after) {
    if (after.hours === before.hours) return before.impressions;
    if (after.hours - before.hours > Math.max(tolerance * 4, 6)) return null;
    return Math.round(before.impressions! + ((after.impressions! - before.impressions!) * (hours - before.hours)) / (after.hours - before.hours));
  }
  const one = before ?? after!;
  return Math.abs(one.hours - hours) <= tolerance ? one.impressions : null;
}

/** Impressions in the first hour, when we looked early enough to know. Null otherwise, so we never invent it. */
export const firstHour = (points: CurvePoint[]) => impressionsAt(points, 1, 0.75);

export type Compare = { metric: string; now: number | null; previous: number | null; change: number | null };
/** This post against the one before it on the same platform, on final numbers and, when both have snapshots, at the same age. */
export function compareWithPrevious(a: { impressions: number | null; likes: number | null; comments: number | null; shares: number | null }, b: { impressions: number | null; likes: number | null; comments: number | null; shares: number | null }): Compare[] {
  return (["impressions", "likes", "comments", "shares"] as const).map((m) => ({
    metric: m, now: a[m], previous: b[m], change: a[m] != null && b[m] != null && b[m] > 0 ? ((a[m]! - b[m]!) / b[m]!) * 100 : null,
  }));
}
