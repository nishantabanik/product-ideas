import type { Score } from "@/lib/advisory/types";

export default function ScoreCard({ title, color, score, empty }: { title: string; color: string; score: Score | null; empty: string }) {
  const r = 52, c = 2 * Math.PI * r;
  return (
    <div className="card hover">
      <div className="card-h" style={{ marginBottom: 12 }}>
        <div className="row"><i className="dotc" style={{ background: color }} /><h2>{title}</h2></div>
        {score && <span className="badge">{score.label}</span>}
      </div>
      {!score ? <p className="hint" style={{ margin: 0 }}>{empty}</p> : (
        <div className="row" style={{ alignItems: "center", gap: 20, flexWrap: "nowrap" }}>
          <div className="ring" role="img" aria-label={`${title} health score ${score.overall} out of 100`}>
            <svg width="128" height="128" viewBox="0 0 128 128">
              <circle className="track" cx="64" cy="64" r={r} fill="none" strokeWidth="11" />
              <circle className="val" cx="64" cy="64" r={r} fill="none" strokeWidth="11" stroke={color} style={{ ["--c" as string]: c, ["--off" as string]: c * (1 - score.overall / 100) }} />
            </svg>
            <div className="mid"><b className="num">{score.overall}</b><span>of 100</span></div>
          </div>
          <div className="parts">
            {score.parts.map((p) => (
              <div key={p.label} className="part">
                <div className="top"><span>{p.label}</span><span className="num">{p.score}</span></div>
                <div className="meter"><i style={{ width: `${p.score}%`, background: color }} /></div>
                <div className="note-s">{p.note}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
