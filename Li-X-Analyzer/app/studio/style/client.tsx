"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Icon } from "../../components/icons";
import { useToast } from "../../components/toast";
import { estimateTokens, KINDS, parseSkillFile, type Asset, type AssetKind } from "@/lib/studio/assets";

type Section = { kind: AssetKind; title: string; help: string; namePh: string; bodyPh: string; defaultSwitch: boolean };
const SECTIONS: Section[] = [
  { kind: "tone", title: "Our tone", help: "How we want to sound. One tone is picked per post. The one marked as default is ticked for us.", namePh: "Warm and direct", bodyPh: "Friendly, plain and a little funny. We talk to one person, never to a crowd. We do not preach. We say what happened and what we learned.", defaultSwitch: true },
  { kind: "style", title: "Our way of writing", help: "Rules the writer must follow every time, like length, openings, words to use or avoid.", namePh: "Short lines", bodyPh: "One idea per line. Sentences under 12 words. Start with the result, then the story. End with one easy question.", defaultSwitch: true },
  { kind: "memory", title: "Memory", help: "Facts about us that the writer can use: who we are, who reads us, what we sell, stories we can tell, names and words to avoid. The writer never goes beyond what is written here.", namePh: "Who we are", bodyPh: "I lead a DevOps team in Berlin. My readers are engineering managers. We are building a small tool that makes deploys faster. Never mention our client names.", defaultSwitch: true },
  { kind: "format", title: "Our story formats", help: "Our own story formats. They appear first in the Write tab, next to the 61 built-in ones.", namePh: "The Friday lesson", bodyPh: "Open with one thing that went wrong this week. Say what we did about it in two or three short lines. End with the one rule we keep now.", defaultSwitch: false },
  { kind: "output", title: "Our writing formats", help: "Kinds of writing, like a carousel, a poll or a mini case study. They appear under Kind of writing in the Write tab.", namePh: "Mini case study", bodyPh: "Four short parts: the problem, what we tried, the result with one number, and one lesson. Under 900 characters.", defaultSwitch: false },
];

export default function StyleClient({ assets }: { assets: Asset[] }) {
  return (
    <div className="stack">
      {SECTIONS.map((s) => <AssetSection key={s.kind} section={s} items={assets.filter((a) => a.kind === s.kind)} />)}
      <SkillSection items={assets.filter((a) => a.kind === "skill")} />
    </div>
  );
}

function useAssetApi() {
  const router = useRouter();
  const toast = useToast();
  async function save(a: { id?: string; kind: AssetKind; name: string; body: string; platform: string; active: boolean }, ok = "Saved") {
    const r = await fetch("/api/studio/assets", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(a) });
    const d = await r.json();
    if (!r.ok) { toast({ tone: "error", title: "Not saved", body: d.error }); return false; }
    toast({ tone: "ok", title: ok }); router.refresh(); return true;
  }
  async function toggle(id: string, active: boolean) { await fetch("/api/studio/assets", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, active }) }); router.refresh(); }
  async function remove(id: string) { if (!confirm("Delete this?")) return; await fetch("/api/studio/assets", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) }); router.refresh(); }
  return { save, toggle, remove, toast };
}

function Item({ a, section, onEdit, api }: { a: Asset; section: Section | null; onEdit: () => void; api: ReturnType<typeof useAssetApi> }) {
  return (
    <div className="style-item">
      <div className="row" style={{ flexWrap: "wrap" }}>
        <strong className="grow">{a.name}</strong>
        {a.platform !== "both" && <span className={`chip tiny ${a.platform}`}>{a.platform === "x" ? "X only" : "LinkedIn only"}</span>}
        <span className="hint">{a.body.length.toLocaleString("en-US")} characters, about {estimateTokens(a.body.length).toLocaleString("en-US")} tokens</span>
      </div>
      <p>{a.body.length > 240 ? `${a.body.slice(0, 240).trim()}...` : a.body}</p>
      <div className="row" style={{ flexWrap: "wrap" }}>
        {(section?.defaultSwitch ?? true) && <label className="row" style={{ cursor: "pointer" }}><input type="checkbox" checked={a.active} onChange={(e) => api.toggle(a.id, e.target.checked)} /><span className="hint">Use by default</span></label>}
        <button className="btn ghost sm" onClick={onEdit}>Edit</button>
        <button className="btn ghost sm" onClick={() => api.remove(a.id)}>Delete</button>
      </div>
    </div>
  );
}

