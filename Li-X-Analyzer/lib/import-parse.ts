import { createHash } from "node:crypto";

export type Platform = "linkedin" | "x";
export type Sheet = { name: string; rows: unknown[][] };

export type DailyRow = {
  platform: Platform; day: string; impressions: number | null; engagements: number | null;
  likes: number | null; comments: number | null; shares: number | null; clicks: number | null;
};
export type ImportedPost = {
  id: string;
  platform: Platform;
  content: string;
  publishedAt: string | null;
  url: string | null;
  impressions: number | null;
  engagements: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  clicks: number | null;
};
export type FollowerRow = { platform: Platform; day: string; total: number | null; gained: number | null; lost: number | null };
export type ParseResult = { daily: DailyRow[]; posts: ImportedPost[]; followers: FollowerRow[]; notes: string[] };

const A = {
  url: ["post url", "post link", "url", "tweet permalink", "permalink", "post permalink"],
  content: ["post title", "post text", "post", "commentary", "tweet text", "text"],
  date: ["post publish date", "created date", "publish date", "date", "time", "created at", "day"],
  impressions: ["impressions", "impressions (total)", "total impressions"],
  engagements: ["engagements", "engagement", "total engagements"],
  likes: ["likes", "reactions", "reactions (total)", "like"],
  comments: ["comments", "comments (total)", "replies", "reply"],
  shares: ["reposts", "shares", "reposts (total)", "retweets", "retweet"],
  clicks: ["clicks", "clicks (total)", "url clicks", "link clicks", "url link clicks"],
} as const;
type Key = keyof typeof A;

const norm = (v: unknown) => String(v ?? "").trim().toLowerCase();
const is = (cell: unknown, key: Key) => (A[key] as readonly string[]).includes(norm(cell));
const isBlank = (r: unknown[]) => !r.some((c) => norm(c));

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? Math.round(v) : null;
  const n = Number(String(v).replace(/[, %]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : null;
}

/* ---------- dates ---------- */

type Order = "mdy" | "dmy";
const SLASH = /^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})/;

/** LinkedIn writes 9/30/2025. If any value has a first part above 12 it is day first, otherwise month first. */
export function inferOrder(values: unknown[]): Order {
  let dmy = false, mdy = false;
  for (const v of values) {
    const m = SLASH.exec(String(v ?? "").trim());
    if (!m) continue;
    if (+m[1] > 12) dmy = true;
    else if (+m[2] > 12) mdy = true;
  }
  return dmy && !mdy ? "dmy" : "mdy";
}

function build(y: number, mo: number, d: number): string | null {
  const t = new Date(Date.UTC(y, mo - 1, d));
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== mo - 1 || t.getUTCDate() !== d) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function parseDay(v: unknown, order: Order = "mdy"): string | null {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : build(v.getUTCFullYear(), v.getUTCMonth() + 1, v.getUTCDate());
  const s = String(v ?? "").trim();
  if (!s) return null;
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if (m) return build(+m[1], +m[2], +m[3]);
  m = SLASH.exec(s);
  if (m) {
    const y = +m[3] < 100 ? 2000 + +m[3] : +m[3];
    return order === "dmy" ? build(y, +m[2], +m[1]) : build(y, +m[1], +m[2]);
  }
  if (/[a-z]{3}/i.test(s) && /\d{4}/.test(s)) {
    const t = new Date(s);
    if (!Number.isNaN(t.getTime())) return build(t.getFullYear(), t.getMonth() + 1, t.getDate());
  }
  return null;
}

/** A full timestamp when the cell has a time, otherwise noon UTC on that day so the date never shifts. */
function parseInstant(v: unknown, order: Order): string | null {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.toISOString();
  const s = String(v ?? "").trim();
  if (/^\d{4}-\d{1,2}-\d{1,2}[ T]\d{1,2}:\d{2}/.test(s)) {
    const t = new Date(s);
    if (!Number.isNaN(t.getTime())) return t.toISOString();
  }
  const day = parseDay(v, order);
  return day ? `${day}T12:00:00.000Z` : null;
}

/* ---------- followers ---------- */

