"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "../../components/icons";
import { useToast } from "../../components/toast";

export type Recent = { platform: "linkedin" | "x"; day: string; total: number | null; gained: number | null; lost: number | null };

export default function FollowerForm({ today, defaultPlatform, recent }: { today: string; defaultPlatform: "linkedin" | "x"; recent: Recent[] }) {
  const [platform, setPlatform] = useState(defaultPlatform);
  const [day, setDay] = useState(today);
  const [total, setTotal] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const toast = useToast();

  async function call(method: "POST" | "DELETE", body: object, ok: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/followers", { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) toast({ tone: "error", title: "Not saved", body: d.error ?? "Something went wrong" });
      else { toast({ tone: "ok", title: ok }); if (method === "POST") setTotal(""); router.refresh(); }
    } catch {
      toast({ tone: "error", title: "Could not reach the server" });
    }
    setBusy(false);
  }

  return (
    <div className="stack">
      <form className="row" style={{ alignItems: "flex-end", flexWrap: "wrap", gap: 12 }} onSubmit={(e) => { e.preventDefault(); call("POST", { platform, day, total: total.trim() }, "Follower number saved"); }}>
        <label className="field"><span>Platform</span>
          <select className="input" value={platform} onChange={(e) => setPlatform(e.target.value as "linkedin" | "x")}>
            <option value="linkedin">LinkedIn</option><option value="x">X</option>
          </select></label>
        <label className="field"><span>Date</span><input className="input" type="date" value={day} max={today} onChange={(e) => setDay(e.target.value)} required /></label>
        <label className="field"><span>Total followers</span><input className="input" type="number" min={0} step={1} inputMode="numeric" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="for example 1250" required /></label>
        <button className="btn" disabled={busy} type="submit"><Icon name="plus" size={16} />Save</button>
      </form>
      {recent.length > 0 && (
        <div className="scroll-x">
          <table className="table">
            <thead><tr><th>Date</th><th>Platform</th><th className="r">Total</th><th className="r">Gained</th><th className="r">Lost</th><th /></tr></thead>
            <tbody>
              {recent.map((r) => (
                <tr key={`${r.platform}${r.day}`}>
                  <td>{r.day}</td><td>{r.platform === "x" ? "X" : "LinkedIn"}</td>
                  <td className="r">{r.total === null ? "n/a" : r.total.toLocaleString("en-US")}</td>
                  <td className="r">{r.gained === null ? "n/a" : r.gained.toLocaleString("en-US")}</td>
                  <td className="r">{r.lost === null ? "n/a" : r.lost.toLocaleString("en-US")}</td>
                  <td><button className="icon-btn" type="button" aria-label={`Remove ${r.day}`} disabled={busy} onClick={() => call("DELETE", { platform: r.platform, day: r.day }, "Day removed")}><Icon name="x" size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
