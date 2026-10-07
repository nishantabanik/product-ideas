"use client";
import { useMemo, useState } from "react";
import Seg from "../components/seg";
import { Icon } from "../components/icons";
import type { Finding, Group } from "@/lib/advisory/types";

const GROUPS: { key: Group; title: string; hint: string }[] = [
  { key: "holding_back", title: "What is holding us back", hint: "Measured problems, biggest first" },
  { key: "missing", title: "What is missing", hint: "Gaps in our routine and our data" },
  { key: "stop", title: "Stop doing", hint: "Habits that are costing us reach or engagement" },
  { key: "experiment", title: "Worth testing", hint: "Hypotheses to try for two weeks" },
  { key: "working", title: "What is working, do more of it", hint: "Patterns in our own results" },
];
const SEV = { high: "High impact", medium: "Medium impact", low: "Small impact" } as const;
const METRIC: Record<string, string> = { reach: "Reach", engagement: "Engagement", replies: "Replies", likes: "Likes", consistency: "Consistency", data: "Data" };

export default function Findings({ findings }: { findings: Finding[] }) {
  const [scope, setScope] = useState<"all" | "linkedin" | "x">("all");
  const shown = useMemo(() => findings.filter((f) => scope === "all" || f.platform === scope || f.platform === "both"), [findings, scope]);

  return (
    <div>
      <div className="toolbar">
        <Seg small label="Platform" value={scope} onChange={(v) => setScope(v as typeof scope)} options={[{ value: "all", label: "Both" }, { value: "linkedin", label: "LinkedIn" }, { value: "x", label: "X" }]} />
        <span className="hint grow">{shown.length} finding{shown.length === 1 ? "" : "s"}</span>
      </div>
      {GROUPS.map((g) => {
        const list = shown.filter((f) => f.group === g.key);
        if (!list.length) return null;
        return (
          <section key={g.key} className="gsec">
            <h3>{g.title}<span className="count-pill">{list.length}</span><span className="hint" style={{ fontWeight: 500 }}>{g.hint}</span></h3>
            <div className="grid g-2">
              {list.map((f, i) => (
                <article key={f.id} className={`finding ${f.severity}`} style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                  <div className="row" style={{ gap: 8 }}>
                    <span className={`sev ${f.severity}`}><i />{SEV[f.severity]}</span>
                    {f.platform !== "both" ? <span className={`badge ${f.platform === "x" ? "x" : "li"}`}>{f.platform === "x" ? "X" : "LinkedIn"}</span> : <span className="badge">Both</span>}
                    <span className="badge">{METRIC[f.metric]}</span>
                    {f.basis === "playbook" && <span className="badge">Playbook</span>}
                  </div>
                  <h4>{f.title}</h4>
                  <p className="why">{f.why}</p>
                  <div className="do"><Icon name="target" size={16} /><span>{f.action}</span></div>
                  {f.evidence.length > 0 && (
                    <details><summary>Evidence</summary><ul>{f.evidence.map((e) => <li key={e}>{e}</li>)}</ul></details>
                  )}
                </article>
              ))}
            </div>
          </section>
        );
      })}
      {shown.length === 0 && <div className="card empty hint" style={{ textAlign: "center", padding: 32 }}>Nothing to flag here yet. More data makes the review sharper.</div>}
    </div>
  );
}
