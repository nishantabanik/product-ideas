import type { GoalView } from "../insights/goals-load.ts";

/** Builds the weekly or monthly report as plain data. Pure: no database, no clock, no PDF. */

export type Freq = "weekly" | "monthly";
export type Period = {
  freq: Freq;
  key: string; // 2026-W41 or 2026-09
  from: string; to: string; // inclusive, UTC days
  prevFrom: string; prevTo: string;
  days: number;
  label: string;
};

const DAY = 86_400_000;
const ms = (day: string) => Date.parse(`${day}T00:00:00Z`);
const fmt = (t: number) => new Date(t).toISOString().slice(0, 10);
export const addDays = (day: string, n: number) => fmt(ms(day) + n * DAY);
const nice = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** ISO 8601 week number and year of a day (the week belongs to the year that holds its Thursday). */
export function isoWeek(day: string): { year: number; week: number } {
  const t = new Date(ms(day));
  const dow = (t.getUTCDay() + 6) % 7; // Monday 0
  t.setUTCDate(t.getUTCDate() - dow + 3); // the Thursday of this week
  const year = t.getUTCFullYear();
  const week = 1 + Math.floor((t.getTime() - Date.UTC(year, 0, 1)) / DAY / 7);
  return { year, week };
}

/** The last full week (Monday to Sunday) or calendar month that ended before `now`, all in UTC. */
export function reportPeriod(freq: Freq, now: Date): Period {
  const today = fmt(now.getTime());
  if (freq === "weekly") {
    const dow = (now.getUTCDay() + 6) % 7;
    const monday = addDays(today, -dow);
    const from = addDays(monday, -7), to = addDays(monday, -1);
    const { year, week } = isoWeek(from);
    return { freq, key: `${year}-W${String(week).padStart(2, "0")}`, from, to, prevFrom: addDays(from, -7), prevTo: addDays(from, -1), days: 7, label: `Week ${week}, ${nice(from)} to ${nice(to)}` };
  }
  const y = now.getUTCFullYear(), m = now.getUTCMonth();
  const start = new Date(Date.UTC(y, m - 1, 1)), end = new Date(Date.UTC(y, m, 0));
  const pStart = new Date(Date.UTC(y, m - 2, 1)), pEnd = new Date(Date.UTC(y, m - 1, 0));
  const from = fmt(start.getTime()), to = fmt(end.getTime());
  return {
    freq, key: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`, from, to,
    prevFrom: fmt(pStart.getTime()), prevTo: fmt(pEnd.getTime()), days: end.getUTCDate(),
    label: `${MONTHS[start.getUTCMonth()]} ${start.getUTCFullYear()}`,
  };
}

/* ---------- input and output ---------- */

export type DayPoint = { day: string; impressions: number | null; engagements: number | null };
export type XWeek = { impressions: number; likes: number; comments: number; shares: number };
export type ReportPost = { id: string; platform: "linkedin" | "x"; content: string; publishedAt: string | null; impressions: number | null; engagements: number | null; url: string | null };
export type FollowerInfo = { platform: "linkedin" | "x"; total: number | null; change: number | null; previousChange: number | null; days: number };

export type ReportInput = {
  period: Period;
  linkedin: { cur: DayPoint[]; prev: DayPoint[] };
  /** Weekly totals for the whole X account, newest first, counted back from the last refresh. */
  x: { weeks: XWeek[]; capturedAt: string | null } | null;
  topPosts: ReportPost[];
  followers: FollowerInfo[];
  goals: GoalView[];
  pendingComments: number | null;
};

export type KpiRow = { platform: "linkedin" | "x"; label: string; current: number | null; previous: number | null; change: number | null; kind: "count" | "rate" };
export type Bars = { platform: "linkedin" | "x"; title: string; unit: "day" | "week"; bars: { label: string; value: number | null }[]; note: string | null };
export type Report = {
  title: string; subtitle: string; period: Period;
  kpis: KpiRow[]; charts: Bars[];
  topPosts: ReportPost[];
  followers: { platform: "linkedin" | "x"; line: string }[];
  goals: string[];
  pendingComments: number | null;
  nextSteps: string[];
  notes: string[];
};

const sumKnown = (xs: (number | null)[]) => (xs.some((v) => v !== null) ? xs.reduce<number>((a, v) => a + (v ?? 0), 0) : null);
const num = (n: number) => Math.round(n).toLocaleString("en-US");
const signed = (n: number) => (n > 0 ? `+${num(n)}` : num(n));
/** Percent change, or null when there is nothing to compare with. A rate gives percentage points instead. */
export function changeOf(cur: number | null, prev: number | null, kind: "count" | "rate" = "count"): number | null {
  if (cur === null || prev === null) return null;
  if (kind === "rate") return (cur - prev) * 100;
  return prev ? ((cur - prev) / prev) * 100 : null;
}
const rateOf = (e: number | null, i: number | null) => (e !== null && i ? e / i : null);

function kpiRows(platform: "linkedin" | "x", cur: { i: number | null; e: number | null }, prev: { i: number | null; e: number | null }): KpiRow[] {
  const rc = rateOf(cur.e, cur.i), rp = rateOf(prev.e, prev.i);
  return [
    { platform, label: "Impressions", current: cur.i, previous: prev.i, change: changeOf(cur.i, prev.i), kind: "count" },
    { platform, label: "Engagements", current: cur.e, previous: prev.e, change: changeOf(cur.e, prev.e), kind: "count" },
    { platform, label: "Engagement rate", current: rc, previous: rp, change: changeOf(rc, rp, "rate"), kind: "rate" },
  ];
}

export function buildReport(input: ReportInput): Report {
  const { period } = input;
  const notes: string[] = [];
  const kpis: KpiRow[] = [];
  const charts: Bars[] = [];

  // LinkedIn: real daily numbers
  const li = input.linkedin;
  const liDays = li.cur.filter((d) => d.impressions !== null || d.engagements !== null);
  if (liDays.length) {
    kpis.push(...kpiRows("linkedin",
      { i: sumKnown(li.cur.map((d) => d.impressions)), e: sumKnown(li.cur.map((d) => d.engagements)) },
      { i: sumKnown(li.prev.map((d) => d.impressions)), e: sumKnown(li.prev.map((d) => d.engagements)) }));
    const by = new Map(li.cur.map((d) => [d.day, d.impressions]));
    charts.push({
      platform: "linkedin", title: "LinkedIn impressions per day", unit: "day",
      bars: Array.from({ length: period.days }, (_, i) => { const day = addDays(period.from, i); return { label: day.slice(5), value: by.get(day) ?? null }; }),
      note: liDays.length < period.days ? `${period.days - liDays.length} of ${period.days} days have no numbers yet and are left empty.` : null,
    });
    if (liDays.length < period.days) notes.push(`LinkedIn has numbers for ${liDays.length} of ${period.days} days in this period. Upload a fresh export to fill the rest.`);
  } else {
    notes.push("No LinkedIn numbers for this period yet. Import a LinkedIn export on the Import page.");
  }

  // X: weekly buckets only
  if (input.x && input.x.weeks.length) {
    const wk = input.x.weeks;
    const n = period.freq === "weekly" ? 1 : Math.max(1, Math.round(period.days / 7));
    const sum = (a: number, b: number) => {
      const list = wk.slice(a, b);
      return list.length === b - a ? { i: list.reduce((s, w) => s + w.impressions, 0), e: list.reduce((s, w) => s + w.likes + w.comments + w.shares, 0) } : { i: null, e: null };
    };
    const cur = sum(0, n), prev = sum(n, n * 2);
    if (cur.i !== null) {
      kpis.push(...kpiRows("x", cur, prev));
      charts.push({
        platform: "x", title: "X impressions per week", unit: "week",
        bars: wk.slice(0, 12).map((w, i) => ({ label: `W-${i}`, value: w.impressions })).reverse().map((b, i, all) => ({ ...b, label: i === all.length - 1 ? "latest" : `-${all.length - 1 - i}w` })),
        note: "X only gives us weekly totals, so we show weeks, not days.",
      });
      const when = input.x.capturedAt ? ` Last refreshed ${nice(input.x.capturedAt.slice(0, 10))}.` : "";
      notes.push(`X numbers are weekly totals for the whole account, counted back from our last refresh, so they may not line up exactly with ${period.freq === "weekly" ? "this week" : "this month"}.${when}`);
    }
  } else {
    notes.push("No X numbers loaded. Use Refresh X numbers on the Analytics page.");
  }

  const followers = input.followers.filter((f) => f.total !== null || f.change !== null).map((f) => {
    const name = f.platform === "x" ? "X" : "LinkedIn";
    const parts: string[] = [];
    if (f.total !== null) parts.push(`${num(f.total)} followers`);
    if (f.change !== null && f.days > 0) parts.push(`${signed(f.change)} in this period (${f.days} of ${period.days} days with numbers)`);
    if (f.change !== null && f.previousChange !== null) parts.push(`${signed(f.previousChange)} the period before`);
    return { platform: f.platform, line: `${name}: ${parts.join(", ")}.` };
  });
  if (!followers.length) notes.push("No follower numbers for this period. Add them on the Growth page.");

  const goals = input.goals.map((g) => {
    const state = g.status === "achieved" ? "reached" : g.status === "on_track" ? "on track" : g.status === "behind" ? "behind" : "no data yet";
    return `${g.label}: ${num(g.current)} of ${num(g.target)}, ${state}.`;
  });

  const topPosts = input.topPosts.slice(0, 3);
  return {
    title: `${period.freq === "weekly" ? "Weekly" : "Monthly"} report`,
    subtitle: period.label, period, kpis, charts, topPosts, followers, goals,
    pendingComments: input.pendingComments,
    nextSteps: nextSteps(input, kpis, topPosts),
    notes,
  };
}

/** Two or three plain lines taken from the numbers. A line is skipped when its data is missing. */
function nextSteps(input: ReportInput, kpis: KpiRow[], top: ReportPost[]): string[] {
  const steps: string[] = [];
  const behind = input.goals.find((g) => g.status === "behind");
  if (behind) {
    steps.push(behind.requiredPerDay !== null
      ? `We are behind on "${behind.label}". Reaching it needs about ${num(behind.requiredPerDay)} a day from here.`
      : `We are behind on "${behind.label}". Look at the Goals tab for what is left.`);
  }
  if (input.pendingComments !== null && input.pendingComments > 0) {
    steps.push(`Reply to the ${input.pendingComments} comment${input.pendingComments === 1 ? "" : "s"} waiting in Comments. Early replies keep a post in front of people.`);
  }
  const drop = kpis.filter((k) => k.label === "Impressions" && k.change !== null && k.change <= -20)[0];
  if (drop) {
    steps.push(`${drop.platform === "x" ? "X" : "LinkedIn"} impressions fell ${Math.abs(Math.round(drop.change!))}% against the period before. Post more often next ${input.period.freq === "weekly" ? "week" : "month"} and compare.`);
  }
  if (top[0] && top[0].impressions) {
    const p = top[0];
    steps.push(`Build on our best post (${num(p.impressions!)} impressions): "${p.content.replace(/\s+/g, " ").trim().slice(0, 70)}". Write a follow up on the same idea.`);
  }
  const fg = input.followers.find((f) => f.change !== null && f.change < 0);
  if (fg && steps.length < 3) steps.push(`We lost ${num(Math.abs(fg.change!))} ${fg.platform === "x" ? "X" : "LinkedIn"} followers net. Check the Growth page for what came before the dip.`);
  return steps.slice(0, 3);
}

/** The period that just ended is due when it is not the one we last sent. A missed Monday is caught up on the next day. */
export function reportDue(freq: string | null, now: Date, last: string | null): { due: boolean; period: Period | null } {
  if (freq !== "weekly" && freq !== "monthly") return { due: false, period: null };
  const period = reportPeriod(freq, now);
  return { due: last !== period.key, period };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** A short email body. The PDF has everything, this is only the headline. */
export function reportEmail(r: Report): { subject: string; html: string; text: string } {
  const val = (k: KpiRow) => (k.current === null ? "n/a" : k.kind === "rate" ? `${(k.current * 100).toFixed(2)}%` : num(k.current));
  const chg = (k: KpiRow) => (k.change === null ? "" : ` (${k.change > 0 ? "+" : ""}${k.change.toFixed(1)}${k.kind === "rate" ? " pts" : "%"})`);
  const lines = r.kpis.map((k) => `${k.platform === "x" ? "X" : "LinkedIn"} ${k.label.toLowerCase()}: ${val(k)}${chg(k)}`);
  const text = [`${r.title}: ${r.subtitle}`, "", ...(lines.length ? lines : ["We have no numbers for this period."]), ...(r.nextSteps.length ? ["", "What to do next:", ...r.nextSteps.map((s) => `- ${s}`)] : []), "", "The full report is attached as a PDF."].join("\n");
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#1a1f29"><h2 style="margin:0 0 4px">${esc(r.title)}</h2><p style="margin:0 0 12px;color:#6b7280">${esc(r.subtitle)}</p>`
    + (lines.length ? `<ul>${lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>` : "<p>We have no numbers for this period.</p>")
    + (r.nextSteps.length ? `<p><b>What to do next</b></p><ul>${r.nextSteps.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>` : "")
    + `<p style="color:#6b7280">The full report is attached as a PDF.</p></div>`;
  return { subject: `${r.title}: ${r.subtitle}`, html, text };
}
