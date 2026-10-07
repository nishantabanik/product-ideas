import { createHash } from "node:crypto";
import { db, ensureSchema } from "../db";
import { externalId } from "../ids";
import { followUpsDue, QUIET_DAYS, quietConversations, type Quiet } from "./quiet.ts";
import type { CommentKind, CommentRow, CommentStatus, NewComment, Platform } from "./types.ts";

type Row = Record<string, string | number | null>;

export function commentId(c: Pick<NewComment, "platform" | "externalId" | "postRef" | "authorName" | "body"> & { kind?: CommentKind }) {
  if (c.externalId) return `cm_${c.platform}_${c.externalId}`;
  if (c.kind === "dm") return "dm_" + createHash("sha1").update(`${c.platform}|${c.authorName.toLowerCase()}|${c.body.replace(/\s+/g, " ").trim()}`).digest("hex").slice(0, 20);
  return "cm_" + createHash("sha1").update(`${c.platform}|${c.postRef ?? ""}|${c.authorName.toLowerCase()}|${c.body.replace(/\s+/g, " ").trim()}`).digest("hex").slice(0, 20);
}

/** Finds our stored post from our own id, a link to it, or the platform's post id. */
export async function resolvePost(platform: Platform, ref: string | null | undefined): Promise<{ id: string; ref: string | null } | null> {
  const r = (ref ?? "").trim();
  if (!r) return null;
  await ensureSchema();
  const ext = externalId(r) ?? (/^\d{6,}$/.test(r) ? r : null);
  const [row] = await db()<{ id: string; external_id: string | null }[]>`
    select id, external_id from posts where platform = ${platform} and (id = ${r} or (${ext}::text is not null and external_id = ${ext})) limit 1`;
  return row ? { id: row.id, ref: row.external_id } : ext ? { id: "", ref: ext } : null;
}

/** Saves comments we have not seen before. Comments are matched by the platform's id when there is one, else by author and text. */
export async function addComments(list: NewComment[]): Promise<{ added: number; skipped: number }> {
  if (!list.length) return { added: 0, skipped: 0 };
  await ensureSchema();
  const unique = [...new Map(list.map((c) => [commentId(c), c])).entries()];
  let added = 0;
  for (let i = 0; i < unique.length; i += 200) {
    const rows: Row[] = unique.slice(i, i + 200).map(([id, c]) => ({
      id, platform: c.platform, post_id: c.postId, post_ref: c.postRef, external_id: c.externalId, author_name: c.authorName, author_handle: c.authorHandle,
      author_url: c.authorUrl, body: c.body, commented_at: c.commentedAt, source: c.source, comment_url: c.commentUrl, likes: c.likes, kind: c.kind ?? "comment",
    }));
    const done = await db()<{ id: string }[]>`insert into comments ${db()(rows, "id", "platform", "post_id", "post_ref", "external_id", "author_name", "author_handle", "author_url", "body", "commented_at", "source", "comment_url", "likes", "kind")}
      on conflict do nothing returning id`;
    added += done.length;
  }
  return { added, skipped: unique.length - added };
}

type Db = {
  id: string; platform: Platform; post_id: string | null; post_ref: string | null; external_id: string | null; author_name: string; author_handle: string | null;
  author_url: string | null; body: string; commented_at: Date | null; source: string; status: CommentStatus; comment_url: string | null; likes: number | null;
  reply_text: string | null; replied_at: Date | null; reply_via: string | null; created_at: Date; post_content: string | null; post_url: string | null;
  kind: CommentKind | null; follow_up_at: Date | null;
};
const iso = (d: Date | null) => (d ? new Date(d).toISOString() : null);
const map = (r: Db): CommentRow => ({
  id: r.id, platform: r.platform, postId: r.post_id, postRef: r.post_ref, externalId: r.external_id, authorName: r.author_name, authorHandle: r.author_handle,
  authorUrl: r.author_url, body: r.body, commentedAt: iso(r.commented_at), source: r.source, status: r.status, commentUrl: r.comment_url, likes: r.likes,
  replyText: r.reply_text, repliedAt: iso(r.replied_at), replyVia: r.reply_via, createdAt: iso(r.created_at)!, postContent: r.post_content, postUrl: r.post_url,
  kind: r.kind === "dm" ? "dm" : "comment", followUpAt: iso(r.follow_up_at),
});

const SELECT = `c.id, c.platform, c.post_id, c.post_ref, c.external_id, c.author_name, c.author_handle, c.author_url, c.body, c.commented_at, c.source, c.status,
  c.comment_url, c.likes, c.reply_text, c.replied_at, c.reply_via, c.created_at, p.content as post_content, p.url as post_url, c.kind, c.follow_up_at`;

export async function listComments(o: { status?: CommentStatus | "all"; platform?: Platform; kind?: CommentKind; postId?: string; limit?: number } = {}): Promise<CommentRow[]> {
  await ensureSchema();
  const status = o.status && o.status !== "all" ? o.status : null;
  const rows = await db()<Db[]>`
    select ${db().unsafe(SELECT)} from comments c left join posts p on p.id = c.post_id
    where (${status}::text is null or c.status = ${status}) and (${o.platform ?? null}::text is null or c.platform = ${o.platform ?? null})
      and (${o.kind ?? null}::text is null or c.kind = ${o.kind ?? null})
      and (${o.postId ?? null}::text is null or c.post_id = ${o.postId ?? null})
    order by coalesce(c.commented_at, c.created_at) desc limit ${o.limit ?? 200}`;
  return rows.map(map);
}

