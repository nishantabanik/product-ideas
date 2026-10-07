"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "../components/toast";
import { Icon } from "../components/icons";
import { daysSinceContact, followUpsDue, openPipelineValue, pipelineTotals, SOURCE_LABELS, STAGES, STAGE_HINTS, STAGE_LABELS, staleLeads, winRate, winRateLabel, wonValue, type LeadFact, type Source, type Stage } from "@/lib/leads/stages";

type Lead = { id: string; platform: "linkedin" | "x"; name: string; handle: string | null; profileUrl: string | null; source: Source; stage: Stage; value: number | null; notes: string; nextStepAt: string | null; lastContactAt: string | null; createdAt: string; updatedAt: string };
const money = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });
const day = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
const plat = (p: string) => (p === "x" ? "X" : "LinkedIn");

async function call(url: string, method: string, body?: unknown) {
  const res = await fetch(url, { method, headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const d = await res.json().catch(() => ({}));
  return { ok: res.ok, d: d as { error?: string; added?: number; skipped?: number; id?: string } };
}

function Card({ l, now }: { l: Lead; now: Date }) {
  const router = useRouter();
  const toast = useToast();
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState({ name: l.name, handle: l.handle ?? "", profileUrl: l.profileUrl ?? "", value: l.value === null ? "" : String(l.value), notes: l.notes, nextStepAt: day(l.nextStepAt) });
  const since = daysSinceContact(l.lastContactAt, now);
  const due = !!l.nextStepAt && new Date(l.nextStepAt) <= now && l.stage !== "won" && l.stage !== "lost";

  async function patch(body: unknown, ok?: string) {
    const r = await call(`/api/leads/${l.id}`, "PATCH", body);
    if (!r.ok) return toast({ tone: "error", title: "Could not save", body: r.d.error });
    if (ok) toast({ tone: "ok", title: ok });
    setEdit(false); router.refresh();
  }
  async function remove() {
    if (!confirm(`Delete ${l.name}?`)) return;
    const r = await call(`/api/leads/${l.id}`, "DELETE");
    if (!r.ok) return toast({ tone: "error", title: "Could not delete", body: r.d.error });
    router.refresh();
  }

  return (
    <div className="leads-card">
      <h4>{l.profileUrl ? <a href={l.profileUrl} target="_blank" rel="noreferrer">{l.name}</a> : l.name}</h4>
      <div className="leads-meta">
        <span className={`chip tiny ${l.platform}`}>{plat(l.platform)}</span>
        <span className="hint">{SOURCE_LABELS[l.source]}</span>
        {l.value !== null && <span className="badge">{money(l.value)}</span>}
      </div>
      {l.nextStepAt && <p className={`hint${due ? " leads-due" : ""}`}>Next step {day(l.nextStepAt)}{due ? " (due)" : ""}</p>}
      <p className="hint">{since === null ? "No contact yet" : since === 0 ? "Contact today" : `${since} day${since === 1 ? "" : "s"} since contact`}</p>
      {l.notes && !edit && <p className="hint">{l.notes.length > 140 ? `${l.notes.slice(0, 140)}...` : l.notes}</p>}
      <div className="leads-actions">
        <select className="input" aria-label={`Stage for ${l.name}`} value={l.stage} onChange={(e) => patch({ stage: e.target.value }, `Moved to ${STAGE_LABELS[e.target.value as Stage]}`)}>
          {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
        </select>
        <button className="btn ghost sm" onClick={() => setEdit(!edit)}>{edit ? "Close" : "Edit"}</button>
        <button className="btn ghost sm" onClick={remove}>Delete</button>
      </div>
      {edit && (
        <div className="leads-edit">
          <label>Name<input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
          <label>Handle<input className="input" value={f.handle} onChange={(e) => setF({ ...f, handle: e.target.value })} /></label>
          <label>Profile link<input className="input" value={f.profileUrl} onChange={(e) => setF({ ...f, profileUrl: e.target.value })} /></label>
          <label>Value<input className="input" inputMode="decimal" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} /></label>
          <label>Next step date<input className="input" type="date" value={f.nextStepAt} onChange={(e) => setF({ ...f, nextStepAt: e.target.value })} /></label>
          <label>Notes<textarea className="input" rows={3} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></label>
          <button className="btn sm" onClick={() => patch(f, "Saved")}>Save</button>
        </div>
      )}
    </div>
  );
}

export default function LeadsClient({ leads, nowIso }: { leads: Lead[]; nowIso: string }) {
  const router = useRouter();
  const toast = useToast();
  const now = new Date(nowIso);
  const facts: LeadFact[] = leads;
  const byId = new Map(leads.map((l) => [l.id, l]));
  const due = followUpsDue(facts, now).map((x) => byId.get(x.id)!);
  const stale = staleLeads(facts, now).map((x) => byId.get(x.id)!);
  const totals = pipelineTotals(facts);
  const rate = winRate(facts);

  const [form, setForm] = useState({ platform: "linkedin", name: "", handle: "", profileUrl: "", value: "", notes: "", source: "manual" });
  const [paste, setPaste] = useState("");
  const [pastePlatform, setPastePlatform] = useState("linkedin");
  const [busy, setBusy] = useState(false);

  async function add() {
    setBusy(true);
    const r = await call("/api/leads", "POST", form).catch(() => null);
    setBusy(false);
    if (!r) return toast({ tone: "error", title: "Could not reach the server" });
    if (!r.ok) return toast({ tone: "error", title: "Could not add", body: r.d.error });
    toast({ tone: "ok", title: "Lead added" });
    setForm({ ...form, name: "", handle: "", profileUrl: "", value: "", notes: "" }); router.refresh();
  }
  async function addMany() {
    setBusy(true);
    const r = await call("/api/leads", "POST", { paste, platform: pastePlatform, source: "profile_view" }).catch(() => null);
    setBusy(false);
    if (!r) return toast({ tone: "error", title: "Could not reach the server" });
    if (!r.ok) return toast({ tone: "error", title: "Could not add", body: r.d.error });
    toast({ tone: r.d.added ? "ok" : "info", title: `${r.d.added ?? 0} added`, body: r.d.skipped ? `${r.d.skipped} already on the list` : undefined });
    setPaste(""); router.refresh();
  }

  return (
    <div className="stack">
      <div className="leads-strip">
        <div className="kpi"><div className="hint">Leads</div><strong>{leads.length}</strong></div>
        <div className="kpi"><div className="hint">Open pipeline value</div><strong>{money(openPipelineValue(facts))}</strong></div>
        <div className="kpi"><div className="hint">Won value</div><strong>{money(wonValue(facts))}</strong></div>
        <div className="kpi"><div className="hint">Win rate</div><strong>{winRateLabel(rate)}</strong>{rate === "n/a" && <div className="hint">Nothing won or lost yet</div>}</div>
      </div>

      <div className="card stack">
        <div className="card-h" style={{ marginBottom: 0 }}><div><h2>Needs attention</h2><p>Next steps that are due, and leads we have not talked to for 14 days.</p></div></div>
        {due.length === 0 && stale.length === 0 ? <p className="hint">Nothing needs attention right now.</p> : (
          <div className="leads-attn">
            {due.map((l) => <div key={`d${l.id}`}><span className="leads-due">Next step due</span> {day(l.nextStepAt)}: {l.name} ({STAGE_LABELS[l.stage]})</div>)}
            {stale.map((l) => <div key={`s${l.id}`}><span className="leads-due">No contact for {daysSinceContact(l.lastContactAt, now)} days</span>: {l.name} ({STAGE_LABELS[l.stage]})</div>)}
          </div>
        )}
      </div>

      <div className="leads-board">
        {STAGES.map((s, i) => {
          const list = leads.filter((l) => l.stage === s);
          const t = totals[i];
          return (
            <section key={s} className="leads-col" aria-label={STAGE_LABELS[s]}>
              <header><h3>{STAGE_LABELS[s]} <span className="leads-count">{t.count}</span></h3><p className="hint">{t.value ? `${money(t.value)} in value` : STAGE_HINTS[s]}</p></header>
              {list.length === 0 ? <p className="hint" style={{ textAlign: "center" }}>Nothing here</p> : list.map((l) => <Card key={l.id} l={l} now={now} />)}
            </section>
          );
        })}
      </div>

      <div className="card stack">
        <div className="card-h" style={{ marginBottom: 0 }}><div><h2>Add a lead</h2></div></div>
        <div className="leads-form">
          <select className="input" aria-label="Platform" value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}><option value="linkedin">LinkedIn</option><option value="x">X</option></select>
          <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" placeholder="Handle" value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value })} />
          <input className="input" placeholder="Profile link" value={form.profileUrl} onChange={(e) => setForm({ ...form, profileUrl: e.target.value })} />
          <input className="input" placeholder="Value" inputMode="decimal" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
          <select className="input" aria-label="Source" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
            {(Object.keys(SOURCE_LABELS) as Source[]).map((s) => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
          </select>
        </div>
        <textarea className="input" rows={2} placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <div><button className="btn" disabled={busy || !form.name.trim()} onClick={add}><Icon name="plus" size={16} />Add lead</button></div>
      </div>

      <div className="card stack">
        <div className="card-h" style={{ marginBottom: 0 }}><div><h2>Add several</h2>
          <p>LinkedIn does not let apps read profile views, so we paste the names from LinkedIn's "Who viewed your profile" page. One name per line, or "name, handle". They are added as profile views.</p></div></div>
        <textarea className="input" rows={5} placeholder={"Ann Lee\nBob Ray, bobray"} value={paste} onChange={(e) => setPaste(e.target.value)} />
        <div className="row">
          <select className="input" aria-label="Platform for pasted names" value={pastePlatform} onChange={(e) => setPastePlatform(e.target.value)} style={{ width: "auto" }}><option value="linkedin">LinkedIn</option><option value="x">X</option></select>
          <button className="btn" disabled={busy || !paste.trim()} onClick={addMany}>Add these names</button>
        </div>
      </div>
    </div>
  );
}
