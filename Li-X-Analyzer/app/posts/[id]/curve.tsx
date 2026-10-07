import type { CurvePoint } from "@/lib/pulse/curve";

const W = 640, H = 220, L = 46, R = 14, T = 12, B = 30;
const compact = (n: number) => (n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${+(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}k` : `${Math.round(n)}`);
const label = (h: number) => (h < 1 ? `${Math.round(h * 60)}m` : h < 48 ? `${+h.toFixed(h < 10 ? 1 : 0)}h` : `${Math.round(h / 24)}d`);

/** Impressions against the age of the post. The age axis is stretched at the start, because most of a post's reach comes early. */
export default function Curve({ points, color }: { points: CurvePoint[]; color: string }) {
  const pts = points.filter((p) => p.impressions != null);
  if (pts.length < 2) return null;
  const maxH = Math.max(...pts.map((p) => p.hours));
  const maxY = Math.max(1, ...pts.map((p) => p.impressions!));
  const x = (h: number) => L + (Math.log10(1 + h) / Math.log10(1 + maxH)) * (W - L - R);
  const y = (v: number) => T + (1 - v / maxY) * (H - T - B);
  const ticks = [0, 1, 3, 6, 12, 24, 48, 72, 168].filter((t) => t <= maxH);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${x(p.hours).toFixed(1)},${y(p.impressions!).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Impressions over the first days of the post" style={{ width: "100%", height: "auto", maxHeight: 260 }}>
      {[0, 0.5, 1].map((f) => <g key={f}><line x1={L} x2={W - R} y1={y(maxY * f)} y2={y(maxY * f)} stroke="rgba(158,178,214,.16)" /><text x={L - 6} y={y(maxY * f) + 4} textAnchor="end" fontSize="11" fill="#8d9bb6">{compact(maxY * f)}</text></g>)}
      {ticks.map((t) => <text key={t} x={x(t)} y={H - 10} textAnchor="middle" fontSize="11" fill="#8d9bb6">{label(t)}</text>)}
      <path d={line} fill="none" stroke={color} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => <circle key={i} cx={x(p.hours)} cy={y(p.impressions!)} r="3.4" fill={color}><title>{`${label(p.hours)} after posting: ${p.impressions!.toLocaleString("en-US")} impressions`}</title></circle>)}
    </svg>
  );
}
