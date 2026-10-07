"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "../../components/icons";
import { useToast } from "../../components/toast";

type T = { name: string; platform: string; kind: string; body: string };
type S = T & { id: string; uses: number };

export default function LibraryClient({ builtIn, saved, mine }: { builtIn: T[]; saved: S[]; mine: { linkedin: string[]; x: string[] } }) {
  const router = useRouter();
  const toast = useToast();
  const [f, setF] = useState({ name: "", body: "", platform: "both", kind: "template" });
  const copy = async (s: string) => { await navigator.clipboard.writeText(s).catch(() => {}); toast({ tone: "ok", title: "Copied" }); };
  async function save() {
    const r = await fetch("/api/studio/library", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
    if (!r.ok) return toast({ tone: "error", title: "Not saved", body: (await r.json()).error });
    setF({ ...f, name: "", body: "" }); toast({ tone: "ok", title: "Saved to our library" }); router.refresh();
  }
  async function remove(id: string) { await fetch("/api/studio/library", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) }); router.refresh(); }
  const Item = ({ t, del }: { t: T & { id?: string }; del?: boolean }) => (
    <div className="variant">
      <div className="row" style={{ justifyContent: "space-between" }}><strong>{t.name}</strong><span className="row"><span className="chip tiny">{t.platform === "both" ? "both" : t.platform === "x" ? "X" : "LinkedIn"}</span>
        <button className="icon-btn" aria-label="Copy" onClick={() => copy(t.body)}><Icon name="copy" size={15} /></button>{del && t.id && <button className="icon-btn" aria-label="Delete" onClick={() => remove(t.id!)}><Icon name="x" size={15} /></button>}</span></div>
      {t.body}
    </div>
  );
  return (
    <div className="stack">
      <div className="card stack">
        <h3 style={{ margin: 0 }}>Save our own</h3>
        <div className="grid g-2">
          <label className="field"><span>Name</span><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
          <div className="grid g-2"><label className="field"><span>For</span><select className="input" value={f.platform} onChange={(e) => setF({ ...f, platform: e.target.value })}><option value="both">Both</option><option value="linkedin">LinkedIn</option><option value="x">X</option></select></label>
            <label className="field"><span>Kind</span><select className="input" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}><option value="template">Template</option><option value="hook">Opening line</option></select></label></div>
        </div>
        <label className="field"><span>Text, with [brackets] for the parts to fill in</span><textarea className="input" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></label>
        <div><button className="btn" onClick={save} disabled={!f.name.trim() || !f.body.trim()}>Save</button></div>
      </div>
      {saved.length > 0 && <section className="stack"><h3 style={{ margin: 0 }}>Ours</h3><div className="grid g-2">{saved.map((t) => <Item key={t.id} t={t} del />)}</div></section>}
      {(mine.linkedin.length > 0 || mine.x.length > 0) && (
        <section className="stack"><h3 style={{ margin: 0 }}>Openings from our best posts</h3>
          <div className="grid g-2">
            {mine.linkedin.map((o, i) => <Item key={`l${i}`} t={{ name: `LinkedIn opening ${i + 1}`, platform: "linkedin", kind: "hook", body: o }} />)}
            {mine.x.map((o, i) => <Item key={`x${i}`} t={{ name: `X opening ${i + 1}`, platform: "x", kind: "hook", body: o }} />)}
          </div></section>
      )}
      <section className="stack"><h3 style={{ margin: 0 }}>Starting points</h3><p className="hint" style={{ margin: 0 }}>Widely used formulas. Fill the brackets, publish, and let our own numbers say which ones work for us.</p>
        <div className="grid g-2">{builtIn.map((t) => <Item key={t.name} t={t} />)}</div></section>
    </div>
  );
}
