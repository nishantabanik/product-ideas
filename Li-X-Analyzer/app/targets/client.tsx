"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "../components/toast";
import { Icon } from "../components/icons";
import { COMMENT_PROMPTS } from "@/lib/targets/prompts";
import { daysSince, profileLink } from "@/lib/targets/rotation";

type Target = { id: string; platform: "linkedin" | "x"; name: string; handle: string | null; profileUrl: string | null; note: string; topics: string; active: boolean; lastEngagedAt: string | null };
type Suggestion = { via: "model"; comments: { angle: string; text: string }[] } | { via: "prompts"; message: string };
const plat = (p: string) => (p === "x" ? "X" : "LinkedIn");
const MAX = 100;

async function call(url: string, method: string, body?: unknown) {
  const res = await fetch(url, { method, headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const d = await res.json().catch(() => ({}));
  return { ok: res.ok, d: d as Record<string, unknown> & { error?: string } };
}

function Prompts() {
  return (
    <div className="stack" style={{ gap: 6 }}>
      {COMMENT_PROMPTS.map((p) => <div key={p.id} className="targets-opt"><small>{p.title}</small>{p.how}{"\n"}<span className="hint">{p.starter}</span></div>)}
    </div>
  );
}

function TodayCard({ t, done, now }: { t: Target; done: boolean; now: Date }) {
  const router = useRouter();
  const toast = useToast();
  const [panel, setPanel] = useState<"" | "suggest" | "engage">("");
  const [post, setPost] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [sug, setSug] = useState<Suggestion | null>(null);
  const link = profileLink(t);
  const since = daysSince(t.lastEngagedAt, now);

  async function suggest() {
    setBusy(true);
    const r = await call("/api/targets/suggest", "POST", { platform: t.platform, name: t.name, topics: t.topics, post }).catch(() => null);
    setBusy(false);
    if (!r) return toast({ tone: "error", title: "Could not reach the server" });
    if (!r.ok) return toast({ tone: "error", title: "Could not suggest comments", body: r.d.error });
    setSug(r.d as unknown as Suggestion);
  }
  async function engage() {
    setBusy(true);
    const r = await call(`/api/targets/${t.id}/engage`, "POST", { note }).catch(() => null);
    setBusy(false);
    if (!r) return toast({ tone: "error", title: "Could not reach the server" });
    if (!r.ok) return toast({ tone: "error", title: "Could not save", body: r.d.error });
    toast({ tone: "ok", title: `Engaged with ${t.name}` });
    setPanel(""); router.refresh();
  }

  return (
    <div className={`targets-card${done ? " done" : ""}`}>
      <h4>{t.name}</h4>
      <div className="row"><span className={`chip tiny ${t.platform}`}>{plat(t.platform)}</span>{t.handle && <span className="hint">@{t.handle}</span>}</div>
      {(t.note || t.topics) && <p className="hint">{[t.note, t.topics && `Topics: ${t.topics}`].filter(Boolean).join(". ")}</p>}
      <p className="hint">{since === null ? "Never engaged" : since === 0 ? "Engaged today" : `Last engaged ${since} day${since === 1 ? "" : "s"} ago`}</p>
      {done ? <p className="hint"><Icon name="check" size={14} /> Done today</p> : (
        <div className="targets-actions">
          {link ? <a className="btn ghost sm" href={link} target="_blank" rel="noreferrer">Open profile</a> : <span className="hint">Add their profile link to open it</span>}
          <button className="btn ghost sm" onClick={() => setPanel(panel === "suggest" ? "" : "suggest")}>Suggest a comment</button>
          <button className="btn sm" onClick={() => setPanel(panel === "engage" ? "" : "engage")}>Mark engaged</button>
        </div>
      )}
      {panel === "suggest" && (
        <div className="targets-panel">
          <textarea className="input" rows={4} placeholder="Paste the text of their latest post" value={post} onChange={(e) => setPost(e.target.value)} />
          <div><button className="btn sm" disabled={busy || !post.trim()} onClick={suggest}>{busy ? "Writing..." : "Write 3 comments"}</button></div>
          {sug?.via === "model" && <div className="stack" style={{ gap: 6 }}>{sug.comments.map((c, i) => (
            <div key={i} className="targets-opt"><small>{c.angle}</small>{c.text}
              <div><button className="btn ghost sm" onClick={() => { navigator.clipboard?.writeText(c.text).then(() => toast({ tone: "ok", title: "Copied" }), () => toast({ tone: "error", title: "Could not copy" })); }}>Copy</button></div></div>
          ))}</div>}
          {sug?.via === "prompts" && <><p className="hint">{sug.message}</p><Prompts /></>}
          {!sug && <details><summary className="hint">Comment ideas that work without a model</summary><Prompts /></details>}
        </div>
      )}
      {panel === "engage" && (
        <div className="targets-panel">
          <input className="input" placeholder="One line about what we said (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <div><button className="btn sm" disabled={busy} onClick={engage}>Save</button></div>
        </div>
      )}
    </div>
  );
}

function Row({ t, now }: { t: Target; now: Date }) {
  const router = useRouter();
  const toast = useToast();
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState({ name: t.name, handle: t.handle ?? "", profileUrl: t.profileUrl ?? "", note: t.note, topics: t.topics });
  const since = daysSince(t.lastEngagedAt, now);
  async function patch(b: unknown, ok: string) {
    const r = await call(`/api/targets/${t.id}`, "PATCH", b).catch(() => null);
    if (!r || !r.ok) return toast({ tone: "error", title: "Could not save", body: r?.d.error });
    toast({ tone: "ok", title: ok }); setEdit(false); router.refresh();
  }
  async function remove() {
    if (!confirm(`Remove ${t.name} from the list?`)) return;
    const r = await call(`/api/targets/${t.id}`, "DELETE").catch(() => null);
    if (!r || !r.ok) return toast({ tone: "error", title: "Could not delete" });
    router.refresh();
  }
  return (
    <div className={`targets-row${t.active ? "" : " targets-paused"}`}>
      <div><strong>{t.name}</strong> <span className={`chip tiny ${t.platform}`}>{plat(t.platform)}</span>{!t.active && <span className="hint"> Paused</span>}
        <div className="hint">{since === null ? "Never engaged" : since === 0 ? "Engaged today" : `${since} day${since === 1 ? "" : "s"} since last time`}</div></div>
      <div className="hint">{[t.note, t.topics && `Topics: ${t.topics}`].filter(Boolean).join(". ")}</div>
      <div className="targets-actions">
        <button className="btn ghost sm" onClick={() => setEdit(!edit)}>{edit ? "Close" : "Edit"}</button>
        <button className="btn ghost sm" onClick={() => patch({ active: !t.active }, t.active ? "Paused" : "Resumed")}>{t.active ? "Pause" : "Resume"}</button>
        <button className="btn ghost sm" onClick={remove}>Delete</button>
      </div>
      {edit && (
        <div className="targets-panel" style={{ gridColumn: "1 / -1" }}>
          <div className="targets-form">
            <input className="input" placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <input className="input" placeholder="Handle" value={f.handle} onChange={(e) => setF({ ...f, handle: e.target.value })} />
            <input className="input" placeholder="Profile link" value={f.profileUrl} onChange={(e) => setF({ ...f, profileUrl: e.target.value })} />
            <input className="input" placeholder="Note" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
            <input className="input" placeholder="Topics" value={f.topics} onChange={(e) => setF({ ...f, topics: e.target.value })} />
          </div>
          <div><button className="btn sm" onClick={() => patch(f, "Saved")}>Save</button></div>
        </div>
      )}
    </div>
  );
}

export default function TargetsClient({ targets, pickIds, doneIds, stats, nowIso }: { targets: Target[]; pickIds: string[]; doneIds: string[]; stats: { done: number; perDay: number; streak: number; week: number }; nowIso: string }) {
  const router = useRouter();
  const toast = useToast();
  const now = new Date(nowIso);
  const byId = new Map(targets.map((t) => [t.id, t]));
  const today = [...doneIds, ...pickIds].map((id) => byId.get(id)).filter((t): t is Target => !!t);
  const [form, setForm] = useState({ platform: "linkedin", name: "", handle: "", profileUrl: "", note: "", topics: "" });
  const [paste, setPaste] = useState("");
  const [pastePlatform, setPastePlatform] = useState("linkedin");
  const [busy, setBusy] = useState(false);

  async function add() {
    setBusy(true);
    const r = await call("/api/targets", "POST", form).catch(() => null);
    setBusy(false);
    if (!r) return toast({ tone: "error", title: "Could not reach the server" });
    if (!r.ok) return toast({ tone: "error", title: "Could not add", body: r.d.error });
    toast({ tone: "ok", title: "Target added" });
    setForm({ ...form, name: "", handle: "", profileUrl: "", note: "", topics: "" }); router.refresh();
  }
  async function addMany() {
    setBusy(true);
    const r = await call("/api/targets", "POST", { paste, platform: pastePlatform }).catch(() => null);
    setBusy(false);
    if (!r) return toast({ tone: "error", title: "Could not reach the server" });
    if (!r.ok) return toast({ tone: "error", title: "Could not add", body: r.d.error });
    toast({ tone: "ok", title: `${r.d.added} added`, body: r.d.skipped ? `${r.d.skipped} skipped` : undefined });
    setPaste(""); router.refresh();
  }

  return (
    <div className="stack">
      <div className="targets-strip">
        <div className="kpi"><div className="hint">Today</div><strong>{stats.done} of {stats.perDay} done today</strong></div>
        <div className="kpi"><div className="hint">Streak</div><strong>{stats.streak} day{stats.streak === 1 ? "" : "s"}</strong></div>
        <div className="kpi"><div className="hint">This week</div><strong>{stats.week}</strong></div>
      </div>

      <div className="card stack">
        <div className="card-h" style={{ marginBottom: 0 }}><div><h2>Today</h2><p>People we have not engaged today, the ones we spoke to longest ago first.</p></div></div>
        {today.length === 0 ? <p className="hint">{targets.filter((t) => t.active).length === 0 ? "Add people below and they show up here." : "Everyone is done for today."}</p> : (
          <div className="targets-today">{today.map((t) => <TodayCard key={t.id} t={t} done={doneIds.includes(t.id)} now={now} />)}</div>
        )}
      </div>

      <div className="card stack">
        <div className="card-h" style={{ marginBottom: 0 }}><div><h2>Our target list</h2><p>{targets.length} of {MAX} people.</p></div></div>
        {targets.length === 0 ? <p className="hint">No one on the list yet.</p> : <div>{targets.map((t) => <Row key={t.id} t={t} now={now} />)}</div>}
      </div>

      <div className="card stack">
        <div className="card-h" style={{ marginBottom: 0 }}><div><h2>Add a target</h2></div></div>
        <div className="targets-form">
          <select className="input" aria-label="Platform" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}><option value="linkedin">LinkedIn</option><option value="x">X</option></select>
          <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" placeholder="Handle" value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value })} />
          <input className="input" placeholder="Profile link" value={form.profileUrl} onChange={(e) => setForm({ ...form, profileUrl: e.target.value })} />
          <input className="input" placeholder="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <input className="input" placeholder="Topics" value={form.topics} onChange={(e) => setForm({ ...form, topics: e.target.value })} />
        </div>
        <div><button className="btn" disabled={busy || !form.name.trim()} onClick={add}><Icon name="plus" size={16} />Add target</button></div>
      </div>

      <div className="card stack">
        <div className="card-h" style={{ marginBottom: 0 }}><div><h2>Add several</h2><p>One person per line, as "name" or "name, handle".</p></div></div>
        <textarea className="input" rows={5} placeholder={"Jane Doe, janedoe\nSam Park"} value={paste} onChange={(e) => setPaste(e.target.value)} />
        <div className="row">
          <select className="input" aria-label="Platform for pasted names" value={pastePlatform} onChange={(e) => setPastePlatform(e.target.value)} style={{ width: "auto" }}><option value="linkedin">LinkedIn</option><option value="x">X</option></select>
          <button className="btn" disabled={busy || !paste.trim()} onClick={addMany}>Add these people</button>
        </div>
      </div>
    </div>
  );
}
