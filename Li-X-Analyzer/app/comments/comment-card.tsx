"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "../components/icons";
import { useToast } from "../components/toast";
import { timeAgo } from "./time";
import { fillTemplate, postSnippet } from "@/lib/comments/fill";
import { STARTER_TEMPLATES, templateFits, type Template } from "@/lib/comments/starters";
import type { CommentRow } from "@/lib/comments/types";
import "./comments.css";

export type Caps = { x: boolean; linkedin: boolean; llm: boolean };
const VIA: Record<string, string> = { x_api: "sent from here to X", linkedin_api: "sent from here to LinkedIn", manual: "answered on the platform" };
const hasCommentUrn = (u: string | null) => !!u && /urn(:|%3A)li(:|%3A)comment/i.test(u);

export type FollowUpInfo = { kind: "due" | "quiet"; days?: number };
const MESSAGES = { linkedin: "https://www.linkedin.com/messaging/", x: "https://x.com/messages" } as const;
const REMIND = [{ label: "Tomorrow", days: 1 }, { label: "In 3 days", days: 3 }, { label: "In a week", days: 7 }];
const remindAt = (days: number) => { const d = new Date(); d.setDate(d.getDate() + days); d.setHours(9, 0, 0, 0); return d.toISOString(); };

export default function CommentCard({ c, caps, showPost = true, templates, followUp }: { c: CommentRow; caps: Caps; showPost?: boolean; templates?: Template[]; followUp?: FollowUpInfo }) {
  const router = useRouter();
  const toast = useToast();
  const [text, setText] = useState("");
  const [options, setOptions] = useState<{ tone: string; text: string }[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const [warn, setWarn] = useState<string | null>(null);
  const [menu, setMenu] = useState<"tpl" | "remind" | null>(null);
  const [tpls, setTpls] = useState<Template[] | null>(templates ?? null);
  const [nudges, setNudges] = useState<string[]>([]);
  const [lead, setLead] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setMenu(null); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);

  const isX = c.platform === "x";
  const isDm = c.kind === "dm";
  const canSend = !isDm && (isX ? caps.x && !!c.externalId : caps.linkedin && hasCommentUrn(c.commentUrl));
  const open = isDm ? MESSAGES[c.platform] : c.commentUrl ?? c.postUrl;
  const tooLong = isX && text.length > 280;

  async function call(path: string, init: RequestInit, label: string) {
    setBusy(label);
    try {
      const res = await fetch(path, { headers: { "content-type": "application/json" }, ...init });
      const d = await res.json();
      if (!res.ok) { toast({ tone: "error", title: "That did not work", body: d.error }); return null; }
      return d;
    } catch {
      toast({ tone: "error", title: "Could not reach the server" });
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function suggest() {
    const d = await call(`/api/comments/${encodeURIComponent(c.id)}/suggest`, { method: "POST" }, "suggest");
    if (d) setOptions(d.replies);
  }

  async function send() {
    setWarn(null);
    const d = await call(`/api/comments/${encodeURIComponent(c.id)}/reply`, { method: "POST", body: JSON.stringify({ text, send: true }) }, "send");
    if (!d) return;
    if (d.sent) { toast({ tone: "ok", title: "Reply sent", body: isX ? "It is live on X." : "It is live on LinkedIn." }); setText(""); router.refresh(); }
    else setWarn(d.reason ?? "We could not send this from here.");
  }

  async function recordManual() {
    const d = await call(`/api/comments/${encodeURIComponent(c.id)}/reply`, { method: "POST", body: JSON.stringify({ text, send: false }) }, "record");
    if (d) { toast({ tone: "ok", title: "Marked as replied" }); setText(""); router.refresh(); }
  }

  async function copy() {
    try { await navigator.clipboard.writeText(text); toast({ tone: "ok", title: "Reply copied", body: "Paste it under the comment on the platform." }); } catch { toast({ tone: "error", title: "Could not copy" }); }
  }

  async function openTemplates() {
    setMenu(menu === "tpl" ? null : "tpl");
    if (tpls) return;
    try {
      const res = await fetch("/api/templates");
      const d = await res.json();
      setTpls(res.ok ? d.templates : STARTER_TEMPLATES);
    } catch { setTpls(STARTER_TEMPLATES); }
  }

  function useTemplate(t: Template) {
    const f = fillTemplate(t.body, { name: c.authorName, post: c.postContent, platform: c.platform });
    setText(f.text); setNotes(f.warnings); setMenu(null);
    if (!t.builtin) void fetch("/api/templates", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: t.id, use: true }) }).catch(() => {});
  }

  async function nudge() {
    const d = await call(`/api/comments/${encodeURIComponent(c.id)}/nudge`, { method: "POST", body: JSON.stringify({ days: followUp?.days }) }, "nudge");
    if (d) setNudges(d.lines);
  }

  async function markLead() {
    setBusy("lead");
    try {
      const res = await fetch("/api/leads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ commentId: c.id }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { toast({ tone: "error", title: "Could not add to Leads", body: d.error }); return; }
      setLead(true);
      toast({ tone: "ok", title: "Added to Leads", body: "Open Leads to see it." });
    } catch { toast({ tone: "error", title: "Could not reach the server" }); } finally { setBusy(null); }
  }

  const remind = async (days: number) => { setMenu(null); await patch({ followUpAt: remindAt(days) }, "We will remind us"); };
  // a reminder is cleared; a quiet conversation is closed by moving it out of Replied, so it does not come back
  const done = () => patch(followUp?.kind === "quiet" ? { followUpAt: null, status: "ignored" } : { followUpAt: null }, "Done");

  const patch = async (body: object, ok: string) => {
    const d = await call(`/api/comments/${encodeURIComponent(c.id)}`, { method: "PATCH", body: JSON.stringify(body) }, "patch");
    if (d) { toast({ tone: "ok", title: ok }); router.refresh(); }
  };
  const remove = async () => {
    if (!confirm("Delete this comment from the app? It is not deleted on the platform.")) return;
    const d = await call(`/api/comments/${encodeURIComponent(c.id)}`, { method: "DELETE" }, "delete");
    if (d) router.refresh();
  };

  return (
    <article className={`comment ${c.platform} ${c.status}`}>
      <div className="row" style={{ flexWrap: "nowrap", alignItems: "flex-start", gap: 12 }}>
        <span className={`avatar ${c.platform}`} aria-hidden="true">{(c.authorName || "?").charAt(0).toUpperCase()}</span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="row" style={{ gap: 8 }}>
            {c.authorUrl ? <a className="who" href={c.authorUrl} target="_blank" rel="noreferrer">{c.authorName}</a> : <span className="who">{c.authorName}</span>}
            {c.authorHandle && <span className="when">{c.authorHandle}</span>}
            <span className={`badge ${isX ? "x" : "li"}`}>{isX ? "X" : "LinkedIn"}</span>
            {isDm && <span className="badge">Message</span>}
            {c.status === "new" ? <span className="badge queue">Needs a reply</span> : c.status === "replied" ? <span className="badge">Replied</span> : <span className="badge">Ignored</span>}
            <span className="when" title={c.commentedAt ?? ""}>{timeAgo(c.commentedAt ?? c.createdAt)}</span>
            {c.likes ? <span className="when">{c.likes} likes</span> : null}
            {followUp?.kind === "quiet" && <span className="comments-tag quiet">Quiet for {followUp.days} {followUp.days === 1 ? "day" : "days"}</span>}
            {followUp?.kind === "due" && <span className="comments-tag due">Reminder due</span>}
            {!followUp && c.followUpAt && <span className="comments-tag" title={c.followUpAt}>Remind {new Date(c.followUpAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>}
          </div>
          {showPost && !isDm && (
            <div className="ctx">
              <span>on</span>
              {c.postId ? <Link href={`/posts/${encodeURIComponent(c.postId)}`}>{(c.postContent ?? "").replace(/\s+/g, " ").slice(0, 90) || "our post"}</Link> : <span>a post we have not stored{c.postRef ? ` (${c.postRef})` : ""}</span>}
            </div>
          )}
        </div>
        <div className="row" style={{ gap: 2, flexWrap: "nowrap" }}>
          {open && <a className="icon-btn" href={open} target="_blank" rel="noreferrer" aria-label={isDm ? `Open ${isX ? "X" : "LinkedIn"} messages` : "Open on the platform"}><Icon name="external" size={16} /></a>}
          {c.status === "new" && <button className="icon-btn" onClick={() => patch({ status: "ignored" }, "Ignored")} aria-label="Ignore" title="Ignore"><Icon name="x" size={16} /></button>}
          {c.status !== "new" && <button className="icon-btn" onClick={() => patch({ status: "new" }, "Moved back to needs a reply")} aria-label="Reopen" title="Needs a reply again"><Icon name="refresh" size={16} /></button>}
          <button className="icon-btn" onClick={remove} aria-label="Delete" title="Delete"><Icon name="alert" size={16} /></button>
        </div>
      </div>

      <div className="text">{c.body}</div>

      {c.status === "replied" && c.replyText && (
        <div className="reply-box"><div className="lab">Our reply, {VIA[c.replyVia ?? "manual"] ?? "sent"} {timeAgo(c.repliedAt)}</div>{c.replyText}</div>
      )}

      {c.status === "new" && (
        <div className="stack" style={{ gap: 10 }}>
          {!isDm && !isX && caps.linkedin && !hasCommentUrn(c.commentUrl) && (
            <div className="row" style={{ flexWrap: "nowrap" }}>
              <input className="input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="Paste this comment's link to send the reply from here" aria-label="Comment link" />
              <button className="btn ghost sm" disabled={!link.trim()} onClick={() => patch({ commentUrl: link.trim() }, "Link saved")}>Save link</button>
            </div>
          )}
          {options.length > 0 && (
            <div className="opts">{options.map((o, i) => <button key={i} className="opt" onClick={() => setText(o.text)}><small>{o.tone}</small>{o.text}</button>)}</div>
          )}
          <textarea className="input" style={{ minHeight: 84 }} value={text} onChange={(e) => { setText(e.target.value); setNotes([]); }} placeholder={isX ? "Write our reply (280 characters)" : "Write our reply"} aria-label="Reply" />
          {isX && <div className={`counter${tooLong ? " bad" : ""}`}>{text.length} / 280</div>}
          {notes.map((n, i) => <div key={i} className="warn-box"><Icon name="info" size={18} /><span>{n}</span></div>)}
          {isDm && <div className="hint">We cannot send messages from here. Copy the reply and send it in {isX ? "X" : "LinkedIn"} messages.</div>}
          {warn && <div className="warn-box"><Icon name="info" size={18} /><span>{warn}</span></div>}
          <div className="row">
            {caps.llm
              ? <button className="btn ghost sm" onClick={suggest} disabled={!!busy}><Icon name={busy === "suggest" ? "refresh" : "bulb"} size={15} className={busy === "suggest" ? "spin" : ""} />{busy === "suggest" ? "Thinking..." : "Suggest replies"}</button>
              : <Link href="/settings" className="hint" style={{ fontSize: 12.5 }}>Connect a model for reply suggestions</Link>}
            <div className="comments-menu" ref={menu === "tpl" ? box : undefined}>
              <button className="btn ghost sm" onClick={openTemplates} aria-expanded={menu === "tpl"}><Icon name="file" size={15} />Templates</button>
              {menu === "tpl" && (
                <div className="comments-pop">
                  {!tpls ? <div className="comments-empty">Loading...</div> : tpls.filter((t) => templateFits(t, c.platform)).map((t) => (
                    <button key={t.id} onClick={() => useTemplate(t)}>{t.name}<small>{t.body}</small></button>
                  ))}
                  {tpls && !tpls.some((t) => templateFits(t, c.platform)) && <div className="comments-empty">No templates for {isX ? "X" : "LinkedIn"} yet.</div>}
                </div>
              )}
            </div>
            <span className="grow" />
            {canSend && <button className="btn sm" disabled={!text.trim() || tooLong || !!busy} onClick={send}><Icon name={busy === "send" ? "refresh" : "send"} size={15} className={busy === "send" ? "spin" : ""} />{busy === "send" ? "Sending..." : `Reply on ${isX ? "X" : "LinkedIn"}`}</button>}
            {!canSend && <button className="btn sm" disabled={!text.trim() || !!busy} onClick={copy}><Icon name="copy" size={15} />Copy reply</button>}
            {!canSend && open && <a className="btn ghost sm" href={open} target="_blank" rel="noreferrer">{isDm ? `Open ${isX ? "X" : "LinkedIn"} messages` : `Open on ${isX ? "X" : "LinkedIn"}`}<Icon name="external" size={13} /></a>}
            <button className="btn ghost sm" disabled={!text.trim() || !!busy} onClick={recordManual} title="Use this after we posted the reply ourselves">Mark as replied</button>
          </div>
        </div>
      )}

      {followUp?.kind === "quiet" && (
        <div className="stack" style={{ gap: 6 }}>
          {nudges.length > 0 && (
            <div className="comments-nudges">
              {nudges.map((l, i) => (
                <div key={i} className="comments-nudge"><span>{l}</span>
                  <button className="btn ghost sm" onClick={async () => { try { await navigator.clipboard.writeText(l); toast({ tone: "ok", title: "Line copied", body: `Send it ${isDm ? "in messages" : "as a reply"} on ${isX ? "X" : "LinkedIn"}.` }); } catch { toast({ tone: "error", title: "Could not copy" }); } }}><Icon name="copy" size={14} />Copy</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="comments-foot">
        <div className="comments-menu" ref={menu === "remind" ? box : undefined}>
          <button className="btn ghost sm" onClick={() => setMenu(menu === "remind" ? null : "remind")} aria-expanded={menu === "remind"} disabled={!!busy}><Icon name="bell" size={15} />Remind me</button>
          {menu === "remind" && <div className="comments-pop">{REMIND.map((r) => <button key={r.days} onClick={() => remind(r.days)}>{r.label}</button>)}</div>}
        </div>
        {(c.followUpAt || followUp) && <button className="btn ghost sm" onClick={done} disabled={!!busy}><Icon name="check" size={15} />Done</button>}
        {followUp?.kind === "quiet" && <button className="btn ghost sm" onClick={nudge} disabled={!!busy}><Icon name={busy === "nudge" ? "refresh" : "bulb"} size={15} className={busy === "nudge" ? "spin" : ""} />{busy === "nudge" ? "Thinking..." : "Suggest a nudge"}</button>}
        <span className="grow" />
        {lead ? <Link href="/leads" className="btn ghost sm">Open Leads</Link> : <button className="btn ghost sm" onClick={markLead} disabled={!!busy}><Icon name="target" size={15} />Mark as lead</button>}
      </div>
    </article>
  );
}
