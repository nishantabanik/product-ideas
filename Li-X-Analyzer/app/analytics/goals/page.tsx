import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { MAX_GOALS } from "@/lib/insights/goals";
import { loadGoalDetails, type GoalDetail } from "@/lib/insights/goals-load";
import { Icon } from "../../components/icons";
import AnalyticsTabs from "../tabs";
import DeleteGoal from "./delete-goal";
import GoalForm from "./goal-form";
import "./goals.css";

export const dynamic = "force-dynamic";

const num = (n: number) => Math.round(n).toLocaleString("en-US");
const STATUS: Record<GoalDetail["status"], string> = { achieved: "Achieved", on_track: "On track", behind: "Behind", no_data: "No data" };

export default async function Goals() {
  if (!(await isAuthed())) redirect("/login");
  let goals: GoalDetail[] = [];
  let dbError: string | null = null;
  try {
    goals = await loadGoalDetails();
  } catch (e) {
    dbError = (e as Error).message;
  }
  const usesX = goals.some((g) => g.platform !== "linkedin" && g.metric !== "posts");

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Goals</h1>
          <p>Targets for the current week (Monday to Sunday) or calendar month, in UTC, and whether our pace gets us there.</p>
        </div>
        <AnalyticsTabs active="goals" />
      </div>

      {dbError && <div className="note"><Icon name="alert" size={18} />Database problem: {dbError}</div>}

      <GoalForm full={goals.length >= MAX_GOALS} />

      {usesX && (
        <div className="note info"><Icon name="info" size={18} /><span>X numbers are weekly. We spread each week&apos;s total evenly over its 7 days, and the weeks run back from the moment we last loaded X, so X progress is an estimate and trails by a few days.</span></div>
      )}

      {!dbError && goals.length === 0 && <div className="card" style={{ textAlign: "center", padding: 36 }}><h2>No goals yet</h2><p className="hint" style={{ margin: "8px 0 0" }}>Add one above, for example 100,000 impressions a month on LinkedIn.</p></div>}

      <div className="goals-list stagger">
        {goals.map((g) => <GoalCard key={g.id} g={g} />)}
      </div>
    </div>
  );
}

function GoalCard({ g }: { g: GoalDetail }) {
  const p = g.progress;
  const share = Math.min(100, (g.current / g.target) * 100);
  const word = g.metric === "posts" ? "posts" : g.metric;
  return (
    <div className="card">
      <div className="goals-top">
        <div><h2 style={{ margin: 0 }}>{g.label}</h2><p className="hint" style={{ margin: "4px 0 0" }}>{p.periodStart} to {p.periodEnd}, {p.remainingDays} day{p.remainingDays === 1 ? "" : "s"} left</p></div>
        <div className="row"><span className={`chip tiny goals-chip ${g.status}`}>{STATUS[g.status]}</span><DeleteGoal id={g.id} /></div>
      </div>
      <div style={{ margin: "14px 0 6px" }}><div className="progress" role="progressbar" aria-valuenow={Math.round(share)} aria-valuemin={0} aria-valuemax={100}><div style={{ width: `${share}%` }} /></div></div>
      <div className="hint">{num(g.current)} of {num(g.target)} {word} ({Math.round((g.current / g.target) * 100)}%)</div>
      <div className="goals-nums">
        <div><b>{g.projected === null ? "n/a" : num(g.projected)}</b><span>projected at the end</span></div>
        <div><b>{g.requiredPerDay === null ? "n/a" : num(Math.max(0, g.requiredPerDay))}</b><span>needed per day</span></div>
        <div><b>{p.elapsedDays} of {p.totalDays}</b><span>days in</span></div>
      </div>
      <p className="hint" style={{ margin: "12px 0 0" }}>{p.explanation}</p>
    </div>
  );
}
