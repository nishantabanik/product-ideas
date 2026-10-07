import { db, ensureSchema } from "../db";
import type { Coach } from "./schema.ts";
import type { Advisory } from "./types.ts";

export type Stored = { day: string; generatedAt: string; advisory: Advisory; coach: Coach | null; coachError: string | null; model: string | null };

export async function saveAdvisory(a: Advisory, coach: Coach | null, coachError: string | null, model: string | null) {
  await ensureSchema();
  await db()`insert into advisories (day, generated_at, data, coach, coach_error, model)
    values (${a.day}, ${a.generatedAt}, ${db().json(a as never)}, ${coach ? db().json(coach as never) : null}, ${coachError}, ${model})
    on conflict (day) do update set generated_at = excluded.generated_at, data = excluded.data, coach = excluded.coach,
      coach_error = excluded.coach_error, model = excluded.model`;
}

type Row = { day: string; generated_at: Date; data: Advisory; coach: Coach | null; coach_error: string | null; model: string | null };
const toStored = (r: Row): Stored => ({ day: r.day, generatedAt: new Date(r.generated_at).toISOString(), advisory: r.data, coach: r.coach, coachError: r.coach_error, model: r.model });

/** The advisory for a day, or the most recent one before it when no day is given or that day has none. */
export async function getAdvisory(day?: string): Promise<Stored | null> {
  await ensureSchema();
  const [r] = day
    ? await db()<Row[]>`select to_char(day, 'YYYY-MM-DD') as day, generated_at, data, coach, coach_error, model from advisories where day = ${day}::date`
    : await db()<Row[]>`select to_char(day, 'YYYY-MM-DD') as day, generated_at, data, coach, coach_error, model from advisories order by day desc limit 1`;
  return r ? toStored(r) : null;
}

export type HistoryPoint = { day: string; linkedin: number | null; x: number | null };

export async function history(limit = 60): Promise<HistoryPoint[]> {
  await ensureSchema();
  const rows = await db()<{ day: string; linkedin: string | null; x: string | null }[]>`
    select to_char(day, 'YYYY-MM-DD') as day, data->'scores'->'linkedin'->>'overall' as linkedin, data->'scores'->'x'->>'overall' as x
    from advisories order by day desc limit ${limit}`;
  return rows.reverse().map((r) => ({ day: r.day, linkedin: r.linkedin === null ? null : Number(r.linkedin), x: r.x === null ? null : Number(r.x) }));
}

export async function days(limit = 45): Promise<string[]> {
  await ensureSchema();
  const rows = await db()<{ day: string }[]>`select to_char(day, 'YYYY-MM-DD') as day from advisories order by day desc limit ${limit}`;
  return rows.map((r) => r.day);
}
