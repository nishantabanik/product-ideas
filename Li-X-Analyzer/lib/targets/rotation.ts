export const DAY = 86_400_000;
export type TargetFact = { id: string; active: boolean; lastEngagedAt: string | null };
export type LogFact = { day: string; targetId: string };

/** UTC calendar day as YYYY-MM-DD. */
export const utcDay = (d: Date) => d.toISOString().slice(0, 10);
const dayNum = (s: string) => { const [y, m, d] = s.slice(0, 10).split("-").map(Number); return Math.floor(Date.UTC(y, m - 1, d) / DAY); };
const numDay = (n: number) => new Date(n * DAY).toISOString().slice(0, 10);
const validDay = (s: string) => /^\d{4}-\d{2}-\d{2}/.test(s) && Number.isFinite(dayNum(s));
const ms = (s: string | null) => { if (!s) return null; const t = new Date(s).getTime(); return Number.isFinite(t) ? t : null; };

/**
 * Who to engage today. Active targets not yet engaged today (UTC day), never engaged first, then least recently engaged,
 * ties keep list order. The quota is perDay in total, so every engagement already logged today uses one slot.
 */
export function pickToday<T extends TargetFact>(targets: T[], log: LogFact[], now: Date, perDay = 5): T[] {
  const today = utcDay(now);
  const done = new Set(log.filter((l) => l.day.slice(0, 10) === today).map((l) => l.targetId));
  const slots = Math.max(0, Math.floor(perDay) - done.size);
  return targets
    .map((t, i) => ({ t, i, last: ms(t.lastEngagedAt) }))
    .filter((x) => x.t.active && !done.has(x.t.id))
    .sort((a, b) => (a.last === null ? (b.last === null ? 0 : -1) : b.last === null ? 1 : a.last - b.last) || a.i - b.i)
    .slice(0, slots)
    .map((x) => x.t);
}

/** Number of distinct targets engaged today. */
export const doneToday = (log: LogFact[], now: Date) => new Set(log.filter((l) => l.day.slice(0, 10) === utcDay(now)).map((l) => l.targetId)).size;

function perDayCounts(logDays: string[]) {
  const m = new Map<number, number>();
  for (const d of logDays) if (validDay(d)) m.set(dayNum(d), (m.get(dayNum(d)) ?? 0) + 1);
  return m;
}

/** Consecutive UTC days with at least minPerDay engagements. If today has none yet, the run that ends yesterday counts. */
export function streak(logDays: string[], now: Date, minPerDay = 1): number {
  const m = perDayCounts(logDays);
  const min = Math.max(1, minPerDay);
  const today = dayNum(utcDay(now));
  let n = (m.get(today) ?? 0) >= min ? today : today - 1;
  let s = 0;
  while ((m.get(n) ?? 0) >= min) { s++; n--; }
  return s;
}

/** Engagements since Monday of the current UTC week. */
export function weekTotal(logDays: string[], now: Date): number {
  const today = dayNum(utcDay(now));
  const monday = today - ((new Date(today * DAY).getUTCDay() + 6) % 7);
  return logDays.filter((d) => validDay(d) && dayNum(d) >= monday && dayNum(d) <= today).length;
}

/** Totals for the last `weeks` weeks (Monday to Sunday, UTC), oldest first. */
export function weeklyTotals(logDays: string[], now: Date, weeks = 4): { weekStart: string; count: number }[] {
  const today = dayNum(utcDay(now));
  const monday = today - ((new Date(today * DAY).getUTCDay() + 6) % 7);
  const out: { weekStart: string; count: number }[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const start = monday - w * 7;
    out.push({ weekStart: numDay(start), count: logDays.filter((d) => validDay(d) && dayNum(d) >= start && dayNum(d) < start + 7 && dayNum(d) <= today).length });
  }
  return out;
}

/** Whole days since an ISO date, null when there is none. */
export function daysSince(iso: string | null, now: Date): number | null {
  const t = ms(iso);
  return t === null ? null : Math.max(0, Math.floor((now.getTime() - t) / DAY));
}

export function parseTargets(text: string, max = 100): { name: string; handle: string | null }[] {
  const seen = new Set<string>();
  const out: { name: string; handle: string | null }[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/^[\s\-*•]+/, "").trim();
    if (!line) continue;
    const i = line.indexOf(",");
    const name = (i >= 0 ? line.slice(0, i) : line).trim().slice(0, 120);
    const handle = i >= 0 ? line.slice(i + 1).trim().replace(/^@/, "").slice(0, 120) || null : null;
    if (!name) continue;
    const key = `${name.toLowerCase()}|${(handle ?? "").toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key); out.push({ name, handle });
    if (out.length >= max) break;
  }
  return out;
}

/** Link to open a profile: the saved link, else built from the handle on X. LinkedIn needs a saved link. */
export function profileLink(t: { platform: string; handle: string | null; profileUrl: string | null }): string | null {
  if (t.profileUrl) return t.profileUrl;
  const h = (t.handle ?? "").replace(/^@/, "").trim();
  return t.platform === "x" && /^[A-Za-z0-9_]{1,15}$/.test(h) ? `https://x.com/${h}` : null;
}
