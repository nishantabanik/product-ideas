"use client";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/app/components/icons";
import { useToast } from "@/app/components/toast";
import ModelSelect from "@/app/studio/chat/model-select";
import { useRouter } from "next/navigation";

type Msg = { role: "user" | "assistant"; content: string };
const STARTERS = [
  "Why is my LinkedIn data missing?",
  "When was X last synced?",
  "How can I get my latest comments?",
  "Explain my recent performance"
];

export default function AnalyticsChatPanel({ llm }: { llm: boolean }) {
  const toast = useToast();
  const router = useRouter();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [model, setModel] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [msgs, busy]);

  async function send(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: question }];
    setMsgs(next); setText(""); setBusy(true);
    try {
      const r = await fetch("/api/analytics/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: next, model }) });
      const d = await r.json();
      if (!r.ok) { toast({ tone: "error", title: "No answer", body: d.error }); setMsgs(msgs); setText(question); return; }

      let reply = d.reply;

      // Handle special actions returned by the LLM
      if (reply.includes("[ACTION_REQUIRED: SYNC]")) {
        reply = reply.replace("[ACTION_REQUIRED: SYNC]", "");
        setMsgs([...next, { role: "assistant", content: reply }]);
        // Trigger a sync
        const syncRes = await fetch("/api/sync", { method: "POST" });
        if (syncRes.ok) {
           toast({ tone: "ok", title: "Sync triggered successfully!" });
           setMsgs(m => [...m, { role: "assistant", content: "I have triggered a sync with Postiz for you. The data should be updated shortly." }]);
           router.refresh();
        } else {
           toast({ tone: "error", title: "Sync failed" });
        }
      } else {
        setMsgs([...next, { role: "assistant", content: reply }]);
      }
    } catch {
        toast({ tone: "error", title: "Could not reach the server" }); setMsgs(msgs); setText(question);
    } finally {
        setBusy(false);
    }
  }

  const copy = async (s: string) => { await navigator.clipboard.writeText(s).catch(() => {}); toast({ tone: "ok", title: "Copied" }); };

  return (
    <div className="stack" style={{ gap: 10 }}>
      <ModelSelect llm={llm} value={model} onChange={setModel} />
      <div className="chatbox" style={{ maxHeight: 600 }}>
        {msgs.length === 0 && (
          <div className="stack" style={{ gap: 8 }}>
            <p className="hint" style={{ margin: 0 }}>{llm ? "Ask anything about your analytics, missing data, or how to resolve data syncing issues." : "Connect a model on the Settings page first."}</p>
            <div className="slotchips">{STARTERS.map((s) => <button key={s} className="chip tiny" type="button" disabled={!llm} onClick={() => send(s)}>{s}</button>)}</div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`chatmsg ${m.role}`}>
            <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
            {m.role === "assistant" && <div className="row" style={{ gap: 6, marginTop: 6 }}>
              <button className="btn ghost sm" onClick={() => copy(m.content)}><Icon name="copy" size={14} />Copy</button>
            </div>}
          </div>
        ))}
        {busy && <div className="chatmsg assistant hint">Thinking...</div>}
        <div ref={end} />
      </div>
      <div className="row" style={{ alignItems: "flex-end" }}>
        <textarea className="input" style={{ minHeight: 56, flex: 1 }} value={text} disabled={!llm} placeholder="Ask why data is missing or how to fix it... Enter sends, Shift+Enter adds a line." onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }} />
        <button className="btn" disabled={!llm || busy || !text.trim()} onClick={() => send(text)}><Icon name={busy ? "refresh" : "send"} size={16} className={busy ? "spin" : ""} />Ask</button>
      </div>
      {msgs.length > 0 && <div><button className="btn ghost sm" onClick={() => setMsgs([])}>Start a new chat</button></div>}
    </div>
  );
}
