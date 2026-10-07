import { listChannels, listPosts, schedulePost, type PostizChannel } from "../postiz";
import { platformOf } from "../sync";
import { checkThread } from "./thread.ts";
import { nextStatus, type Action } from "./flow.ts";
import { nextSlotTimes } from "./slots.ts";
import { getDraft, getRequireApproval, getZone, listDrafts, listSlots, takenTimes, updateDraft } from "./store";
import type { Draft } from "./types.ts";

function pickChannel(channels: PostizChannel[], draft: Draft, channelId?: string) {
  const mine = channels.filter((c) => !c.disabled && platformOf(c.identifier) === draft.platform);
  const c = channelId ? mine.find((x) => x.id === channelId) : mine[0];
  if (!c) throw new Error(`No ${draft.platform === "x" ? "X" : "LinkedIn"} channel is connected in Postiz.`);
  return c;
}

/** What goes out as text: the thread when there are two or more posts, else the single post. */
export function bodyOf(d: Draft) {
  const thread = d.platform === "x" ? d.thread.map((t) => t.trim()).filter(Boolean) : [];
  return { content: thread.length > 1 ? thread[0] : d.content.trim(), thread: thread.length > 1 ? thread : undefined };
}

export function validateForSend(d: Draft) {
  const { content, thread } = bodyOf(d);
  if (!content) throw new Error("The draft is empty.");
  if (d.platform === "x") {
    const c = checkThread(thread ?? [content]);
    if (!c.ok) throw new Error(c.problems[0]);
  } else if (content.length > 3000) throw new Error(`LinkedIn allows 3000 characters, this is ${content.length}.`);
}

/** Sends a draft to Postiz at a time (or now) and marks it scheduled. */
export async function scheduleDraft(d: Draft, o: { date?: string; now?: boolean; channelId?: string; channels?: PostizChannel[] }) {
  const requireApproval = await getRequireApproval();
  nextStatus(d.status, "schedule", requireApproval);
  validateForSend(d);
  const date = o.now ? new Date().toISOString() : new Date(o.date ?? "").toISOString();
  if (!o.now && new Date(date).getTime() < Date.now()) throw new Error("Pick a time in the future.");
  const channel = pickChannel(o.channels ?? (await listChannels()), d, o.channelId);
  const { content, thread } = bodyOf(d);
  await schedulePost({ content, thread, date, channels: [channel], now: o.now });
  return updateDraft(d.id, { status: "scheduled", scheduledFor: date });
}

export async function applyAction(id: string, action: Action, o: { note?: string; date?: string; now?: boolean; channelId?: string }) {
  const d = await getDraft(id);
  if (!d) throw new Error("Draft not found.");
  if (action === "schedule") return scheduleDraft(d, o);
  const next = nextStatus(d.status, action, await getRequireApproval());
  if (next === "review" && !d.content.trim() && !d.thread.length) throw new Error("Write something before sending it for review.");
  return updateDraft(id, { status: next, reviewNote: action === "changes" ? (o.note?.trim() || "Changes requested.") : action === "approve" || action === "submit" ? null : d.reviewNote });
}

/** Gives every approved draft the next free slot of its platform and sends it to Postiz. */
export async function fillQueue(now = new Date()) {
  const [drafts, tz, slots, channels] = await Promise.all([listDrafts(), getZone(), listSlots(), listChannels()]);
  const approved = drafts.filter((d) => d.status === "approved").sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
  const scheduled: { id: string; platform: string; when: string }[] = [];
  const skipped: { id: string; reason: string }[] = [];
  let queued: { platform: string; at: string }[] = [];
  try { // times that Postiz already holds, also from posts we did not plan here
    const end = new Date(now.getTime() + 60 * 86_400_000).toISOString();
    const by = new Map(channels.map((c) => [c.id, c]));
    queued = (await listPosts(now.toISOString(), end, 0)).filter((p) => p.state === "QUEUE" && p.publishDate)
      .map((p) => ({ platform: platformOf(by.get(p.integration?.id ?? "")?.identifier ?? p.integration?.providerIdentifier ?? ""), at: p.publishDate! }));
  } catch { /* the times we know from our own drafts still apply */ }

  for (const platform of ["linkedin", "x"] as const) {
    const mine = approved.filter((d) => d.platform === platform);
    if (!mine.length) continue;
    const rules = slots.filter((s) => s.platform === platform);
    if (!rules.length) { mine.forEach((d) => skipped.push({ id: d.id, reason: `No ${platform === "x" ? "X" : "LinkedIn"} queue slots are set.` })); continue; }
    const taken = [...(await takenTimes(platform)), ...queued.filter((q) => q.platform === platform).map((q) => q.at)];
    const times = nextSlotTimes(rules, tz, now, mine.length, taken);
    for (const [i, d] of mine.entries()) {
      if (!times[i]) { skipped.push({ id: d.id, reason: "No free slot in the next year." }); continue; }
      try {
        await scheduleDraft(d, { date: times[i].toISOString(), channels });
        scheduled.push({ id: d.id, platform, when: times[i].toISOString() });
      } catch (e) { skipped.push({ id: d.id, reason: (e as Error).message }); }
    }
  }
  return { scheduled, skipped };
}
