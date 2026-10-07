"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Seg from "../components/seg";
import { Icon } from "../components/icons";
import { PRESETS } from "@/lib/ranges";

type Q = Record<string, string | undefined>;

function href(base: Q, over: Q) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...base, ...over })) if (v) q.set(k, v);
  return `/analytics?${q}`;
}

export default function RangeBar({ q, scope, preset, unit, autoUnit, from, to, dataMax, dataMin }: {
  q: Q; scope: string; preset: string; unit: string; autoUnit: string; from: string; to: string; dataMin: string | null; dataMax: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [n, setN] = useState("2");
  const [u, setU] = useState("y");
  const [f, setF] = useState(from);
  const [t, setT] = useState(to);
  const clearRange = { range: undefined, from: undefined, to: undefined, n: undefined, u: undefined };

  return (
    <div className="toolbar" style={{ position: "relative" }}>
      <Seg small label="Platform" value={scope} options={[
        { value: "both", label: "Both", href: href(q, { p: "both" }) },
        { value: "linkedin", label: "LinkedIn", href: href(q, { p: "linkedin" }) },
        { value: "x", label: "X", href: href(q, { p: "x" }) },
      ]} />
      <Seg small label="Range" value={preset} options={PRESETS.map((p) => ({ value: p.value, label: p.label, href: href(q, { ...clearRange, range: p.value }) }))} />
      <button className={`chip${preset === "custom" ? " on" : ""}`} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <Icon name="calendar" size={15} />{preset === "custom" ? `${from} to ${to}` : "Custom"}
      </button>
      <div className="grow">
        <Seg small label="Detail" value={unit === autoUnit && !q.g ? "auto" : unit} options={[
          { value: "auto", label: "Auto", href: href(q, { g: undefined }) },
          { value: "day", label: "Day", href: href(q, { g: "day" }) },
          { value: "week", label: "Week", href: href(q, { g: "week" }) },
          { value: "month", label: "Month", href: href(q, { g: "month" }) },
        ]} />
      </div>
      {open && (
        <div className="card page" style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 30, width: 360, boxShadow: "0 24px 60px rgba(0,0,0,.55)" }}>
          <div className="stack" style={{ gap: 14 }}>
            <div>
              <div className="hint" style={{ marginBottom: 6 }}>Last</div>
              <div className="row">
                <input className="input" style={{ width: 90 }} inputMode="numeric" value={n} onChange={(e) => setN(e.target.value.replace(/\D/g, ""))} aria-label="How many" />
                <select className="input" style={{ width: 130 }} value={u} onChange={(e) => setU(e.target.value)} aria-label="Unit">
                  <option value="d">days</option><option value="m">months</option><option value="y">years</option>
                </select>
                <button className="btn sm" disabled={!n || n === "0"} onClick={() => { setOpen(false); router.push(href(q, { ...clearRange, n, u })); }}>Show</button>
              </div>
            </div>
            <div>
              <div className="hint" style={{ marginBottom: 6 }}>Or between two dates</div>
              <div className="row">
                <input className="input" type="date" style={{ flex: 1 }} value={f} min={dataMin ?? undefined} max={dataMax ?? undefined} onChange={(e) => setF(e.target.value)} aria-label="From" />
                <input className="input" type="date" style={{ flex: 1 }} value={t} min={dataMin ?? undefined} max={dataMax ?? undefined} onChange={(e) => setT(e.target.value)} aria-label="To" />
              </div>
              <p style={{ margin: "10px 0 0" }}><button className="btn sm" disabled={!f || !t || f > t} onClick={() => { setOpen(false); router.push(href(q, { ...clearRange, from: f, to: t })); }}>Apply dates</button></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
