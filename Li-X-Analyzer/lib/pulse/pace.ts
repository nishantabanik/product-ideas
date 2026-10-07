/**
 * How is a fresh post doing, compared with what our posts usually reach? We compare its impressions now with the share of a
 * typical final total that a post usually has by this age. Until we hold enough of our own history, a general curve is used.
 */
export type Pace = { state: "too_early" | "no_baseline" | "slow" | "on_track" | "taking_off"; ratio: number | null; expected: number | null; reason: string };

/** Share of the final impressions reached by a given age, in minutes. A common shape on X, used until we have our own. */
const DEFAULT_CURVE: [number, number][] = [[0, 0], [15, 0.1], [30, 0.2], [60, 0.35], [120, 0.5], [360, 0.75], [1440, 0.95], [4320, 1]];

export function interpolate(curve: [number, number][], x: number): number {
  if (x <= curve[0][0]) return curve[0][1];
  for (let i = 1; i < curve.length; i++) {
    if (x <= curve[i][0]) {
      const [x0, y0] = curve[i - 1], [x1, y1] = curve[i];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0 || 1);
    }
  }
  return curve[curve.length - 1][1];
}

export type Snap = { at: number; impressions: number | null }; // at = minutes since publishing

/** The median share of the final total reached at each age, from our own posts that have snapshots. Null when there is too little. */
export function learnCurve(history: { snaps: Snap[] }[], minPosts = 8): [number, number][] | null {
  const usable = history.map((h) => {
    const s = h.snaps.filter((x) => x.impressions != null).sort((a, b) => a.at - b.at);
    const final = s.length && s[s.length - 1].at >= 1440 ? s[s.length - 1].impressions! : 0;
    return { s, final };
  }).filter((h) => h.final > 0 && h.s.length >= 3);
  if (usable.length < minPosts) return null;
  const ages = [15, 30, 60, 120, 360, 1440];
  const out: [number, number][] = [[0, 0]];
  for (const age of ages) {
    const shares: number[] = [];
    for (const h of usable) {
      const pts = h.s.map((x) => [x.at, x.impressions! / h.final] as [number, number]);
      if (!h.s.some((x) => Math.abs(x.at - age) <= Math.max(30, age * 0.5))) continue; // no snapshot near enough to this age
      shares.push(interpolate([[0, 0], ...pts], age));
    }
    if (shares.length < Math.min(minPosts, usable.length)) return null;
    shares.sort((a, b) => a - b);
    out.push([age, shares[Math.floor(shares.length / 2)]]);
  }
  out.push([4320, 1]);
  return out.every((p, i) => i === 0 || p[1] >= out[i - 1][1]) ? out : null;
}

export const MIN_IMPRESSIONS = 40;

export function paceStatus(o: { ageMinutes: number; impressions: number | null; typicalFinal: number | null; curve?: [number, number][] | null }): Pace {
  if (o.typicalFinal == null || o.typicalFinal <= 0) return { state: "no_baseline", ratio: null, expected: null, reason: "We need a few more measured posts before we can compare." };
  if (o.ageMinutes < 20) return { state: "too_early", ratio: null, expected: null, reason: "Too early to tell." };
  if (o.impressions == null) return { state: "too_early", ratio: null, expected: null, reason: "No numbers yet." };
  const expected = o.typicalFinal * interpolate(o.curve ?? DEFAULT_CURVE, o.ageMinutes);
  const ratio = expected > 0 ? o.impressions / expected : null;
  if (ratio == null) return { state: "too_early", ratio: null, expected, reason: "Too early to tell." };
  if (ratio >= 1.5 && o.impressions >= MIN_IMPRESSIONS) return { state: "taking_off", ratio, expected, reason: `${o.impressions.toLocaleString("en-US")} impressions so far, ${ratio.toFixed(1)} times what a typical post has by now (about ${Math.round(expected).toLocaleString("en-US")}).` };
  if (o.ageMinutes >= 60 && o.ageMinutes <= 480 && ratio <= 0.5) return { state: "slow", ratio, expected, reason: `${o.impressions.toLocaleString("en-US")} impressions so far, about ${Math.round(ratio * 100)}% of what a typical post has by now (about ${Math.round(expected).toLocaleString("en-US")}).` };
  return { state: "on_track", ratio, expected, reason: "In line with our usual posts." };
}
