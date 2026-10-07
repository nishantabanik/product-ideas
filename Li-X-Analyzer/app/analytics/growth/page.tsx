import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { addDays } from "@/lib/ranges";
import {
  analyzePlatform, basisText, bestDay, chartSeries, latestTotal, netSeries, sumNet,
  type Analysis, type FollowerDay, type RankedPost,
} from "@/lib/insights/followers";
import { loadFollowerRows, loadPostsFor, type Platform } from "@/lib/insights/followers-store";
import Chart, { type ChartSeries } from "../../components/chart";
import CountUp from "../../components/count-up";
import Delta from "../../components/delta";
import { Icon } from "../../components/icons";
import Seg from "../../components/seg";
import AnalyticsTabs from "../tabs";
import FollowerForm, { type Recent } from "./follower-form";

export const dynamic = "force-dynamic";

const COLORS: Record<Platform, string> = { linkedin: "#3987e5", x: "#d95926" };
const NAMES: Record<Platform, string> = { linkedin: "LinkedIn", x: "X" };
const nice = (day: string) => new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const signed = (n: number) => (n > 0 ? `+${n.toLocaleString("en-US")}` : n.toLocaleString("en-US"));

type PlatformData = { platform: Platform; rows: FollowerDay[]; analysis: Analysis };

