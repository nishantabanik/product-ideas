import { db, ensureSchema } from "../db";
import { validateAsset, type Asset, type AssetKind, type Selection } from "./assets.ts";

type Row = { id: string; kind: AssetKind; name: string; body: string; platform: Asset["platform"]; active: boolean; position: number };
const newId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 14);
const MAX_ASSETS = 200;

export async function listAssets(kind?: AssetKind): Promise<Asset[]> {
  await ensureSchema();
  const rows = kind
    ? await db()<Row[]>`select id, kind, name, body, platform, active, position from writing_assets where kind = ${kind} order by position, created_at`
    : await db()<Row[]>`select id, kind, name, body, platform, active, position from writing_assets order by kind, position, created_at`;
  return rows;
}

export async function saveAsset(input: { id?: string; kind?: string; name?: string; body?: string; platform?: string; active?: boolean }): Promise<string> {
  const v = validateAsset(input);
  await ensureSchema();
  const sql = db();
  if (input.id) {
    const r = await sql`update writing_assets set name = ${v.name}, body = ${v.body}, platform = ${v.platform}, active = ${v.active}, updated_at = now() where id = ${input.id} and kind = ${v.kind} returning id`;
    if (!r.length) throw new Error("That item no longer exists.");
    return input.id;
  }
  const [{ n }] = await sql<{ n: number }[]>`select count(*)::int as n from writing_assets`;
  if (n >= MAX_ASSETS) throw new Error(`We keep at most ${MAX_ASSETS} items. Delete some first.`);
  const id = newId();
  const [{ p }] = await sql<{ p: number }[]>`select coalesce(max(position), 0)::int + 1 as p from writing_assets where kind = ${v.kind}`;
  await sql`insert into writing_assets (id, kind, name, body, platform, active, position) values (${id}, ${v.kind}, ${v.name}, ${v.body}, ${v.platform}, ${v.active}, ${p})`;
  return id;
}

export async function setAssetActive(id: string, active: boolean) {
  await ensureSchema();
  await db()`update writing_assets set active = ${active}, updated_at = now() where id = ${id}`;
}

export async function deleteAsset(id: string) {
  await ensureSchema();
  await db()`delete from writing_assets where id = ${id}`;
}

export async function assetsByIds(ids: string[]): Promise<Asset[]> {
  const list = [...new Set(ids.filter((x) => typeof x === "string" && x.length <= 40))].slice(0, 60);
  if (!list.length) return [];
  await ensureSchema();
  return db()<Row[]>`select id, kind, name, body, platform, active, position from writing_assets where id = any(${list}) order by kind, position, created_at`;
}

/** What is switched on by default for a platform. Used by the chat, where nothing is picked by hand. */
export async function activeSelection(platform: "linkedin" | "x"): Promise<Selection> {
  const all = (await listAssets()).filter((a) => a.active && (a.platform === "both" || a.platform === platform));
  return { tone: all.find((a) => a.kind === "tone") ?? null, styles: all.filter((a) => a.kind === "style"), memories: all.filter((a) => a.kind === "memory"), skills: all.filter((a) => a.kind === "skill") };
}
