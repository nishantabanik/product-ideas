"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Seg from "../components/seg";
import { Icon } from "../components/icons";
import { useToast } from "../components/toast";

type Platform = "linkedin" | "x";

export default function QuickAdd({ llm, pillars }: { llm: boolean; pillars: string[] }) {
  const router = useRouter();
  const toast = useToast();
  const [platform, setPlatform] = useState<Platform>("linkedin");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<{ title: string; angle: string; pillar?: string }[]>([]);

  async function create(body: Record<string, unknown>, label: string) {
    setBusy(label);
    try {
      const r = await fetch("/api/studio", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ platform, ...body }) });
      const d = await r.json();
      if (!r.ok) return toast({ tone: "error", title: "Could not save", body: d.error });
      return d as { id: string };
    } catch { toast({ tone: "error", title: "Could not reach the server" }); } finally { setBusy(null); }
  }
  async function idea() {
    if (!text.trim()) return;
    if (await create({ status: "idea", title: text.trim() }, "idea")) { setText(""); toast({ tone: "ok", title: "Idea saved" }); router.refresh(); }
  }
  async function draft() {
    const d = await create({ status: "draft", title: text.trim().slice(0, 80), content: platform === "x" && text.length <= 280 ? text.trim() : "" , source: "manual" }, "draft");
    if (d) router.push(`/studio/${d.id}`);
  }
  async function suggest() {
    setBusy("ai");
    try {
      const r = await fetch("/api/studio/ai", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ task: "ideas", platform, count: 6 }) });
      const d = await r.json();
      if (!r.ok) return toast({ tone: "error", title: "No ideas", body: d.error });
      setIdeas(d.ideas);
    } catch { toast({ tone: "error", title: "Could not reach the server" }); } finally { setBusy(null); }
  }
  async function keep(i: { title: string; angle: string; pillar?: string }) {
    if (await create({ status: "idea", title: i.title, content: i.angle, pillar: i.pillar ?? null, source: "ai" }, "keep")) {
      setIdeas((x) => x.filter((y) => y !== i)); router.refresh();
    }
  }

  return (
    <div className="card stack">
      <div className="row" style={{ flexWrap: "wrap" }}>
        <Seg small label="Platform" value={platform} onChange={(v) => setPlatform(v as Platform)} options={[{ value: "linkedin", label: "LinkedIn" }, { value: "x", label: "X" }]} />
        <input className="input" style={{ flex: 1, minWidth: 240 }} value={text} onChange={(e) => setText(e.target.value)} placeholder="An idea, a headline or the first line of a post" onKeyDown={(e) => e.key === "Enter" && idea()} />
        <button className="btn ghost" onClick={idea} disabled={!text.trim() || !!busy}><Icon name="bulb" size={16} />Save idea</button>
        <button className="btn" onClick={draft} disabled={!!busy}><Icon name="pen" size={16} />Start a draft</button>
        <button className="btn ghost" onClick={suggest} disabled={!llm || !!busy} title={llm ? "" : "Connect a model on the Settings page"}><Icon name={busy === "ai" ? "refresh" : "target"} size={16} className={busy === "ai" ? "spin" : ""} />{busy === "ai" ? "Thinking..." : "Suggest ideas"}</button>
      </div>
      {pillars.length > 0 && <p className="hint">Suggestions follow our pillars: {pillars.join(", ")}.</p>}
      {ideas.length > 0 && (
        <div className="stack" style={{ gap: 8 }}>
          {ideas.map((i, k) => (
            <div key={k} className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div><strong>{i.title}</strong>{i.pillar && <span className="chip" style={{ marginLeft: 8 }}>{i.pillar}</span>}<p className="hint" style={{ margin: "2px 0 0" }}>{i.angle}</p></div>
              <button className="btn ghost sm" onClick={() => keep(i)} disabled={!!busy}>Keep</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
