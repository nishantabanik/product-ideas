/** Milliseconds that `tz` is ahead of UTC at the instant `ms`. */
function offsetMs(tz: string, ms: number) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(ms));
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second")) - Math.floor(ms / 1000) * 1000;
}

/** Turn a wall-clock time ("2026-10-12T09:00") in an IANA timezone into the real UTC instant. */
export function zonedToUtc(wall: string, tz: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(wall);
  if (!m) throw new Error(`Bad date: ${wall}`);
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  const first = guess - offsetMs(tz, guess);
  return new Date(guess - offsetMs(tz, first));
}
