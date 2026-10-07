export type BulkPlatform = "x" | "linkedin" | "both";
export type BulkRow = {
  line: number;
  date: string; // wall clock, YYYY-MM-DDTHH:mm
  platform: BulkPlatform | null; // null when the platform cell was not understood
  content: string;
  errors: string[];
};

const HEADERS: Record<string, string[]> = {
  date: ["date", "datetime", "date time", "when", "schedule", "scheduled", "scheduled at", "publish date", "day"],
  time: ["time", "hour"],
  platform: ["platform", "network", "channel", "where", "site"],
  content: ["content", "text", "post", "message", "caption", "body", "copy"],
};

export const MAX_ROWS = 100;
const norm = (v: unknown) => String(v ?? "").trim().toLowerCase();

export function parsePlatform(v: unknown): BulkPlatform | null {
  const s = norm(v).replace(/[^a-z]/g, "");
  if (["x", "twitter", "xtwitter"].includes(s)) return "x";
  if (["linkedin", "li", "in"].includes(s)) return "linkedin";
  if (["both", "all", "xlinkedin", "linkedinx", "bothplatforms"].includes(s)) return "both";
  return null;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Accepts a Date (Excel cell, wall clock stored as UTC) or text like 2026-10-12, 2026-10-12 09:30, 2026-10-12T09:30. */
export function parseWhen(dateCell: unknown, timeCell: unknown): { value?: string; error?: string } {
  let y: number, mo: number, d: number, h = 9, mi = 0;
  if (dateCell instanceof Date) {
    y = dateCell.getUTCFullYear(); mo = dateCell.getUTCMonth() + 1; d = dateCell.getUTCDate();
    if (dateCell.getUTCHours() || dateCell.getUTCMinutes()) { h = dateCell.getUTCHours(); mi = dateCell.getUTCMinutes(); }
  } else {
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?/.exec(String(dateCell ?? "").trim());
    if (!m) return { error: "Date must look like 2026-10-12 or 2026-10-12 09:30" };
    y = +m[1]; mo = +m[2]; d = +m[3];
    if (m[4] !== undefined) { h = +m[4]; mi = +m[5]; }
  }
  if (timeCell instanceof Date) {
    h = timeCell.getUTCHours(); mi = timeCell.getUTCMinutes();
  } else if (norm(timeCell)) {
    const t = /^(\d{1,2}):(\d{2})/.exec(String(timeCell).trim());
    if (!t) return { error: "Time must look like 09:30" };
    h = +t[1]; mi = +t[2];
  }
  const check = new Date(Date.UTC(y, mo - 1, d, h, mi));
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d || h > 23 || mi > 59) {
    return { error: "That date or time does not exist" };
  }
  return { value: `${y}-${pad(mo)}-${pad(d)}T${pad(h)}:${pad(mi)}` };
}

/** Turn sheet rows (first non-empty row is the header) into schedule rows with per-row errors. */
export function parseBulkRows(rows: unknown[][]): { rows: BulkRow[]; error?: string } {
  const headerIdx = rows.findIndex((r) => r.some((c) => norm(c)));
  if (headerIdx < 0) return { rows: [], error: "The file is empty." };
  const header = rows[headerIdx].map(norm);
  const col = (k: string) => header.findIndex((h) => HEADERS[k].includes(h));
  const idx = { date: col("date"), time: col("time"), platform: col("platform"), content: col("content") };
  const missing = (["date", "platform", "content"] as const).filter((k) => idx[k] < 0);
  if (missing.length) {
    return { rows: [], error: `Missing column: ${missing.join(", ")}. The first row must have the headers date, platform, content (time is optional).` };
  }

  const out: BulkRow[] = [];
  const seen = new Set<string>();
  rows.slice(headerIdx + 1).forEach((r, i) => {
    if (!r.some((c) => norm(c))) return;
    const line = headerIdx + i + 2;
    const errors: string[] = [];
    const when = parseWhen(r[idx.date], idx.time >= 0 ? r[idx.time] : undefined);
    if (when.error) errors.push(when.error);
    const platform = parsePlatform(r[idx.platform]);
    if (!platform) errors.push("Platform must be x, linkedin or both");
    const content = String(r[idx.content] ?? "").trim();
    if (!content) errors.push("Post text is empty");
    if (platform && platform !== "linkedin" && content.length > 280) errors.push(`X allows 280 characters, this has ${content.length}`);
    if (platform && content.length > 3000) errors.push("LinkedIn allows 3000 characters");
    const key = `${when.value}|${platform}|${content}`;
    if (!errors.length && seen.has(key)) errors.push("Duplicate of an earlier row");
    seen.add(key);
    out.push({ line, date: when.value ?? "", platform, content, errors });
  });
  if (!out.length) return { rows: [], error: "No post rows found under the header." };
  if (out.length > MAX_ROWS) return { rows: [], error: `At most ${MAX_ROWS} rows per file, this has ${out.length}.` };
  return { rows: out };
}
