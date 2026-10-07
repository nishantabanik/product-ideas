"use client";
import { useState } from "react";
import Chart, { type Pt, type Unit } from "../components/chart";
import CountUp from "../components/count-up";
import Delta from "../components/delta";

export type HeroMetric = { id: string; label: string; color: string; cur: Pt[]; prev?: Pt[]; total: number; prevTotal: number | null };

export default function HeroChart({ title, sub, metrics, unit, shiftMs, foot }: {
  title: string; sub: string; metrics: HeroMetric[]; unit: Unit; shiftMs: number; foot?: React.ReactNode;
}) {
  const [id, setId] = useState(metrics[0].id);
  const [compare, setCompare] = useState(true);
  const m = metrics.find((x) => x.id === id) ?? metrics[0];
  const canCompare = !!m.prev?.length;

  const series = [
    { id: "cur", name: m.label, color: m.color, points: m.cur, area: true },
    ...(compare && canCompare ? [{ id: "prev", name: "Previous period", color: "#8d9bb6", points: m.prev!.map((p) => ({ t: p.t + shiftMs, y: p.y })), dashed: true }] : []),
  ];

  return (
    <div className="card">
      <div className="card-h" style={{ alignItems: "flex-start" }}>
        <div>
          <div className="hint" style={{ fontWeight: 650 }}>{title}</div>
          <div style={{ fontSize: 40, fontWeight: 760, lineHeight: 1.1, margin: "6px 0 8px" }}><CountUp value={m.total} /></div>
          <div className="row"><Delta cur={m.total} prev={m.prevTotal} /><span className="hint">{sub}</span></div>
        </div>
        <div className="row" style={{ justifyContent: "flex-end" }}>
          {metrics.map((x) => (
            <button key={x.id} className={`chip${x.id === m.id ? " on" : ""}`} onClick={() => setId(x.id)}>
              <i className="dotc" style={{ background: x.color }} />{x.label}
            </button>
          ))}
          {canCompare && <button className={`chip${compare ? " on" : ""}`} onClick={() => setCompare((c) => !c)} aria-pressed={compare}>Compare</button>}
        </div>
      </div>
      <Chart key={`${m.id}-${unit}-${compare}`} series={series} unit={unit} height={320} ariaLabel={`${m.label} over time`} />
      <div className="legend" style={{ marginTop: 10 }}>
        <span><i style={{ background: m.color }} />{m.label}</span>
        {compare && canCompare && <span><i className="dash" />Previous period</span>}
      </div>
      {foot}
    </div>
  );
}
