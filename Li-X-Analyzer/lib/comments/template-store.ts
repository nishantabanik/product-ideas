import { db, ensureSchema } from "../db";
import type { Template } from "./starters.ts";

type Db = { id: string; name: string; body: string; platform: string; uses: number };
const map = (r: Db): Template => ({ id: r.id, name: r.name, body: r.body, platform: r.platform === "linkedin" || r.platform === "x" ? r.platform : "both", uses: r.uses });

export async function listTemplates(): Promise<Template[]> {
  await ensureSchema();
  const rows = await db()<Db[]>`select id, name, body, platform, uses from reply_templates order by uses desc, created_at asc`;
  return rows.map(map);
}

export async function saveTemplate(t: { id?: string | null; name: string; body: string; platform: "both" | "linkedin" | "x" }): Promise<string> {
  await ensureSchema();
  if (t.id) {
    const done = await db()<{ id: string }[]>`update reply_templates set name = ${t.name}, body = ${t.body}, platform = ${t.platform} where id = ${t.id} returning id`;
    if (done.length) return t.id;
  }
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 14);
  await db()`insert into reply_templates (id, name, body, platform) values (${id}, ${t.name}, ${t.body}, ${t.platform})`;
  return id;
}

export async function bumpTemplate(id: string) {
  await ensureSchema();
  await db()`update reply_templates set uses = uses + 1 where id = ${id}`;
}

export async function deleteTemplate(id: string) {
  await ensureSchema();
  await db()`delete from reply_templates where id = ${id}`;
}
