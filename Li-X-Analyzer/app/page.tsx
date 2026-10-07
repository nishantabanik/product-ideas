import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { db, ensureSchema } from "@/lib/db";
import { coverage, dailyBuckets } from "@/lib/analytics-data";
import { listChannels, listPosts } from "@/lib/postiz";
import { resolveRange, sum, toSeries } from "@/lib/ranges";
import { platformOf, stripHtml } from "@/lib/sync";
import { engagement, type PostRow } from "@/lib/stats";
import { sumTotals, ZERO, type Totals } from "@/lib/xaccount";
import Chart from "./components/chart";
import CountUp from "./components/count-up";
import Delta from "./components/delta";
import { Icon } from "./components/icons";
import SyncButton from "./sync-button";
import { getAdvisory } from "@/lib/advisory/store";

export const dynamic = "force-dynamic";

const LI = "#3987e5", X = "#d95926", DAY = 86_400_000;
const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC";

async function upcoming() {
  try {
    const start = new Date(); start.setUTCMinutes(0, 0, 0);
    const end = new Date(start.getTime() + 14 * DAY);
    const [channels, posts] = await Promise.all([listChannels(), listPosts(start.toISOString(), end.toISOString(), 60_000)]);
    const by = new Map(channels.map((c) => [c.id, c]));
    return posts
      .filter((p) => p.state === "QUEUE" && p.publishDate && new Date(p.publishDate) > new Date())
      .map((p) => ({ id: p.id, platform: platformOf(by.get(p.integration?.id ?? "")?.identifier ?? p.integration?.providerIdentifier ?? ""), date: p.publishDate!, text: stripHtml(p.content ?? "") }))
      .filter((p) => p.platform === "x" || p.platform === "linkedin")
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return null;
  }
}

