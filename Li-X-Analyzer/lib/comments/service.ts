import { db, ensureSchema } from "../db";
import { getConnection, getState, setState } from "../connections";
import { llmAvailable } from "../llm/index.ts";
import { parseLinkedinCommentLink } from "./links.ts";
import { replyLinkedin, type LinkedinConn } from "./linkedin.ts";
import { parseCommentRows, parsePasted, relativeTime } from "./parse.ts";
import { addComments, markReplied, resolvePost } from "./store";
import { extractComments } from "./suggest.ts";
import type { CommentKind, CommentRow, NewComment, Platform } from "./types.ts";
import { mentionsToComments, xConfigured, xMe, xMentions, xReply } from "./x.ts";

/** Pulls new replies and mentions from X. Only tweets newer than the last sync are read, so only new ones are billed. */
export async function syncXComments(limit = Number(process.env.X_SYNC_LIMIT || 50)) {
  if (!xConfigured()) throw new Error("The X keys are not set. Add X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN and X_ACCESS_SECRET.");
  let myId = await getState("x:user_id");
  if (!myId) { myId = (await xMe()).id; await setState("x:user_id", myId); }
  const m = await xMentions(myId, await getState("x:mentions_since"), limit);

  await ensureSchema();
  const ids = [...new Set(m.tweets.flatMap((t) => [t.conversation_id, ...(t.referenced_tweets ?? []).map((r) => r.id)]).filter((x): x is string => !!x))];
  const ours = ids.length ? await db()<{ id: string; external_id: string }[]>`select id, external_id from posts where platform = 'x' and external_id = any(${ids})` : [];
  const byExt = new Map(ours.map((p) => [p.external_id, p.id]));
  const list = mentionsToComments(m, myId, (tid) => (byExt.has(tid) ? { id: byExt.get(tid)! } : null));
  const r = await addComments(list);
  if (m.newestId) await setState("x:mentions_since", m.newestId);
  return { fetched: m.tweets.length, added: r.added };
}

export type SendResult = { sent: boolean; via: string; reason?: string };

/** Sends a reply from here when we can (X keys, or LinkedIn connected plus the comment's link). Otherwise it says why not. */
export async function sendReply(c: CommentRow, text: string): Promise<SendResult> {
  if (c.kind === "dm") return { sent: false, via: "manual", reason: `We cannot send messages from here. Copy the reply and send it in ${c.platform === "x" ? "X" : "LinkedIn"} messages.` };
  if (c.platform === "x") {
    if (!xConfigured()) return { sent: false, via: "manual", reason: "The X keys are not set, so copy the reply and post it on X." };
    if (!c.externalId) return { sent: false, via: "manual", reason: "We do not have the id of this tweet, so copy the reply and post it on X." };
    const id = await xReply(text, c.externalId);
    await markReplied(c.id, text, "x_api", id);
    return { sent: true, via: "x_api" };
  }
  const conn = await getConnection<LinkedinConn>("linkedin");
  const link = parseLinkedinCommentLink(c.commentUrl);
  if (!conn) return { sent: false, via: "manual", reason: "LinkedIn is not connected. Connect it on the Settings page, or copy the reply and post it on LinkedIn." };
  if (!link) return { sent: false, via: "manual", reason: "To send from here we need the comment's link. On LinkedIn, open the comment's menu, choose Copy link to comment, and add it to this comment. Or copy the reply and post it on LinkedIn." };
  const id = await replyLinkedin(conn, { postUrn: link.postUrn, parentCommentUrn: link.commentUrn, text });
  await markReplied(c.id, text, "linkedin_api", id);
  return { sent: true, via: "linkedin_api" };
}

export type CaptureInput = { kind?: CommentKind; platform: Platform; post?: string | null; mode: "paste" | "single"; text?: string; smart?: boolean; author?: string; body?: string; link?: string | null };

const base = (platform: Platform, post: { id: string; ref: string | null } | null, source: NewComment["source"]) => ({
  platform, postId: post?.id || null, postRef: post?.ref ?? null, source, likes: null, authorHandle: null, authorUrl: null,
});

/** Comments we type or paste in. */
export async function capture(i: CaptureInput): Promise<{ added: number; skipped: number; found: number; method?: string }> {
  const kind: CommentKind = i.kind === "dm" ? "dm" : "comment";
  const post = kind === "dm" ? null : await resolvePost(i.platform, i.post);
  const now = new Date();
  const list: NewComment[] = [];
  let method: string | undefined;

  if (i.mode === "single") {
    if (!i.body?.trim()) throw new Error(kind === "dm" ? "Write the message first." : "Write the comment first.");
    const link = kind === "dm" ? null : parseLinkedinCommentLink(i.link);
    list.push({ ...base(i.platform, post, "manual"), postId: post?.id || null, postRef: link?.postUrn ?? post?.ref ?? null, externalId: link?.commentId ?? null,
      authorName: i.author?.trim() || "Unknown", body: i.body.trim(), commentedAt: now.toISOString(), commentUrl: i.link?.trim() || null, kind });
  } else {
    const raw = i.text ?? "";
    if (!raw.trim()) throw new Error(kind === "dm" ? "Paste the messages first." : "Paste the comments first.");
    let parsed: { author: string; body: string; when: string | null }[] | null = null;
    if (i.smart && (await llmAvailable())) {
      try { parsed = await extractComments(raw); method = "model"; } catch { parsed = null; }
    }
    if (!parsed || !parsed.length) { parsed = parsePasted(raw); method = "simple"; }
    for (const p of parsed) {
      list.push({ ...base(i.platform, post, "paste"), externalId: null, authorName: p.author, body: p.body, commentedAt: relativeTime(p.when, now) ?? now.toISOString(), commentUrl: null, kind });
    }
  }
  const r = await addComments(list);
  return { ...r, found: list.length, method };
}

export async function captureRows(platform: Platform, postRef: string | null, rows: unknown[][]) {
  const { comments, error } = parseCommentRows(rows);
  if (error) throw new Error(error);
  const fallback = await resolvePost(platform, postRef);
  const list: NewComment[] = [];
  for (const c of comments) {
    const own = c.post ? await resolvePost(platform, c.post) : null;
    const post = own ?? fallback;
    const link = parseLinkedinCommentLink(c.link);
    list.push({ ...base(platform, post, "csv"), externalId: link?.commentId ?? null, authorName: c.author, body: c.body,
      commentedAt: relativeTime(c.when, new Date()) ?? (c.when && !Number.isNaN(Date.parse(c.when)) ? new Date(c.when).toISOString() : new Date().toISOString()), commentUrl: c.link });
  }
  return { ...(await addComments(list)), found: list.length };
}
