"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "../components/icons";
import { useToast } from "../components/toast";

type Counts = { total: number; added: number; updated: number; unchanged: number };
type Result = { file: string; error?: string; daily?: Counts & { from: string | null; to: string | null }; posts?: Counts; followers?: Counts; notes?: string[] };

const Pills = ({ c, label }: { c: Counts; label: string }) => (
  <>
    <span className="badge">{label}: {c.total.toLocaleString("en-US")}</span>
    {c.added > 0 && <span className="badge li">{c.added.toLocaleString("en-US")} new</span>}
    {c.updated > 0 && <span className="badge x">{c.updated.toLocaleString("en-US")} updated</span>}
    {c.unchanged > 0 && <span className="badge">{c.unchanged.toLocaleString("en-US")} already had</span>}
  </>
);

export default function ImportForm() {
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const toast = useToast();

  async function upload(files: File[]) {
    const ok = files.filter((f) => /\.(xlsx|csv)$/i.test(f.name));
    if (!ok.length) return toast({ tone: "error", title: "Use .xlsx or .csv files" });
    setBusy(true); setResults([]); setDone(0); setTotal(ok.length);
    const out: Result[] = [];
    for (const f of ok) {
      const body = new FormData();
      body.set("file", f);
      try {
        const res = await fetch("/api/import", { method: "POST", body });
        const d = await res.json();
        out.push(res.ok ? d : { file: f.name, error: d.error ?? "Failed" });
      } catch {
        out.push({ file: f.name, error: "Could not reach the server" });
      }
      setResults([...out]); setDone(out.length);
    }
    setBusy(false);
    const added = out.reduce((a, r) => a + (r.daily?.added ?? 0) + (r.posts?.added ?? 0) + (r.followers?.added ?? 0), 0);
    const failed = out.filter((r) => r.error).length;
    toast({ tone: failed ? "error" : "ok", title: failed ? `${failed} file(s) failed` : "Import finished", body: `${added.toLocaleString("en-US")} new rows added across ${out.length - failed} file(s).` });
    router.refresh();
  }

  return (
    <div className="stack">
      <div className={`drop${over ? " over" : ""}`} role="button" tabIndex={0}
        onClick={() => input.current?.click()} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); upload([...e.dataTransfer.files]); }}>
        <span className="big"><Icon name={busy ? "refresh" : "upload"} size={24} className={busy ? "spin" : ""} /></span>
        <h3>{busy ? `Importing ${done} of ${total}...` : "Drop LinkedIn or X export files here"}</h3>
        <p>{busy ? "Large files take a moment." : "or click to choose. .xlsx and .csv, several at once"}</p>
        <input ref={input} type="file" multiple accept=".xlsx,.csv" hidden onChange={(e) => { upload([...(e.target.files ?? [])]); e.target.value = ""; }} />
      </div>
      {busy && <div className="progress"><div style={{ width: `${(done / Math.max(total, 1)) * 100}%` }} /></div>}
      {results.length > 0 && (
        <div className="card page">
          <div className="card-h"><h2>Results</h2></div>
          {results.map((r, i) => (
            <div key={i} className="result">
              <b style={{ minWidth: 160 }}><Icon name="file" size={15} /> {r.file}</b>
              {r.error ? <span className="warn">{r.error}</span> : (
                <div className="stack" style={{ gap: 8 }}>
                  <div className="pills">
                    {r.daily && r.daily.total > 0 && <Pills c={r.daily} label="Days" />}
                    {r.posts && r.posts.total > 0 && <Pills c={r.posts} label="Posts" />}
                    {r.followers && r.followers.total > 0 && <Pills c={r.followers} label="Follower days" />}
                  </div>
                  {r.daily?.from && <span className="hint">Days from {r.daily.from} to {r.daily.to}</span>}
                </div>
              )}
            </div>
          ))}
          {results.some((r) => r.notes?.some((n) => /at most 50/.test(n))) && (
            <p className="hint" style={{ margin: "12px 0 0" }}>LinkedIn lists at most 50 posts per export. To capture older posts, export shorter date ranges (for example one month at a time) and upload each file.</p>
          )}
        </div>
      )}
    </div>
  );
}
