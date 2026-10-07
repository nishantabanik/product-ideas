import { db, ensureSchema } from "../db";
import type { LeadInput, LeadPatch } from "./input.ts";
import { movesSetContact, type LeadFact, type Source, type Stage } from "./stages.ts";

export type Lead = {
  id: string; platform: "linkedin" | "x"; name: string; handle: string | null; profileUrl: string | null; source: Source; stage: Stage; value: number | null; notes: string;
  commentId: string | null; nextStepAt: string | null; lastContactAt: string | null; createdAt: string; updatedAt: string;
};
type Row = { id: string; platform: "linkedin" | "x"; name: string; handle: string | null; profile_url: string | null; source: Source; stage: Stage; value: string | number | null; notes: string; comment_id: string | null; next_step_at: Date | null; last_contact_at: Date | null; created_at: Date; updated_at: Date };
const iso = (d: Date | null) => (d ? new Date(d).toISOString() : null);
const map = (r: Row): Lead => ({ id: r.id, platform: r.platform, name: r.name, handle: r.handle, profileUrl: r.profile_url, source: r.source, stage: r.stage, value: r.value === null ? null : Number(r.value), notes: r.notes, commentId: r.comment_id, nextStepAt: iso(r.next_step_at), lastContactAt: iso(r.last_contact_at), createdAt: iso(r.created_at)!, updatedAt: iso(r.updated_at)! });
const newId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 14);
export const toFact = (l: Lead): LeadFact => ({ id: l.id, stage: l.stage, value: l.value, createdAt: l.createdAt, updatedAt: l.updatedAt, nextStepAt: l.nextStepAt, lastContactAt: l.lastContactAt });

export async function listLeads(): Promise<Lead[]> {
  await ensureSchema();
  return (await db()<Row[]>`select * from leads order by updated_at desc limit 1000`).map(map);
}

export async function createLead(i: LeadInput, commentId: string | null = null): Promise<string> {
  await ensureSchema();
  const id = newId();
  await db()`insert into leads (id, platform, name, handle, profile_url, source, value, notes, comment_id, next_step_at)
    values (${id}, ${i.platform}, ${i.name}, ${i.handle}, ${i.profileUrl}, ${i.source}, ${i.value}, ${i.notes}, ${commentId}, ${i.nextStepAt})`;
  return id;
}

export async function createMany(list: { name: string; handle: string | null }[], platform: "linkedin" | "x", source: Source): Promise<number> {
  await ensureSchema();
  let n = 0;
  for (const p of list) {
    const [dup] = await db()<{ id: string }[]>`select id from leads where platform = ${platform} and lower(name) = ${p.name.toLowerCase()} and coalesce(lower(handle), '') = ${(p.handle ?? "").toLowerCase()} limit 1`;
    if (dup) continue;
    await db()`insert into leads (id, platform, name, handle, source) values (${newId()}, ${platform}, ${p.name}, ${p.handle}, ${source})`;
    n++;
  }
  return n;
}

export async function leadFromComment(commentId: string): Promise<{ id: string; existing: boolean } | null> {
  await ensureSchema();
  const [dup] = await db()<{ id: string }[]>`select id from leads where comment_id = ${commentId} limit 1`;
  if (dup) return { id: dup.id, existing: true };
  const [c] = await db()<{ platform: "linkedin" | "x"; author_name: string; author_handle: string | null; author_url: string | null; kind: string | null }[]>`
    select platform, author_name, author_handle, author_url, kind from comments where id = ${commentId}`;
  if (!c) return null;
  const id = await createLead({ platform: c.platform, name: c.author_name.trim() || c.author_handle || "Unknown", handle: c.author_handle?.replace(/^@/, "") || null, profileUrl: c.author_url, source: c.kind === "dm" ? "dm" : "comment", value: null, notes: "", nextStepAt: null }, commentId);
  return { id, existing: false };
}

export async function updateLead(id: string, p: LeadPatch): Promise<boolean> {
  await ensureSchema();
  const [cur] = await db()<Row[]>`select * from leads where id = ${id}`;
  if (!cur) return false;
  const stage = p.stage ?? cur.stage;
  const touch = p.stage !== undefined && p.stage !== cur.stage && movesSetContact(p.stage);
  await db()`update leads set
    name = ${p.name ?? cur.name},
    handle = ${p.handle !== undefined ? p.handle : cur.handle},
    profile_url = ${p.profileUrl !== undefined ? p.profileUrl : cur.profile_url},
    value = ${p.value !== undefined ? p.value : cur.value},
    notes = ${p.notes ?? cur.notes},
    next_step_at = ${p.nextStepAt !== undefined ? p.nextStepAt : cur.next_step_at},
    stage = ${stage},
    last_contact_at = ${touch ? new Date().toISOString() : cur.last_contact_at},
    updated_at = now()
    where id = ${id}`;
  return true;
}

export async function deleteLead(id: string) {
  await ensureSchema();
  await db()`delete from leads where id = ${id}`;
}
