"use client";
import { useEffect, useRef, useState } from "react";
import { Icon } from "../components/icons";
import { useToast } from "../components/toast";
import ModelSelect from "./model-select";

type Msg = { role: "user" | "assistant"; content: string };
const STARTERS = ["Give me five opening lines for this topic", "Write a short post about this", "Make the draft sharper and shorter", "What is weak about this draft?", "Turn this into a thread"];

export default function ChatPanel({ platform, llm, getDraft, onUse, compact = false }: { platform: "linkedin" | "x"; llm: boolean; getDraft?: () => string; onUse?: (text: string) => void; compact?: boolean }) {
  const toast = useToast();
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
      const r = await fetch("/api/studio/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ platform, messages: next, draft: getDraft?.() ?? "", model }) });
      const d = await r.json();
      if (!r.ok) { toast({ tone: "error", title: "No answer", body: d.error }); setMsgs(msgs); setText(question); return; }
      setMsgs([...next, { role: "assistant", content: d.reply }]);
    } catch { toast({ tone: "error", title: "Could not reach the server" }); setMsgs(msgs); setText(question); } finally { setBusy(false); }
  }
  const copy = async (s: string) => { await navigator.clipboard.writeText(s).catch(() => {}); toast({ tone: "ok", title: "Copied" }); };

  return (
    <div className="stack" style={{ gap: 10 }}>
      <ModelSelect llm={llm} value={model} onChange={setModel} />
      <div className="chatbox" style={{ maxHeight: compact ? 340 : 520 }}>
        {msgs.length === 0 && (
          <div className="stack" style={{ gap: 8 }}>
            <p className="hint" style={{ margin: 0 }}>{llm ? "Ask anything about our posts: drafts, openings, structure, tone. We send our voice samples and the last 8 messages, so each question stays small." : "Connect a model on the Settings page first."}</p>
            <div className="slotchips">{STARTERS.map((s) => <button key={s} className="chip tiny" type="button" disabled={!llm} onClick={() => send(s)}>{s}</button>)}</div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`chatmsg ${m.role}`}>
            <div>{m.content}</div>
            {m.role === "assistant" && <div className="row" style={{ gap: 6, marginTop: 6 }}>
              <button className="btn ghost sm" onClick={() => copy(m.content)}><Icon name="copy" size={14} />Copy</button>
              {onUse && <button className="btn ghost sm" onClick={() => { onUse(m.content); toast({ tone: "ok", title: "Loaded into the editor" }); }}>Use as the draft</button>}
            </div>}
          </div>
        ))}
        {busy && <div className="chatmsg assistant hint">Thinking...</div>}
        <div ref={end} />
      </div>
      <div className="row" style={{ alignItems: "flex-end" }}>
        <textarea className="input" style={{ minHeight: 56, flex: 1 }} value={text} disabled={!llm} placeholder="Ask a question, or say what to write. Enter sends, Shift+Enter adds a line." onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }} />
        <button className="btn" disabled={!llm || busy || !text.trim()} onClick={() => send(text)}><Icon name={busy ? "refresh" : "send"} size={16} className={busy ? "spin" : ""} />Ask</button>
      </div>
      {msgs.length > 0 && <div><button className="btn ghost sm" onClick={() => setMsgs([])}>Start a new chat</button></div>}
    </div>
  );
}
