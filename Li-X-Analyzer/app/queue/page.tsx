import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { evergreenCandidates } from "@/lib/studio/recycle";
import { bestTimes } from "@/lib/studio/times";
import { listDrafts, getZone, listSlots, postFacts, recycledPostIds } from "@/lib/studio/store";
import { llmAvailable } from "@/lib/llm";
import { Icon } from "../components/icons";
import { hh, snippet, when, WD } from "../studio/fmt";
import { FillQueue, RecycleButton, SlotsSetup } from "./client";

export const dynamic = "force-dynamic";

function Heat({ t }: { t: ReturnType<typeof bestTimes> }) {
  const max = Math.max(1.2, ...t.grid.map((c) => c.score ?? 0));
  const order = [1, 2, 3, 4, 5, 6, 0];
  return (
    <div className="scroll-x">
      <div className="heat" role="img" aria-label="Weekday and hour heat map of how posts performed">
        <span />{Array.from({ length: 24 }, (_, h) => <span key={h} style={{ textAlign: "center" }}>{h % 3 === 0 ? h : ""}</span>)}
        {order.map((wd) => [
          <span key={`l${wd}`} className="lbl">{WD[wd]}</span>,
          ...Array.from({ length: 24 }, (_, h) => {
            const c = t.grid[wd * 24 + h];
            const a = c.score == null ? 0 : Math.max(0.12, Math.min(1, (c.score - 0.6) / (max - 0.6)));
            return <span key={`${wd}-${h}`} className="hc" title={c.n ? `${WD[wd]} ${hh(h)}: ${c.n} posts, ${c.score!.toFixed(2)} times our typical post` : `${WD[wd]} ${hh(h)}: no posts`} style={c.n ? { background: `rgba(57,135,229,${a})`, outline: c.n >= 2 ? "1px solid rgba(159,202,255,.35)" : "none" } : undefined} />;
          }),
        ])}
      </div>
    </div>
  );
}

export default async function QueuePage() {
  if (!(await isAuthed())) redirect("/login");
  let error: string | null = null;
  const [posts, drafts, slots, tz, recycled, llm] = await Promise.all([postFacts(2000), listDrafts(), listSlots(), getZone(), recycledPostIds(), llmAvailable()]).catch((e) => {
    error = (e as Error).message;
    return [[], [], [], "UTC", [], false] as unknown as [Awaited<ReturnType<typeof postFacts>>, Awaited<ReturnType<typeof listDrafts>>, Awaited<ReturnType<typeof listSlots>>, string, string[], boolean];
  });
  const times = { linkedin: bestTimes(posts, "linkedin", tz), x: bestTimes(posts, "x", tz) };
  const approved = drafts.filter((d) => d.status === "approved");
  const upcoming = drafts.filter((d) => d.status === "scheduled").sort((a, b) => (a.scheduledFor ?? "").localeCompare(b.scheduledFor ?? ""));
  const candidates = evergreenCandidates(posts, new Date(), recycled);
  const suggest = (p: "linkedin" | "x") => (times[p].enough && times[p].top.length ? times[p].top : []).map((c) => ({ weekday: c.weekday, time: hh(c.hour) }));

  return (
    <div className="page">
      <div className="page-head"><div><h1>Queue</h1><p>When to post, a weekly rhythm of slots, and old winners worth running again.</p></div></div>
      {error && <div className="note"><Icon name="alert" size={18} />Database problem: {error}</div>}
      <div className="stack">
        <div className="card stack">
          <div className="card-h" style={{ marginBottom: 0 }}><div><h2>Our queue</h2><p>Approved drafts take the next free slot. Slots already used in Postiz are skipped.</p></div></div>
          <SlotsSetup tz={tz} initial={slots} suggestions={{ linkedin: suggest("linkedin"), x: suggest("x") }} />
          <div className="row" style={{ flexWrap: "wrap" }}>
            <FillQueue approved={approved.length} hasSlots={slots.length > 0} />
            <span className="hint">{approved.length} approved draft{approved.length === 1 ? "" : "s"} waiting. <Link href="/studio">Open the board</Link></span>
          </div>
          {upcoming.length > 0 && (
            <div className="stack" style={{ gap: 6 }}><h3 style={{ margin: "6px 0 0" }}>Coming up from the Studio</h3>
              {upcoming.slice(0, 10).map((d) => <Link key={d.id} href={`/studio/${d.id}`} className="hint"><Icon name="clock" size={13} /> {when(d.scheduledFor, tz)}. {d.platform === "x" ? "X" : "LinkedIn"}. {snippet(d.thread[0] || d.content, 90)}</Link>)}</div>
          )}
        </div>

        {(["linkedin", "x"] as const).map((p) => {
          const t = times[p];
          return (
            <div className="card stack" key={p}>
              <div className="card-h" style={{ marginBottom: 0 }}><div><h2>Best time to post on {p === "x" ? "X" : "LinkedIn"}</h2><p>Compared with our typical post, in the time zone {tz}. Brighter means better. {t.posts} posts with numbers.</p></div></div>
              {!t.enough ? (
                <div className="stack" style={{ gap: 8 }}>
                  <p className="hint" style={{ margin: 0 }}>We need about 20 posts with impressions to say anything honest about timing (we have {t.posts}). Until then, these common starter times are a fair guess:</p>
                  <div className="slotchips">{t.starter.map((c) => <span key={`${c.weekday}${c.hour}`} className="chip tiny">{WD[c.weekday]} {hh(c.hour)}</span>)}</div>
                </div>
              ) : (
                <>
                  <Heat t={t} />
                  {t.top.length ? (
                    <div className="stack" style={{ gap: 8 }}>
                      <h3 style={{ margin: 0 }}>Our strongest hours</h3>
                      <div className="slotchips">{t.top.map((c) => <span key={`${c.weekday}${c.hour}`} className="chip tiny on">{WD[c.weekday]} {hh(c.hour)} . {c.score.toFixed(1)} times typical . {c.n} posts</span>)}</div>
                      <p className="hint" style={{ margin: 0 }}>Only hours with at least two posts count, and one lucky post is pulled toward average. Add them as slots above with one click.</p>
                    </div>
                  ) : <p className="hint" style={{ margin: 0 }}>No single hour stands out yet. Keep posting at varied times and check again.</p>}
                </>
              )}
            </div>
          );
        })}

        <div className="card stack">
          <div className="card-h" style={{ marginBottom: 0 }}><div><h2>Run these again</h2><p>Strong posts older than three months, not tied to a date. Most of our audience has not seen them.</p></div></div>
          {candidates.length === 0 ? <p className="hint" style={{ margin: 0 }}>Nothing qualifies yet. We need at least eight older posts with numbers and text, on one platform.</p> : (
            <div className="stack" style={{ gap: 10 }}>
              {candidates.map((c) => (
                <div key={c.post.id} className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div><span className={`chip tiny ${c.post.platform}`}>{c.post.platform === "x" ? "X" : "LinkedIn"}</span> <span className="hint">{c.reason}</span><p style={{ margin: "4px 0 0", fontSize: 13.5 }}>{snippet(c.post.content, 200)}</p></div>
                  <RecycleButton postId={c.post.id} llm={llm} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
