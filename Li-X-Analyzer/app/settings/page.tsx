import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { getConnection } from "@/lib/connections";
import { activeGateway, llmStatus } from "@/lib/llm";
import type { CopilotConnection } from "@/lib/llm/copilot";
import { linkedinOAuthConfigured, type LinkedinConn } from "@/lib/comments/linkedin";
import { xConfigured } from "@/lib/comments/x";
import { CopilotLogin, GatewayForm, LinkedinButtons, TestButton, type GatewayView } from "./controls";

export const dynamic = "force-dynamic";
const MSG: Record<string, string> = { connected: "LinkedIn is connected.", denied: "LinkedIn sign in was cancelled.", state: "That sign in link was not valid. Try again.", error: "LinkedIn did not accept the sign in. Check the app keys and the redirect link." };

const Dot = ({ on }: { on: boolean }) => <span className={`status-dot ${on ? "ok" : "off"}`} />;
const Env = ({ children }: { children: string }) => <code className="env">{children}</code>;

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ linkedin?: string }> }) {
  if (!(await isAuthed())) redirect("/login");
  const q = await searchParams;
  const [cop, li, status] = await Promise.all([
    getConnection<CopilotConnection>("copilot").catch(() => null),
    getConnection<LinkedinConn>("linkedin").catch(() => null),
    llmStatus().catch(() => ({ kind: null, label: "", model: null, detail: "" })),
  ]);
  const ag = await activeGateway();
  const gw: GatewayView = { url: ag?.cfg.url ?? "", model: ag?.cfg.model ?? "", style: ag?.cfg.style ?? "", keyHeader: ag?.cfg.keyHeader ?? "", extraHeaders: ag?.cfg.extraHeaders ?? "", hasKey: !!ag?.cfg.key, from: ag?.from ?? null };
  const liOk = !!li && li.expiresAt > Date.now() / 1000;
  const x = xConfigured();

  return (
    <div className="page">
      <div className="page-head"><div><h1>Settings</h1><p>Connections that switch features on. The model gateway and sign ins are saved encrypted in our database. The X and LinkedIn app keys still live in Vercel environment variables.</p></div></div>
      {q.linkedin && MSG[q.linkedin] && <div className="note">{MSG[q.linkedin]}</div>}
      <div className="stack">
        <div className="card stack">
          <div className="card-h" style={{ marginBottom: 0 }}><div><h2><Dot on={status.kind !== null} /> Coach model</h2><p>Writes the coach notes, suggests replies and reads pasted comments. Optional.</p></div></div>
          <p className="hint">{status.kind ? `In use: ${status.label}${status.model ? ` (${status.model})` : ""}. ${status.detail}` : "No model connected yet. Everything else works without one."}</p>
          <h3>Our gateway</h3>
          <GatewayForm g={gw} />
          <h3>GitHub Copilot sign in</h3>
          <p className="hint">Experimental. This uses GitHub's device sign in and Copilot's chat endpoint, which GitHub has not published for apps like ours. It can stop working without notice. When both are set, the gateway wins unless <Env>LLM_PROVIDER=copilot</Env> is set.</p>
          <CopilotLogin connected={!!cop} login={cop?.login} />
          {ag && <TestButton target="llm" provider="gateway" label="Test the gateway" />}
          {cop && <TestButton target="llm" provider="copilot" label="Test GitHub Copilot" />}
        </div>

        <div className="card stack">
          <div className="card-h" style={{ marginBottom: 0 }}><div><h2><Dot on={x} /> X (read and reply to comments)</h2><p>Needs our own X developer app with read and write access. X bills API use per request.</p></div></div>
          <dl className="kv">
            <dt>Keys</dt><dd><Env>X_API_KEY</Env> <Env>X_API_SECRET</Env> <Env>X_ACCESS_TOKEN</Env> <Env>X_ACCESS_SECRET</Env></dd>
            <dt>Optional</dt><dd><Env>X_SYNC_LIMIT</Env> replies read per check</dd>
          </dl>
          {x ? <TestButton target="x" /> : <p className="hint">Not set yet.</p>}
        </div>

        <div className="card stack">
          <div className="card-h" style={{ marginBottom: 0 }}><div><h2><Dot on={liOk} /> LinkedIn (send replies from the app)</h2><p>LinkedIn does not let apps read comments on a personal profile. This connection only sends replies, and needs the link of the comment we answer.</p></div></div>
          {li && <p className="hint">Connected as {li.name}. {liOk ? "" : "The token has expired."}</p>}
          <dl className="kv">
            <dt>App keys</dt><dd><Env>LINKEDIN_CLIENT_ID</Env> <Env>LINKEDIN_CLIENT_SECRET</Env> {linkedinOAuthConfigured() ? "set" : "not set"}</dd>
            <dt>Redirect link</dt><dd>our site address plus /api/connect/linkedin/callback (set <Env>APP_URL</Env> if it differs)</dd>
          </dl>
          <LinkedinButtons connected={!!li} configured={linkedinOAuthConfigured()} />
          {li && <TestButton target="linkedin" />}
        </div>

        <div className="card stack">
          <div className="card-h" style={{ marginBottom: 0 }}><div><h2><Dot on={!!process.env.POSTIZ_API_KEY} /> Postiz</h2><p>Scheduling and post numbers.</p></div></div>
          <dl className="kv"><dt>Keys</dt><dd><Env>POSTIZ_API_KEY</Env> <Env>POSTIZ_API_URL</Env></dd></dl>
        </div>
      </div>
    </div>
  );
}
