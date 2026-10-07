import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { emailConfigured, telegramConfigured } from "@/lib/notify";
import { listAlerts } from "@/lib/pulse/store";
import { Icon } from "../components/icons";
import { AlertActions } from "./client";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  if (!(await isAuthed())) redirect("/login");
  let error: string | null = null;
  const alerts = await listAlerts().catch((e) => { error = (e as Error).message; return []; });
  const ago = (iso: string) => { const m = Math.round((Date.now() - new Date(iso).getTime()) / 60_000); return m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`; };
  return (
    <div className="page">
      <div className="page-head"><div><h1>Alerts</h1><p>When a fresh post is taking off or starts slowly, we say so while there is still time to act.</p></div><AlertActions unseen={alerts.some((a) => !a.seen)} /></div>
      {error && <div className="note"><Icon name="alert" size={18} />Database problem: {error}</div>}
      <div className="stack">
        {alerts.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 36 }}>
            <h2>No alerts yet</h2>
            <p className="hint" style={{ margin: "8px auto 0", maxWidth: "60ch" }}>An alert appears when a post published in the last day and a half reaches about 1.5 times, or less than half of, what our posts usually have by that age. Press Check now after posting, or turn on the 15 minute checks below.</p>
          </div>
        ) : alerts.map((a) => (
          <div key={a.id} className="card stack" style={{ gap: 6, borderLeft: `3px solid ${a.level === "good" ? "#5fc38a" : a.level === "warn" ? "var(--orange)" : "var(--blue)"}` }}>
            <div className="row" style={{ justifyContent: "space-between" }}><strong>{a.title}</strong><span className="hint">{a.seen ? "" : "New . "}{ago(a.createdAt)}</span></div>
            <p style={{ margin: 0, fontSize: 13.5 }}>{a.detail}</p>
            {a.postId && <a className="hint" href={`/posts/${a.postId}`}>Open the post page</a>}
          </div>
        ))}
        <div className="card stack">
          <h3 style={{ margin: 0 }}>How to switch it on</h3>
          <ol className="steps" style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6, fontSize: 13.5 }}>
            <li>Alerts work for X posts. Postiz gives no numbers for LinkedIn personal profiles, so LinkedIn posts cannot be watched.</li>
            <li>Press Check now after posting. That works as it is.</li>
            <li>For automatic checks every 15 minutes: in GitHub, open the repository, Settings, Secrets and variables, Actions, and add APP_URL (our Vercel address) and CRON_SECRET (the same value as in Vercel). The workflow file is already in the repository. Vercel's free plan only runs jobs once a day, which is why GitHub does the frequent checks.</li>
            <li>To get a message when an alert appears: email {emailConfigured() ? "is set up" : "needs RESEND_API_KEY and NOTIFY_EMAIL_TO"}, Telegram {telegramConfigured() ? "is set up" : "needs TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID"}.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
