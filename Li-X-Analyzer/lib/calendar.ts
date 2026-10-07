export type CalItem = {
  id: string; platform: "x" | "linkedin"; channel: string; state: string; date: string; content: string; url: string | null;
};

export const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Monday of the week containing d, local time, midnight. */
export function startOfWeek(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** The days shown for an anchor date: 6 full weeks for a month, 7 days for a week. */
export function gridDays(anchor: Date, view: "month" | "week") {
  if (view === "week") {
    const s = startOfWeek(anchor);
    return Array.from({ length: 7 }, (_, i) => addDays(s, i));
  }
  const s = startOfWeek(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
  return Array.from({ length: 42 }, (_, i) => addDays(s, i));
}

export function groupByDay(items: CalItem[]) {
  const map = new Map<string, CalItem[]>();
  for (const it of items) {
    const k = dayKey(new Date(it.date));
    map.set(k, [...(map.get(k) ?? []), it]);
  }
  return map;
}

export const STATE_LABEL: Record<string, string> = { QUEUE: "Scheduled", PUBLISHED: "Published", ERROR: "Failed", DRAFT: "Draft" };
