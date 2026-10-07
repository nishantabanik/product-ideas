/** X counts most characters as 1, East Asian text and emoji as 2, and every link as 23. */
const URL_RE = /https?:\/\/\S+/g;
export const X_LIMIT = 280;

export function tweetLength(text: string): number {
  let n = 0;
  const plain = text.replace(URL_RE, () => { n += 23; return ""; });
  for (const ch of plain) {
    const c = ch.codePointAt(0)!;
    n += c <= 0x10ff || (c >= 0x2000 && c <= 0x200d) || (c >= 0x2010 && c <= 0x201f) || (c >= 0x2032 && c <= 0x2037) ? 1 : 2;
  }
  return n;
}

/** Cuts one long text into posts of at most `limit`, at paragraph, then sentence, then word boundaries. */
export function splitThread(text: string, limit = X_LIMIT, numbering = false): string[] {
  const reserve = numbering ? 8 : 0; // room for " (12/12)"
  const max = limit - reserve;
  const units: string[] = [];
  for (const para of text.replace(/\r/g, "").trim().split(/\n{2,}/)) {
    const p = para.trim();
    if (!p) continue;
    if (tweetLength(p) <= max) { units.push(p); continue; }
    for (const s of p.split(/(?<=[.!?])\s+/)) {
      if (tweetLength(s) <= max) { units.push(s); continue; }
      let cur = "";
      for (const w of s.split(/\s+/)) {
        const next = cur ? `${cur} ${w}` : w;
        if (tweetLength(next) > max && cur) { units.push(cur); cur = w; } else cur = next;
      }
      if (cur) units.push(cur);
    }
  }
  const out: string[] = [];
  let cur = "";
  for (const u of units) {
    const next = cur ? `${cur}\n\n${u}` : u;
    if (cur && tweetLength(next) > max) { out.push(cur); cur = u; } else cur = next;
  }
  if (cur) out.push(cur);
  return numbering && out.length > 1 ? out.map((t, i) => `${t} (${i + 1}/${out.length})`) : out;
}

export const joinThread = (posts: string[]) => posts.map((p) => p.trim()).filter(Boolean).join("\n\n");

export type ThreadCheck = { ok: boolean; problems: string[]; lengths: number[] };
export function checkThread(posts: string[]): ThreadCheck {
  const list = posts.map((p) => p.trim());
  const problems: string[] = [];
  const lengths = list.map(tweetLength);
  list.forEach((p, i) => {
    if (!p) problems.push(`Post ${i + 1} is empty.`);
    if (lengths[i] > X_LIMIT) problems.push(`Post ${i + 1} is ${lengths[i]} characters, the limit is ${X_LIMIT}.`);
  });
  if (list.length > 25) problems.push("A thread can have at most 25 posts.");
  return { ok: problems.length === 0 && list.length > 0, problems, lengths };
}
