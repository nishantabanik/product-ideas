import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { emailConfigured } from "@/lib/notify";
import { loadReport } from "@/lib/reports/load";
import { getFrequency } from "@/lib/reports/schedule";
import type { Report } from "@/lib/reports/report";
import { Icon } from "../../components/icons";
import Seg from "../../components/seg";
import AnalyticsTabs from "../tabs";
import ReportActions from "./report-actions";

export const dynamic = "force-dynamic";

const num = (n: number) => Math.round(n).toLocaleString("en-US");
const NAME = { linkedin: "LinkedIn", x: "X" } as const;

export default async function Reports({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  if (!(await isAuthed())) redirect("/login");
  const q = await searchParams;
  const view = q.f === "monthly" ? "monthly" : "weekly";
  const email = emailConfigured();

  let error: string | null = null;
  let freq: "off" | "weekly" | "monthly" = "off";
  let report: Report | null = null;
  try {
    [freq, report] = await Promise.all([getFrequency(), loadReport(view)]);
  } catch (e) {
    error = (e as Error).message;
  }
  const settingText = freq === "weekly" ? "Weekly, every Monday" : freq === "monthly" ? "Monthly, on the 1st" : "Off";

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Reports</h1><p>A one page summary of the last full week or month, as a PDF we can download or get by email.</p></div>
        <AnalyticsTabs active="reports" />
      </div>
      {error && <div className="note"><Icon name="alert" size={18} />Database problem: {error}</div>}

      <div className="stack">
        <div className="card">
          <div className="card-h"><div><h2>Delivery</h2><p>Current setting: {settingText}.</p></div></div>
          <ReportActions freq={freq} emailReady={email} />
          <div className={email ? "note info" : "note"} style={{ marginTop: 16 }}>
            <Icon name={email ? "check" : "info"} size={18} />
            {email
              ? <span>Email is set up. Reports go to the address in NOTIFY_EMAIL_TO. The daily job sends one when a week or month has ended and has not been sent yet.</span>
              : <span>Email is not set up yet. To get reports by email, add RESEND_API_KEY and NOTIFY_EMAIL_TO in the Vercel project settings (Environment Variables), then redeploy. Downloading the PDF works without it.</span>}
          </div>
        </div>

        <div className="toolbar" style={{ marginBottom: 0 }}>
          <Seg small label="Preview" value={view} options={[
            { value: "weekly", label: "Last week", href: "/analytics/reports" }, { value: "monthly", label: "Last month", href: "/analytics/reports?f=monthly" },
          ]} />
        </div>

        {report && <Preview r={report} />}
      </div>
    </div>
  );
}

function Preview({ r }: { r: Report }) {
  return (
    <div className="card">
      <div className="card-h"><div><h2>Preview: {r.subtitle}</h2><p>This is what the PDF holds, compared with the period before it. Dates are UTC.</p></div></div>
      <div className="stack">
        {r.kpis.length > 0 ? (
          <div className="scroll-x">
            <table className="table">
              <thead><tr><th>Platform</th><th>Metric</th><th className="r">This period</th><th className="r">Before</th><th>Change</th></tr></thead>
              <tbody>
                {r.kpis.map((k) => {
                  const v = (n: number | null) => (n === null ? "n/a" : k.kind === "rate" ? `${(n * 100).toFixed(2)}%` : num(n));
                  return (
                    <tr key={k.platform + k.label}>
                      <td><span className={`badge ${k.platform === "x" ? "x" : "li"}`}>{NAME[k.platform]}</span></td>
                      <td>{k.label}</td><td className="r"><b className="num">{v(k.current)}</b></td><td className="r">{v(k.previous)}</td>
                      <td>{k.change === null ? <span className="hint">no earlier period</span> : <span className={`delta ${k.change > 0.05 ? "up" : k.change < -0.05 ? "down" : ""}`}>{k.change > 0 ? "+" : ""}{k.change.toFixed(1)}{k.kind === "rate" ? " pts" : "%"}</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <p className="hint">We have no impressions or engagement numbers for this period.</p>}

        <div>
          <b>Top posts</b>
          {r.topPosts.length === 0 ? <p className="hint">No posts with numbers in this period.</p> : (
            <ol style={{ margin: "6px 0 0", paddingLeft: 20 }}>
              {r.topPosts.map((p) => (
                <li key={p.id}><Link href={`/posts/${p.id}`}>{(p.content || "(no text)").replace(/\s+/g, " ").slice(0, 100)}</Link>
                  <span className="hint"> {NAME[p.platform]}{p.impressions !== null ? `, ${num(p.impressions)} impressions` : ""}</span></li>
              ))}
            </ol>
          )}
        </div>

        <div><b>Followers</b>{r.followers.length ? r.followers.map((f) => <p key={f.platform} style={{ margin: "4px 0 0" }}>{f.line}</p>) : <p className="hint">We have no follower numbers for this period.</p>}</div>
        {r.goals.length > 0 && <div><b>Goals</b>{r.goals.map((g) => <p key={g} style={{ margin: "4px 0 0" }}>{g}</p>)}</div>}
        {r.pendingComments !== null && <div><b>Comments</b><p style={{ margin: "4px 0 0" }}>{r.pendingComments ? `${r.pendingComments} waiting for a reply.` : "None waiting for a reply."}</p></div>}
        <div><b>What to do next</b>{r.nextSteps.length ? <ol style={{ margin: "6px 0 0", paddingLeft: 20 }}>{r.nextSteps.map((s) => <li key={s}>{s}</li>)}</ol> : <p className="hint">We do not have enough numbers to suggest anything yet.</p>}</div>
        {r.notes.map((n) => <p key={n} className="hint" style={{ margin: 0 }}>{n}</p>)}
      </div>
    </div>
  );
}
