"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "../components/icons";
import { useToast } from "../components/toast";

export function TestButton({ target, label = "Test connection", provider }: { target: "llm" | "x" | "linkedin"; label?: string; provider?: "gateway" | "copilot" }) {
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ ok: boolean; detail: string } | null>(null);
  async function run() {
    setBusy(true); setRes(null);
    try {
      const r = await fetch("/api/settings/test", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ target, provider }) });
      setRes(await r.json());
    } catch { setRes({ ok: false, detail: "Could not reach the server" }); } finally { setBusy(false); }
  }
  return (
    <div className="row" style={{ flexWrap: "wrap" }}>
      <button className="btn ghost" onClick={run} disabled={busy}><Icon name="refresh" size={16} className={busy ? "spin" : ""} />{busy ? "Testing..." : label}</button>
      {res && <span className="hint"><span className={`status-dot ${res.ok ? "ok" : "bad"}`} /> {res.detail}</span>}
    </div>
  );
}

export function CopilotLogin({ connected, login }: { connected: boolean; login?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [flow, setFlow] = useState<{ deviceCode: string; userCode: string; verificationUri: string; interval: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function start() {
    setBusy(true);
    try {
      const r = await fetch("/api/connect/copilot/start", { method: "POST" });
      const d = await r.json();
      if (!r.ok) return toast({ tone: "error", title: "Could not start sign in", body: d.error });
      setFlow(d);
      poll(d.deviceCode, d.interval);
    } catch { toast({ tone: "error", title: "Could not reach the server" }); } finally { setBusy(false); }
  }
  function poll(deviceCode: string, interval: number) {
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch("/api/connect/copilot/poll", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ deviceCode }) });
        const d = await r.json();
        if (d.status === "done") { setFlow(null); toast({ tone: "ok", title: "GitHub Copilot connected", body: d.login ? `Signed in as ${d.login}` : undefined }); router.refresh(); return; }
        if (d.status === "error") { setFlow(null); toast({ tone: "error", title: "Sign in failed", body: d.message }); return; }
        poll(deviceCode, d.status === "slow_down" ? (d.interval ?? interval + 5) : interval);
      } catch { poll(deviceCode, interval); }
    }, Math.max(interval, 3) * 1000);
  }
  async function out() {
    await fetch("/api/connect/copilot", { method: "DELETE" });
    toast({ tone: "ok", title: "Signed out of GitHub Copilot" });
    router.refresh();
  }

  if (flow) return (
    <div className="stack" style={{ gap: 12 }}>
      <p className="hint">1. Open the GitHub page below. 2. Type this code. We keep checking and finish by ourselves.</p>
      <div className="code-box">{flow.userCode}</div>
      <div className="row"><a className="btn" href={flow.verificationUri} target="_blank" rel="noreferrer"><Icon name="send" size={16} />Open GitHub</a>
        <button className="btn ghost" onClick={() => { if (timer.current) clearTimeout(timer.current); setFlow(null); }}>Cancel</button></div>
    </div>
  );
  return connected
    ? <div className="row"><span className="hint">Signed in{login ? ` as ${login}` : ""}.</span><button className="btn ghost" onClick={out}>Sign out</button></div>
    : <button className="btn" onClick={start} disabled={busy}>{busy ? "Starting..." : "Sign in with GitHub"}</button>;
}

export function LinkedinButtons({ connected, configured }: { connected: boolean; configured: boolean }) {
  const router = useRouter();
  const toast = useToast();
  async function out() {
    await fetch("/api/connect/linkedin", { method: "DELETE" });
    toast({ tone: "ok", title: "LinkedIn disconnected" });
    router.refresh();
  }
  return (
    <div className="row">
      {configured && <a className="btn" href="/api/connect/linkedin">{connected ? "Connect again" : "Connect LinkedIn"}</a>}
      {connected && <button className="btn ghost" onClick={out}>Disconnect</button>}
    </div>
  );
}

export type GatewayView = { url: string; model: string; style: string; keyHeader: string; extraHeaders: string; hasKey: boolean; from: "settings" | "environment" | null };

