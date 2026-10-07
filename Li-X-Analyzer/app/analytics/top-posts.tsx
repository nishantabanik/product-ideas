"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "../components/icons";

export type PostRow = {
  id: string; content: string; url: string | null; date: string | null; impressions: number | null; engagements: number | null;
  likes?: number | null; comments?: number | null; shares?: number | null;
};
type Key = "date" | "impressions" | "likes" | "comments" | "shares" | "engagements" | "rate";

const rate = (p: PostRow) => (p.impressions ? (p.engagements ?? 0) / p.impressions : null);
const fmt = (n: number | null) => (n === null ? "n/a" : n.toLocaleString("en-US"));

export default function TopPosts({ rows, empty, accent = "#3987e5" }: { rows: PostRow[]; empty: string; accent?: string }) {
  const [q, setQ] = useState("");
  const [key, setKey] = useState<Key>("impressions");
  const [dir, setDir] = useState<1 | -1>(-1);
  const [shown, setShown] = useState(15);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const val = (p: PostRow) => (key === "rate" ? rate(p) : key === "date" ? (p.date ? Date.parse(p.date) : null) : p[key] ?? null);
    return rows
      .filter((p) => !s || p.content.toLowerCase().includes(s) || (p.url ?? "").toLowerCase().includes(s))
      .sort((a, b) => {
        const x = val(a), y = val(b);
        if (x === null && y === null) return 0;
        if (x === null) return 1;
        if (y === null) return -1;
        return (x - y) * dir;
      });
  }, [rows, q, key, dir]);

  const max = Math.max(1, ...rows.map((r) => r.impressions ?? 0));
  const th = (k: Key, label: string, right = true) => (
    <th className={`sortable${right ? " r" : ""}`} onClick={() => { if (key === k) setDir((d) => (d === 1 ? -1 : 1)); else { setKey(k); setDir(-1); } }} aria-sort={key === k ? (dir === 1 ? "ascending" : "descending") : "none"}>
      {label}{key === k ? (dir === 1 ? " ↑" : " ↓") : ""}
    </th>
  );

  if (!rows.length) return <div className="empty hint" style={{ padding: 28, textAlign: "center" }}>{empty}</div>;

  return (
    <>
      <div className="toolbar" style={{ marginBottom: 8 }}>
        <div style={{ position: "relative", width: 280, maxWidth: "100%" }}>
          <input className="input" style={{ paddingLeft: 36 }} placeholder="Search posts" value={q} onChange={(e) => { setQ(e.target.value); setShown(15); }} aria-label="Search posts" />
          <span style={{ position: "absolute", left: 12, top: 12, color: "var(--mute)" }}><Icon name="search" size={16} /></span>
        </div>
        <span className="hint grow">{list.length.toLocaleString("en-US")} post{list.length === 1 ? "" : "s"}</span>
      </div>
      <div className="scroll-x">
        <table className="table">
          <thead><tr><th>Post</th>{th("date", "Date", false)}{th("impressions", "Impressions")}{th("likes", "Likes")}{th("comments", "Comments")}{th("shares", "Reposts")}{th("engagements", "Engagements")}{th("rate", "Rate")}</tr></thead>
          <tbody>
            {list.slice(0, shown).map((p) => (
              <tr key={p.id}>
                <td>
                  <span className="clip">
                    <Link href={`/posts/${encodeURIComponent(p.id)}`} style={{ color: "var(--ink)" }}>{p.content || "Post"}</Link>{" "}
                    {p.url && <a href={p.url} target="_blank" rel="noreferrer" aria-label="Open post on the platform" style={{ whiteSpace: "nowrap" }}><Icon name="external" size={13} /></a>}
                  </span>
                </td>
                <td style={{ whiteSpace: "nowrap", color: "var(--ink-2)" }}>{p.date ? new Date(p.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : ""}</td>
                <td className="r"><span className="cell-bar">{fmt(p.impressions)}<i style={{ width: `${((p.impressions ?? 0) / max) * 100}%`, background: accent }} /></span></td>
                <td className="r">{fmt(p.likes ?? null)}</td>
                <td className="r">{fmt(p.comments ?? null)}</td>
                <td className="r">{fmt(p.shares ?? null)}</td>
                <td className="r">{fmt(p.engagements)}</td>
                <td className="r">{rate(p) === null ? "n/a" : `${(rate(p)! * 100).toFixed(1)}%`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {shown < list.length && <p style={{ margin: "12px 0 0", textAlign: "center" }}><button className="btn ghost sm" onClick={() => setShown((s) => s + 25)}>Show 25 more</button></p>}
    </>
  );
}
