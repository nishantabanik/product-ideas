import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { CATALOG, NEED_LABEL, featureCount } from "@/lib/features-catalog";
import { Icon } from "../components/icons";

export default async function FeaturesPage() {
  if (!(await isAuthed())) redirect("/login");
  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Features</h1><p>Everything this app can do, and where to find it. {featureCount()} features in {CATALOG.length} groups. Click a name to open it.</p></div>
      </div>
      <nav className="slotchips" aria-label="Groups" style={{ marginBottom: 16 }}>
        {CATALOG.map((g) => <a key={g.id} className="chip tiny" href={`#${g.id}`}>{g.title}</a>)}
      </nav>
      <div className="stack">
        {CATALOG.map((g) => (
          <section key={g.id} id={g.id} className="card stack" style={{ scrollMarginTop: 16 }}>
            <div><h2 style={{ margin: 0 }}>{g.title}</h2><p className="hint" style={{ margin: "4px 0 0" }}>{g.blurb}</p></div>
            <div className="feat-list">
              {g.features.map((f) => (
                <div key={f.name} className="feat">
                  <div className="feat-main">
                    <Link href={f.href} className="feat-name">{f.name}<Icon name="external" size={13} /></Link>
                    <p>{f.what}</p>
                  </div>
                  <div className="feat-side">
                    <span className="hint">Where: {f.where}</span>
                    <span className="enable"><strong>How to enable:</strong> {f.enable}</span>
                    {(f.need ?? ["none"]).map((n) => <span key={n} className={`chip tiny${n === "none" ? " on" : ""}`}>{NEED_LABEL[n]}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
