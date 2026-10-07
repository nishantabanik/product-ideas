import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { listPillars, postFacts } from "@/lib/studio/store";
import { breakdown, MIN_GROUP, MIN_OVERALL, type Breakdown, type Dimension } from "@/lib/insights/breakdown";
import { Icon } from "../../components/icons";
import Seg from "../../components/seg";
import AnalyticsTabs from "../tabs";
import "./content.css";

export const dynamic = "force-dynamic";

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

export default async function Content({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  if (!(await isAuthed())) redirect("/login");
  const q = await searchParams;
  const platform = q.p === "x" ? "x" : "linkedin";

  let dbError: string | null = null;
  let b: Breakdown | null = null;
  try {
    const [facts, pillars] = await Promise.all([postFacts(), listPillars()]);
    b = breakdown(facts, pillars, platform);
  } catch (e) {
    dbError = (e as Error).message;
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Content</h1>
          <p>Which topics, formats, lengths and hooks bring us more impressions than a typical post.</p>
        </div>
        <AnalyticsTabs active="content" />
      </div>

      <div className="row">
        <Seg label="Platform" value={platform} options={[
          { value: "linkedin", label: "LinkedIn", href: "/analytics/content?p=linkedin" },
          { value: "x", label: "X", href: "/analytics/content?p=x" },
        ]} />
      </div>

      {dbError && <div className="note"><Icon name="alert" size={18} />Database problem: {dbError}</div>}

      {b && <Body b={b} />}
    </div>
  );
}

function Body({ b }: { b: Breakdown }) {
  const name = b.platform === "x" ? "X" : "LinkedIn";
  if (b.total > 0 && b.usable === 0 && b.withoutText === b.total) {
    return (
      <div className="note info"><Icon name="info" size={18} /><span>None of our {fmt(b.total)} {name} posts have text stored. {b.platform === "linkedin" ? "LinkedIn exports hold numbers but no post text. " : ""}Posts made through Postiz or the Studio carry their text, so this page fills up as we publish that way.</span></div>
    );
  }
  if (b.total === 0) {
    return <div className="note info"><Icon name="info" size={18} /><span>We have no published {name} posts yet. Posts made through Postiz or the Studio carry their text and numbers, and they show up here.</span></div>;
  }
  return (
    <>
      <div className="card">
        <div className="card-h"><div><h2>What stands out</h2><p>Built only from groups with at least {MIN_GROUP} posts, and only when we have {MIN_OVERALL} or more posts.</p></div></div>
        {b.standouts.length > 0 ? (
          <ul className="stack" style={{ margin: 0, paddingLeft: 18 }}>{b.standouts.map((s) => <li key={s}>{s}</li>)}</ul>
        ) : (
          <p className="hint" style={{ margin: 0 }}>{b.enough ? "No group is clearly above or below the rest with this many posts. Nothing stands out yet." : `We need at least ${MIN_OVERALL} posts with text and impressions to say anything. We have ${b.usable}.`}</p>
        )}
        <p className="hint" style={{ margin: "12px 0 0" }}>
          This rests on {fmt(b.usable)} {name} post{b.usable === 1 ? "" : "s"} with text and impressions. Typical post: {fmt(b.overallMedian)} impressions{b.overallRate !== null ? `, ${(b.overallRate * 100).toFixed(2)}% engagement rate` : ""}.
          {b.withoutText > 0 ? ` ${fmt(b.withoutText)} post${b.withoutText === 1 ? " has" : "s have"} no text and ${b.withoutText === 1 ? "is" : "are"} left out.` : ""}
          {b.withoutImpressions > 0 ? ` ${fmt(b.withoutImpressions)} ha${b.withoutImpressions === 1 ? "s" : "ve"} no impressions yet.` : ""}
          {" "}We do not store whether a post has an image, so images are not part of this.
        </p>
      </div>

      <div className="grid g-2">
        {b.dimensions.map((d) => <DimensionCard key={d.id} d={d} platform={b.platform} usable={b.usable} />)}
      </div>
    </>
  );
}

function DimensionCard({ d, platform, usable }: { d: Dimension; platform: "linkedin" | "x"; usable: number }) {
  const max = Math.max(2, ...d.groups.map((g) => g.ratio ?? 0));
  const scale = Math.min(max, 3);
  return (
    <div className="card">
      <div className="card-h"><div><h2>{d.title}</h2><p>Bar = median impressions compared with a typical post. The line marks typical (1.0).</p></div></div>
      <div className="content-bars">
        {d.groups.length === 0 && <p className="hint" style={{ margin: 0 }}>No posts to group.</p>}
        {d.groups.map((g) => (
          <div key={g.key} className="content-row">
            <div className="content-name"><b>{g.label}</b>{g.detail && <span>{g.detail}</span>}</div>
            <div className="content-track" title={g.ratio !== null ? `${g.ratio.toFixed(2)} times typical` : ""}>
              <div className={`content-fill ${platform === "x" ? "x" : ""} ${g.verdict === "too few posts" ? "thin" : ""}`} style={{ width: `${Math.min(100, ((g.ratio ?? 0) / scale) * 100)}%` }} />
              <div className="content-mark" style={{ left: `${(1 / scale) * 100}%` }} />
            </div>
            <div className="content-num">
              <b>{g.ratio !== null ? `${g.ratio.toFixed(2)}x` : "n/a"}</b>
              <span className={`chip tiny content-verdict ${g.verdict === "strong" ? "strong" : g.verdict === "weak" ? "weak" : ""}`}>{g.verdict}</span>
              <small>{g.posts} post{g.posts === 1 ? "" : "s"}, median {fmt(g.medianImpressions)}{g.medianRate !== null ? `, ${(g.medianRate * 100).toFixed(1)}% eng.` : ""}</small>
            </div>
          </div>
        ))}
      </div>
      <p className="hint" style={{ margin: "14px 0 0" }}>Rests on {usable} posts.</p>
    </div>
  );
}
