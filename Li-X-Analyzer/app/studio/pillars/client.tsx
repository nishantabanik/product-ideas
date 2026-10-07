"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "../../components/icons";
import { useToast } from "../../components/toast";

type P = { id?: string; name: string; keywords: string };

export default function PillarsClient({ initial }: { initial: P[] }) {
  const router = useRouter();
  const toast = useToast();
  const [rows, setRows] = useState<P[]>(initial.length ? initial : [{ name: "", keywords: "" }]);
  const [busy, setBusy] = useState(false);
  const set = (i: number, k: keyof P, v: string) => setRows((r) => r.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  async function save() {
    setBusy(true);
    try {
      const r = await fetch("/api/studio/pillars", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ pillars: rows }) });
      if (!r.ok) return toast({ tone: "error", title: "Not saved", body: (await r.json()).error });
      toast({ tone: "ok", title: "Pillars saved" }); router.refresh();
    } finally { setBusy(false); }
  }
  return (
    <div className="card stack">
      {rows.map((p, i) => (
        <div key={i} className="grid g-2" style={{ alignItems: "end", gridTemplateColumns: "minmax(0,1fr) minmax(0,2fr) auto" }}>
          <label className="field"><span>{i === 0 ? "Pillar" : ""}</span><input className="input" value={p.name} onChange={(e) => set(i, "name", e.target.value)} placeholder="For example Analytics" /></label>
          <label className="field"><span>{i === 0 ? "Keywords, separated by commas" : ""}</span><input className="input" value={p.keywords} onChange={(e) => set(i, "keywords", e.target.value)} placeholder="dashboard, metrics, reporting" /></label>
          <button className="icon-btn" aria-label="Remove pillar" onClick={() => setRows((r) => r.filter((_, j) => j !== i))}><Icon name="x" size={16} /></button>
        </div>
      ))}
      <div className="row"><button className="btn ghost" disabled={rows.length >= 12} onClick={() => setRows((r) => [...r, { name: "", keywords: "" }])}><Icon name="plus" size={16} />Add a pillar</button><button className="btn" disabled={busy} onClick={save}>{busy ? "Saving..." : "Save pillars"}</button></div>
    </div>
  );
}
