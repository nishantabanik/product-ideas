import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { db, ensureSchema } from "@/lib/db";
import { bestDay, coverage, dailyBuckets, postTotals, topPosts } from "@/lib/analytics-data";
import { has, resolveRange, sum, toSeries, type Metric as SeriesMetric } from "@/lib/ranges";
import { engagement } from "@/lib/stats";
import { sumTotals, ZERO, type Totals } from "@/lib/xaccount";
import CountUp from "../components/count-up";
import Delta from "../components/delta";
import { Icon } from "../components/icons";
import SyncButton from "../sync-button";
import HeroChart, { type HeroMetric } from "./hero-chart";
import RangeBar from "./range-bar";
import AnalyticsTabs from "./tabs";
import TopPosts, { type PostRow } from "./top-posts";

export const dynamic = "force-dynamic";

const LI = "#3987e5", X = "#d95926";
const DAY = 86_400_000;
const nice = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

type Q = { p?: string; range?: string; from?: string; to?: string; g?: string; n?: string; u?: string };

export default async function Analytics({ searchParams }: { searchParams: Promise<Q> }) {
  if (!(await isAuthed())) redirect("/login");
  const q = await searchParams;
  const scope = q.p === "x" || q.p === "linkedin" ? q.p : "both";
  const today = new Date().toISOString().slice(0, 10);

  let dbError: string | null = null;
  let li: Awaited<ReturnType<typeof loadLinkedin>> | null = null;
  let xs: Awaited<ReturnType<typeof loadX>> | null = null;
  let cov = { min: null as string | null, max: null as string | null, days: 0 };
  try {
    cov = await coverage("linkedin");
  } catch (e) {
    dbError = (e as Error).message;
  }
  const range = resolveRange(q, today, scope === "x" ? { min: null, max: null } : cov);

  if (!dbError) {
    try {
      [li, xs] = await Promise.all([
        scope !== "x" ? loadLinkedin(range, cov) : null,
        scope !== "linkedin" ? loadX(range) : null,
      ]);
    } catch (e) {
      dbError = (e as Error).message;
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Analytics</h1>
          <p>{nice(range.from)} to {nice(range.to)}, {range.days.toLocaleString("en-US")} days{cov.max && scope !== "x" && range.preset !== "custom" ? `. Presets end at our latest data day, ${nice(cov.max)}.` : "."}</p>
        </div>
      </div>

      <RangeBar q={q as Record<string, string | undefined>} scope={scope} preset={range.preset} unit={range.unit}
        autoUnit={range.unit} from={range.from} to={range.to} dataMin={cov.min} dataMax={today} />

      {dbError && <div className="note"><Icon name="alert" size={18} />Database problem: {dbError}</div>}

      <div className="stack stagger">
        {li && xs && <SideBySide li={li} xs={xs} range={range} />}
        {li && <LinkedinSection li={li} range={range} cov={cov} />}
        {xs && <XSection xs={xs} range={range} />}
      </div>
    </div>
  );
}

/* ---------- LinkedIn ---------- */

async function loadLinkedin(range: ReturnType<typeof resolveRange>, cov: { min: string | null; max: string | null; days: number }) {
  const [cur, prev, posts, best, totals] = await Promise.all([
    dailyBuckets("linkedin", range.from, range.to, range.unit),
    dailyBuckets("linkedin", range.prevFrom, range.prevTo, range.unit),
    topPosts("linkedin", range.from, range.to),
    bestDay("linkedin", range.from, range.to),
    postTotals("linkedin"),
  ]);
  return { cur, prev, posts, best, totals, cov };
}

function LinkedinSection({ li, range, cov }: { li: Awaited<ReturnType<typeof loadLinkedin>>; range: ReturnType<typeof resolveRange>; cov: { min: string | null; max: string | null; days: number } }) {
  if (!cov.days && !li.totals.posts) {
    return (
      <div className="card" style={{ textAlign: "center", padding: 44 }}>
        <h2>No LinkedIn data yet</h2>
        <p className="hint" style={{ maxWidth: 52 + "ch", margin: "8px auto 18px" }}>Export our post analytics from LinkedIn and upload the file. Each export holds the daily impressions, so one file already fills the whole range it covers.</p>
        <Link href="/import" className="btn"><Icon name="upload" size={16} />Import LinkedIn data</Link>
      </div>
    );
  }
  const curPts = toSeries(li.cur, range.from, range.to, range.unit);
  const prevPts = toSeries(li.prev, range.prevFrom, range.prevTo, range.unit);
  const impr = sum(curPts, "impressions"), eng = sum(curPts, "engagements");
  const imprP = sum(prevPts, "impressions"), engP = sum(prevPts, "engagements");
  const hasPrev = li.prev.some((r) => r.days > 0);
  const daysWithData = li.cur.reduce((a, r) => a + r.days, 0);
  const rate = impr ? eng / impr : null, rateP = imprP ? engP / imprP : null;

  const mk = (id: SeriesMetric, label: string, total: number, prevTotal: number): HeroMetric => ({
    id, label, color: LI, total, prevTotal: hasPrev ? prevTotal : null,
    cur: curPts.map((p) => ({ t: p.t, y: p[id], partial: p.partial })),
    prev: hasPrev ? prevPts.map((p) => ({ t: p.t, y: p[id], partial: p.partial })) : undefined,
  });
  const extra = ([["likes", "Likes and reactions"], ["comments", "Comments"], ["shares", "Reposts"]] as const).filter(([k]) => has(curPts, k));
  const metrics: HeroMetric[] = [
    mk("impressions", "Impressions", impr, imprP),
    mk("engagements", "Engagements", eng, engP),
    ...extra.map(([k, label]) => mk(k, label, sum(curPts, k), sum(prevPts, k))),
  ];
  const toRow = (p: (typeof li.posts)[number]): PostRow => ({
    id: p.id, content: p.content, url: p.url, date: p.published_at ? new Date(p.published_at).toISOString() : null,
    impressions: p.impressions, likes: p.likes, comments: p.comments, shares: p.shares,
    engagements: p.impressions !== null || p.engagements !== null ? engagement(p as never) : null,
  });
  const rows: PostRow[] = li.posts.map(toRow);
  const missing = range.days - daysWithData;

  return (
    <>
      <div className="section-t"><span className="dotc" style={{ background: LI }} />LinkedIn</div>
      <HeroChart title="Impressions and engagements" metrics={metrics} unit={range.unit} shiftMs={range.days * DAY}
        sub={`per ${range.unit}, ${range.days.toLocaleString("en-US")} days`} />
      <div className="grid g-4 stagger">
        <div className="card kpi hover"><div className="l"><i className="dotc" style={{ background: LI }} />Engagements</div><div className="v"><CountUp value={eng} /></div><Delta cur={eng} prev={hasPrev ? engP : null} /></div>
        <div className="card kpi hover"><div className="l"><i className="dotc" style={{ background: LI }} />Engagement rate</div><div className="v"><CountUp value={rate === null ? 0 : rate * 100} decimals={2} suffix="%" /></div><Delta cur={rate} prev={hasPrev ? rateP : null} pts /></div>
        <div className="card kpi hover"><div className="l"><i className="dotc" style={{ background: LI }} />Average per day</div><div className="v"><CountUp value={daysWithData ? impr / daysWithData : 0} /></div><div className="s">impressions, over {daysWithData.toLocaleString("en-US")} days with data</div></div>
        <div className="card kpi hover"><div className="l"><i className="dotc" style={{ background: LI }} />Best day</div><div className="v"><CountUp value={li.best?.impressions ?? 0} /></div><div className="s">{li.best ? nice(li.best.day) : "no data in this range"}</div></div>
      </div>

      {extra.length > 0 ? (
        <div className="grid g-3 stagger">
          {extra.map(([k, label]) => (
            <div key={k} className="card kpi hover"><div className="l"><i className="dotc" style={{ background: LI }} />{label}</div>
              <div className="v"><CountUp value={sum(curPts, k)} /></div><Delta cur={sum(curPts, k)} prev={hasPrev ? sum(prevPts, k) : null} />
              <div className="s">{impr ? `${((sum(curPts, k) / impr) * 1000).toFixed(1)} per 1,000 impressions` : ""}</div></div>
          ))}
        </div>
      ) : (
        <div className="note info"><Icon name="info" size={18} /><span>LinkedIn&apos;s personal export has impressions and engagements per day, but not likes or comments. They show up here when an export includes them (Company Page exports do), and the Comments tab keeps the comments we capture on each post.</span></div>
      )}

      <div className="card">
        <div className="card-h"><div><h2>Posts</h2><p>Ranked by impressions. LinkedIn exports list the top 50 posts of the period they cover.</p></div></div>
        <TopPosts rows={rows} empty="No posts with numbers in this range. Posts appear when an export lists them." accent={LI} />
      </div>

      <div className="card">
        <div className="card-h"><div><h2>Data coverage</h2><p>What we hold and what this view uses.</p></div><Link href="/import" className="btn ghost sm"><Icon name="upload" size={15} />Import more</Link></div>
        <div className="pills">
          <span className="badge">{cov.days.toLocaleString("en-US")} days stored</span>
          {cov.min && cov.max && <span className="badge">{nice(cov.min)} to {nice(cov.max)}</span>}
          <span className="badge">{li.totals.posts.toLocaleString("en-US")} posts stored</span>
          <span className="badge">{daysWithData.toLocaleString("en-US")} of {range.days.toLocaleString("en-US")} days in this view have data</span>
        </div>
        {missing > 0 && daysWithData > 0 && <p className="hint" style={{ margin: "12px 0 0" }}>{missing.toLocaleString("en-US")} days in this range have no numbers yet. They stay empty (not zero) in the chart. Upload an export that covers them to fill the gaps.</p>}
      </div>
    </>
  );
}

/* ---------- X ---------- */

async function loadX(range: ReturnType<typeof resolveRange>) {
  await ensureSchema();
  const sql = db();
  const [acct, posts] = await Promise.all([
    sql<Array<Totals & { week: number; captured: Date }>>`
      select ab.week, sum(ab.impressions)::int as impressions, sum(ab.likes)::int as likes, sum(ab.comments)::int as comments,
             sum(ab.shares)::int as shares, sum(ab.bookmarks)::int as bookmarks, max(ab.captured_at) as captured
      from account_buckets ab join channels c on c.id = ab.channel_id where c.platform = 'x' group by ab.week order by ab.week`,
    topPosts("x", range.from, range.to),
  ]);
  return { acct, posts };
}

function XSection({ xs, range }: { xs: Awaited<ReturnType<typeof loadX>>; range: ReturnType<typeof resolveRange> }) {
  const weeks = 12;
  const n = Math.min(weeks, Math.max(1, Math.round(range.days / 7)));
  const by = (w: number): Totals => xs.acct.find((a) => a.week === w) ?? ZERO;
  const span = (a: number, b: number) => sumTotals(Array.from({ length: b - a + 1 }, (_, i) => by(a + i)));
  const captured = xs.acct[0]?.captured ? new Date(xs.acct[0].captured) : null;
  const cur = span(1, n);
  const prev = n * 2 <= weeks ? span(n + 1, n * 2) : null;
  const t0 = (captured ?? new Date()).getTime();
  const pts = (k: keyof Totals) => Array.from({ length: weeks }, (_, i) => ({ t: t0 - (weeks - i) * 7 * DAY, y: by(weeks - i)[k] }));
  const mk = (id: keyof Totals, label: string): HeroMetric => ({ id, label, color: X, cur: pts(id), total: cur[id], prevTotal: prev ? prev[id] : null });
  const rate = cur.impressions ? (cur.likes + cur.comments + cur.shares) / cur.impressions : null;
  const rateP = prev && prev.impressions ? (prev.likes + prev.comments + prev.shares) / prev.impressions : null;
  const rows: PostRow[] = xs.posts.map((p) => ({ id: p.id, content: p.content, url: p.url, date: p.published_at ? new Date(p.published_at).toISOString() : null, impressions: p.impressions, likes: p.likes, comments: p.comments, shares: p.shares, engagements: p.impressions !== null || p.engagements !== null ? engagement(p as never) : null }));

  return (
    <>
      <div className="section-t"><span className="dotc" style={{ background: X }} />X</div>
      {xs.acct.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <h2>No X numbers loaded yet</h2>
          <p className="hint" style={{ margin: "8px 0 18px" }}>We read the totals for every original post on the account, including ones not made through Postiz.</p>
          <SyncButton label="Load X numbers from Postiz" />
        </div>
      ) : (
        <>
          <HeroChart title="X account, all original posts" metrics={[mk("impressions", "Impressions"), mk("likes", "Likes"), mk("comments", "Replies"), mk("shares", "Reposts and quotes"), mk("bookmarks", "Bookmarks")]}
            unit="week" shiftMs={0} sub={`last ${n} week${n === 1 ? "" : "s"}${range.days > 84 ? ". X history from Postiz covers 12 weeks" : ""}`}
            foot={<div className="row" style={{ marginTop: 14 }}>
              <span className="hint">{captured ? `Updated ${captured.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC. ` : ""}Includes posts not made through Postiz. Replies and retweets are not counted.</span>
              <span className="grow"><SyncButton label="Refresh X numbers" ghost /></span>
            </div>} />
          <div className="grid g-4">
            <div className="card kpi hover"><div className="l"><i className="dotc" style={{ background: X }} />Engagement rate</div><div className="v"><CountUp value={rate === null ? 0 : rate * 100} decimals={2} suffix="%" /></div><Delta cur={rate} prev={rateP} pts /></div>
            <div className="card kpi hover"><div className="l"><i className="dotc" style={{ background: X }} />Likes</div><div className="v"><CountUp value={cur.likes} /></div><Delta cur={cur.likes} prev={prev ? prev.likes : null} /></div>
            <div className="card kpi hover"><div className="l"><i className="dotc" style={{ background: X }} />Replies</div><div className="v"><CountUp value={cur.comments} /></div><Delta cur={cur.comments} prev={prev ? prev.comments : null} /></div>
            <div className="card kpi hover"><div className="l"><i className="dotc" style={{ background: X }} />Reposts and quotes</div><div className="v"><CountUp value={cur.shares} /></div><Delta cur={cur.shares} prev={prev ? prev.shares : null} /></div>
          </div>
        </>
      )}
      {rows.length > 0 && (
        <div className="card">
          <div className="card-h"><div><h2>X posts we track</h2><p>Posts made through Postiz plus any imported from X. Sorted by impressions.</p></div></div>
          <TopPosts rows={rows} empty="" accent={X} />
        </div>
      )}
    </>
  );
}


