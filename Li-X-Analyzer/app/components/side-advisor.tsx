"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "./icons";
import { useToast } from "./toast";
import ModelSelect from "../studio/model-select";

type Msg = { role: "user" | "assistant"; content: string };

const STARTERS: Record<string, string[]> = {
  analytics: [
    "Why is my LinkedIn data only showing till a few days ago?",
    "Why is X not showing data for the last 7 days?",
    "What changed this week versus last week?",
  ],
  advisory: [
    "Why is there no Advisory for today?",
    "How do I refresh today's Advisory now?",
    "What do my health scores mean?",
  ],
  studio: [
    "Help me write a strong opening for this topic.",
    "How do I approve a draft and queue it?",
    "Why does my draft score low?",
  ],
  comments: [
    "Why can't I see my LinkedIn comments?",
    "Why are X replies not showing?",
    "How do I get new X replies now?",
  ],
  import: [
    "How do I get LinkedIn data into the app?",
    "Why is my LinkedIn export not showing recent days?",
  ],
  general: [
    "Why is my LinkedIn analytics not showing till today?",
    "Why is X data missing for the last 7 days?",
    "What is missing and how do I fix it?",
  ],
};

function pageContext(path: string): string {
  if (path.startsWith("/analytics")) return "analytics";
  if (path.startsWith("/advisory")) return "advisory";
  if (path.startsWith("/studio")) return "studio";
  if (path.startsWith("/comments")) return "comments";
  if (path.startsWith("/leads")) return "leads";
  if (path.startsWith("/targets")) return "targets";
  if (path.startsWith("/queue")) return "queue";
  if (path.startsWith("/calendar")) return "calendar";
  if (path.startsWith("/import")) return "import";
  if (path.startsWith("/compose") || path.startsWith("/bulk")) return "schedule";
  return "general";
}

/** A chat window that floats on every page. Model pick, page aware answers, and it runs the resolution when one exists. */
export default function SideAdvisor({ llm }: { llm: boolean }) {
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [model, setModel] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [msgs, busy, open]);

  const page = pageContext(pathname);
  const starters = STARTERS[page] ?? STARTERS.general;

  async function runAction(action: string) {
    let url = "";
    let okTitle = "";
    if (action === "sync") { url = "/api/sync"; okTitle = "Synced with Postiz"; }
    else if (action === "x-replies") { url = "/api/comments/sync"; okTitle = "Checked X for new replies"; }
    else if (action === "advisory") { url = "/api/advisory"; okTitle = "Advisory refreshed"; }
    else return;
    try {
      const r = await fetch(url, { method: "POST" });
      if (r.ok) { toast({ tone: "ok", title: okTitle }); router.refresh(); }
      else { const d = await r.json().catch(() => ({}) as { error?: string }); toast({ tone: "error", title: "Could not run that action", body: d.error }); }
    } catch { toast({ tone: "error", title: "Could not run that action" }); }
  }

  async function send(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: question }];
    setMsgs(next); setText(""); setBusy(true);
    try {
      const r = await fetch("/api/advisor/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: next, model, page }) });
      const d = await r.json();
      if (!r.ok) { toast({ tone: "error", title: "No answer", body: d.error }); setMsgs(msgs); setText(question); return; }
      setMsgs([...next, { role: "assistant", content: d.reply }]);
      if (d.action) await runAction(d.action);
    } catch { toast({ tone: "error", title: "Could not reach the server" }); setMsgs(msgs); setText(question); } finally { setBusy(false); }
  }

  const copy = async (s: string) => { await navigator.clipboard.writeText(s).catch(() => {}); toast({ tone: "ok", title: "Copied" }); };

  return (
    <>
      {!open && (
        <button className="advisor-fab" type="button" aria-label="Open the side advisor" onClick={() => setOpen(true)}>
          <Icon name="chat" size={22} />
        </button>
      )}
      {open && (
        <section className="advisor-panel" role="dialog" aria-label="Side advisor">
          <div className="advisor-head">
            <div className="row" style={{ gap: 8 }}>
              <span className="logo" style={{ width: 30, height: 30 }}><Icon name="bulb" size={16} /></span>
              <div>
                <b>Side advisor</b>
                <p className="hint" style={{ margin: 0, fontSize: 12 }}>Answers for this page, and fixes what it can.</p>
              </div>
            </div>
            <button className="icon-btn" type="button" aria-label="Close" onClick={() => setOpen(false)}><Icon name="x" size={16} /></button>
          </div>
          <div className="advisor-body">
            <ModelSelect llm={llm} value={model} onChange={setModel} />
            <div className="chatbox" style={{ maxHeight: 320, flex: 1 }}>
              {msgs.length === 0 && (
                <div className="stack" style={{ gap: 8 }}>
                  <p className="hint" style={{ margin: 0 }}>{llm ? "Ask about this page: missing data, why something is not showing, or how to fix it. I resolve what I can and explain the rest step by step." : "Connect a model on the Settings page first."}</p>
                  <div className="slotchips">{starters.map((s) => <button key={s} className="chip tiny" type="button" disabled={!llm} onClick={() => send(s)}>{s}</button>)}</div>
                </div>
              )}
              {msgs.map((m, i) => (
                <div key={i} className={`chatmsg ${m.role}`}>
                  <div>{m.content}</div>
                  {m.role === "assistant" && <div className="row" style={{ gap: 6, marginTop: 6 }}>
                    <button className="btn ghost sm" onClick={() => copy(m.content)}><Icon name="copy" size={13} />Copy</button>
                  </div>}
                </div>
              ))}
              {busy && <div className="chatmsg assistant hint">Thinking...</div>}
              <div ref={end} />
            </div>
            <div className="row" style={{ alignItems: "flex-end" }}>
              <textarea className="input" style={{ minHeight: 52, flex: 1 }} value={text} disabled={!llm} placeholder="Ask a question... Enter sends." onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }} />
              <button className="btn" disabled={!llm || busy || !text.trim()} onClick={() => send(text)}><Icon name={busy ? "refresh" : "send"} size={16} className={busy ? "spin" : ""} />Ask</button>
            </div>
            {msgs.length > 0 && <div><button className="btn ghost sm" onClick={() => setMsgs([])}>Start a new chat</button></div>}
          </div>
        </section>
      )}
    </>
  );
}
