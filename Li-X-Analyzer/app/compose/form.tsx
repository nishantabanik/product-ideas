"use client";
import { useState } from "react";
import Seg from "../components/seg";
import { Icon } from "../components/icons";
import { useToast } from "../components/toast";
import { ChannelSelects, useChannels } from "../use-channels";

type Target = "x" | "linkedin" | "both";

function defaultWhen(date?: string) {
  const d = date ? new Date(`${date}T09:00`) : new Date(Date.now() + 86_400_000);
  if (!date) d.setHours(9, 0, 0, 0);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function ComposeForm({ initialDate, initialText, initialTarget }: { initialDate?: string; initialText?: string; initialTarget?: Target }) {
  const { channels, chosen, setChosen, error } = useChannels();
  const toast = useToast();
  const [target, setTarget] = useState<Target>(initialTarget ?? "both");
  const [mode, setMode] = useState<"schedule" | "now">("schedule");
  const [content, setContent] = useState(initialText ?? "");
  const [when, setWhen] = useState(() => defaultWhen(initialDate));
  const [busy, setBusy] = useState(false);

  const ids = [target !== "linkedin" && chosen.x, target !== "x" && chosen.linkedin].filter(Boolean) as string[];
  const tooLong = target !== "linkedin" && content.length > 280;
  const missing = (target !== "linkedin" && !chosen.x) || (target !== "x" && !chosen.linkedin);
  const ready = !busy && content.trim() && ids.length && !missing && !tooLong && (mode === "now" || when);

  async function submit() {
    setBusy(true);
    try {
      const res = await fetch("/api/schedule", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, channelIds: ids, now: mode === "now", date: mode === "schedule" ? new Date(when).toISOString() : undefined }),
      });
      const d = await res.json();
      if (!res.ok) return toast({ tone: "error", title: "Could not send", body: d.error });
      toast({ tone: "ok", title: mode === "now" ? "Posting now" : "Scheduled", body: mode === "now" ? "It will show on the calendar in a moment." : "Find it on the calendar." });
      setContent("");
    } catch {
      toast({ tone: "error", title: "Could not reach the server" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid g-main">
      <div className="card stack">
        {error && <div className="note"><Icon name="alert" size={18} />{error}</div>}
        <div className="field">
          <span>Where to post</span>
          <div className="row" style={{ alignItems: "stretch" }}>
            {([["x", "X", "Up to 280 characters"], ["linkedin", "LinkedIn", "Up to 3,000 characters"], ["both", "Both", "Same text on X and LinkedIn"]] as const).map(([v, l, s]) => (
              <button type="button" key={v} className={`pick ${v}${target === v ? " on" : ""}`} onClick={() => setTarget(v)}>{l}<small>{s}</small></button>
            ))}
          </div>
        </div>
        <ChannelSelects channels={channels} chosen={chosen} setChosen={setChosen} />
        {missing && channels.length > 0 && <p className="warn" style={{ margin: 0 }}>No {target === "x" ? "X" : target === "linkedin" ? "LinkedIn" : "X or LinkedIn"} channel is connected in Postiz yet.</p>}
        <label className="field"><span>Post</span>
          <textarea className="input" value={content} onChange={(e) => setContent(e.target.value)} placeholder="What do we want to say?" />
          <div className={`counter${tooLong ? " bad" : ""}`}>{content.length.toLocaleString("en-US")}{target !== "linkedin" ? " / 280 on X" : " / 3,000"}</div>
        </label>
      </div>

      <div className="card stack">
        <div className="field"><span>When</span>
          <Seg label="When" value={mode} onChange={(v) => setMode(v as "schedule" | "now")} options={[{ value: "schedule", label: "Schedule" }, { value: "now", label: "Post now" }]} />
        </div>
        {mode === "schedule" && <label className="field"><span>Date and time (our local time)</span><input className="input" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /></label>}
        <button className="btn" disabled={!ready} onClick={submit}><Icon name={busy ? "refresh" : "check"} size={16} className={busy ? "spin" : ""} />{busy ? "Sending..." : mode === "now" ? "Post now" : "Schedule post"}</button>
        <p className="hint" style={{ margin: 0 }}>Postiz publishes at the chosen time, even when this page is closed.</p>
      </div>
    </div>
  );
}
