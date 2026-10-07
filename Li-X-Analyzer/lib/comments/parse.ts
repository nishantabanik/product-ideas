export type Parsed = { author: string; body: string; when: string | null };

const NOISE: RegExp[] = [
  /^(like|reply|report|share|send|comment|more|…more|see more|see less|edited|author|creator|you|follow|connect|message|pending|translate|show translation)$/i,
  /^\d+\s*(reactions?|likes?|repl(y|ies)|comments?)$/i,
  /^[•·|]+$/,
  /^[•·]?\s*(1st|2nd|3rd|\d+th)(\s+degree connection)?$/i,
  /^(load more comments|view \d+ more repl\w+|view more comments|add a comment…?)$/i,
  /^(most relevant|newest|top comments)$/i,
];
const TIME = /^[•·]?\s*(\d+\s?(s|m|min|mins|h|hr|hrs|d|w|wk|mo|y|yr)|\d{1,2}:\d{2}\s?(am|pm)?|just now|yesterday|\d+ (second|minute|hour|day|week|month|year)s? ago)\s*(•\s*edited)?$/i;

const clean = (l: string) => l.replace(/\s+/g, " ").trim();

/**
 * Comments pasted from a post page. Blocks are separated by a blank line. In each block the first line is the author and the rest
 * is the comment, or the block is one line written as "Author: comment". Buttons, reaction counts, connection degrees and times
 * that the page adds are dropped.
 */
export function parsePasted(raw: string): Parsed[] {
  const blocks = raw.replace(/\r/g, "").split(/\n\s*\n/);
  const out: Parsed[] = [];
  for (const block of blocks) {
    let when: string | null = null;
    const lines: string[] = [];
    for (const l0 of block.split("\n")) {
      // "Like | Reply | 3 Reactions" is one line of buttons. Keep only the parts that are not page furniture.
      const kept = clean(l0).split(/\s*\|\s*/).map((t) => t.replace(/^[•·\s]+/, "").trim()).filter((t) => t && !NOISE.some((n) => n.test(t)));
      const l = kept.join(" ").trim();
      if (!l) continue;
      if (TIME.test(l)) { when = when ?? l; continue; }
      if (lines[lines.length - 1] === l) continue; // LinkedIn repeats the name for screen readers
      lines.push(l);
    }
    if (!lines.length) continue;
    if (lines.length === 1) {
      const m = /^(.{2,60}?)\s*:\s+(.+)$/.exec(lines[0]);
      if (m) out.push({ author: m[1], body: m[2], when });
      continue; // a lone line with no author is not enough to go on
    }
    out.push({ author: lines[0].replace(/\s*[•·].*$/, ""), body: lines.slice(1).join("\n"), when });
  }
  return out.filter((c) => c.body.length > 0);
}

/** Turns the loose time words some pages give ("2d", "3 weeks ago") into a date, counted back from `now`. */
export function relativeTime(text: string | null, now = new Date()): string | null {
  if (!text) return null;
  const m = /(\d+)\s*(s|m|min|mins|h|hr|hrs|d|w|wk|mo|y|yr|second|minute|hour|day|week|month|year)/i.exec(text);
  if (!m) return /yesterday/i.test(text) ? new Date(now.getTime() - 86_400_000).toISOString() : /just now/i.test(text) ? now.toISOString() : null;
  const n = Number(m[1]);
  const u = m[2].toLowerCase();
  const ms = u.startsWith("mo") ? 30 * 86_400_000 : u.startsWith("m") ? 60_000 : u.startsWith("s") ? 1000 : u.startsWith("h") ? 3_600_000 : u.startsWith("d") ? 86_400_000 : u.startsWith("w") ? 7 * 86_400_000 : 365 * 86_400_000;
  return new Date(now.getTime() - n * ms).toISOString();
}

/** Rows from a CSV or Excel file with columns like author, comment, date and link. */
export function parseCommentRows(rows: unknown[][]): { comments: (Parsed & { link: string | null; post: string | null })[]; error?: string } {
  const header = rows.findIndex((r) => r.some((c) => String(c ?? "").trim()));
  if (header < 0) return { comments: [], error: "The file is empty." };
  const names = rows[header].map((c) => String(c ?? "").trim().toLowerCase());
  const col = (...opts: string[]) => names.findIndex((n) => opts.includes(n));
  const [a, b, d, l, p] = [col("author", "name", "from", "commenter"), col("comment", "text", "body", "message"), col("date", "when", "time", "commented at"), col("link", "url", "comment link", "comment url"), col("post", "post url", "post link")];
  if (a < 0 || b < 0) return { comments: [], error: "We need columns called author and comment. Optional: date, link (of the comment), post (link of our post)." };
  const comments = rows.slice(header + 1).filter((r) => String(r[b] ?? "").trim()).map((r) => ({
    author: String(r[a] ?? "").trim() || "Unknown",
    body: String(r[b]).trim(),
    when: d >= 0 && r[d] ? (r[d] instanceof Date ? (r[d] as Date).toISOString() : String(r[d])) : null,
    link: l >= 0 && r[l] ? String(r[l]).trim() : null,
    post: p >= 0 && r[p] ? String(r[p]).trim() : null,
  }));
  return { comments };
}