const F = {
  date: ["date", "day", "week", "time", "created date"],
  gained: ["new followers", "new follows", "followers gained", "gained followers", "follower gain", "gained", "new follower", "follows"],
  lost: ["unfollows", "unfollowed", "followers lost", "lost followers", "lost", "new unfollows"],
  total: ["total followers", "followers (total)", "total", "followers", "follower count", "total follower count", "followers total"],
  organic: ["organic followers", "organic"],
  sponsored: ["sponsored followers", "paid followers", "sponsored"],
} as const;
type FKey = keyof typeof F;
const fis = (cell: unknown, k: FKey) => (F[k] as readonly string[]).includes(norm(cell));

/**
 * Daily follower numbers. A LinkedIn followers sheet (sheet name has "follower") has a Date column with New followers and/or
 * Total followers (or Organic plus Sponsored). An X analytics CSV has daily New follows and Unfollows next to the other columns.
 * Header names are matched loosely, and rows without a readable date are skipped.
 */
function parseFollowers(rows: unknown[][], sheetName: string, notes: string[]): FollowerRow[] {
  const named = /follower/i.test(sheetName);
  const h = rows.findIndex((r) => {
    if (!r.some((c) => fis(c, "date"))) return false;
    const hasX = r.some((c) => ["new follows", "unfollows"].includes(norm(c)));
    if (hasX) return true;
    return named && r.some((c) => fis(c, "gained") || fis(c, "total") || fis(c, "organic") || fis(c, "sponsored") || fis(c, "lost"));
  });
  if (h < 0) return [];
  const header = rows[h];
  const col = (k: FKey) => header.findIndex((c) => fis(c, k));
  const [dc, gc, lc, tc, oc, sc] = [col("date"), col("gained"), col("lost"), col("total"), col("organic"), col("sponsored")];
  const isX = header.some((c) => ["new follows", "unfollows"].includes(norm(c)));
  const platform: Platform = isX ? "x" : "linkedin";
  const body = rows.slice(h + 1);
  const order = inferOrder(body.map((r) => r[dc]));
  const pick = (r: unknown[], i: number) => (i >= 0 ? num(r[i]) : null);

  const out = new Map<string, FollowerRow>();
  for (const r of body) {
    const day = parseDay(r[dc], order);
    if (!day) continue;
    let gained = pick(r, gc);
    if (gained === null && gc < 0 && (oc >= 0 || sc >= 0)) {
      const parts = [pick(r, oc), pick(r, sc)].filter((v): v is number => v !== null);
      gained = parts.length ? parts.reduce((a, b) => a + b, 0) : null;
    }
    const row: FollowerRow = { platform, day, total: pick(r, tc), gained, lost: pick(r, lc) };
    if (row.total === null && row.gained === null && row.lost === null) continue;
    out.set(day, row);
  }
  const list = [...out.values()];
  if (list.length) {
    const days = list.map((d) => d.day).sort();
    notes.push(`Follower numbers: ${list.length} days from ${days[0]} to ${days[days.length - 1]}.`);
  }
  return list;
}

/* ---------- tables ---------- */

function parseDaily(rows: unknown[][], notes: string[]): DailyRow[] {
  const h = rows.findIndex((r) => {
    const cells = r;
    return cells.some((c) => is(c, "date")) &&
      cells.some((c) => is(c, "impressions") || is(c, "engagements") || is(c, "likes") || is(c, "comments")) &&
      !cells.some((c) => is(c, "url"));
  });
  if (h < 0) return [];
  const header = rows[h];
  const col = (k: Key) => header.findIndex((c) => is(c, k));
  const [dc, ic, ec, lc, cc, sc, kc] = [col("date"), col("impressions"), col("engagements"), col("likes"), col("comments"), col("shares"), col("clicks")];
  const pick = (r: unknown[], i: number) => (i >= 0 ? num(r[i]) : null);
  const platform: Platform = header.some((c) => /tweet|retweet/.test(norm(c))) ? "x" : "linkedin";
  const body = rows.slice(h + 1);
  const order = inferOrder(body.map((r) => r[dc]));

  const out: DailyRow[] = [];
  for (const r of body) {
    const day = parseDay(r[dc], order);
    if (!day) continue;
    out.push({ platform, day, impressions: pick(r, ic), engagements: pick(r, ec), likes: pick(r, lc), comments: pick(r, cc), shares: pick(r, sc), clicks: pick(r, kc) });
  }
  if (out.length) {
    const days = out.map((d) => d.day).sort();
    notes.push(`Daily numbers: ${out.length} days from ${days[0]} to ${days[days.length - 1]}.`);
  }
  return out;
}

const X_URL = /(?:^|\/\/)(?:www\.)?(?:x|twitter)\.com\//i;

