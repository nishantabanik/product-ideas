import { db, ensureSchema } from "../db";
import { utcDay } from "./rotation.ts";

export const MAX_TARGETS = 100;
export type Target = { id: string; platform: "linkedin" | "x"; name: string; handle: string | null; profileUrl: string | null; note: string; topics: string; active: boolean; lastEngagedAt: string | null; createdAt: string };
export type TargetInput = { platform: "linkedin" | "x"; name: string; handle: string | null; profileUrl: string | null; note: string; topics: string };
type Row = { id: string; platform: "linkedin" | "x"; name: string; handle: string | null; profile_url: string | null; note: string; topics: string; active: boolean; last_engaged_at: Date | null; created_at: Date };
const iso = (d: Date | null) => (d ? new Date(d).toISOString() : null);
const map = (r: Row): Target => ({ id: r.id, platform: r.platform, name: r.name, handle: r.handle, profileUrl: r.profile_url, note: r.note, topics: r.topics, active: r.active, lastEngagedAt: iso(r.last_engaged_at), createdAt: iso(r.created_at)! });
const newId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 14);

export async function listTargets(): Promise<Target[]> {
  await ensureSchema();
  return (await db()<Row[]>`select * from targets order by created_at asc, id asc`).map(map);
}
export async function getTarget(id: string): Promise<Target | null> {
  await ensureSchema();
  const [r] = await db()<Row[]>`select * from targets where id = ${id}`;
  return r ? map(r) : null;
}
const total = async () => (await db()<{ n: number }[]>`select count(*)::int as n from targets`)[0].n;

export async function createTarget(i: TargetInput): Promise<string | null> {
  await ensureSchema();
  if ((await total()) >= MAX_TARGETS) return null;
  const id = newId();
  await db()`insert into targets (id, platform, name, handle, profile_url, note, topics) values (${id}, ${i.platform}, ${i.name}, ${i.handle}, ${i.profileUrl}, ${i.note}, ${i.topics})`;
  return id;
}

export async function createMany(list: { name: string; handle: string | null }[], platform: "linkedin" | "x"): Promise<{ added: number; skipped: number }> {
  await ensureSchema();
  let room = MAX_TARGETS - (await total());
  let added = 0;
  for (const p of list) {
    if (room <= 0) break;
    const [dup] = await db()<{ id: string }[]>`select id from targets where platform = ${platform} and lower(name) = ${p.name.toLowerCase()} and coalesce(lower(handle), '') = ${(p.handle ?? "").toLowerCase()} limit 1`;
    if (dup) continue;
    await db()`insert into targets (id, platform, name, handle) values (${newId()}, ${platform}, ${p.name}, ${p.handle})`;
    added++; room--;
  }
  return { added, skipped: list.length - added };
}

export type TargetPatch = Partial<Omit<TargetInput, "platform">> & { active?: boolean };
export async function updateTarget(id: string, p: TargetPatch): Promise<boolean> {
  await ensureSchema();
  const [cur] = await db()<Row[]>`select * from targets where id = ${id}`;
  if (!cur) return false;
  await db()`update targets set name = ${p.name ?? cur.name}, handle = ${p.handle !== undefined ? p.handle : cur.handle},
    profile_url = ${p.profileUrl !== undefined ? p.profileUrl : cur.profile_url}, note = ${p.note ?? cur.note}, topics = ${p.topics ?? cur.topics}, active = ${p.active ?? cur.active} where id = ${id}`;
  return true;
}
export async function deleteTarget(id: string) {
  await ensureSchema();
  await db()`delete from engagement_log where target_id = ${id}`;
  await db()`delete from targets where id = ${id}`;
}

/** Marks a target engaged for the UTC day of `now`. Doing it twice the same day only updates the note. */
export async function engage(id: string, note: string | null, now = new Date()): Promise<boolean> {
  await ensureSchema();
  if (!(await getTarget(id))) return false;
  await db()`insert into engagement_log (id, day, target_id, note) values (${newId()}, ${utcDay(now)}, ${id}, ${note})
    on conflict (day, target_id) do update set note = coalesce(excluded.note, engagement_log.note)`;
  await db()`update targets set last_engaged_at = ${now.toISOString()} where id = ${id}`;
  return true;
}

export type LogRow = { day: string; targetId: string; note: string | null };
export async function recentLog(days = 120): Promise<LogRow[]> {
  await ensureSchema();
  const rows = await db()<{ day: Date | string; target_id: string; note: string | null }[]>`select day, target_id, note from engagement_log where day >= (now() at time zone 'utc')::date - ${days}::int order by day desc`;
  return rows.map((r) => ({ day: typeof r.day === "string" ? r.day.slice(0, 10) : new Date(r.day).toISOString().slice(0, 10), targetId: r.target_id, note: r.note }));
}
