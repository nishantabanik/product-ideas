"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "../components/icons";

type Source = { kind: "gateway" | "copilot"; label: string; models: { value: string; name: string }[]; error?: string };
const KEY = "lix-model";

/** One list of every model we can use, grouped by where it comes from. The pick is remembered on this device. */
export default function ModelSelect({ llm, value, onChange }: { llm: boolean; value: string; onChange: (v: string) => void }) {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function load() {
    setLoading(true); setNote(null);
    try {
      const r = await fetch("/api/studio/models");
      const d = await r.json();
      const list: Source[] = d.sources ?? [];
      setSources(list);
      const all = list.flatMap((s) => s.models.map((m) => m.value));
      let saved = ""; try { saved = localStorage.getItem(KEY) ?? ""; } catch { /* private window */ }
      const pick = [value, saved].find((v) => v && all.includes(v)) ?? (d.default && all.includes(d.default) ? d.default : all[0] ?? "");
      onChange(pick);
    } catch { setNote("Could not reach the server."); } finally { setLoading(false); }
  }
  useEffect(() => { if (llm) void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  useEffect(() => { if (value) { try { localStorage.setItem(KEY, value); } catch { /* ignore */ } } }, [value]);

  const total = sources.reduce((n, s) => n + s.models.length, 0);
  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="row" style={{ flexWrap: "wrap" }}>
        <select className="input" style={{ flex: 1, minWidth: 240 }} value={value} disabled={!llm || total === 0} onChange={(e) => onChange(e.target.value)} aria-label="Model">
          {total === 0 && <option value="">{llm ? (loading ? "Loading models..." : "No models found") : "No model connected"}</option>}
          {sources.filter((s) => s.models.length).map((s) => (
            <optgroup key={s.kind} label={s.label}>{s.models.map((m) => <option key={m.value} value={m.value}>{m.name}</option>)}</optgroup>
          ))}
        </select>
        <button className="btn ghost" type="button" disabled={!llm || loading} onClick={load}><Icon name="refresh" size={16} className={loading ? "spin" : ""} />Reload</button>
      </div>
      {!llm && <div className="warn-box"><Icon name="alert" size={16} /><span>No model is connected yet. Open <Link href="/settings">Settings</Link>, add our gateway URL and key, or sign in with GitHub Copilot.</span></div>}
      {sources.filter((s) => s.error).map((s) => <p key={s.kind} className="hint" style={{ margin: 0, color: "var(--red)" }}>{s.label}: {s.error}</p>)}
      {note && <p className="hint" style={{ margin: 0, color: "var(--red)" }}>{note}</p>}
    </div>
  );
}
