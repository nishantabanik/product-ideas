import { Icon } from "./icons";

/** Change versus the previous period. `pts` shows percentage points instead of percent (for rates). */
export default function Delta({ cur, prev, pts }: { cur: number | null; prev: number | null; pts?: boolean }) {
  if (cur === null || prev === null || (!prev && !pts)) return <span className="delta">no earlier period</span>;
  const d = pts ? (cur - prev) * 100 : ((cur - prev) / prev) * 100;
  const dir = d > 0.05 ? "up" : d < -0.05 ? "down" : "";
  return (
    <span className={`delta ${dir}`}>
      {dir ? <Icon name={dir === "up" ? "up" : "down"} size={12} /> : null}
      {Math.abs(d).toFixed(1)}{pts ? " pts" : "%"} vs previous
    </span>
  );
}
