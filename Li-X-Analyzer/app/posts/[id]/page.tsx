import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { db, ensureSchema } from "@/lib/db";
import { listComments } from "@/lib/comments/store";
import { xConfigured } from "@/lib/comments/x";
import { getConnection } from "@/lib/connections";
import { llmAvailable } from "@/lib/llm";
import type { LinkedinConn } from "@/lib/comments/linkedin";
import AddComments from "../../comments/add-comments";
import CommentCard from "../../comments/comment-card";
import Delta from "../../components/delta";
import { compareWithPrevious, curvePoints, firstHour, impressionsAt } from "@/lib/pulse/curve";
import { snapshotsFor } from "@/lib/pulse/store";
import Curve from "./curve";

export const dynamic = "force-dynamic";
type P = { id: string; platform: "linkedin" | "x"; content: string; published_at: Date | null; url: string | null; impressions: number | null; engagements: number | null; likes: number | null; comments: number | null; shares: number | null };
type Typ = { impressions: number | null; likes: number | null; comments: number | null; shares: number | null };

const fmt = (n: number | null) => (n == null ? "n/a" : n.toLocaleString("en-US"));

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) redirect("/login");
  const { id } = await params;
  await ensureSchema();
  const sql = db();
  const [p] = await sql<P[]>`select id, platform, content, published_at, url, impressions, engagements, likes, comments, shares from posts where id = ${id}`;
  if (!p) notFound();
  const [typ] = await sql<Typ[]>`
    select percentile_cont(0.5) within group (order by impressions)::float8 as impressions,
           percentile_cont(0.5) within group (order by likes)::float8 as likes,
           percentile_cont(0.5) within group (order by comments)::float8 as comments,
           percentile_cont(0.5) within group (order by shares)::float8 as shares
    from posts where platform = ${p.platform} and id <> ${id} and state = 'PUBLISHED' and published_at > now() - interval '180 days'`;
  // The post before this one on the same platform, for a fair "better or worse than last time".
  const [prev] = p.published_at ? await sql<(P & { id: string })[]>`
    select id, platform, content, published_at, url, impressions, engagements, likes, comments, shares from posts
    where platform = ${p.platform} and state = 'PUBLISHED' and published_at < ${p.published_at} and impressions is not null order by published_at desc limit 1` : [];
  const iso = (d: Date | null) => (d ? new Date(d).toISOString() : null);
  const [snaps, prevSnaps] = await Promise.all([snapshotsFor(id), prev ? snapshotsFor(prev.id) : Promise.resolve([])]);
  const pts = curvePoints(snaps, iso(p.published_at));
  const prevPts = prev ? curvePoints(prevSnaps, iso(prev.published_at)) : [];
  const hour1 = firstHour(pts);
  const day1 = impressionsAt(pts, 24, 3), prevDay1 = impressionsAt(prevPts, 24, 3);
  const cmp = prev ? compareWithPrevious(p, prev) : [];
  const [list, llm, li] = await Promise.all([listComments({ postId: id, status: "all", limit: 200 }), llmAvailable(), getConnection<LinkedinConn>("linkedin").catch(() => null)]);
  const caps = { x: xConfigured(), linkedin: !!li && li.expiresAt > Date.now() / 1000, llm };
  const cards: [string, number | null, number | null][] = [
    ["Impressions", p.impressions, typ?.impressions ?? null], ["Likes", p.likes, typ?.likes ?? null], ["Comments", p.comments, typ?.comments ?? null], ["Reposts", p.shares, typ?.shares ?? null],
  ];
  const open = list.filter((c) => c.status === "new").length;

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>{p.platform === "x" ? "X post" : "LinkedIn post"}</h1><p>{p.published_at ? new Date(p.published_at).toISOString().slice(0, 10) : "No date"}{p.url ? <> . <a href={p.url} target="_blank" rel="noreferrer">Open on {p.platform === "x" ? "X" : "LinkedIn"}</a></> : null}</p></div>
        <Link className="btn ghost" href="/analytics">Back to analytics</Link>
      </div>
      <div className="stack">
        <div className="card"><p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{p.content || "(no text)"}</p></div>
        <div className="grid g-4">
          {cards.map(([l, v, t]) => (
            <div className="card kpi" key={l}><div className="l">{l}</div><div className="v">{fmt(v)}</div>
              <div className="hint">{t != null ? <>Typical post: {fmt(Math.round(t))} <Delta cur={v} prev={Math.round(t)} /></> : "No comparison yet"}</div></div>
          ))}
        </div>
        <div className="card stack">
          <div className="card-h" style={{ marginBottom: 0 }}><div><h2>Speed</h2><p>How fast the post grew, and how it did against the post before it.</p></div></div>
          <div className="grid g-3">
            <div className="kpi card"><div className="l">First hour</div><div className="v" style={{ fontSize: 22 }}>{hour1 == null ? "Not measured" : `${fmt(hour1)} impressions`}</div>
              <div className="hint">{hour1 == null ? "We need a check within the first hour or two after posting, and Postiz numbers (X posts)." : p.impressions ? `${Math.round((hour1 / p.impressions) * 100)}% of the total so far` : ""}</div></div>
            <div className="kpi card"><div className="l">After 24 hours</div><div className="v" style={{ fontSize: 22 }}>{day1 == null ? "Not measured" : `${fmt(day1)} impressions`}</div>
              <div className="hint">{day1 == null ? "Needs checks around the first day." : prevDay1 != null ? <>Previous post at 24 hours: {fmt(prevDay1)} <Delta cur={day1} prev={prevDay1} /></> : "No matching check for the previous post."}</div></div>
            <div className="kpi card"><div className="l">Against the previous post</div>
              {prev ? (<><div className="v" style={{ fontSize: 22 }}>{cmp[0].change == null ? "n/a" : `${cmp[0].change > 0 ? "+" : ""}${Math.round(cmp[0].change).toLocaleString("en-US")}% impressions`}</div>
                <div className="hint">{fmt(prev.impressions)} before. {cmp[1].change != null ? `Likes ${cmp[1].change > 0 ? "+" : ""}${Math.round(cmp[1].change)}%. ` : ""}{cmp[2].change != null ? `Comments ${cmp[2].change > 0 ? "+" : ""}${Math.round(cmp[2].change)}%.` : ""} <Link href={`/posts/${prev.id}`}>Open it</Link></div></>) : <><div className="v" style={{ fontSize: 22 }}>n/a</div><div className="hint">No earlier measured post on this platform.</div></>}</div>
          </div>
          {pts.filter((x) => x.impressions != null).length >= 2 ? <Curve points={pts} color={p.platform === "x" ? "#d95926" : "#3987e5"} /> : (
            <p className="hint" style={{ margin: 0 }}>{snaps.length} check{snaps.length === 1 ? "" : "s"} so far, a curve needs at least two. Checks happen at every sync (daily) and, with the 15 minute checks switched on, much more often. <Link href="/alerts">How to switch them on</Link>.</p>
          )}
        </div>
        <div className="card-h" style={{ marginBottom: 0 }}><div><h2>Comments ({list.length}{open ? `, ${open} need a reply` : ""})</h2></div></div>
        {list.length === 0 ? <div className="card"><p className="hint" style={{ margin: 0 }}>No comments captured for this post yet.</p></div>
          : <div className="stack">{list.map((c) => <CommentCard key={c.id} c={c} caps={caps} showPost={false} />)}</div>}
        <AddComments posts={[]} llm={llm} fixed={{ id: p.id, platform: p.platform }} />
      </div>
    </div>
  );
}
