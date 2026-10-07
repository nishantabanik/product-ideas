"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "../../components/icons";
import { useToast } from "../../components/toast";

export default function GoalForm({ full }: { full: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [platform, setPlatform] = useState("linkedin");
  const [metric, setMetric] = useState("impressions");
  const [period, setPeriod] = useState("month");
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    setBusy(true);
    try {
      const res = await fetch("/api/goals", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ platform, metric, period, target: Number(target.replace(/[, ]/g, "")) }) });
      const d = await res.json();
      if (!res.ok) return toast({ tone: "error", title: "Could not add the goal", body: d.error });
      toast({ tone: "ok", title: "Goal added" });
      setTarget("");
      router.refresh();
    } catch { toast({ tone: "error", title: "Could not reach the server" }); } finally { setBusy(false); }
  }

  return (
    <div className="card">
      <div className="card-h"><div><h2>Add a goal</h2><p>{full ? "We track 12 goals at most. Delete one to add another." : "Pick what to count, where, and how much by the end of the week or month."}</p></div></div>
      <div className="goals-form">
        <label className="field"><span>Platform</span>
          <select className="input" value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="linkedin">LinkedIn</option><option value="x">X</option><option value="both">Both</option>
          </select></label>
        <label className="field"><span>Metric</span>
          <select className="input" value={metric} onChange={(e) => setMetric(e.target.value)}>
            <option value="impressions">Impressions</option><option value="engagements">Engagements</option><option value="likes">Likes</option><option value="comments">Comments</option><option value="posts">Posts published</option>
          </select></label>
        <label className="field"><span>Period</span>
          <select className="input" value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="week">A week</option><option value="month">A month</option>
          </select></label>
        <label className="field"><span>Target</span>
          <input className="input" inputMode="numeric" value={target} placeholder="for example 100000" onChange={(e) => setTarget(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !busy && !full) add(); }} /></label>
        <button type="button" className="btn" disabled={busy || full || !target.trim()} onClick={add}><Icon name="plus" size={16} />Add goal</button>
      </div>
    </div>
  );
}
