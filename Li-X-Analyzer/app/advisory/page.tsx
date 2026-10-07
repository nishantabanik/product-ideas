import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { coachConfigured } from "@/lib/advisory/coach";
import { ensureToday } from "@/lib/advisory/generate";
import { days as listDays, getAdvisory, history } from "@/lib/advisory/store";
import { Icon } from "../components/icons";
import AuditTable from "./audit-table";
import CoachView from "./coach-view";
import DayPicker from "./day-picker";
import Findings from "./findings";
import HistoryChart from "./history-chart";
import PlaybookView from "./playbook-view";
import Regenerate from "./regenerate";
import ScoreCard from "./score-ring";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC";

export default async function AdvisoryPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  if (!(await isAuthed())) redirect("/login");
  const { d } = await searchParams;
  const configured = await coachConfigured();

  let stored = null, daysList: string[] = [], hist: Awaited<ReturnType<typeof history>> = [], error: string | null = null;
  try {
    stored = d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? await getAdvisory(d) : await ensureToday();
    [daysList, hist] = await Promise.all([listDays(45), history(60)]);
  } catch (e) {
    error = (e as Error).message;
  }

  if (!stored) {
    return (
      <div className="page">
        <div className="page-head"><div><h1>Advisory</h1><p>A daily review of every post and every number.</p></div></div>
        <div className="note"><Icon name="alert" size={18} />{error ? `Database problem: ${error}` : "No advisory for that day."}</div>
      </div>
    );
  }

  const a = stored.advisory;
  const counts = {
    problems: a.findings.filter((f) => f.group === "holding_back").length,
    missing: a.findings.filter((f) => f.group === "missing").length,
    working: a.findings.filter((f) => f.group === "working").length,
  };
  const reviewed = a.audits.length;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Advisory</h1>
          <p>A review of every post and every number, written fresh each morning. It says what is holding us back, what is missing, what to stop and what to do more of.</p>
        </div>
        <div className="row"><DayPicker days={daysList.length ? daysList : [stored.day]} current={stored.day} /><Regenerate coachConfigured={configured} /></div>
      </div>

      <div className="stack stagger">
        <div className="card" style={{ background: "linear-gradient(135deg, rgba(57,135,229,.14), transparent 60%), var(--surface)" }}>
          <div className="row" style={{ alignItems: "flex-start", flexWrap: "nowrap", gap: 14 }}>
            <span className="logo" style={{ flex: "none" }}><Icon name="bulb" size={18} /></span>
            <div style={{ minWidth: 0 }}>
              <div className="hint" style={{ fontWeight: 650 }}>Today in one line</div>
              <p style={{ margin: "4px 0 10px", fontSize: 18, fontWeight: 650, lineHeight: 1.4, letterSpacing: "-.01em" }}>{a.headline}</p>
              <div className="pills">
                <span className="badge">Reviewed {reviewed.toLocaleString("en-US")} posts</span>
                <span className="badge err">{counts.problems} holding us back</span>
                <span className="badge">{counts.missing} missing</span>
                <span className="badge li">{counts.working} working</span>
                <span className="badge">Updated {when(stored.generatedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid g-3">
          <ScoreCard title="LinkedIn health" color="#3987e5" score={a.scores.linkedin} empty="Import a LinkedIn export to see this score." />
          <ScoreCard title="X health" color="#d95926" score={a.scores.x} empty="Refresh the X numbers on the Analytics page to see this score." />
          <div className="card hover">
            <div className="card-h" style={{ marginBottom: 12 }}><div className="row"><Icon name="target" size={18} /><h2>Today&apos;s focus</h2></div></div>
            {a.focus.length === 0 ? <p className="hint" style={{ margin: 0 }}>Nothing urgent. Keep the rhythm and keep testing.</p> : a.focus.map((x, i) => (
              <div key={i} className="focus-item">
                <span className="focus-n">{i + 1}</span>
                <div><b>{x.title}</b><p>{x.action}</p></div>
              </div>
            ))}
          </div>
        </div>

        <div className="section-t">Findings</div>
        <Findings findings={a.findings} />

        <div className="section-t">Coach notes</div>
        {stored.coach ? <CoachView coach={stored.coach} model={stored.model} /> : (
          <div className="card">
            {!configured ? (
              <div className="row" style={{ alignItems: "flex-start", flexWrap: "nowrap" }}>
                <Icon name="info" size={20} />
                <div><b>Written coach notes are off</b>
                  <p className="hint" style={{ margin: "4px 0 0", maxWidth: "70ch" }}>Connect a model on the <Link href="/settings">Settings page</Link>: a gateway (GATEWAY_API_URL and GATEWAY_API_KEY in Vercel) or a GitHub Copilot sign in. Then each morning it reads our numbers and our own posts, explains why they are behind, rewrites our weakest posts and suggests posts for the week. The findings above work without it.</p></div>
              </div>
            ) : stored.coachError ? (
              <div className="row" style={{ alignItems: "flex-start", flexWrap: "nowrap" }}><Icon name="alert" size={20} /><div><b>Coach notes could not be written</b><p className="warn" style={{ margin: "4px 0 0" }}>{stored.coachError}</p></div></div>
            ) : (
              <p className="hint" style={{ margin: 0 }}>Coach notes are written by the morning run. Press Review again now to write them for today.</p>
            )}
          </div>
        )}

        {hist.length >= 2 && (
          <>
            <div className="section-t">Health score over time</div>
            <div className="card"><HistoryChart points={hist} /></div>
          </>
        )}

        <div className="section-t">Every post, reviewed</div>
        <div className="card">
          <div className="card-h"><div><h2>Post by post</h2><p>Each post is scored against our other posts on the same platform, and checked for what usually helps or hurts.</p></div></div>
          {reviewed === 0 ? <p className="hint">No posts to review yet. Sync from Postiz or import an export.</p> : <AuditTable audits={a.audits} />}
        </div>

        <div className="section-t">Playbook</div>
        <PlaybookView />
      </div>
    </div>
  );
}