function Form({ kind, initial, placeholders, defaultSwitch, api, onDone }: { kind: AssetKind; initial?: Asset; placeholders: { name: string; body: string }; defaultSwitch: boolean; api: ReturnType<typeof useAssetApi>; onDone: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [platform, setPlatform] = useState(initial?.platform ?? "both");
  const [active, setActive] = useState(initial?.active ?? defaultSwitch);
  const [busy, setBusy] = useState(false);
  const max = KINDS[kind].max;
  async function submit() {
    setBusy(true);
    const ok = await api.save({ id: initial?.id, kind, name, body, platform, active }, initial ? "Changes saved" : "Added");
    setBusy(false);
    if (ok) { if (!initial) { setName(""); setBody(""); } onDone(); }
  }
  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="grid g-2">
        <label className="field"><span>Name</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholders.name} /></label>
        <label className="field"><span>Use it for</span>
          <select className="input" value={platform} onChange={(e) => setPlatform(e.target.value as Asset["platform"])}><option value="both">LinkedIn and X</option><option value="linkedin">LinkedIn only</option><option value="x">X only</option></select></label>
      </div>
      <label className="field"><span>What it says</span><textarea className="input" style={{ minHeight: 110 }} value={body} onChange={(e) => setBody(e.target.value)} placeholder={placeholders.body} />
        <span className="hint" style={{ textAlign: "right", color: body.length > max ? "var(--red)" : undefined }}>{body.length.toLocaleString("en-US")} / {max.toLocaleString("en-US")}</span></label>
      {defaultSwitch && <label className="row" style={{ cursor: "pointer" }}><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />Use by default (it starts ticked in the Write tab)</label>}
      <div className="row"><button className="btn" disabled={busy || !name.trim() || !body.trim() || body.length > max} onClick={submit}>{busy ? "Saving..." : initial ? "Save changes" : "Add"}</button>{initial && <button className="btn ghost" onClick={onDone}>Cancel</button>}</div>
    </div>
  );
}

function AssetSection({ section, items }: { section: Section; items: Asset[] }) {
  const api = useAssetApi();
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(items.length === 0);
  return (
    <div className="card stack">
      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <div><h2 style={{ margin: 0 }}>{section.title} <span className="hint">({items.length})</span></h2><p className="style-help">{section.help}</p></div>
        {!adding && <button className="btn ghost" onClick={() => setAdding(true)}><Icon name="plus" size={16} />Add</button>}
      </div>
      {items.map((a) => editing === a.id
        ? <div key={a.id} className="style-item"><Form kind={section.kind} initial={a} placeholders={{ name: section.namePh, body: section.bodyPh }} defaultSwitch={section.defaultSwitch} api={api} onDone={() => setEditing(null)} /></div>
        : <Item key={a.id} a={a} section={section} onEdit={() => setEditing(a.id)} api={api} />)}
      {adding && <div className="style-item"><Form kind={section.kind} placeholders={{ name: section.namePh, body: section.bodyPh }} defaultSwitch={section.defaultSwitch} api={api} onDone={() => setAdding(items.length === 0)} /></div>}
    </div>
  );
}

function SkillSection({ items }: { items: Asset[] }) {
  const api = useAssetApi();
  const file = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [pasting, setPasting] = useState(false);
  const [busy, setBusy] = useState(false);

  async function upload() {
    const files = [...(file.current?.files ?? [])];
    if (!files.length) return;
    setBusy(true);
    let added = 0;
    for (const f of files) {
      const text = await f.text();
      const p = parseSkillFile(text, f.name);
      const body = p.description ? `Description: ${p.description}\n\n${p.body}` : p.body;
      if (!p.body.trim()) { api.toast({ tone: "error", title: `${f.name} is empty` }); continue; }
      if (body.length > KINDS.skill.max) { api.toast({ tone: "error", title: `${f.name} is too long`, body: `A skill file can have at most ${KINDS.skill.max.toLocaleString("en-US")} characters, this has ${body.length.toLocaleString("en-US")}.` }); continue; }
      const r = await fetch("/api/studio/assets", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "skill", name: p.name, body, platform: "both", active: false }) });
      if (r.ok) added++; else api.toast({ tone: "error", title: `${f.name} not saved`, body: (await r.json()).error });
    }
    if (file.current) file.current.value = "";
    setBusy(false);
    if (added) { api.toast({ tone: "ok", title: `${added} skill file${added === 1 ? "" : "s"} added` }); window.location.reload(); }
  }

  return (
    <div className="card stack">
      <div><h2 style={{ margin: 0 }}>Skill files <span className="hint">({items.length})</span></h2>
        <p className="style-help">Instruction files, for example a SKILL.md or any markdown or text file with rules for writing posts. Upload them or paste the text. Tick the ones to use in the Write tab. Big files are shortened to fit, so keep each one focused.</p></div>
      {items.map((a) => editing === a.id
        ? <div key={a.id} className="style-item"><Form kind="skill" initial={a} placeholders={{ name: "Hook writing skill", body: "Paste the instructions" }} defaultSwitch api={api} onDone={() => setEditing(null)} /></div>
        : <Item key={a.id} a={a} section={null} onEdit={() => setEditing(a.id)} api={api} />)}
      <div className="row" style={{ flexWrap: "wrap" }}>
        <input ref={file} type="file" multiple accept=".md,.markdown,.txt,text/markdown,text/plain" className="input" style={{ maxWidth: 360 }} aria-label="Skill files" />
        <button className="btn" disabled={busy} onClick={upload}><Icon name={busy ? "refresh" : "upload"} size={16} className={busy ? "spin" : ""} />{busy ? "Adding..." : "Upload skill files"}</button>
        <button className="btn ghost" onClick={() => setPasting(!pasting)}>{pasting ? "Hide" : "Paste a skill instead"}</button>
      </div>
      {pasting && <div className="style-item"><Form kind="skill" placeholders={{ name: "Hook writing skill", body: "Paste the instructions" }} defaultSwitch api={api} onDone={() => setPasting(false)} /></div>}
    </div>
  );
}