export async function getComment(id: string): Promise<CommentRow | null> {
  await ensureSchema();
  const [r] = await db()<Db[]>`select ${db().unsafe(SELECT)} from comments c left join posts p on p.id = c.post_id where c.id = ${id}`;
  return r ? map(r) : null;
}

export type Counts = { new: number; replied: number; ignored: number; linkedin: number; x: number; followUp: number; followUpDue: number; followUpQuiet: number; dm: number };

/** The comments that matter for follow ups: recent ones, plus any with a reminder. Older conversations are left out. */
async function followUpWindow(withPost: boolean, days = 90): Promise<CommentRow[]> {
  await ensureSchema();
  const from = new Date(Date.now() - days * 86_400_000);
  const rows = await db()<Db[]>`
    select ${db().unsafe(withPost ? SELECT : SELECT.replace("p.content as post_content, p.url as post_url", "null::text as post_content, null::text as post_url"))}
    from comments c ${withPost ? db().unsafe("left join posts p on p.id = c.post_id") : db().unsafe("")}
    where coalesce(c.commented_at, c.created_at) > ${from} or c.replied_at > ${from} or c.follow_up_at is not null
    order by coalesce(c.commented_at, c.created_at) desc limit 3000`;
  return rows.map(map);
}

export type FollowUps = { due: CommentRow[]; quiet: Quiet<CommentRow>[] };
/** Comments with a reminder that has come, and conversations that went quiet after our reply. */
export async function followUps(now = new Date()): Promise<FollowUps> {
  const rows = await followUpWindow(true);
  return { due: followUpsDue(rows, now), quiet: quietConversations(rows, now, QUIET_DAYS) };
}

/** Only the number shown on the Comments tab. Every page asks for it, so it is one cheap query. */
export async function newCount(): Promise<number> {
  await ensureSchema();
  const [r] = await db()<{ n: number }[]>`select count(*)::int as n from comments where status = 'new'`;
  return r?.n ?? 0;
}

export async function counts(): Promise<Counts> {
  await ensureSchema();
  const rows = await db()<{ status: string; platform: string; kind: string; n: number }[]>`select status, platform, kind, count(*)::int as n from comments group by status, platform, kind`;
  const c: Counts = { new: 0, replied: 0, ignored: 0, linkedin: 0, x: 0, followUp: 0, followUpDue: 0, followUpQuiet: 0, dm: 0 };
  for (const r of rows) {
    c[r.status as "new" | "replied" | "ignored"] += r.n;
    if (r.status === "new") { c[r.platform as Platform] += r.n; if (r.kind === "dm") c.dm += r.n; }
  }
  try {
    const now = new Date();
    const w = await followUpWindow(false);
    const due = followUpsDue(w, now);
    const quiet = quietConversations(w, now, QUIET_DAYS);
    const ids = new Set(due.map((r) => r.id));
    c.followUpDue = due.length;
    c.followUpQuiet = quiet.length;
    c.followUp = due.length + quiet.filter((q) => !ids.has(q.row.id)).length;
  } catch { /* the counts above are still right */ }
  return c;
}

export async function setFollowUp(id: string, at: string | null) {
  await ensureSchema();
  await db()`update comments set follow_up_at = ${at} where id = ${id}`;
}

export async function setStatus(id: string, status: CommentStatus) {
  await ensureSchema();
  await db()`update comments set status = ${status}, replied_at = case when ${status} = 'new' then null else replied_at end where id = ${id}`;
}

export async function markReplied(id: string, text: string, via: string, replyExternalId: string | null = null) {
  await ensureSchema();
  await db()`update comments set status = 'replied', reply_text = ${text}, replied_at = now(), reply_via = ${via}, reply_external_id = ${replyExternalId}, follow_up_at = null where id = ${id}`;
}

export async function setCommentUrl(id: string, url: string) {
  await ensureSchema();
  await db()`update comments set comment_url = ${url} where id = ${id}`;
}

export async function removeComment(id: string) {
  await ensureSchema();
  await db()`delete from comments where id = ${id}`;
}

export async function recentPosts(limit = 80) {
  await ensureSchema();
  return db()<{ id: string; platform: Platform; content: string; published_at: Date | null }[]>`
    select id, platform, content, published_at from posts where state = 'PUBLISHED' order by published_at desc nulls last limit ${limit}`;
}

/** What the Advisory needs to know about our replies. */
export async function commentStats() {
  await ensureSchema();
  const rows = await db()<{ platform: Platform; open: number; oldest_hours: number | null; last30: number; replied30: number }[]>`
    select platform,
      count(*) filter (where status = 'new')::int as open,
      (extract(epoch from now() - min(coalesce(commented_at, created_at)) filter (where status = 'new')) / 3600)::float8 as oldest_hours,
      count(*) filter (where coalesce(commented_at, created_at) > now() - interval '30 days')::int as last30,
      count(*) filter (where status = 'replied' and coalesce(commented_at, created_at) > now() - interval '30 days')::int as replied30
    from comments group by platform`;
  return rows.map((r) => ({ platform: r.platform, open: r.open, oldestHours: r.oldest_hours, last30: r.last30, replied30: r.replied30 }));
}
