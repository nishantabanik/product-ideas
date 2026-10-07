"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "../components/icons";
import { useToast } from "../components/toast";
import { STARTER_TEMPLATES, type Template } from "@/lib/comments/starters";
import "./comments.css";

const LABEL = { both: "Both platforms", linkedin: "LinkedIn", x: "X" } as const;
type Draft = { id: string | null; name: string; body: string; platform: Template["platform"] };
const blank: Draft = { id: null, name: "", body: "", platform: "both" };

export default function TemplatesPanel({ templates }: { templates: Template[] }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const builtin = templates.length === 0;
  const list = builtin ? STARTER_TEMPLATES : templates;

  async function save() {
    if (!draft) return;
    setBusy(true);
    try {
      const res = await fetch("/api/templates", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(draft) });
      const d = await res.json();
      if (!res.ok) return toast({ tone: "error", title: "Could not save", body: d.error });
      toast({ tone: "ok", title: "Template saved" });
      setDraft(null); router.refresh();
    } catch { toast({ tone: "error", title: "Could not reach the server" }); } finally { setBusy(false); }
  }

  async function remove(t: Template) {
    if (!confirm(`Delete the template "${t.name}"?`)) return;
    try {
      const res = await fetch(`/api/templates?id=${encodeURIComponent(t.id)}`, { method: "DELETE" });
      if (!res.ok) return toast({ tone: "error", title: "Could not delete", body: (await res.json()).error });
      router.refresh();
    } catch { toast({ tone: "error", title: "Could not reach the server" }); }
  }

  return (
    <div className="card stack">
      <div className="card-h" style={{ marginBottom: 0 }}>
        <div><h2>Templates</h2><p>Saved replies. Use [name] for the first name of the person and [post] for a short title of our post.</p></div>
        <button className="btn ghost sm" onClick={() => setOpen(!open)} aria-expanded={open}><Icon name={open ? "up" : "down"} size={15} />{open ? "Hide" : `Show (${list.length})`}</button>
      </div>
      {open && (
        <>
          {builtin && <div className="hint">We have not saved any templates yet. These four starters can be used in any reply box. Add our own below, or copy a starter to change it.</div>}
          <div>
            {list.map((t) => (
              <div key={t.id} className="comments-tpl">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row" style={{ gap: 8 }}><span className="comments-name">{t.name}</span><span className="comments-tag">{LABEL[t.platform]}</span>{!t.builtin && <span className="when hint">used {t.uses}x</span>}</div>
                  <div className="comments-body">{t.body}</div>
                </div>
                <div className="row" style={{ gap: 2, flexWrap: "nowrap" }}>
                  <button className="icon-btn" onClick={() => setDraft({ id: t.builtin ? null : t.id, name: t.name, body: t.body, platform: t.platform })} aria-label={t.builtin ? "Copy to edit" : "Edit"} title={t.builtin ? "Copy to edit" : "Edit"}><Icon name={t.builtin ? "copy" : "pen"} size={16} /></button>
                  {!t.builtin && <button className="icon-btn" onClick={() => remove(t)} aria-label="Delete" title="Delete"><Icon name="x" size={16} /></button>}
                </div>
              </div>
            ))}
          </div>
          {draft ? (
            <div className="stack" style={{ gap: 10 }}>
              <div className="grid g-2">
                <label className="field"><span>Name</span><input className="input" value={draft.name} maxLength={80} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Thanks" /></label>
                <label className="field"><span>For</span>
                  <select className="input" value={draft.platform} onChange={(e) => setDraft({ ...draft, platform: e.target.value as Draft["platform"] })}>
                    <option value="both">Both platforms</option><option value="linkedin">LinkedIn</option><option value="x">X</option>
                  </select></label>
              </div>
              <label className="field"><span>Text</span><textarea className="input" style={{ minHeight: 90 }} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} placeholder="Thanks [name], glad it helped." /></label>
              <div className="row">
                <button className="btn sm" disabled={busy || !draft.name.trim() || !draft.body.trim()} onClick={save}><Icon name="check" size={15} />{busy ? "Saving..." : "Save template"}</button>
                <button className="btn ghost sm" onClick={() => setDraft(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="row"><button className="btn ghost sm" onClick={() => setDraft(blank)}><Icon name="plus" size={15} />Add a template</button></div>
          )}
        </>
      )}
    </div>
  );
}
