export function when(iso: string | null, tz = "UTC") {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(iso));
}
export const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;
export const snippet = (s: string, n = 110) => { const t = s.replace(/\s+/g, " ").trim(); return t.length > n ? `${t.slice(0, n).trim()}...` : t; };
