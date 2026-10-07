"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../../components/icons";
import Seg from "../../components/seg";
import { useToast } from "../../components/toast";
import ChatPanel from "../chat-panel";
import { lintDraft } from "@/lib/studio/lint";
import { checkThread, joinThread, splitThread, tweetLength, X_LIMIT } from "@/lib/studio/thread";
import type { Draft } from "@/lib/studio/types";

export type Insertable = { name: string; body: string; platform: string };
type Variant = { angle: string; text: string; thread?: string[]; lint: { score: number } };
type Adapted = { linkedin: string; xShort: string; xThread: string[]; via: "model" | "rules" };

const tone = (n: number) => (n >= 80 ? "good" : n >= 60 ? "mid" : "low");
const local = (iso: string) => { const d = new Date(iso); const p = (n: number) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };
const fmt = (iso: string) => new Date(iso).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function Editor({ draft, pillars, library, suggested, llm, requireApproval }: {
  draft: Draft; pillars: string[]; library: Insertable[]; suggested: string[]; llm: boolean; requireApproval: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const locked = draft.status === "scheduled" || draft.status === "published";
  const [status, setStatus] = useState(draft.status);
  const [platform, setPlatform] = useState(draft.platform);
  const [title, setTitle] = useState(draft.title);
  const [content, setContent] = useState(draft.content);
  const [thread, setThread] = useState<string[]>(draft.thread);
  const [threadMode, setThreadMode] = useState(draft.thread.length > 1);
  const [pillar, setPillar] = useState(draft.pillar ?? "");
  const [note, setNote] = useState(draft.reviewNote ?? "");
  const [saved, setSaved] = useState<"saved" | "saving" | "dirty">("saved");
  const [busy, setBusy] = useState<string | null>(null);
  const [brief, setBrief] = useState(draft.status === "idea" ? [draft.title, draft.content].filter(Boolean).join(". ") : "");
  const [hook, setHook] = useState("");
  const [variants, setVariants] = useState<Variant[]>([]);
  const [adapted, setAdapted] = useState<Adapted | null>(null);
  const [when, setWhen] = useState(() => local(suggested[0] ?? new Date(Date.now() + 86_400_000).toISOString()));
  const first = useRef(true);

  const posts = platform === "x" && threadMode ? thread : [];
  const lint = useMemo(() => lintDraft(platform, platform === "x" && threadMode ? (thread[0] ?? "") : content, posts), [platform, content, thread, threadMode, posts]);
  const check = useMemo(() => (platform === "x" ? checkThread(threadMode ? thread : [content]) : null), [platform, content, thread, threadMode]);
  const hooks = library.filter((l) => l.platform === "both" || l.platform === platform);

  // Autosave while writing. Changing the text of something in review or approved sends it back to draft, the server does that.
  const latest = useRef({ title, content, thread, threadMode, pillar, platform });
  latest.current = { title, content, thread, threadMode, pillar, platform };
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  async function saveNow() {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (locked || !dirty.current) return;
    dirty.current = false;
    setSaved("saving");
    const v = latest.current;
    const r = await fetch(`/api/studio/${draft.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: v.title, content: v.content, thread: v.threadMode ? v.thread : [], pillar: v.pillar, platform: v.platform }) });
    if (r.ok) { const d = await r.json(); setStatus(d.status); setSaved(dirty.current ? "dirty" : "saved"); } else { dirty.current = true; setSaved("dirty"); toast({ tone: "error", title: "Could not save", body: (await r.json()).error }); }
  }
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (locked) return;
    dirty.current = true;
    setSaved("dirty");
    timer.current = setTimeout(saveNow, 900);
    return () => { if (timer.current) clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, thread, threadMode, pillar, platform]);

  async function act(action: string, extra: Record<string, unknown> = {}, ok?: string) {
    setBusy(action);
    try {
      await saveNow(); // what is on screen is what gets reviewed, approved or sent
      const r = await fetch(`/api/studio/${draft.id}/action`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, note, ...extra }) });
      const d = await r.json();
      if (!r.ok) return toast({ tone: "error", title: "Not possible", body: d.error });
      setStatus(d.status);
      toast({ tone: "ok", title: ok ?? "Done" });
      router.refresh();
    } catch { toast({ tone: "error", title: "Could not reach the server" }); } finally { setBusy(null); }
  }

  async function ai(task: string, body: Record<string, unknown>) {
    setBusy(task);
    try {
      const r = await fetch("/api/studio/ai", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ task, platform, ...body }) });
      const d = await r.json();
      if (!r.ok) { toast({ tone: "error", title: "The model could not do that", body: d.error }); return null; }
      return d;
    } catch { toast({ tone: "error", title: "Could not reach the server" }); return null; } finally { setBusy(null); }
  }

  const useVariant = (v: Variant) => {
    if (platform === "x" && v.thread && v.thread.length > 1) { setThreadMode(true); setThread(v.thread); setContent(joinThread(v.thread)); } else { setThreadMode(false); setContent(v.text); }
    toast({ tone: "ok", title: "Version loaded into the editor" });
  };
  const insert = (name: string) => { const t = library.find((l) => l.name === name); if (t) setContent((c) => (c.trim() ? `${c.trim()}\n\n${t.body}` : t.body)); };
  const toThread = () => { const parts = splitThread(content); setThread(parts.length ? parts : [""]); setThreadMode(true); };
  const toSingle = () => { setContent(joinThread(thread)); setThreadMode(false); };
  const setPost = (i: number, v: string) => setThread((t) => t.map((x, k) => (k === i ? v : x)));
  const move = (i: number, d: number) => setThread((t) => { const n = [...t]; [n[i], n[i + d]] = [n[i + d], n[i]]; return n; });

  async function adaptTo(kind: string, text: string, thr?: string[]) {
    const to = kind === "linkedin" ? "linkedin" : "x";
    const r = await fetch("/api/studio", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ platform: to, status: "draft", title: title || undefined, content: text, thread: thr ?? [], source: "repurpose", parentId: draft.id }) });
    const d = await r.json();
    if (!r.ok) return toast({ tone: "error", title: "Could not create the draft", body: d.error });
    toast({ tone: "ok", title: "Draft created", body: "Open it from the board." });
    router.refresh();
  }

  const sendable = platform === "x" ? check?.ok : content.trim().length > 0 && content.length <= 3000;
  const dt = new Date(when);

  return (
    <div className="editor">
      <div className="stack">
        <div className="card stack">
          <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <div className="row">
              {status === "idea" || status === "draft" ? (
                <Seg small label="Platform" value={platform} onChange={(v) => setPlatform(v as "x" | "linkedin")} options={[{ value: "linkedin", label: "LinkedIn" }, { value: "x", label: "X" }]} />
              ) : <span className={`chip ${platform}`}>{platform === "x" ? "X" : "LinkedIn"}</span>}
              <span className="chip tiny">{status}</span>
            </div>
            <span className="hint">{locked ? "Locked, this one is in Postiz" : saved === "saved" ? "Saved" : saved === "saving" ? "Saving..." : "Unsaved changes"}</span>
          </div>
          <label className="field"><span>Working title (only for us, not published)</span><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} disabled={locked} /></label>

          {platform === "x" && (
            <div className="row">
              <Seg small label="Format" value={threadMode ? "thread" : "single"} onChange={(v) => (v === "thread" ? toThread() : toSingle())} options={[{ value: "single", label: "Single post" }, { value: "thread", label: "Thread builder" }]} />
              {threadMode && <span className="hint">{thread.length} posts</span>}
            </div>
          )}

          {platform === "x" && threadMode ? (
            <div className="stack" style={{ gap: 10 }}>
              {thread.map((t, i) => {
                const n = tweetLength(t);
                return (
                  <div key={i} className="tweet">
                    <div className="row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
                      <strong style={{ fontSize: 13 }}>Post {i + 1}</strong>
                      <div className="row" style={{ gap: 4 }}>
                        <button className="icon-btn" aria-label="Move up" disabled={i === 0 || locked} onClick={() => move(i, -1)}><Icon name="up" size={15} /></button>
                        <button className="icon-btn" aria-label="Move down" disabled={i === thread.length - 1 || locked} onClick={() => move(i, 1)}><Icon name="down" size={15} /></button>
                        <button className="icon-btn" aria-label="Remove post" disabled={thread.length <= 1 || locked} onClick={() => setThread((x) => x.filter((_, k) => k !== i))}><Icon name="x" size={15} /></button>
                      </div>
                    </div>
                    <textarea className="input" value={t} disabled={locked} onChange={(e) => setPost(i, e.target.value)} />
                    <div className={`counter${n > X_LIMIT ? " over" : ""}`}>{n} / {X_LIMIT}</div>
                  </div>
                );
              })}
              <div className="row">
                <button className="btn ghost sm" disabled={locked || thread.length >= 25} onClick={() => setThread((x) => [...x, ""])}><Icon name="plus" size={15} />Add a post</button>
                <button className="btn ghost sm" disabled={locked} onClick={() => { const all = splitThread(joinThread(thread), X_LIMIT, true); setThread(all); }} title="Cut again at natural breaks and number the posts">Re-split and number</button>
              </div>
              {check && check.problems.length > 0 && <div className="warn-box"><Icon name="alert" size={16} /><span>{check.problems[0]}</span></div>}
            </div>
          ) : (
            <label className="field"><span>{platform === "x" ? "The post" : "The post text"}</span>
              <textarea className="input" style={{ minHeight: platform === "x" ? 120 : 280 }} value={content} disabled={locked} onChange={(e) => setContent(e.target.value)} placeholder={platform === "linkedin" ? "A short first line that makes a promise.\n\nThen short paragraphs." : "One sharp point."} />
              <span className={`counter${platform === "x" && tweetLength(content) > X_LIMIT ? " over" : ""}`} style={{ textAlign: "right", fontSize: 12, color: "var(--mute)" }}>{platform === "x" ? `${tweetLength(content)} / ${X_LIMIT}` : `${content.length} / 3000`}</span></label>
          )}

          <div className="grid g-2">
            <label className="field"><span>Content pillar</span>
              <select className="input" value={pillar} disabled={locked} onChange={(e) => setPillar(e.target.value)}><option value="">None</option>{pillars.map((p) => <option key={p}>{p}</option>)}</select></label>
            <label className="field"><span>Insert an opening or a template</span>
              <select className="input" value="" disabled={locked} onChange={(e) => e.target.value && insert(e.target.value)}><option value="">Choose from the library</option>{hooks.map((h) => <option key={h.name}>{h.name}</option>)}</select></label>
          </div>
          {status === "draft" && draft.reviewNote && <div className="warn-box"><Icon name="info" size={16} /><span>Changes asked for: {draft.reviewNote}</span></div>}
        </div>

        {/* Workflow */}
        <div className="card stack">
          <h3 style={{ margin: 0 }}>Review and publish</h3>
          {status === "idea" && <div className="row"><button className="btn" disabled={!!busy} onClick={() => act("promote", {}, "Moved to drafts")}>Turn into a draft</button><span className="hint">Write the post, or use "Write 3 versions" on the right.</span></div>}
          {(status === "draft" || status === "review") && (
            <div className="stack" style={{ gap: 10 }}>
              <div className="row" style={{ flexWrap: "wrap" }}>
                {status === "draft" && <button className="btn ghost" disabled={!!busy || !sendable} onClick={() => act("submit", {}, "Sent for review")}>Send for review</button>}
                {status === "review" && <><button className="btn" disabled={!!busy} onClick={() => act("approve", {}, "Approved")}>Approve</button>
                  <button className="btn ghost" disabled={!!busy} onClick={() => act("changes", {}, "Sent back with a note")}>Ask for changes</button></>}
                {status === "draft" && !requireApproval && <button className="btn" disabled={!!busy || !sendable} onClick={() => act("approve", {}, "Approved")}>Approve</button>}
              </div>
              {status === "review" && <label className="field"><span>Note for the writer (for Ask for changes)</span><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What should change?" /></label>}
              {requireApproval && status === "draft" && <p className="hint">Approval is required before scheduling, so send it for review first.</p>}
            </div>
          )}
          {(status === "approved" || (!requireApproval && (status === "draft" || status === "review"))) && (
            <div className="stack" style={{ gap: 10 }}>
              <div className="field"><span>When</span>
                <div className="row" style={{ flexWrap: "wrap" }}>
                  <input className="input" type="datetime-local" style={{ maxWidth: 240 }} value={when} onChange={(e) => setWhen(e.target.value)} />
                  {suggested.slice(0, 4).map((s) => <button key={s} className="chip tiny" onClick={() => setWhen(local(s))} type="button">{fmt(s)}</button>)}
                </div>
                {suggested.length > 0 && <span className="hint">The chips are the next queue slots, or our best times when no slots are set.</span>}
              </div>
              <div className="row" style={{ flexWrap: "wrap" }}>
                <button className="btn" disabled={!!busy || !sendable || isNaN(dt.getTime())} onClick={() => act("schedule", { date: dt.toISOString() }, "Scheduled in Postiz")}><Icon name="clock" size={16} />Schedule</button>
                <button className="btn ghost" disabled={!!busy || !sendable} onClick={() => confirm("Post it right now?") && act("schedule", { now: true }, "Posting now")}><Icon name="send" size={16} />Post now</button>
                {status === "approved" && <button className="btn ghost" disabled={!!busy} onClick={() => act("reopen", {}, "Back to draft")}>Back to draft</button>}
              </div>
              {status === "approved" && <p className="hint">Or leave it approved and press Fill queue on the Queue page, which gives it the next free slot.</p>}
            </div>
          )}
          {status === "scheduled" && <p className="hint">Scheduled for {draft.scheduledFor ? fmt(draft.scheduledFor) : "the chosen time"}. It is in Postiz now, change it there.</p>}
          {status === "published" && <p className="hint">Published from here. Its numbers show up in Analytics after the next sync.</p>}
          {!locked && <div><button className="btn ghost sm" onClick={async () => { if (!confirm("Delete this draft?")) return; await fetch(`/api/studio/${draft.id}`, { method: "DELETE" }); router.push("/studio"); }}>Delete draft</button></div>}
        </div>
      </div>

      <div className="stack">
        <div className="card stack">
          <div className="row" style={{ justifyContent: "space-between" }}><h3 style={{ margin: 0 }}>Checked against our rules</h3><span className={`score ${tone(lint.score)}`}>{lint.score}</span></div>
          {lint.checks.map((c) => (
            <div key={c.key} className="lintrow"><span className={`status-dot ${c.level === "ok" ? "ok" : c.level === "bad" ? "bad" : "off"}`} style={{ marginTop: 6, ...(c.level === "warn" ? { background: "var(--orange)" } : {}) }} /><div>{c.label}{c.level !== "ok" && <small>{c.tip}</small>}</div></div>
          ))}
          <button className="btn ghost sm" disabled={!llm || !!busy || locked || lint.checks.every((c) => c.level === "ok")} onClick={async () => {
            const d = await ai("improve", { text: platform === "x" && threadMode ? thread[0] ?? "" : content, thread: posts });
            if (!d) return;
            if (platform === "x" && d.thread?.length > 1) { setThreadMode(true); setThread(d.thread); } else setContent(d.text);
            toast({ tone: "ok", title: "Improved", body: (d.changes ?? []).slice(0, 3).join(". ") });
          }} title={llm ? "" : "Connect a model on the Settings page"}><Icon name={busy === "improve" ? "refresh" : "check"} size={15} className={busy === "improve" ? "spin" : ""} />Fix what is flagged</button>
        </div>

        <div className="card stack">
          <h3 style={{ margin: 0 }}>Write with our voice</h3>
          <p className="hint" style={{ margin: 0 }}>The model reads our best past posts and our rules, then writes three versions. {llm ? "" : "Connect a model on the Settings page first."}</p>
          <label className="field"><span>What is the post about?</span><textarea className="input" style={{ minHeight: 90 }} value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="The point, the story, the numbers. Real details give better drafts." /></label>
          <label className="field"><span>Start from an opening pattern (optional)</span>
            <select className="input" value={hook} onChange={(e) => setHook(e.target.value)}><option value="">Let the model choose</option>{library.filter((l) => l.body.length < 200).map((l) => <option key={l.name} value={l.body}>{l.name}: {l.body.slice(0, 50)}</option>)}</select></label>
          <button className="btn" disabled={!llm || !!busy || !brief.trim() || locked} onClick={async () => { const d = await ai("draft", { brief, pillar, hook, asThread: platform === "x" && threadMode }); if (d) setVariants(d.variants); }}>
            <Icon name={busy === "draft" ? "refresh" : "pen"} size={16} className={busy === "draft" ? "spin" : ""} />{busy === "draft" ? "Writing..." : "Write 3 versions"}</button>
          {variants.map((v, i) => (
            <div key={i} className="variant">
              <div className="row" style={{ justifyContent: "space-between" }}><span className="chip tiny">{v.angle}</span><span className={`score ${tone(v.lint.score)}`} style={{ minWidth: 34, height: 34, fontSize: 13 }}>{v.lint.score}</span></div>
              {v.thread && v.thread.length > 1 ? v.thread.map((t, k) => <div key={k}><small className="hint">Post {k + 1}</small><div>{t}</div></div>) : v.text}
              <div><button className="btn ghost sm" disabled={locked} onClick={() => useVariant(v)}>Use this version</button></div>
            </div>
          ))}
        </div>

        <div className="card stack">
          <h3 style={{ margin: 0 }}>Adapt to the other format</h3>
          <p className="hint" style={{ margin: 0 }}>One post becomes a LinkedIn version, a short X post and an X thread. New drafts land on the board.</p>
          <button className="btn ghost" disabled={!!busy || !(content.trim() || thread.some((t) => t.trim()))} onClick={async () => { const d = await ai("repurpose", { text: platform === "x" && threadMode ? joinThread(thread) : content, from: platform }); if (d) setAdapted(d); }}>
            <Icon name={busy === "repurpose" ? "refresh" : "layers"} size={16} className={busy === "repurpose" ? "spin" : ""} />{busy === "repurpose" ? "Adapting..." : "Adapt this post"}</button>
          {adapted && (
            <div className="stack" style={{ gap: 10 }}>
              {adapted.via === "rules" && <p className="hint">No model connected, so we cut the text by rule. Connect one for a proper rewrite.</p>}
              {platform !== "linkedin" && <div className="variant"><span className="chip tiny linkedin">LinkedIn</span>{adapted.linkedin}<div><button className="btn ghost sm" onClick={() => adaptTo("linkedin", adapted.linkedin)}>Create the draft</button></div></div>}
              <div className="variant"><span className="chip tiny x">X, one post</span>{adapted.xShort}<div><button className="btn ghost sm" onClick={() => adaptTo("x", adapted.xShort)}>Create the draft</button></div></div>
              <div className="variant"><span className="chip tiny x">X, thread of {adapted.xThread.length}</span>{adapted.xThread.map((t, k) => <div key={k}>{k + 1}. {t}</div>)}<div><button className="btn ghost sm" onClick={() => adaptTo("x", adapted.xThread[0], adapted.xThread)}>Create the draft</button></div></div>
            </div>
          )}
        </div>
        <div className="card stack">
          <h3 style={{ margin: 0 }}>Ask the writing assistant</h3>
          <ChatPanel platform={platform} llm={llm} compact
            getDraft={() => (platform === "x" && threadMode ? joinThread(thread) : content)}
            onUse={locked ? undefined : (t) => { if (platform === "x" && threadMode) { setThread(splitThread(t)); } else { setContent(t); } }} />
        </div>
        <Link className="hint" href="/studio">Back to the board</Link>
      </div>
    </div>
  );
}