function postId(url: string | null, content: string, when: string | null, isX: boolean) {
  const statusId = /\/status\/(\d+)/.exec(url ?? "")?.[1];
  if (isX && statusId) return `x_${statusId}`;
  const key = url || `${content}|${when}`;
  return (isX ? "x_" : "li_") + createHash("sha1").update(key).digest("hex").slice(0, 20);
}

/** One sheet can hold several post tables side by side (LinkedIn lists "by engagements" next to "by impressions"). */
function parsePostTables(rows: unknown[][]): { posts: ImportedPost[]; tableSizes: number[] } {
  const h = rows.findIndex((r) => r.some((c) => is(c, "url")));
  if (h < 0) return { posts: [], tableSizes: [] };
  const header = rows[h];
  const starts = header.flatMap((c, i) => (is(c, "url") ? [i] : []));
  const body = rows.slice(h + 1);
  const order = inferOrder(body.flatMap((r) => starts.map((s) => r[s + 1])).concat(body.flatMap((r) => r)));

  const merged = new Map<string, ImportedPost>();
  const tableSizes: number[] = [];
  starts.forEach((start, t) => {
    const end = starts[t + 1] ?? header.length;
    const col = (k: Key) => {
      for (let i = start; i < end; i++) if (is(header[i], k)) return i;
      return -1;
    };
    const idx = Object.fromEntries((Object.keys(A) as Key[]).map((k) => [k, col(k)])) as Record<Key, number>;
    const isXTable = header.slice(start, end).some((c) => norm(c).startsWith("tweet"));
    let size = 0;
    for (const r of body) {
      const get = (k: Key) => (idx[k] >= 0 ? r[idx[k]] : undefined);
      const url = norm(get("url")) ? String(get("url")).trim() : null;
      const content = norm(get("content")) ? String(get("content")).trim() : "";
      if (!url && !content) continue;
      size++;
      const isX = X_URL.test(url ?? "") || isXTable;
      const when = parseInstant(get("date"), order);
      const id = postId(url, content, when, isX);
      const next: ImportedPost = {
        id, platform: isX ? "x" : "linkedin", content, publishedAt: when, url,
        impressions: num(get("impressions")), engagements: num(get("engagements")), likes: num(get("likes")),
        comments: num(get("comments")), shares: num(get("shares")), clicks: num(get("clicks")),
      };
      const prev = merged.get(id);
      merged.set(id, prev ? {
        ...prev, content: next.content || prev.content, publishedAt: next.publishedAt ?? prev.publishedAt, url: next.url ?? prev.url,
        impressions: next.impressions ?? prev.impressions, engagements: next.engagements ?? prev.engagements, likes: next.likes ?? prev.likes,
        comments: next.comments ?? prev.comments, shares: next.shares ?? prev.shares, clicks: next.clicks ?? prev.clicks,
      } : next);
    }
    tableSizes.push(size);
  });
  return { posts: [...merged.values()], tableSizes };
}

/** Read every sheet of an export. Daily history and post tables can be in any sheet, in any order. */
export function parseWorkbook(sheets: Sheet[]): ParseResult {
  const notes: string[] = [];
  const daily = new Map<string, DailyRow>();
  const posts = new Map<string, ImportedPost>();
  const followers = new Map<string, FollowerRow>();
  const sizes: number[] = [];

  for (const sheet of sheets) {
    for (const d of parseDaily(sheet.rows, notes)) daily.set(`${d.platform}|${d.day}`, d);
    for (const f of parseFollowers(sheet.rows, sheet.name, notes)) followers.set(`${f.platform}|${f.day}`, f);
    const found = parsePostTables(sheet.rows);
    sizes.push(...found.tableSizes);
    for (const p of found.posts) {
      const prev = posts.get(p.id);
      posts.set(p.id, prev ? { ...prev, ...Object.fromEntries(Object.entries(p).filter(([, v]) => v !== null && v !== "")) } as ImportedPost : p);
    }
  }
  if (posts.size) notes.push(`Posts: ${posts.size} found.`);
  if (sizes.some((s) => s >= 50)) {
    notes.push("LinkedIn lists at most 50 posts per export. To capture older posts, export shorter date ranges (for example one month at a time) and upload each file.");
  }
  return { daily: [...daily.values()], posts: [...posts.values()], followers: [...followers.values()], notes };
}

/* ---------- csv ---------- */

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      rows.push(row); row = [];
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

export { isBlank };
