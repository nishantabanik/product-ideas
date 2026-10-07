export type Slot = { weekday: number; time: string }; // weekday 0 = Sunday, time "HH:MM" in the queue time zone

/** The UTC instant at which the wall clock in `tz` shows this date and time. Handles daylight saving. */
export function zonedToUtc(y: number, mo: number, d: number, h: number, mi: number, tz: string): Date {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const offsetAt = (t: number) => {
    const p = Object.fromEntries(fmt.formatToParts(new Date(t)).map((x) => [x.type, x.value]));
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute) - t;
  };
  let t = guess - offsetAt(guess);
  t = guess - offsetAt(t); // second pass settles the offset when the guess lands near a clock change
  return new Date(t);
}

/** Today's calendar date in a time zone. */
const todayIn = (tz: string, from: Date) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(from).map((x) => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day };
};

/**
 * The next free times the weekly slots produce. `taken` holds ISO strings (to the minute) that are already used, so two posts never
 * share a slot. Looks up to a year ahead.
 */
export function nextSlotTimes(slots: Slot[], tz: string, from: Date, count: number, taken: Iterable<string> = [], minLeadMinutes = 10): Date[] {
  const used = new Set([...taken].map((t) => new Date(t).toISOString().slice(0, 16)));
  const out: Date[] = [];
  if (!slots.length) return out;
  const start = todayIn(tz, from);
  const earliest = from.getTime() + minLeadMinutes * 60_000;
  for (let i = 0; i < 366 && out.length < count; i++) {
    const day = new Date(Date.UTC(start.y, start.m - 1, start.d + i));
    const wd = day.getUTCDay();
    const todays = slots.filter((s) => s.weekday === wd).sort((a, b) => a.time.localeCompare(b.time));
    for (const s of todays) {
      const [h, mi] = s.time.split(":").map(Number);
      const when = zonedToUtc(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), h, mi, tz);
      const key = when.toISOString().slice(0, 16);
      if (when.getTime() < earliest || used.has(key)) continue;
      used.add(key);
      out.push(when);
      if (out.length >= count) break;
    }
  }
  return out;
}

export const validTime = (t: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
export function validZone(tz: string) { try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); return true; } catch { return false; } }
