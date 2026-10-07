"use client";
import Link from "next/link";
import { Icon } from "../components/icons";
import { useToast } from "../components/toast";
import type { Coach } from "@/lib/advisory/schema";

const name = (p: string) => (p === "x" ? "X" : "LinkedIn");
const badge = (p: string) => (p === "x" ? "x" : "li");

export default function CoachView({ coach, model }: { coach: Coach; model: string | null }) {
  const toast = useToast();
  const copy = (t: string) => navigator.clipboard.writeText(t).then(() => toast({ tone: "ok", title: "Copied" }), () => toast({ tone: "error", title: "Could not copy" }));
  const compose = (p: string, text: string) => `/compose?to=${p}&text=${encodeURIComponent(text)}`;

  return (
    <div className="stack">
      <div className="card">
        <div className="card-h"><div><h2>Coach notes</h2><p>Written by our model from our numbers and our own posts{model ? ` (${model})` : ""}</p></div></div>
        <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.6 }}>{coach.summary}</p>
      </div>

      <div className="grid g-2">
        <div className="card">
          <div className="card-h"><h2>Why we are behind</h2></div>
          <ol className="steps">{coach.why_behind.map((w, i) => <li key={i}>{w}</li>)}</ol>
        </div>
        <div className="stack">
          {coach.experiments.length > 0 && (
            <div className="card">
              <div className="card-h"><h2>Experiments for the next two weeks</h2></div>
              <div className="stack" style={{ gap: 14 }}>
                {coach.experiments.map((e, i) => (
                  <div key={i}><b>{e.hypothesis}</b><p className="hint" style={{ margin: "3px 0 0" }}>How: {e.how}</p><p className="hint" style={{ margin: "2px 0 0" }}>Compare: {e.measure}</p></div>
                ))}
              </div>
            </div>
          )}
          {coach.watch_out.length > 0 && (
            <div className="note"><Icon name="alert" size={18} /><span><b>Watch out</b><br />{coach.watch_out.join(" ")}</span></div>
          )}
        </div>
      </div>

      {coach.rewrites.length > 0 && (
        <div className="card">
          <div className="card-h"><div><h2>Our weakest posts, rewritten</h2><p>Same facts, stronger opening and structure</p></div></div>
          <div className="stack" style={{ gap: 22 }}>
            {coach.rewrites.map((r, i) => (
              <div key={i} className="stack" style={{ gap: 10 }}>
                <div className="row"><span className={`badge ${badge(r.platform)}`}>{name(r.platform)}</span><span className="hint">{r.problem}</span></div>
                <div className="rewrite">
                  <div><div className="lab">Before</div><div className="box">{r.original}</div></div>
                  <div>
                    <div className="lab"><span>After</span><span className="row" style={{ gap: 4 }}>
                      <button className="icon-btn" aria-label="Copy" onClick={() => copy(r.rewrite)}><Icon name="copy" size={15} /></button>
                      <Link className="btn sm ghost" href={compose(r.platform, r.rewrite)}>Use in Compose</Link></span></div>
                    <div className="box new">{r.rewrite}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {coach.ideas.length > 0 && (
        <div className="card">
          <div className="card-h"><div><h2>Post ideas for this week</h2><p>Built from the topics we have already posted about</p></div></div>
          <div className="grid g-2">
            {coach.ideas.map((x, i) => (
              <div key={i} className="finding low" style={{ borderLeftColor: x.platform === "x" ? "var(--orange)" : "var(--blue)" }}>
                <div className="row"><span className={`badge ${badge(x.platform)}`}>{name(x.platform)}</span></div>
                <h4>{x.idea}</h4>
                <p className="why" style={{ fontStyle: "italic" }}>{x.hook}</p>
                <p className="hint" style={{ margin: "0 0 10px" }}>{x.why}</p>
                <Link className="btn sm ghost" href={compose(x.platform, x.hook)}>Start this post</Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
