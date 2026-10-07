import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { pillarStats } from "@/lib/studio/pillars";
import { listPillars, postFacts } from "@/lib/studio/store";
import { Icon } from "../../components/icons";
import StudioTabs from "../tabs";
import PillarsClient from "./client";

export const dynamic = "force-dynamic";
const n = (v: number | null) => (v == null ? "n/a" : Math.round(v).toLocaleString("en-US"));

export default async function PillarsPage() {
  if (!(await isAuthed())) redirect("/login");
  let error: string | null = null;
  const [pillars, posts] = await Promise.all([listPillars(), postFacts()]).catch((e) => { error = (e as Error).message; return [[], []] as unknown as [Awaited<ReturnType<typeof listPillars>>, Awaited<ReturnType<typeof postFacts>>]; });
  const stats = (["linkedin", "x"] as const).map((p) => ({ platform: p, rows: pillarStats(posts.filter((x) => x.platform === p), pillars) })).filter((s) => s.rows.some((r) => r.posts));
  return (
    <div className="page">
      <div className="page-head"><div><h1>Pillars</h1><p>The three to five topics we post about. Every post is tagged by its keywords, so we can see which topics earn attention.</p></div><StudioTabs active="pillars" /></div>
      {error && <div className="note"><Icon name="alert" size={18} />Database problem: {error}</div>}
      <div className="stack">
        <PillarsClient initial={pillars.map((p) => ({ id: p.id, name: p.name, keywords: p.keywords.join(", ") }))} />
        {pillars.length === 0 && <div className="card"><p className="hint" style={{ margin: 0 }}>Add a pillar with a few keywords and we tag every past post and show which topics work.</p></div>}
        {pillars.length > 0 && stats.map((s) => (
          <div className="card" key={s.platform}>
            <h3 style={{ marginTop: 0 }}>{s.platform === "x" ? "X" : "LinkedIn"} by pillar</h3>
            <div className="scroll-x"><table className="table"><thead><tr><th>Pillar</th><th>Posts</th><th>Median impressions</th><th>Median engagement rate</th><th>Likes</th><th>Comments</th><th>Verdict</th></tr></thead>
              <tbody>{s.rows.map((r) => <tr key={r.name}><td>{r.name}</td><td>{r.posts}</td><td>{n(r.medianImpressions)}</td><td>{r.medianRate == null ? "n/a" : `${r.medianRate.toFixed(1)}%`}</td><td>{n(r.likes)}</td><td>{n(r.comments)}</td><td>{r.verdict}</td></tr>)}</tbody></table></div>
            <p className="hint">Strong means at least a quarter above our typical post, weak at least a quarter below. With fewer than three posts we say so instead of guessing.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
