import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { llmAvailable } from "@/lib/llm";
import { getRequireApproval, getZone, listDrafts, listPillars } from "@/lib/studio/store";
import type { Draft, DraftStatus } from "@/lib/studio/types";
import { Icon } from "../components/icons";
import ApprovalToggle from "./approval-toggle";
import { snippet, when } from "./fmt";
import QuickAdd from "./quick-add";
import StudioTabs from "./tabs";

export const dynamic = "force-dynamic";

const COLUMNS: { status: DraftStatus; title: string; hint: string }[] = [
  { status: "idea", title: "Ideas", hint: "Things we might write" },
  { status: "draft", title: "Drafts", hint: "Being written" },
  { status: "review", title: "In review", hint: "Waiting for a decision" },
  { status: "approved", title: "Approved", hint: "Ready for a slot" },
  { status: "scheduled", title: "Scheduled", hint: "In Postiz" },
];

function Card({ d, tz }: { d: Draft; tz: string }) {
  return (
    <Link href={`/studio/${d.id}`} className="dcard">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className={`chip ${d.platform}`}>{d.platform === "x" ? "X" : "LinkedIn"}{d.thread.length > 1 ? ` thread ${d.thread.length}` : ""}</span>
        {d.source !== "manual" && <span className="hint">{d.source === "ai" ? "AI" : d.source === "recycle" ? "Again" : "Adapted"}</span>}
      </div>
      <p>{d.title || snippet(d.thread[0] || d.content || "(empty)")}</p>
      {d.status !== "idea" && d.title && <p className="hint">{snippet(d.thread[0] || d.content, 90)}</p>}
      {d.pillar && <span className="chip">{d.pillar}</span>}
      {d.status === "scheduled" && d.scheduledFor && <p className="hint"><Icon name="clock" size={13} /> {when(d.scheduledFor, tz)}</p>}
      {d.status === "draft" && d.reviewNote && <p className="hint" style={{ color: "var(--orange-ink)" }}>{d.reviewNote}</p>}
    </Link>
  );
}

export default async function StudioPage() {
  if (!(await isAuthed())) redirect("/login");
  let error: string | null = null;
  const [drafts, pillars, llm, require, tz] = await Promise.all([listDrafts(), listPillars(), llmAvailable(), getRequireApproval(), getZone()]).catch((e) => {
    error = (e as Error).message;
    return [[], [], false, false, "UTC"] as const;
  });
  const published = drafts.filter((d) => d.status === "published").slice(0, 8);

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Studio</h1><p>From idea to published post: write in our own voice, check every draft against our rules, get it approved and queue it.</p></div>
        <StudioTabs active="board" />
      </div>
      {error && <div className="note"><Icon name="alert" size={18} />Database problem: {error}</div>}
      <div className="stack">
        <QuickAdd llm={llm} pillars={pillars.map((p) => p.name)} />
        <ApprovalToggle on={require} />
        <div className="board">
          {COLUMNS.map((c) => {
            const list = drafts.filter((d) => d.status === c.status);
            return (
              <section key={c.status} className="col" aria-label={c.title}>
                <header><h3>{c.title} <span className="count">{list.length}</span></h3><p className="hint">{c.hint}</p></header>
                {list.length === 0 ? <p className="hint empty">Nothing here</p> : list.map((d) => <Card key={d.id} d={d} tz={tz} />)}
              </section>
            );
          })}
        </div>
        {published.length > 0 && (
          <div className="card"><h3 style={{ marginTop: 0 }}>Recently published from here</h3>
            <div className="stack" style={{ gap: 6 }}>{published.map((d) => <Link key={d.id} href={`/studio/${d.id}`} className="hint">{when(d.scheduledFor, tz)}. {d.platform === "x" ? "X" : "LinkedIn"}. {snippet(d.thread[0] || d.content, 100)}</Link>)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
