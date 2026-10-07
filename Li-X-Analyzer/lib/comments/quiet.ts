import type { CommentRow } from "./types.ts";

export const QUIET_DAYS = 3;
const DAY = 86_400_000;

export type QuietRow = Pick<CommentRow, "id" | "platform" | "authorName" | "authorHandle" | "status" | "commentedAt" | "createdAt" | "repliedAt" | "followUpAt">;

/** Who wrote it. Same platform and same handle, or, when there is no handle, the same name. */
export function personKey(r: Pick<QuietRow, "platform" | "authorName" | "authorHandle">): string {
  const h = (r.authorHandle ?? "").trim().replace(/^@+/, "").toLowerCase();
  if (h) return `${r.platform}|@${h}`;
  return `${r.platform}|${r.authorName.trim().replace(/\s+/g, " ").toLowerCase()}`;
}

const at = (s: string | null) => { const t = s ? Date.parse(s) : NaN; return Number.isNaN(t) ? null : t; };
const wrote = (r: QuietRow) => at(r.commentedAt) ?? at(r.createdAt) ?? 0;

export type Quiet<T extends QuietRow> = { row: T; repliedAt: string; days: number };

/**
 * Conversations where our reply is the last word. For each person we take our latest reply. It counts when that comment is still
 * marked replied (not ignored or reopened), the person wrote nothing newer than our reply, and at least `quietDays` have passed.
 * A person with several replied comments shows up once, with the latest one. The quietest come first.
 */
export function quietConversations<T extends QuietRow>(rows: T[], now: Date | number, quietDays = QUIET_DAYS): Quiet<T>[] {
  const t0 = typeof now === "number" ? now : now.getTime();
  const groups = new Map<string, T[]>();
  for (const r of rows) { const k = personKey(r); (groups.get(k) ?? groups.set(k, []).get(k)!).push(r); }
  const out: Quiet<T>[] = [];
  for (const g of groups.values()) {
    // a reply we gave and then dismissed (ignored) still ends the story, so it must not hand over to an older reply
    const ours = g.filter((r) => (r.status === "replied" || r.status === "ignored") && at(r.repliedAt) !== null);
    if (!ours.length) continue;
    const last = ours.reduce((a, b) => (at(b.repliedAt)! > at(a.repliedAt)! ? b : a));
    if (last.status !== "replied") continue;
    const when = at(last.repliedAt)!;
    if (g.some((r) => r !== last && wrote(r) > when)) continue;
    if (wrote(last) > when) continue;
    if (t0 - when < quietDays * DAY) continue;
    out.push({ row: last, repliedAt: last.repliedAt!, days: Math.floor((t0 - when) / DAY) });
  }
  return out.sort((a, b) => Date.parse(a.repliedAt) - Date.parse(b.repliedAt));
}

/** Comments whose reminder date has come and that are not dismissed. Oldest reminder first. */
export function followUpsDue<T extends QuietRow>(rows: T[], now: Date | number): T[] {
  const t0 = typeof now === "number" ? now : now.getTime();
  return rows.filter((r) => r.status !== "ignored" && at(r.followUpAt) !== null && at(r.followUpAt)! <= t0).sort((a, b) => at(a.followUpAt)! - at(b.followUpAt)!);
}