export default async function Growth({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  if (!(await isAuthed())) redirect("/login");
  const q = await searchParams;
  const scope = q.p === "x" || q.p === "linkedin" ? q.p : "both";
  const platforms: Platform[] = scope === "both" ? ["linkedin", "x"] : [scope];
  const today = new Date().toISOString().slice(0, 10);

  let error: string | null = null;
  let data: PlatformData[] = [];
  try {
    data = await Promise.all(platforms.map(async (platform) => {
      const [rows, posts] = await Promise.all([loadFollowerRows(platform), loadPostsFor(platform)]);
      return { platform, rows, analysis: analyzePlatform(rows, posts) };
    }));
  } catch (e) {
    error = (e as Error).message;
  }

  const href = (p?: string) => `/analytics/growth${p ? `?p=${p}` : ""}`;
  const withData = data.filter((d) => d.rows.length > 0);
  const nets = data.map((d) => ({ ...d, net: netSeries(d.rows) }));

  // KPI numbers
  const latest = data.map((d) => ({ platform: d.platform, t: latestTotal(d.rows) })).filter((x) => x.t);
  const cur = { from: addDays(today, -29), to: today }, prev = { from: addDays(today, -59), to: addDays(today, -30) };
  const sums = (r: { from: string; to: string }) => nets.map((n) => sumNet(n.net.days, r.from, r.to));
  const curDays = sums(cur).reduce((a, s) => a + s.days, 0), prevDays = sums(prev).reduce((a, s) => a + s.days, 0);
  const curSum = sums(cur).reduce((a, s) => a + s.sum, 0), prevSum = sums(prev).reduce((a, s) => a + s.sum, 0);
  const bests = nets.map((n) => ({ platform: n.platform, b: bestDay(n.net.days) })).filter((x) => x.b).sort((a, b) => b.b!.net - a.b!.net);
  const best = bests[0];

  // chart
  const series: ChartSeries[] = [];
  let chartKind: "total" | "cumulative" = "total";
  for (const n of nets) {
    const c = chartSeries(n.rows, n.net.days);
    if (c.points.length < 2) continue;
    if (c.kind === "cumulative") chartKind = "cumulative";
    series.push({ id: n.platform, name: NAMES[n.platform], color: COLORS[n.platform], area: nets.length === 1, points: c.points.map((p) => ({ t: Date.parse(`${p.day}T00:00:00Z`), y: p.y })) });
  }

  const recent: Recent[] = withData.flatMap((d) => d.rows.slice(-8).map((r) => ({ platform: d.platform, ...r }))).sort((a, b) => (a.day < b.day ? 1 : -1)).slice(0, 10);
  const ranked: (RankedPost & { n: number })[] = data.flatMap((d) => d.analysis.ranked.map((r) => ({ ...r, n: d.analysis.noise })));
  ranked.sort((a, b) => b.excess - a.excess);
  const ready = data.filter((d) => d.analysis.enough);
  const notReady = data.filter((d) => !d.analysis.enough);

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Growth</h1><p>How many followers we gain, and which posts came just before our best days.</p></div>
        <AnalyticsTabs active="growth" />
      </div>
      {error && <div className="note"><Icon name="alert" size={18} />Database problem: {error}</div>}

      <div className="stack">
        <div className="toolbar" style={{ marginBottom: 0 }}>
          <Seg small label="Platform" value={scope} options={[
            { value: "both", label: "Both", href: href() }, { value: "linkedin", label: "LinkedIn", href: href("linkedin") }, { value: "x", label: "X", href: href("x") },
          ]} />
        </div>

        {!error && withData.length === 0 && (
          <div className="card" style={{ textAlign: "center", padding: 40 }}>
            <h2>No follower numbers yet</h2>
            <p className="hint" style={{ margin: "8px auto 0", maxWidth: "58ch" }}>We have no follower numbers for {scope === "both" ? "either platform" : NAMES[scope]}. Add them with the form below, or import a LinkedIn followers export or an X analytics CSV on the <Link href="/import">Import page</Link>.</p>
          </div>
        )}

        {withData.length > 0 && (
          <>
            <div className="grid g-3 stagger">
              <div className="card kpi hover">
                <div className="l">Followers now</div>
                <div className="v">{latest.length ? <CountUp value={latest.reduce((a, x) => a + x.t!.total, 0)} /> : "n/a"}</div>
                <div className="s">{latest.length ? latest.map((x) => `${NAMES[x.platform as Platform]} ${x.t!.total.toLocaleString("en-US")} (${nice(x.t!.day)})`).join(", ") : "We have no total yet. Add one with the form below."}</div>
              </div>
              <div className="card kpi hover">
                <div className="l">Gained, last 30 days</div>
                <div className="v">{curDays ? signed(curSum) : "n/a"}</div>
                {curDays && prevDays ? <Delta cur={curSum} prev={prevSum} /> : <div className="s">{curDays ? "no earlier 30 days to compare with" : "no numbers in the last 30 days"}</div>}
                <div className="s">{curDays} day{curDays === 1 ? "" : "s"} with numbers{prevDays ? `, previous 30 days: ${signed(prevSum)} over ${prevDays} days` : ""}</div>
              </div>
              <div className="card kpi hover">
                <div className="l">Best day</div>
                <div className="v">{best ? signed(best.b!.net) : "n/a"}</div>
                <div className="s">{best ? `${nice(best.b!.day)}${scope === "both" ? ` on ${NAMES[best.platform]}` : ""}` : "no day with a gain yet"}</div>
              </div>
            </div>

            <div className="card">
              <div className="card-h"><div><h2>{chartKind === "total" ? "Followers" : "Net follower gain since the first day"}</h2>
                <p>{chartKind === "total" ? "Our total follower count on the days we have a number for." : "We only have gains, so this adds them up from zero. It is not our real follower count."}</p></div></div>
              {series.length ? <Chart series={series} unit="day" height={280} ariaLabel="Followers over time" />
                : <p className="hint">We need at least two days of numbers to draw a line.</p>}
            </div>
          </>
        )}

        <div className="card">
          <div className="card-h"><div><h2>Posts that came just before our best follower gains</h2>
            <p>A link, not proof. Followers can come from many things, and we cannot see where each one came from.</p></div></div>
          {ready.length > 0 && (
            <>
              <p className="hint" style={{ margin: "0 0 12px" }}>
                This rests on {ready.reduce((a, d) => a + d.analysis.postsUsed, 0)} posts and {ready.reduce((a, d) => a + d.analysis.netDays, 0)} days of follower change{ready.length > 1 ? " across both platforms" : ""}.
                For each post we add up the followers gained on the day it went out and the day after, then take off what we gain in a normal two days
                ({ready.map((d) => `${ready.length > 1 ? NAMES[d.platform] + " " : ""}${Math.round(d.analysis.baseline * 10) / 10}, ${d.analysis.baselineKind === "median" ? "the median of windows without a post" : "twice our average day, because there are few windows without a post"}`).join("; ")}).
                A post is called linked only when every day in its window has numbers, it beat that by more than {1.5} times the usual swing, and it is above zero.
                Daily change is measured as {[...new Set(ready.map((d) => basisText(d.analysis.basis)))].join(" and ")}.
              </p>
              {ready.some((d) => d.analysis.postsSkipped > 0) && <p className="hint" style={{ margin: "0 0 12px" }}>{ready.reduce((a, d) => a + d.analysis.postsSkipped, 0)} posts were left out because a day in their window has no follower number.</p>}
              {ranked.length === 0 ? <p className="hint">No post has a full two day window yet.</p> : (
                <div className="scroll-x">
                  <table className="table">
                    <thead><tr><th>Post</th><th>Published</th><th className="r">Followers in 48 hours</th><th className="r">Above normal</th><th>Verdict</th></tr></thead>
                    <tbody>
                      {ranked.slice(0, 15).map((r) => (
                        <tr key={r.id}>
                          <td style={{ maxWidth: 360 }}>
                            {scope === "both" && <span className={`badge ${r.platform === "x" ? "x" : "li"}`} style={{ marginRight: 8 }}>{NAMES[r.platform as Platform]}</span>}
                            <Link href={`/posts/${r.id}`}>{(r.content || "(no text)").replace(/\s+/g, " ").slice(0, 90)}</Link>
                          </td>
                          <td>{nice(r.day)}</td>
                          <td className="r"><b className="num">{signed(r.gain)}</b></td>
                          <td className="r"><b className="num">{signed(Math.round(r.excess * 10) / 10)}</b></td>
                          <td>{r.linked ? <span className="badge li">Linked to growth</span> : <span className="hint">Not clearly above normal</span>}
                            {r.sharedWith > 0 && <span className="hint"> Shares days with {r.sharedWith} other post{r.sharedWith === 1 ? "" : "s"}.</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {!ranked.some((r) => r.linked) && ranked.length > 0 && <p className="hint" style={{ margin: "12px 0 0" }}>None of our posts stands out from our normal days yet. That is a fair answer, not a failure of the data.</p>}
            </>
          )}
          {notReady.map((d) => (
            <div key={d.platform} className="note info" style={{ marginTop: ready.length ? 12 : 0 }}>
              <Icon name="info" size={18} />
              <div>
                <b>{NAMES[d.platform]}: we need more data.</b> Still missing: {d.analysis.missing.join("; ")}.
                {" "}Ways to add it: type a total by hand in the form below, import a LinkedIn followers export or an X analytics CSV (with New follows and Unfollows) on the <Link href="/import">Import page</Link>, or keep logging a number each day. Posts come from our synced and imported posts.
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-h"><div><h2>Add a follower number</h2><p>Type the total we see on a given day. Saving the same day again replaces it.</p></div></div>
          <FollowerForm today={today} defaultPlatform={scope === "x" ? "x" : "linkedin"} recent={recent} />
        </div>
      </div>
    </div>
  );
}
