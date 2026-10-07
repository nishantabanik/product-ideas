"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";

export type Pt = { t: number; y: number | null; partial?: boolean };
export type ChartSeries = { id: string; name: string; color: string; points: Pt[]; dashed?: boolean; area?: boolean };
export type Unit = "day" | "week" | "month";

const DAY = 86_400_000;
const compact = (n: number) => (n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${+(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}k` : `${Math.round(n)}`);

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const m = v / p;
  return ([1, 1.2, 1.6, 2, 2.4, 3, 4, 5, 6, 8, 10].find((x) => m <= x) ?? 10) * p;
}

/** Smooth line through the points without overshooting (monotone cubic, Fritsch and Carlson). */
function smooth(pts: [number, number][]) {
  const n = pts.length;
  if (n === 0) return "";
  if (n === 1) return `M${pts[0][0]},${pts[0][1]}`;
  const dx = [], dy = [], m = [];
  for (let i = 0; i < n - 1; i++) { dx.push(pts[i + 1][0] - pts[i][0]); dy.push(pts[i + 1][1] - pts[i][1]); m.push(dy[i] / (dx[i] || 1)); }
  const t = [m[0]];
  for (let i = 1; i < n - 1; i++) t.push(m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2);
  t.push(m[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
    const a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
  }
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += `C${(pts[i][0] + h).toFixed(1)},${(pts[i][1] + t[i] * h).toFixed(1)} ${(pts[i + 1][0] - h).toFixed(1)},${(pts[i + 1][1] - t[i + 1] * h).toFixed(1)} ${pts[i + 1][0].toFixed(1)},${pts[i + 1][1].toFixed(1)}`;
  }
  return d;
}

function label(t: number, unit: Unit, long: boolean) {
  const d = new Date(t);
  if (unit === "month") return d.toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
  const base = d.toLocaleDateString("en-GB", { weekday: long && unit === "day" ? "short" : undefined, day: "numeric", month: "short", year: long ? "numeric" : undefined, timeZone: "UTC" });
  return unit === "week" && long ? `Week of ${base}` : base;
}

export default function Chart({ series, unit, height = 300, mini = false, format = (n) => n.toLocaleString("en-US"), ariaLabel, yMax }: {
  series: ChartSeries[]; unit: Unit; height?: number; mini?: boolean; format?: (n: number) => string; ariaLabel: string; yMax?: number;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState<number | null>(null);
  const gid = useId().replace(/:/g, "");

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(200, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const m = mini ? { l: 2, r: 2, t: 6, b: 4 } : { l: 44, r: 14, t: 14, b: 28 };
  const w = width - m.l - m.r, h = height - m.t - m.b;

  const geo = useMemo(() => {
    const all = series.flatMap((s) => s.points);
    const ts = all.map((p) => p.t);
    const t0 = Math.min(...ts), t1 = Math.max(...ts);
    const max = yMax ?? niceMax(Math.max(0, ...all.map((p) => p.y ?? 0)) * 1.06);
    const x = (t: number) => m.l + (t1 === t0 ? w / 2 : ((t - t0) / (t1 - t0)) * w);
    const y = (v: number) => m.t + h - (v / max) * h;
    const paths = series.map((s) => {
      // Solid line through full periods. Partial periods (cut off by the range, or with missing days) get a dashed link and a hollow dot.
      const runs: [number, number][][] = [];
      const dashed: string[] = [];
      const hollow: [number, number][] = [];
      let cur: [number, number][] = [];
      let prev: { x: number; y: number; partial: boolean } | null = null;
      for (const p of s.points) {
        if (p.y === null) { if (cur.length) runs.push(cur); cur = []; prev = null; continue; }
        const q = { x: x(p.t), y: y(p.y), partial: !!p.partial };
        if (q.partial) {
          if (cur.length) { runs.push(cur); cur = []; }
          hollow.push([q.x, q.y]);
        } else cur.push([q.x, q.y]);
        if (prev && (prev.partial || q.partial)) dashed.push(`M${prev.x.toFixed(1)},${prev.y.toFixed(1)}L${q.x.toFixed(1)},${q.y.toFixed(1)}`);
        prev = q;
      }
      if (cur.length) runs.push(cur);
      const line = runs.map(smooth).join(" ");
      const area = runs.filter((r) => r.length > 1).map((r) => `${smooth(r)}L${r[r.length - 1][0].toFixed(1)},${m.t + h}L${r[0][0].toFixed(1)},${m.t + h}Z`).join(" ");
      return { line, area, dashed: dashed.join(" "), hollow, lone: runs.filter((r) => r.length === 1).map((r) => r[0]) };
    });
    return { t0, t1, max, x, y, paths };
  }, [series, w, h, m.l, m.t]);

  const primary = series[0]?.points ?? [];
  const nearest = (t: number, pts: Pt[], tol = Infinity) => {
    let best = -1, d = Infinity;
    pts.forEach((p, i) => { const dd = Math.abs(p.t - t); if (dd < d) { d = dd; best = i; } });
    return d <= tol ? best : -1;
  };

  function onMove(e: React.PointerEvent<SVGRectElement>) {
    const r = (e.target as SVGRectElement).getBoundingClientRect();
    const t = geo.t0 + ((e.clientX - r.left) / r.width) * (geo.t1 - geo.t0);
    setHover(nearest(t, primary));
  }

  const yTicks = mini ? [] : [0, 1, 2, 3, 4].map((i) => (geo.max / 4) * i);
  const nx = mini ? 0 : Math.max(2, Math.min(8, Math.floor(width / 120), primary.length));
  const span = (geo.t1 - geo.t0) / DAY;
  const tickLabel = (t: number) => (unit === "month" || span > 330 ? label(t, "month", false) : label(t, unit === "week" ? "day" : unit, false));
  // Never print the same label twice, which happens when a short series is stretched over many ticks.
  const xTicks = Array.from({ length: nx }, (_, i) => geo.t0 + ((geo.t1 - geo.t0) * i) / Math.max(1, nx - 1)).filter((t, i, all) => i === 0 || tickLabel(t) !== tickLabel(all[i - 1]));

  const hp = hover !== null ? primary[hover] : null;
  const tipLeft = hp ? Math.min(Math.max(geo.x(hp.t), 90), width - 90) : 0;
  const tol = unit === "month" ? 16 * DAY : unit === "week" ? 4 * DAY : DAY / 2;

  return (
    <div ref={wrap} className="chart" style={{ height }}>
      <svg width={width} height={height} role="img" aria-label={ariaLabel} key={gid}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.id} id={`${gid}-${s.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.32" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={m.l} x2={width - m.r} y1={geo.y(v)} y2={geo.y(v)} className="grid-line" />
            <text x={m.l - 8} y={geo.y(v) + 4} textAnchor="end" className="axis">{compact(v)}</text>
          </g>
        ))}
        {xTicks.map((t, i) => (
          <text key={i} x={geo.x(t)} y={height - 8} textAnchor={i === 0 ? "start" : i === xTicks.length - 1 ? "end" : "middle"} className="axis">{tickLabel(t)}</text>
        ))}
        {series.map((s, i) =>
          s.area ? <path key={`a${s.id}`} d={geo.paths[i].area} fill={`url(#${gid}-${s.id})`} className="area-in" /> : null,
        )}
        {series.map((s, i) => (
          <g key={s.id}>
            <path d={geo.paths[i].line} fill="none" stroke={s.color} strokeWidth={s.dashed ? 1.6 : 2.2} strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray={s.dashed ? "5 5" : undefined} opacity={s.dashed ? 0.7 : 1} className={s.dashed ? "" : "line-draw"} pathLength={s.dashed ? undefined : 1} />
            {geo.paths[i].dashed && <path d={geo.paths[i].dashed} fill="none" stroke={s.color} strokeWidth={1.8} strokeDasharray="4 4" opacity={0.8} />}
            {geo.paths[i].lone.map(([lx, ly], k) => <circle key={k} cx={lx} cy={ly} r={3} fill={s.color} />)}
            {geo.paths[i].hollow.map(([hx, hy], k) => <circle key={`h${k}`} cx={hx} cy={hy} r={3.8} fill="var(--surface)" stroke={s.color} strokeWidth={2} />)}
          </g>
        ))}
        {hp && (
          <g>
            <line x1={geo.x(hp.t)} x2={geo.x(hp.t)} y1={m.t} y2={m.t + h} className="cross" />
            {series.map((s) => {
              const j = nearest(hp.t, s.points, tol);
              const p = j >= 0 ? s.points[j] : null;
              return p && p.y !== null ? <circle key={s.id} cx={geo.x(p.t)} cy={geo.y(p.y)} r={4.5} fill={s.color} stroke="var(--surface)" strokeWidth={2.5} /> : null;
            })}
          </g>
        )}
        <rect x={m.l} y={m.t} width={w} height={h} fill="transparent" onPointerMove={onMove} onPointerLeave={() => setHover(null)} />
      </svg>
      {hp && (
        <div className="chart-tip" style={{ left: tipLeft, top: 6 }}>
          <div className="tip-h">{label(hp.t, unit, true)}{hp.partial ? " (partial period)" : ""}</div>
          {series.map((s) => {
            const j = nearest(hp.t, s.points, tol);
            const p = j >= 0 ? s.points[j] : null;
            return (
              <div key={s.id} className="tip-r">
                <i style={{ background: s.color }} />
                <span>{s.name}</span>
                <b>{p && p.y !== null ? format(p.y) : "no data"}</b>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
