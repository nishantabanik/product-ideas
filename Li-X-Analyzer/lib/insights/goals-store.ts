import { db, ensureSchema } from "../db";
import type { Goal } from "./goals.ts";

export async function listGoals(): Promise<Goal[]> {
  await ensureSchema();
  const rows = await db()<{ id: string; platform: Goal["platform"]; metric: Goal["metric"]; period: Goal["period"]; target: string }[]>`
    select id, platform, metric, period, target::text from goals order by created_at, id`;
  return rows.map((r) => ({ ...r, target: Number(r.target) }));
}

export async function addGoal(g: Omit<Goal, "id">): Promise<string> {
  await ensureSchema();
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 14);
  await db()`insert into goals (id, platform, metric, period, target) values (${id}, ${g.platform}, ${g.metric}, ${g.period}, ${g.target})`;
  return id;
}

export async function deleteGoal(id: string) {
  await ensureSchema();
  await db()`delete from goals where id = ${id}`;
}
