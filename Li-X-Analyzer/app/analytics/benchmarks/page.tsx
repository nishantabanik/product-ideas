import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { dailyBuckets } from "@/lib/analytics-data";
import { db, ensureSchema } from "@/lib/db";
import { addDays, benchmark, headline, records, ordinal, type Bench, type Point, type Records, type Series } from "@/lib/insights/benchmarks";
import { postFacts } from "@/lib/studio/store";
import Delta from "../../components/delta";
import { Icon } from "../../components/icons";
import Seg from "../../components/seg";
import AnalyticsTabs from "../tabs";
import "./benchmarks.css";

export const dynamic = "force-dynamic";

const num = (n: number | null) => (n === null ? "n/a" : Math.round(n).toLocaleString("en-US"));
const nice = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const monthName = (m: string) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

type Block = { platform: "linkedin" | "x"; bench: Bench; rec: Records };

async function loadLinkedin(today: string): Promise<Series> {
  const rows = await dailyBuckets("linkedin", addDays(today, -1100), today, "day");
  return { unit: "day", points: rows.filter((r) => r.days > 0).map((r) => ({ day: r.start, impressions: r.impressions, engagements: r.engagements })) };
}

/** X only has weekly buckets. Week 1 is the 7 days before we captured the numbers. Engagements are likes, replies and reposts. */
async function loadX(): Promise<Series> {
  await ensureSchema();
  const rows = await db()<{ week: number; impressions: number; engagements: number; captured: Date }[]>`
    select ab.week, sum(ab.impressions)::float8 as impressions, (sum(ab.likes) + sum(ab.comments) + sum(ab.shares))::float8 as engagements, max(ab.captured_at) as captured
    from account_buckets ab join channels c on c.id = ab.channel_id where c.platform = 'x' group by ab.week order by ab.week`;
  if (!rows.length) return { unit: "week", points: [] };
  const cap = new Date(rows[0].captured).toISOString().slice(0, 10);
  const points: Point[] = rows.map((r) => ({ day: addDays(cap, -7 * r.week), impressions: r.impressions, engagements: r.engagements }));
  return { unit: "week", points };
}