/* ---------- LinkedIn and X together ---------- */

function SideBySide({ li, xs, range }: { li: Awaited<ReturnType<typeof loadLinkedin>>; xs: Awaited<ReturnType<typeof loadX>>; range: ReturnType<typeof resolveRange> }) {
  const cur = toSeries(li.cur, range.from, range.to, range.unit);
  const prev = toSeries(li.prev, range.prevFrom, range.prevTo, range.unit);
  const hasPrev = li.prev.some((r) => r.days > 0);
  const weeks = 12;
  const n = Math.min(weeks, Math.max(1, Math.round(range.days / 7)));
  const by = (w: number): Totals => xs.acct.find((a) => a.week === w) ?? ZERO;
  const span = (a: number, b: number) => sumTotals(Array.from({ length: b - a + 1 }, (_, i) => by(a + i)));
  const xNow = span(1, n);
  const xPrev = n * 2 <= weeks && xs.acct.length ? span(n + 1, n * 2) : null;
  if (!xs.acct.length && !li.cur.length) return null;

  const L = (k: SeriesMetric) => (has(cur, k) ? sum(cur, k) : null);
  const Lp = (k: SeriesMetric) => (hasPrev && has(prev, k) ? sum(prev, k) : null);
  const xEng = (t: Totals) => t.likes + t.comments + t.shares;
  const rate = (e: number | null, i: number | null) => (e !== null && i ? e / i : null);

  type Row = { label: string; li: number | null; liPrev: number | null; x: number | null; xPrev: number | null; pct?: boolean; note?: string };
  const rows: Row[] = [
    { label: "Impressions", li: L("impressions"), liPrev: Lp("impressions"), x: xs.acct.length ? xNow.impressions : null, xPrev: xPrev ? xPrev.impressions : null },
    { label: "Engagements", li: L("engagements"), liPrev: Lp("engagements"), x: xs.acct.length ? xEng(xNow) : null, xPrev: xPrev ? xEng(xPrev) : null, note: "X: likes, replies and reposts" },
    { label: "Engagement rate", li: rate(L("engagements"), L("impressions")), liPrev: rate(Lp("engagements"), Lp("impressions")), x: xs.acct.length ? rate(xEng(xNow), xNow.impressions) : null, xPrev: xPrev ? rate(xEng(xPrev), xPrev.impressions) : null, pct: true },
    { label: "Likes", li: L("likes"), liPrev: Lp("likes"), x: xs.acct.length ? xNow.likes : null, xPrev: xPrev ? xPrev.likes : null },
    { label: "Comments and replies", li: L("comments"), liPrev: Lp("comments"), x: xs.acct.length ? xNow.comments : null, xPrev: xPrev ? xPrev.comments : null },
    { label: "Reposts", li: L("shares"), liPrev: Lp("shares"), x: xs.acct.length ? xNow.shares : null, xPrev: xPrev ? xPrev.shares : null },
  ];
  const cell = (v: number | null, p: number | null, pct?: boolean) => (
    <>
      <td className="r"><b className="num">{v === null ? "n/a" : pct ? `${(v * 100).toFixed(2)}%` : Math.round(v).toLocaleString("en-US")}</b></td>
      <td><Delta cur={v} prev={p} pts={pct} /></td>
    </>
  );
  return (
    <div className="card">
      <div className="card-h"><div><h2>LinkedIn and X side by side</h2><p>LinkedIn for the {range.days} days chosen, X for the matching {n} week{n === 1 ? "" : "s"} (X history from Postiz covers 12 weeks).</p></div></div>
      <div className="scroll-x">
        <table className="table">
          <thead><tr><th>Metric</th><th className="r"><span className="badge li">LinkedIn</span></th><th>Change</th><th className="r"><span className="badge x">X</span></th><th>Change</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <td>{r.label}{r.note && <span className="hint" style={{ marginLeft: 8 }}>{r.note}</span>}</td>
                {cell(r.li, r.liPrev, r.pct)}
                {cell(r.x, r.xPrev, r.pct)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
