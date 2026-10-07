import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { listTargets, recentLog, type Target } from "@/lib/targets/store";
import { doneToday, pickToday, streak, utcDay, weekTotal } from "@/lib/targets/rotation";
import { Icon } from "../components/icons";
import TargetsClient from "./client";
import "./targets.css";

export const dynamic = "force-dynamic";
const PER_DAY = 5;

export default async function TargetsPage() {
  if (!(await isAuthed())) redirect("/login");
  let error: string | null = null;
  let targets: Target[] = [];
  let log: { day: string; targetId: string; note: string | null }[] = [];
  try { [targets, log] = await Promise.all([listTargets(), recentLog()]); } catch (e) { error = (e as Error).message; }
  const now = new Date();
  const today = utcDay(now);
  const picks = pickToday(targets, log, now, PER_DAY);
  const doneIds = [...new Set(log.filter((l) => l.day === today).map((l) => l.targetId))].filter((id) => targets.some((t) => t.id === id));
  const days = log.map((l) => l.day);
  const stats = { done: doneToday(log, now), perDay: PER_DAY, streak: streak(days, now), week: weekTotal(days, now) };
  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Targets</h1><p>A short list of people we engage with every day. A useful comment on their latest post puts us in front of their audience and brings new people to our profile.</p></div>
      </div>
      {error && <div className="note"><Icon name="alert" size={18} />Database problem: {error}</div>}
      <TargetsClient targets={targets} pickIds={picks.map((t) => t.id)} doneIds={doneIds} stats={stats} nowIso={now.toISOString()} />
    </div>
  );
}
