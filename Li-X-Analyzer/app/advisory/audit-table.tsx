"use client";
import { useMemo, useState } from "react";
import Seg from "../components/seg";
import { Icon } from "../components/icons";
import type { PostAudit } from "@/lib/advisory/types";

type Key = "score" | "date" | "impressions" | "rate";
const fmt = (n: number | null) => (n === null ? "n/a" : n.toLocaleString("en-US"));

export default function AuditTable({ audits }: { audits: PostAudit[] }) {
  const [scope, setScope] = useState<"all" | "linkedin" | "x">("all");
  const [onlyBad, setOnlyBad] = useState(false);
  const [q, setQ] = useState("");
  const [key, setKey] = useState<Key>("score");
  const [dir, setDir] = useState<1 | -1>(-1);
  const [shown, setShown] = useState(20);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const val = (a: PostAudit) => (key === "date" ? (a.date ? Date.parse(a.date) : null) : key === "rate" ? a.rate : a[key]);
    return audits
      .filter((a) => (scope === "all" || a.platform === scope) && (!onlyBad || a.flags.some((f) => f.tone === "bad")) && (!s || a.snippet.toLowerCase().includes(s)))
      .sort((a, b) => { const x = val(a), y = val(b); if (x === null && y === null) return 0; if (x === null) return 1; if (y === null) return -1; return (x - y) * dir; });
  }, [audits, scope, onlyBad, q, key, dir]);

  const th = (k: Key, label: string, right = false) => (
    <th className={`sortable${right ? " r" : ""}`} onClick={() => { if (key === k) setDir((d) => (d === 1 ? -1 : 1)); else { setKey(k); setDir(-1); } }}>{label}{key === k ? (dir === 1 ? " ↑" : " ↓") : ""}</th>
  );

  return (
    <>
      <div className="toolbar">
        <Seg small label="Platform" value={scope} onChange={(v) => { setScope(v as typeof scope); setShown(20); }} options={[{ value: "all", label: "Both" }, { value: "linkedin", label: "LinkedIn" }, { value: "x", label: "X" }]} />
        <button className={`chip${onlyBad ? " on" : ""}`} aria-pressed={onlyBad} onClick={() => setOnlyBad((v) => !v)}><Icon name="alert" size={14} />Only posts with problems</button>
        <div style={{ position: "relative", width: 240 }}>
          <input className="input" style={{ paddingLeft: 36 }} placeholder="Search posts" value={q} onChange={(e) => { setQ(e.target.value); setShown(20); }} aria-label="Search posts" />
          <span style={{ position: "absolute", left: 12, top: 12, color: "var(--mute)" }}><Icon name="search" size={16} /></span>
        </div>
        <span className="hint grow">{list.length.toLocaleString("en-US")} posts</span>
      </div>
      <div className="scroll-x">
        <table className="table">
          <thead><tr><th>Post</th><th>Where</th>{th("date", "Date")}{th("impressions", "Impressions", true)}{th("rate", "Rate", true)}{th("score", "Score", true)}<th>What we noticed</th></tr></thead>
          <tbody>
            {list.slice(0, shown).map((a) => (
              <tr key={a.id}>
                <td style={{ minWidth: 220, maxWidth: 360 }}><span className="clip" style={{ maxWidth: 340 }}>{a.snippet || <span className="hint">No text saved</span>} {a.url && <a href={a.url} target="_blank" rel="noreferrer" aria-label="Open post"><Icon name="external" size={13} /></a>}</span></td>
                <td><span className={`badge ${a.platform === "x" ? "x" : "li"}`}>{a.platform === "x" ? "X" : "LinkedIn"}</span></td>
                <td style={{ whiteSpace: "nowrap", color: "var(--ink-2)" }}>{a.date ? new Date(a.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : ""}</td>
                <td className="r">{fmt(a.impressions)}</td>
                <td className="r">{a.rate === null ? "n/a" : `${(a.rate * 100).toFixed(1)}%`}</td>
                <td className="r"><b className="num">{a.score ?? "n/a"}</b></td>
                <td><div className="flags">{a.flags.length ? a.flags.map((f) => <span key={f.key} className={`flag ${f.tone}`}>{f.label}</span>) : <span className="hint">Nothing notable</span>}</div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {shown < list.length && <p style={{ margin: "12px 0 0", textAlign: "center" }}><button className="btn ghost sm" onClick={() => setShown((s) => s + 25)}>Show 25 more</button></p>}
      {list.length === 0 && <p className="hint" style={{ textAlign: "center", padding: 24 }}>No posts match.</p>}
    </>
  );
}
