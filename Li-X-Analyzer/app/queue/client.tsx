"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "../components/icons";
import Seg from "../components/seg";
import { useToast } from "../components/toast";
import { WD } from "../studio/fmt";

type Platform = "linkedin" | "x";
type Slot = { weekday: number; time: string };
type SlotRow = Slot & { platform: Platform };

export function SlotsSetup({ tz, initial, suggestions }: { tz: string; initial: SlotRow[]; suggestions: Record<Platform, Slot[]> }) {
  const router = useRouter();
  const toast = useToast();
  const [zone, setZone] = useState(tz);
  const [platform, setPlatform] = useState<Platform>("linkedin");
  const [slots, setSlots] = useState<Record<Platform, Slot[]>>({ linkedin: initial.filter((s) => s.platform === "linkedin"), x: initial.filter((s) => s.platform === "x") });
  const [wd, setWd] = useState(2);
  const [time, setTime] = useState("09:00");
  const [busy, setBusy] = useState(false);
  const mine = slots[platform];
  const key = (s: Slot) => `${s.weekday} ${s.time}`;
  const add = (list: Slot[]) => setSlots((all) => {
    const have = new Set(all[platform].map(key));
    return { ...all, [platform]: [...all[platform], ...list.filter((s) => !have.has(key(s)))].sort((a, b) => a.weekday - b.weekday || a.time.localeCompare(b.time)) };
  });

  async function save() {
    setBusy(true);
    try {
      for (const p of ["linkedin", "x"] as const) {
        const r = await fetch("/api/queue/slots", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ platform: p, slots: slots[p], tz: zone }) });
        if (!r.ok) return toast({ tone: "error", title: "Not saved", body: (await r.json()).error });
      }
      toast({ tone: "ok", title: "Queue slots saved" }); router.refresh();
    } finally { setBusy(false); }
  }

  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="row" style={{ flexWrap: "wrap" }}>
        <Seg small label="Platform" value={platform} onChange={(v) => setPlatform(v as Platform)} options={[{ value: "linkedin", label: `LinkedIn (${slots.linkedin.length})` }, { value: "x", label: `X (${slots.x.length})` }]} />
        <label className="row"><span className="hint">Time zone</span><input className="input" style={{ width: 200 }} value={zone} onChange={(e) => setZone(e.target.value)} /></label>
        <button className="btn ghost sm" type="button" onClick={() => setZone(Intl.DateTimeFormat().resolvedOptions().timeZone)}>Use this browser's</button>
      </div>
      <div className="slotchips">
        {mine.length === 0 && <span className="hint">No slots for {platform === "x" ? "X" : "LinkedIn"} yet.</span>}
        {mine.map((s) => <span key={key(s)} className="chip tiny">{WD[s.weekday]} {s.time}<button className="icon-btn" style={{ padding: 0 }} aria-label="Remove slot" onClick={() => setSlots((all) => ({ ...all, [platform]: all[platform].filter((x) => key(x) !== key(s)) }))}><Icon name="x" size={12} /></button></span>)}
      </div>
      <div className="row" style={{ flexWrap: "wrap" }}>
        <select className="input" style={{ width: 120 }} value={wd} onChange={(e) => setWd(+e.target.value)} aria-label="Weekday">{[1, 2, 3, 4, 5, 6, 0].map((d) => <option key={d} value={d}>{WD[d]}</option>)}</select>
        <input className="input" type="time" style={{ width: 130 }} value={time} onChange={(e) => setTime(e.target.value)} aria-label="Time" />
        <button className="btn ghost sm" onClick={() => time && add([{ weekday: wd, time }])}><Icon name="plus" size={15} />Add slot</button>
        <button className="btn ghost sm" disabled={!suggestions[platform].length} onClick={() => add(suggestions[platform])} title={suggestions[platform].length ? "" : "We need more posts with numbers first"}><Icon name="target" size={15} />Add our best hours</button>
        <button className="btn" disabled={busy} onClick={save}>{busy ? "Saving..." : "Save slots"}</button>
      </div>
    </div>
  );
}

export function FillQueue({ approved, hasSlots }: { approved: number; hasSlots: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    try {
      const r = await fetch("/api/queue/fill", { method: "POST" });
      const d = await r.json();
      if (!r.ok) return toast({ tone: "error", title: "Could not fill the queue", body: d.error });
      toast({ tone: d.scheduled.length ? "ok" : "info", title: `${d.scheduled.length} scheduled`, body: d.skipped.length ? `${d.skipped.length} skipped. ${d.skipped[0].reason}` : undefined });
      router.refresh();
    } catch { toast({ tone: "error", title: "Could not reach the server" }); } finally { setBusy(false); }
  }
  return <button className="btn" onClick={run} disabled={busy || approved === 0 || !hasSlots} title={!hasSlots ? "Add and save slots first" : approved === 0 ? "No approved drafts yet" : ""}><Icon name={busy ? "refresh" : "layers"} size={16} className={busy ? "spin" : ""} />{busy ? "Scheduling..." : "Fill the queue now"}</button>;
}

export function RecycleButton({ postId, llm }: { postId: string; llm: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  async function go(refresh: boolean) {
    setBusy(true);
    try {
      const r = await fetch("/api/queue/recycle", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ postId, refresh }) });
      const d = await r.json();
      if (!r.ok) return toast({ tone: "error", title: "Could not create the draft", body: d.error });
      toast({ tone: "ok", title: "Draft created", body: d.note ?? "Find it on the Studio board." });
      router.push(`/studio/${d.id}`);
    } finally { setBusy(false); }
  }
  return (
    <div className="row" style={{ flexShrink: 0 }}>
      <button className="btn ghost sm" disabled={busy} onClick={() => go(false)}>Same words</button>
      <button className="btn sm" disabled={busy || !llm} onClick={() => go(true)} title={llm ? "" : "Connect a model on the Settings page"}>{busy ? "Working..." : "Fresh opening"}</button>
    </div>
  );
}
