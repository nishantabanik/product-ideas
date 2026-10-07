import { db, ensureSchema } from "../db";
import { getState, setState } from "../connections";
import type { Pillar } from "./pillars.ts";
import type { Slot } from "./slots.ts";
import type { Draft, DraftStatus, Platform, PostFact } from "./types.ts";

type Row = {
  id: string; platform: Platform; status: DraftStatus; title: string; content: string; thread: string[]; pillar: string | null; source: Draft["source"];
  parent_id: string | null; parent_post_id: string | null; scheduled_for: Date | null; review_note: string | null; created_at: Date; updated_at: Date;
};
const iso = (d: Date | null) => (d ? new Date(d).toISOString() : null);
const toDraft = (r: Row): Draft => ({
  id: r.id, platform: r.platform, status: r.status, title: r.title, content: r.content, thread: Array.isArray(r.thread) ? r.thread : [], pillar: r.pillar, source: r.source,
  parentId: r.parent_id, parentPostId: r.parent_post_id, scheduledFor: iso(r.scheduled_for), reviewNote: r.review_note, createdAt: iso(r.created_at)!, updatedAt: iso(r.updated_at)!,
});
const newId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 14);

/** Scheduled drafts whose time has passed are published. */
async function rollover() {
  await db()`update drafts set status = 'published', updated_at = now() where status = 'scheduled' and scheduled_for < now() - interval '30 minutes'`;
}

export async function listDrafts(): Promise<Draft[]> {
  await ensureSchema();
  await rollover();
  const rows = await db()<Row[]>`select * from drafts order by updated_at desc limit 500`;
  return rows.map(toDraft);
}

export async function getDraft(id: string): Promise<Draft | null> {
  await ensureSchema();
  const [r] = await db()<Row[]>`select * from drafts where id = ${id}`;
  return r ? toDraft(r) : null;
}

export type DraftInput = Partial<Pick<Draft, "platform" | "status" | "title" | "content" | "thread" | "pillar" | "source" | "parentId" | "parentPostId" | "scheduledFor" | "reviewNote">>;

export async function createDraft(i: DraftInput & { platform: Platform }): Promise<Draft> {
  await ensureSchema();
  const id = newId();
  await db()`insert into drafts (id, platform, status, title, content, thread, pillar, source, parent_id, parent_post_id, scheduled_for, review_note)
    values (${id}, ${i.platform}, ${i.status ?? "draft"}, ${i.title ?? ""}, ${i.content ?? ""}, ${db().json((i.thread ?? []) as never)}, ${i.pillar ?? null}, ${i.source ?? "manual"},
      ${i.parentId ?? null}, ${i.parentPostId ?? null}, ${i.scheduledFor ?? null}, ${i.reviewNote ?? null})`;
  return (await getDraft(id))!;
}

export async function updateDraft(id: string, p: DraftInput): Promise<Draft | null> {
  const cur = await getDraft(id);
  if (!cur) return null;
  const m = { ...cur, ...p };
  await db()`update drafts set platform = ${m.platform}, status = ${m.status}, title = ${m.title}, content = ${m.content}, thread = ${db().json(m.thread as never)},
    pillar = ${m.pillar}, scheduled_for = ${m.scheduledFor}, review_note = ${m.reviewNote}, updated_at = now() where id = ${id}`;
  return getDraft(id);
}

export async function deleteDraft(id: string) {
  await ensureSchema();
  await db()`delete from drafts where id = ${id}`;
}

/** Times already taken by scheduled drafts, so the queue never doubles up. */
export async function takenTimes(platform: Platform): Promise<string[]> {
  await ensureSchema();
  const rows = await db()<{ t: Date }[]>`select scheduled_for as t from drafts where platform = ${platform} and status = 'scheduled' and scheduled_for > now()`;
  return rows.map((r) => new Date(r.t).toISOString());
}

