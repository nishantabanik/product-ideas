"use client";
import { useRef, useState } from "react";

export type Line = { name: string; color: string; values: number[] };

const W = 300, H = 64, PAD = 4;

export default function Sparkline({ lines, labels, label, prefix }: { lines: Line[]; labels: string[]; label: string; prefix?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...lines.flatMap((l) => l.values));
  const n = labels.length;
  const x = (i: number) => PAD + (n === 1 ? (W - 2 * PAD) / 2 : (i / (n - 1)) * (W - 2 * PAD));
  const y = (v: number) => H - PAD - (v / max) * (H - 2 * PAD);
  const path = (v: number[]) => v.map((val, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(val).toFixed(1)}`).join(" ");

  function move(e: React.MouseEvent<SVGSVGElement>) {
    const r = ref.current!.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left) / r.width) * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, i)));
  }

  return (
    <div style={{ position: "relative" }}>
      <svg ref={ref} className="spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={label}
        onMouseMove={move} onMouseLeave={() => setHover(null)}>
        <line x1={PAD} x2={W - PAD} y1={H - PAD} y2={H - PAD} stroke="var(--line)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        {lines.length === 1 && (
          <path d={`${path(lines[0].values)} L${x(n - 1)},${H - PAD} L${x(0)},${H - PAD} Z`} fill={lines[0].color} opacity="0.14" />
        )}
        {lines.map((l) => (
          <path key={l.name} d={path(l.values)} fill="none" stroke={l.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        ))}
        {hover !== null && (
          <>
            <line x1={x(hover)} x2={x(hover)} y1={0} y2={H} stroke="var(--mute)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            {lines.map((l) => <circle key={l.name} cx={x(hover)} cy={y(l.values[hover])} r="3.5" fill={l.color} stroke="var(--card)" strokeWidth="2" vectorEffect="non-scaling-stroke" />)}
          </>
        )}
      </svg>
      {hover !== null && (
        <div className="tip" style={{ left: `${(x(hover) / W) * 100}%`, top: -8, transform: `translate(${hover > n / 2 ? "-105%" : "5%"}, -100%)` }}>
          <b>{prefix ? `${prefix} ` : ""}{new Date(`${labels[hover]}T12:00:00Z`).toLocaleDateString([], { month: "short", day: "numeric", timeZone: "UTC" })}</b>
          {lines.map((l) => <div key={l.name}><i className="dot" style={{ background: l.color }} />{l.name} {l.values[hover].toLocaleString("en-US")}</div>)}
        </div>
      )}
    </div>
  );
}
