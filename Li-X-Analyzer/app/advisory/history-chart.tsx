"use client";
import Chart from "../components/chart";
import type { HistoryPoint } from "@/lib/advisory/store";

export default function HistoryChart({ points }: { points: HistoryPoint[] }) {
  const t = (d: string) => Date.parse(`${d}T00:00:00Z`);
  return (
    <>
      <Chart unit="day" height={220} yMax={100} ariaLabel="Health score over time"
        series={[
          { id: "li", name: "LinkedIn", color: "#3987e5", points: points.map((p) => ({ t: t(p.day), y: p.linkedin })), area: true },
          { id: "x", name: "X", color: "#d95926", points: points.map((p) => ({ t: t(p.day), y: p.x })) },
        ]} />
      <div className="legend" style={{ marginTop: 10 }}><span><i style={{ background: "#3987e5" }} />LinkedIn</span><span><i style={{ background: "#d95926" }} />X</span></div>
    </>
  );
}
