export const STAGES = ["new", "contacted", "conversation", "proposal", "won", "lost"] as const;
export type Stage = (typeof STAGES)[number];
export const STAGE_LABELS: Record<Stage, string> = { new: "New", contacted: "Contacted", conversation: "In conversation", proposal: "Proposal", won: "Won", lost: "Lost" };
export const STAGE_HINTS: Record<Stage, string> = {
  new: "People we have not written to yet", contacted: "We sent a first message", conversation: "They answered, we are talking",
  proposal: "We sent an offer or a price", won: "They became a customer", lost: "It will not happen",
};
export const SOURCES = ["comment", "profile_view", "dm", "manual"] as const;
export type Source = (typeof SOURCES)[number];
export const SOURCE_LABELS: Record<Source, string> = { comment: "Comment", profile_view: "Profile view", dm: "Direct message", manual: "Added by hand" };
export const DAY = 86_400_000;
export const STALE_DAYS = 14;

export const isStage = (s: unknown): s is Stage => typeof s === "string" && (STAGES as readonly string[]).includes(s);
export const isSource = (s: unknown): s is Source => typeof s === "string" && (SOURCES as readonly string[]).includes(s);
export const isOpen = (s: Stage) => s !== "won" && s !== "lost";
/** Any move is allowed. */
export const canMove = (from: Stage, to: Stage) => isStage(from) && isStage(to);
/** Moving to contacted or conversation counts as contact made now. */
export const movesSetContact = (to: Stage) => to === "contacted" || to === "conversation";

export type LeadFact = { id: string; stage: Stage; value: number | null; createdAt: string; updatedAt?: string | null; nextStepAt?: string | null; lastContactAt?: string | null };

const ms = (s: string | null | undefined) => { if (!s) return null; const t = new Date(s).getTime(); return Number.isFinite(t) ? t : null; };
const num = (v: number | null | undefined) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

export type StageTotal = { stage: Stage; count: number; value: number };
export function pipelineTotals(leads: LeadFact[]): StageTotal[] {
  return STAGES.map((stage) => {
    const l = leads.filter((x) => x.stage === stage);
    return { stage, count: l.length, value: l.reduce((a, x) => a + num(x.value), 0) };
  });
}
/** Value of leads that are still open (not won, not lost). */
export const openPipelineValue = (leads: LeadFact[]) => leads.filter((l) => isOpen(l.stage)).reduce((a, l) => a + num(l.value), 0);
export const wonValue = (leads: LeadFact[]) => leads.filter((l) => l.stage === "won").reduce((a, l) => a + num(l.value), 0);

/** Won divided by won plus lost, as a fraction, or "n/a" when nothing is closed. */
export function winRate(leads: LeadFact[]): number | "n/a" {
  const won = leads.filter((l) => l.stage === "won").length;
  const lost = leads.filter((l) => l.stage === "lost").length;
  return won + lost === 0 ? "n/a" : won / (won + lost);
}
export const winRateLabel = (r: number | "n/a") => (r === "n/a" ? "n/a" : `${Math.round(r * 100)}%`);

/** Average days from created to won (the last update stands in for the win date). Null when nothing is won. */
export function avgDaysToWon(leads: LeadFact[]): number | null {
  const d = leads.filter((l) => l.stage === "won").map((l) => { const a = ms(l.createdAt), b = ms(l.updatedAt); return a === null || b === null ? null : Math.max(0, (b - a) / DAY); }).filter((x): x is number => x !== null);
  return d.length ? d.reduce((a, b) => a + b, 0) / d.length : null;
}

export function followUpsDue(leads: LeadFact[], now: Date): LeadFact[] {
  const t = now.getTime();
  return leads.filter((l) => { const n = ms(l.nextStepAt); return isOpen(l.stage) && n !== null && n <= t; }).sort((a, b) => ms(a.nextStepAt)! - ms(b.nextStepAt)!);
}

/** Leads in contacted, conversation or proposal with no contact for 14 days or more. */
export function staleLeads(leads: LeadFact[], now: Date, days = STALE_DAYS): LeadFact[] {
  const t = now.getTime();
  return leads.filter((l) => {
    if (l.stage !== "contacted" && l.stage !== "conversation" && l.stage !== "proposal") return false;
    const c = ms(l.lastContactAt);
    return c !== null && t - c >= days * DAY;
  }).sort((a, b) => ms(a.lastContactAt)! - ms(b.lastContactAt)!);
}

/** Whole days since the last contact, or null when there was none. */
export function daysSinceContact(lastContactAt: string | null | undefined, now: Date): number | null {
  const c = ms(lastContactAt);
  return c === null ? null : Math.max(0, Math.floor((now.getTime() - c) / DAY));
}

export type ParsedPerson = { name: string; handle: string | null };
/** One person per line: "name" or "name, handle". Blank lines and repeats are dropped. */
export function parsePeople(text: string, max = 100): ParsedPerson[] {
  const seen = new Set<string>();
  const out: ParsedPerson[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/^[\s\-*•]+/, "").trim();
    if (!line) continue;
    const i = line.indexOf(",");
    const name = (i >= 0 ? line.slice(0, i) : line).trim().slice(0, 120);
    const handle = i >= 0 ? line.slice(i + 1).trim().replace(/^@/, "").slice(0, 120) || null : null;
    if (!name) continue;
    const key = `${name.toLowerCase()}|${(handle ?? "").toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ name, handle });
    if (out.length >= max) break;
  }
  return out;
}
