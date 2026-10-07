import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { counts, followUps, listComments, recentPosts, type Counts } from "@/lib/comments/store";
import { listTemplates } from "@/lib/comments/template-store";
import { STARTER_TEMPLATES, type Template } from "@/lib/comments/starters";
import { xConfigured } from "@/lib/comments/x";
import { getConnection } from "@/lib/connections";
import { llmAvailable } from "@/lib/llm";
import type { LinkedinConn } from "@/lib/comments/linkedin";
import type { CommentKind, CommentRow, CommentStatus, Platform } from "@/lib/comments/types";
import { Icon } from "../components/icons";
import Seg from "../components/seg";
import AddComments from "./add-comments";
import CommentCard, { type FollowUpInfo } from "./comment-card";
import TemplatesPanel from "./templates-panel";
import SyncX from "./sync-x";

export const dynamic = "force-dynamic";
type Q = { s?: string; p?: string; k?: string };
type Shown = { c: CommentRow; f?: FollowUpInfo };
const NO_COUNTS: Counts = { new: 0, replied: 0, ignored: 0, linkedin: 0, x: 0, followUp: 0, followUpDue: 0, followUpQuiet: 0, dm: 0 };

export default async function CommentsPage({ searchParams }: { searchParams: Promise<Q> }) {
  if (!(await isAuthed())) redirect("/login");
  const q = await searchParams;
  const status = (["new", "replied", "ignored", "all", "followup"].includes(q.s ?? "") ? q.s : "new") as CommentStatus | "all" | "followup";
  const kind: CommentKind | undefined = q.k === "comment" || q.k === "dm" ? q.k : undefined;
  const platform = q.p === "x" || q.p === "linkedin" ? (q.p as Platform) : undefined;
  const href = (s: string, p?: string, k: string | undefined = kind) => `/comments?s=${s}${p ? `&p=${p}` : ""}${k ? `&k=${k}` : ""}`;

  let error: string | null = null;
  let shown: Shown[] = [];
  let c: Counts = NO_COUNTS;
  let posts: { id: string; platform: Platform; content: string; published_at: Date | null }[] = [];
  let llm = false;
  let li: Awaited<ReturnType<typeof getConnection<LinkedinConn>>> = null;
  let saved: Template[] = [];
  try {
    [c, posts, llm, li, saved] = await Promise.all([counts(), recentPosts(80), llmAvailable(), getConnection<LinkedinConn>("linkedin").catch(() => null), listTemplates().catch(() => [])]);
    if (status === "followup") {
      const f = await followUps();
      const seen = new Set<string>();
      for (const r of f.due) { seen.add(r.id); shown.push({ c: r, f: { kind: "due" } }); }
      for (const qc of f.quiet) if (!seen.has(qc.row.id)) shown.push({ c: qc.row, f: { kind: "quiet", days: qc.days } });
      shown = shown.filter((x) => (!platform || x.c.platform === platform) && (!kind || x.c.kind === kind));
    } else {
      shown = (await listComments({ status, platform, kind })).map((r) => ({ c: r }));
    }
  } catch (e) { error = (e as Error).message; }
  const caps = { x: xConfigured(), linkedin: !!li && li.expiresAt > Date.now() / 1000, llm };
  const options = posts.map((p) => ({ id: p.id, platform: p.platform, label: `${p.published_at ? new Date(p.published_at).toISOString().slice(0, 10) : ""}  ${(p.content || "(no text)").replace(/\s+/g, " ").slice(0, 70)}` }));

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Comments</h1><p>Every comment on our posts in one inbox. Answer fast: replies in the first hour keep a post in front of people.</p></div>
        {caps.x && <SyncX />}
      </div>
      {error && <div className="note"><Icon name="alert" size={18} />Database problem: {error}</div>}

      <div className="stack">
        <div className="toolbar" style={{ marginBottom: 0 }}>
          <Seg small label="Status" value={status} options={[
            { value: "new", label: `Needs a reply${c.new ? ` (${c.new})` : ""}`, href: href("new", platform) },
            { value: "followup", label: `Follow up${c.followUp ? ` (${c.followUp})` : ""}`, href: href("followup", platform) },
            { value: "replied", label: `Replied (${c.replied})`, href: href("replied", platform) },
            { value: "ignored", label: `Ignored (${c.ignored})`, href: href("ignored", platform) },
            { value: "all", label: "All", href: href("all", platform) },
          ]} />
          <Seg small label="Platform" value={platform ?? "both"} options={[
            { value: "both", label: "Both", href: href(status) }, { value: "linkedin", label: "LinkedIn", href: href(status, "linkedin") }, { value: "x", label: "X", href: href(status, "x") },
          ]} />
          <Seg small label="Type" value={kind ?? "both"} options={[
            { value: "comment", label: "Comments", href: href(status, platform, "comment") }, { value: "dm", label: "Messages", href: href(status, platform, "dm") }, { value: "both", label: "Both", href: href(status, platform, "") },
          ]} />
          <span className="hint grow">{caps.x ? "X replies are read from our X account." : "Add the X keys on the Settings page to read X replies automatically."}</span>
        </div>

        {shown.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 40 }}>
            <h2>{status === "new" ? "Nothing waiting for a reply" : status === "followup" ? "Nothing to follow up" : "No comments here"}</h2>
            <p className="hint" style={{ margin: "8px auto 0", maxWidth: "56ch" }}>{status === "followup" ? "Reminders we set, and people who have not written back for 3 days after our reply, show up here." : status === "new" ? "When someone comments, it shows up here. Add comments below, or check X for new replies." : "Change the filters above, or add comments below."}</p>
          </div>
        ) : (
          <div className="stack stagger">{shown.map((x) => <CommentCard key={x.c.id} c={x.c} caps={caps} templates={saved.length ? saved : STARTER_TEMPLATES} followUp={x.f} />)}</div>
        )}

        <TemplatesPanel templates={saved} />
        <AddComments posts={options} llm={llm} />
      </div>
    </div>
  );
}