export async function recycledPostIds(): Promise<string[]> {
  await ensureSchema();
  const rows = await db()<{ p: string }[]>`select parent_post_id as p from drafts where source = 'recycle' and parent_post_id is not null and created_at > now() - interval '90 days'`;
  return rows.map((r) => r.p);
}

/** Published posts as the studio needs them: text and numbers. */
export async function postFacts(days = 800): Promise<PostFact[]> {
  await ensureSchema();
  const rows = await db()<{ id: string; platform: Platform; content: string; published_at: Date | null; impressions: number | null; engagements: number | null; likes: number | null; comments: number | null; shares: number | null }[]>`
    select id, platform, content, published_at, impressions, engagements, likes, comments, shares from posts
    where state = 'PUBLISHED' and published_at is not null and published_at > now() - make_interval(days => ${days}) and platform in ('linkedin', 'x')
    order by published_at desc limit 4000`;
  return rows.map((r) => ({ id: r.id, platform: r.platform, content: r.content, publishedAt: iso(r.published_at), impressions: r.impressions, engagements: r.engagements, likes: r.likes, comments: r.comments, shares: r.shares }));
}

/* ---------- library ---------- */
export type SavedTemplate = { id: string; name: string; platform: Platform | "both"; kind: "hook" | "template"; body: string; uses: number };
export async function listTemplates(): Promise<SavedTemplate[]> {
  await ensureSchema();
  return db()<SavedTemplate[]>`select id, name, platform, kind, body, uses from templates order by created_at desc`;
}
export async function addTemplate(t: Omit<SavedTemplate, "id" | "uses">) {
  await ensureSchema();
  await db()`insert into templates (id, name, platform, kind, body) values (${newId()}, ${t.name}, ${t.platform}, ${t.kind}, ${t.body})`;
}
export async function deleteTemplate(id: string) {
  await ensureSchema();
  await db()`delete from templates where id = ${id}`;
}

/* ---------- pillars ---------- */
export async function listPillars(): Promise<Pillar[]> {
  await ensureSchema();
  const rows = await db()<{ id: string; name: string; keywords: string[] }[]>`select id, name, keywords from pillars order by position, name`;
  return rows.map((r) => ({ id: r.id, name: r.name, keywords: Array.isArray(r.keywords) ? r.keywords : [] }));
}
export async function replacePillars(list: { id?: string; name: string; keywords: string[] }[]) {
  await ensureSchema();
  const sql = db();
  await sql.begin(async (tx) => {
    await tx`delete from pillars`;
    for (const [i, p] of list.entries()) {
      await tx`insert into pillars (id, name, keywords, position) values (${p.id || newId()}, ${p.name}, ${tx.json(p.keywords as never)}, ${i})`;
    }
  });
}

/* ---------- queue slots ---------- */
export async function listSlots(platform?: Platform): Promise<(Slot & { platform: Platform })[]> {
  await ensureSchema();
  const rows = platform
    ? await db()<{ platform: Platform; weekday: number; time: string }[]>`select platform, weekday, time from queue_slots where platform = ${platform} order by weekday, time`
    : await db()<{ platform: Platform; weekday: number; time: string }[]>`select platform, weekday, time from queue_slots order by platform, weekday, time`;
  return rows;
}
export async function replaceSlots(platform: Platform, slots: Slot[]) {
  await ensureSchema();
  await db().begin(async (tx) => {
    await tx`delete from queue_slots where platform = ${platform}`;
    for (const s of slots) await tx`insert into queue_slots (id, platform, weekday, time) values (${newId()}, ${platform}, ${s.weekday}, ${s.time}) on conflict do nothing`;
  });
}

/* ---------- settings ---------- */
export const getZone = async () => (await getState("studio:tz")) || "UTC";
export const setZone = (tz: string) => setState("studio:tz", tz);
export const getRequireApproval = async () => (await getState("studio:require_approval")) === "1";
export const setRequireApproval = (on: boolean) => setState("studio:require_approval", on ? "1" : "0");
