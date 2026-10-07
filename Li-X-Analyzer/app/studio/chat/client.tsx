"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Seg from "../../components/seg";
import { useToast } from "../../components/toast";
import ChatPanel from "../chat-panel";

export default function ChatClient({ llm }: { llm: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [platform, setPlatform] = useState<"linkedin" | "x">("linkedin");
  const [draft, setDraft] = useState("");
  async function save(text: string) {
    const r = await fetch("/api/studio", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ platform, status: "draft", content: platform === "x" ? text.slice(0, 6000) : text, source: "ai" }) });
    const d = await r.json();
    if (!r.ok) return toast({ tone: "error", title: "Could not save", body: d.error });
    router.push(`/studio/${d.id}`);
  }
  return (
    <div className="stack">
      <div className="row"><Seg small label="Platform" value={platform} onChange={(v) => setPlatform(v as "linkedin" | "x")} options={[{ value: "linkedin", label: "LinkedIn" }, { value: "x", label: "X" }]} /></div>
      <div className="card stack">
        <label className="field"><span>A draft to work on (optional, the assistant reads it with every question)</span>
          <textarea className="input" style={{ minHeight: 90 }} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Paste a draft, or leave empty to ask general questions." /></label>
        <ChatPanel platform={platform} llm={llm} getDraft={() => draft} onUse={save} />
      </div>
    </div>
  );
}