export default async function Benchmarks({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  if (!(await isAuthed())) redirect("/login");
  const q = await searchParams;
  const scope = q.p === "x" || q.p === "linkedin" ? q.p : "both";
  const today = new Date().toISOString().slice(0, 10);

  let dbError: string | null = null;
  const blocks: Block[] = [];
  try {
    const facts = await postFacts(1100);
    const make = async (platform: "linkedin" | "x") => {
      const series = platform === "linkedin" ? await loadLinkedin(today) : await loadX();
      const posts = facts.filter((f) => f.platform === platform).map((f) => ({ id: f.id, impressions: f.impressions, publishedAt: f.publishedAt }));
      blocks.push({ platform, bench: benchmark(series, today), rec: records(series, posts, today) });
    };
    if (scope !== "x") await make("linkedin");
    if (scope !== "linkedin") await make("x");
  } catch (e) {
    dbError = (e as Error).message;
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Benchmarks</h1>
          <p>How our latest numbers compare with our own past: the period before, a year ago, our usual and our best.</p>
        </div>
        <AnalyticsTabs active="benchmarks" />
      </div>

      <div className="row">
        <Seg label="Platform" value={scope} options={[
          { value: "both", label: "Both", href: "/analytics/benchmarks?p=both" },
          { value: "linkedin", label: "LinkedIn", href: "/analytics/benchmarks?p=linkedin" },
          { value: "x", label: "X", href: "/analytics/benchmarks?p=x" },
        ]} />
      </div>

      {dbError && <div className="note"><Icon name="alert" size={18} />Database problem: {dbError}</div>}

      <div className="stack stagger">
        {blocks.map((b) => <Section key={b.platform} b={b} />)}
      </div>
    </div>
  );
}

function Section({ b }: { b: Block }) {
  const { bench, rec, platform } = b;
  const color = platform === "x" ? "#d95926" : "#3987e5";
  const name = platform === "x" ? "X" : "LinkedIn";
  const imp = bench.metrics.impressions, eng = bench.metrics.engagements;
  return (
    <>
      <div className="section-t"><span className="dotc" style={{ background: color }} />{name}</div>
      <div className="card">
        <p className="bench-head">{headline(bench)}</p>
        {bench.start && bench.end && <p className="bench-sub">{nice(bench.start)} to {nice(bench.end)}. {bench.dataDays.toLocaleString("en-US")} days of data held.</p>}
        {bench.notes.map((n) => <div key={n} className="note info" style={{ marginTop: 12 }}><Icon name="info" size={18} /><span>{n}</span></div>)}
      </div>

      {bench.start && (
        <div className="card">
          <div className="card-h"><div><h2>Latest {bench.windowName} against our past</h2><p>Change is the latest {bench.windowName} compared with each baseline.</p></div></div>
          <div className="scroll-x">
            <table className="table">
              <thead><tr><th>Compared with</th><th className="r">Impressions</th><th>Change</th><th className="r">Engagements</th><th>Change</th></tr></thead>
              <tbody>
                <tr><td><b>Latest {bench.windowName}</b>{imp.rank && <span className="bench-note">{ordinal(imp.rank.rank)} best of {imp.rank.of} periods of {bench.windowName}</span>}</td><td className="r"><b className="num">{num(imp.latest)}</b></td><td /><td className="r"><b className="num">{num(eng.latest)}</b></td><td /></tr>
                {imp.comparisons.map((c, i) => {
                  const e = eng.comparisons[i];
                  return (
                    <tr key={c.key}>
                      <td>{c.label}{c.note && <span className="bench-note">{c.note}</span>}</td>
                      <td className="r"><span className="num">{num(c.value)}</span></td>
                      <td>{c.value !== null ? <Delta cur={imp.latest} prev={c.value} /> : <span className="delta">not available</span>}</td>
                      <td className="r"><span className="num">{num(e.value)}</span></td>
                      <td>{e.value !== null ? <Delta cur={eng.latest} prev={e.value} /> : <span className="delta">not available</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-h"><div><h2>Records</h2><p>Our best numbers on {name}, by impressions.</p></div></div>
        <div className="bench-rec">
          <div><b>{rec.bestDay ? num(rec.bestDay.value) : "n/a"}</b><span>Best day{rec.bestDay ? `, ${nice(rec.bestDay.day)}` : ""}</span></div>
          <div><b>{rec.bestWeek ? num(rec.bestWeek.value) : "n/a"}</b><span>Best week{rec.bestWeek ? `, from ${nice(rec.bestWeek.start)}` : ""}</span></div>
          <div><b>{rec.bestMonth ? num(rec.bestMonth.value) : "n/a"}</b><span>Best month{rec.bestMonth ? `, ${monthName(rec.bestMonth.month)}` : ""}</span></div>
          <div>
            <b>{rec.bestPost ? num(rec.bestPost.impressions) : "n/a"}</b>
            <span>Best post{rec.bestPost?.publishedAt ? `, ${nice(rec.bestPost.publishedAt.slice(0, 10))}` : ""}</span>
            {rec.bestPost && <Link href={`/posts/${rec.bestPost.id}`} className="btn ghost sm" style={{ marginTop: 6 }}>Open post</Link>}
          </div>
          <div>
            <b>{rec.latestPost ? (rec.latestPost.percentile === null ? "n/a" : `${ordinal(Math.round(rec.latestPost.percentile))} percentile`) : "n/a"}</b>
            <span>{rec.latestPost ? `Latest post, ${num(rec.latestPost.impressions)} impressions` : "Latest post"}</span>
            {rec.latestPost && <Link href={`/posts/${rec.latestPost.id}`} className="btn ghost sm" style={{ marginTop: 6 }}>Open post</Link>}
          </div>
        </div>
        {rec.notes.map((n) => <p key={n} className="hint" style={{ margin: "12px 0 0" }}>{n}</p>)}
      </div>
    </>
  );
}