export default async function Overview() {
  if (!(await isAuthed())) redirect("/login");

  let error: string | null = null;
  try {
    await ensureSchema();
    const sql = db();
    const today = new Date().toISOString().slice(0, 10);
    const cov = await coverage("linkedin");
    const r90 = resolveRange({ range: "90d" }, today, cov);
    const r30 = resolveRange({ range: "30d" }, today, cov);

    const [b90, b30, b30p, xrows, recent, sync, soon, adv] = await Promise.all([
      dailyBuckets("linkedin", r90.from, r90.to, "week"),
      dailyBuckets("linkedin", r30.from, r30.to, "day"),
      dailyBuckets("linkedin", r30.prevFrom, r30.prevTo, "day"),
      sql<Array<Totals & { week: number }>>`select ab.week, sum(ab.impressions)::int as impressions, sum(ab.likes)::int as likes, sum(ab.comments)::int as comments,
        sum(ab.shares)::int as shares, sum(ab.bookmarks)::int as bookmarks from account_buckets ab join channels c on c.id = ab.channel_id where c.platform = 'x' group by ab.week`,
      sql<PostRow[]>`select id, platform, content, published_at, url, impressions, engagements, likes, comments, shares, clicks from posts
        where state = 'PUBLISHED' and published_at is not null order by published_at desc limit 8`,
      sql<{ at: Date | null }[]>`select greatest((select max(updated_at) from posts where source = 'postiz'), (select max(captured_at) from account_buckets)) as at`,
      upcoming(),
      getAdvisory().catch(() => null),
    ]);

    const cur = toSeries(b30, r30.from, r30.to, "day"), prev = toSeries(b30p, r30.prevFrom, r30.prevTo, "day");
    const impr = sum(cur, "impressions"), imprP = sum(prev, "impressions"), eng = sum(cur, "engagements"), engP = sum(prev, "engagements");
    const hasPrev = b30p.some((r) => r.days > 0);
    const rate = impr ? eng / impr : null, rateP = imprP ? engP / imprP : null;
    const wk = toSeries(b90, r90.from, r90.to, "week");
    const x4 = sumTotals(Array.from({ length: 4 }, (_, i) => xrows.find((a) => a.week === i + 1) ?? ZERO));
    const x4p = sumTotals(Array.from({ length: 4 }, (_, i) => xrows.find((a) => a.week === i + 5) ?? ZERO));
    const hasX = xrows.length > 0;
    const syncedAt = sync[0]?.at ? new Date(sync[0].at) : null;

    return (
      <div className="page">
        <div className="page-head">
          <div><h1>Overview</h1><p>{syncedAt ? `Postiz data last synced ${syncedAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC.` : "Press Sync to pull our posts and X numbers from Postiz."}</p></div>
          <div className="row"><SyncButton ghost /><Link href="/compose" className="btn"><Icon name="plus" size={16} />New post</Link></div>
        </div>

        <div className="stack stagger">
          <div className="grid g-4">
            <div className="card kpi hover"><div className="l"><i className="dotc" style={{ background: LI }} />LinkedIn impressions, 30 days</div>
              <div className="v"><CountUp value={impr} /></div>{cov.days ? <Delta cur={impr} prev={hasPrev ? imprP : null} /> : <span className="s">Import an export to start</span>}</div>
            <div className="card kpi hover"><div className="l"><i className="dotc" style={{ background: LI }} />LinkedIn engagement rate</div>
              <div className="v"><CountUp value={rate === null ? 0 : rate * 100} decimals={2} suffix="%" /></div>{cov.days ? <Delta cur={rate} prev={hasPrev ? rateP : null} pts /> : null}</div>
            <div className="card kpi hover"><div className="l"><i className="dotc" style={{ background: X }} />X impressions, 4 weeks</div>
              <div className="v"><CountUp value={x4.impressions} /></div>{hasX ? <Delta cur={x4.impressions} prev={x4p.impressions || null} /> : <span className="s">Sync to load</span>}</div>
            <div className="card kpi hover"><div className="l"><Icon name="clock" size={14} />Scheduled, next 14 days</div>
              <div className="v"><CountUp value={soon?.length ?? 0} /></div><span className="s">{soon === null ? "Postiz not reachable" : "posts waiting to go out"}</span></div>
          </div>

          <div className="card hover" style={{ background: "linear-gradient(135deg, rgba(57,135,229,.12), transparent 55%), var(--surface)" }}>
            <div className="card-h">
              <div className="row"><Icon name="bulb" size={18} /><div><h2>Today&apos;s advisory</h2><p>{adv ? adv.advisory.headline : "A daily review of every post, with what to fix and what to do more of."}</p></div></div>
              <Link href="/advisory" className="btn ghost sm">Open advisory<Icon name="right" size={15} /></Link>
            </div>
            {adv ? (
              <div className="grid g-3">
                {adv.advisory.focus.map((x, i) => (
                  <div key={i} className="focus-item" style={{ borderBottom: 0, padding: 0 }}>
                    <span className="focus-n">{i + 1}</span>
                    <div><b>{x.title}</b><p>{x.action}</p></div>
                  </div>
                ))}
                {adv.advisory.focus.length === 0 && <p className="hint" style={{ margin: 0 }}>Nothing urgent today. Keep the rhythm.</p>}
              </div>
            ) : <p className="hint" style={{ margin: 0 }}>Nothing reviewed yet. <Link href="/advisory">Open the advisory</Link> to run the first review.</p>}
          </div>

          <div className="grid g-main">
            <div className="card">
              <div className="card-h"><div><h2>LinkedIn, last 90 days</h2><p>Impressions per week</p></div><Link href="/analytics" className="btn ghost sm">Open analytics<Icon name="right" size={15} /></Link></div>
              {cov.days ? <Chart series={[{ id: "i", name: "Impressions", color: LI, area: true, points: wk.map((p) => ({ t: p.t, y: p.impressions, partial: p.partial })) }]} unit="week" height={300} ariaLabel="LinkedIn impressions per week" />
                : <div className="hint" style={{ padding: "60px 0", textAlign: "center" }}>No LinkedIn data yet. <Link href="/import">Import our export</Link>.</div>}
              {cov.days > 0 && (
                <div className="grid g-3" style={{ marginTop: 16 }}>
                  <div><div className="hint">Total, 90 days</div><div style={{ fontSize: 20, fontWeight: 700 }} className="num">{sum(wk, "impressions").toLocaleString("en-US")}</div></div>
                  <div><div className="hint">Average per day</div><div style={{ fontSize: 20, fontWeight: 700 }} className="num">{Math.round(sum(wk, "impressions") / Math.max(1, b90.reduce((a, r) => a + r.days, 0))).toLocaleString("en-US")}</div></div>
                  <div><div className="hint">Best week</div><div style={{ fontSize: 20, fontWeight: 700 }} className="num">{Math.max(0, ...wk.map((p) => p.impressions ?? 0)).toLocaleString("en-US")}</div></div>
                </div>
              )}
            </div>
            <div className="card">
              <div className="card-h"><div><h2>Coming up</h2><p>Scheduled in Postiz</p></div><Link href="/calendar" className="btn ghost sm">Calendar<Icon name="right" size={15} /></Link></div>
              {soon === null && <p className="hint">Could not load scheduled posts right now.</p>}
              {soon && soon.length === 0 && <p className="hint">Nothing scheduled for the next two weeks. <Link href="/compose">Write a post</Link> or <Link href="/bulk">upload a file</Link>.</p>}
              <div className="daylist">
                {soon?.slice(0, 5).map((p) => (
                  <div key={p.id} className={`item ${p.platform}`}>
                    <div className="meta"><span className={`badge ${p.platform === "x" ? "x" : "li"}`}>{p.platform === "x" ? "X" : "LinkedIn"}</span><span>{when(p.date)}</span></div>
                    <p style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-h"><div><h2>Recent posts</h2><p>Latest published, from Postiz and imports</p></div></div>
            {recent.length === 0 ? <p className="hint">No published posts stored yet.</p> : (
              <div className="scroll-x"><table className="table">
                <thead><tr><th>Post</th><th>Where</th><th>Date</th><th className="r">Impressions</th><th className="r">Engagements</th></tr></thead>
                <tbody>{recent.map((p) => (
                  <tr key={p.id}>
                    <td><span className="clip">{p.content || "Post"} {p.url && <a href={p.url} target="_blank" rel="noreferrer" aria-label="Open post"><Icon name="external" size={13} /></a>}</span></td>
                    <td><span className={`badge ${p.platform === "x" ? "x" : "li"}`}>{p.platform === "x" ? "X" : "LinkedIn"}</span></td>
                    <td style={{ whiteSpace: "nowrap", color: "var(--ink-2)" }}>{p.published_at ? new Date(p.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : ""}</td>
                    <td className="r">{p.impressions === null ? "n/a" : p.impressions.toLocaleString("en-US")}</td>
                    <td className="r">{p.impressions === null && p.engagements == null ? "n/a" : engagement(p).toLocaleString("en-US")}</td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <div className="page">
      <div className="page-head"><div><h1>Overview</h1></div></div>
      <div className="note"><Icon name="alert" size={18} />Database problem: {error}</div>
    </div>
  );
}