export function GatewayForm({ g }: { g: GatewayView }) {
  const router = useRouter();
  const toast = useToast();
  const [v, setV] = useState({ url: g.url, key: "", model: g.model, style: g.style, keyHeader: g.keyHeader, extraHeaders: g.extraHeaders });
  const [more, setMore] = useState(Boolean(g.style || g.keyHeader || g.extraHeaders));
  const [busy, setBusy] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [manual, setManual] = useState(false);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });

  async function load() {
    setLoading(true); setLoadErr(null);
    try {
      const r = await fetch("/api/connect/gateway/models", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(v) });
      const d = await r.json();
      if (!r.ok) { setLoadErr(d.error); setManual(true); return; }
      setModels(d.models); setManual(false);
      if (!d.models.includes(v.model)) setV((x) => ({ ...x, model: "" }));
      toast({ tone: "ok", title: `${d.models.length} models found`, body: "Choose one from the list." });
    } catch { setLoadErr("Could not reach the server"); } finally { setLoading(false); }
  }
  useEffect(() => { if (g.url && g.hasKey) void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  async function save() {
    setBusy(true);
    try {
      const r = await fetch("/api/connect/gateway", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(v) });
      const d = await r.json();
      if (!r.ok) return toast({ tone: "error", title: "Not saved", body: d.error });
      toast({ tone: "ok", title: "Gateway saved", body: "Use Test the model to check it." });
      setV({ ...v, key: "" });
      router.refresh();
    } catch { toast({ tone: "error", title: "Could not reach the server" }); } finally { setBusy(false); }
  }
  async function remove() {
    await fetch("/api/connect/gateway", { method: "DELETE" });
    toast({ tone: "ok", title: "Saved gateway removed" });
    router.refresh();
  }
  return (
    <div className="stack" style={{ gap: 12 }}>
      {g.from === "environment" && <p className="hint">A gateway from the environment variables is in use. Saving one here replaces it.</p>}
      <div className="grid g-2">
        <label className="field"><span>Gateway API URL</span><input className="input" value={v.url} onChange={set("url")} placeholder="https://our-gateway.example.com/v1" /></label>
        <label className="field"><span>Gateway API key</span><input className="input" type="password" autoComplete="off" value={v.key} onChange={set("key")} placeholder={g.hasKey ? "Saved. Leave empty to keep it." : "Paste our key"} /></label>
      </div>
      <div className="field"><span>Model</span>
        <div className="row" style={{ flexWrap: "wrap" }}>
          {models.length > 0 && !manual ? (
            <select className="input" style={{ flex: 1, minWidth: 220 }} value={v.model} onChange={set("model")}>
              <option value="">Choose a model ({models.length} available)</option>
              {v.model && !models.includes(v.model) && <option value={v.model}>{v.model}</option>}
              {models.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          ) : (
            <input className="input" style={{ flex: 1, minWidth: 220 }} value={v.model} onChange={set("model")} placeholder={loading ? "Loading models..." : "Load the models, or type the model name"} />
          )}
          <button className="btn ghost" type="button" onClick={load} disabled={loading || !v.url.trim() || (!v.key.trim() && !g.hasKey)}><Icon name="refresh" size={16} className={loading ? "spin" : ""} />{loading ? "Loading..." : models.length ? "Reload models" : "Load models"}</button>
          {models.length > 0 && <button className="btn ghost sm" type="button" onClick={() => setManual(!manual)}>{manual ? "Use the list" : "Type by hand"}</button>}
        </div>
        {loadErr && <p className="hint" style={{ color: "var(--red)", margin: "6px 0 0" }}>{loadErr}</p>}
      </div>
      <button className="btn ghost sm" type="button" onClick={() => setMore(!more)} style={{ alignSelf: "flex-start" }}>{more ? "Hide" : "Show"} advanced options</button>
      {more && (
        <div className="stack" style={{ gap: 12 }}>
          <div className="grid g-2">
            <label className="field"><span>API style</span>
              <select className="input" value={v.style} onChange={set("style")}><option value="">Detect from the URL</option><option value="openai">OpenAI style (chat/completions)</option><option value="anthropic">Anthropic style (messages)</option></select></label>
            <label className="field"><span>Key header name (if not Authorization)</span><input className="input" value={v.keyHeader} onChange={set("keyHeader")} placeholder="api-key" /></label>
          </div>
          <label className="field"><span>Extra headers as JSON</span><input className="input" value={v.extraHeaders} onChange={set("extraHeaders")} placeholder='{"x-team":"growth"}' /></label>
        </div>
      )}
      <div className="row"><button className="btn" onClick={save} disabled={busy}>{busy ? "Saving..." : "Save gateway"}</button>
        {g.from === "settings" && <button className="btn ghost" onClick={remove}>Remove saved gateway</button>}</div>
    </div>
  );
}
