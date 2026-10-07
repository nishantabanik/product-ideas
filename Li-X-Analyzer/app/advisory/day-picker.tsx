"use client";
import { useRouter } from "next/navigation";

export default function DayPicker({ days, current }: { days: string[]; current: string }) {
  const router = useRouter();
  if (days.length < 2) return null;
  return (
    <select className="input" style={{ width: "auto" }} value={current} aria-label="Advisory date" onChange={(e) => router.push(e.target.value === days[0] ? "/advisory" : `/advisory?d=${e.target.value}`)}>
      {days.map((d) => <option key={d} value={d}>{new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}{d === days[0] ? " (latest)" : ""}</option>)}
    </select>
  );
}
