"use client";
import { useMemo, useRef, useState } from "react";
import type { BulkRow } from "@/lib/bulk";
import { zonedToUtc } from "@/lib/tz";
import { Icon } from "../components/icons";
import { useToast } from "../components/toast";
import { ChannelSelects, useChannels } from "../use-channels";

type Status = "pending" | "sending" | "done" | "failed";
const LABEL = { x: "X", linkedin: "LinkedIn", both: "Both" } as const;
const CONCURRENCY = 3;

export default function BulkForm() {
  const { channels, chosen, setChosen, error: chError } = useChannels();
  const toast = useToast();
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [status, setStatus] = useState<Record<number, { s: Status; err?: string }>>({});
  const [tz, setTz] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const utc = (r: BulkRow) => { try { return zonedToUtc(r.date, tz); } catch { return null; } };
  const past = (r: BulkRow) => { const u = utc(r); return !u || u.getTime() < Date.now() + 60_000; };
  const valid = useMemo(() => rows.filter((r) => !r.errors.length && !past(r)), [rows, tz]); // eslint-disable-line react-hooks/exhaustive-deps
  const todo = valid.filter((r) => status[r.line]?.s !== "done");
  const done = rows.filter((r) => status[r.line]?.s === "done").length;
  const missingChannel = (valid.some((r) => r.platform !== "linkedin") && !chosen.x) || (valid.some((r) => r.platform !== "x") && !chosen.linkedin);

  async function onFile(file?: File) {
    if (!file) return;
    setRows([]); setStatus({}); setParsing(true);
    const body = new FormData();
    body.set("file", file);
    try {
      const res = await fetch("/api/bulk", { method: "POST", body });
      const d = await res.json();
      if (!res.ok) return toast({ tone: "error", title: "Could not read the file", body: d.error });
      setRows(d.rows);
    } catch {
      toast({ tone: "error", title: "Could not reach the server" });
    } finally {
      setParsing(false);
    }
  }

  async function run() {
    setRunning(true);
    const queue = [...todo];
    let failed = 0, limited = false;
    const worker = async () => {
      for (let r = queue.shift(); r && !limited; r = queue.shift()) {
        setStatus((s) => ({ ...s, [r.line]: { s: "sending" } }));
        const channelIds = [r.platform !== "linkedin" && chosen.x, r.platform !== "x" && chosen.linkedin].filter(Boolean);
        try {
          const res = await fetch("/api/schedule", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: r.content, channelIds, date: utc(r)!.toISOString() }) });
          const d = await res.json().catch(() => ({}));
          if (res.ok) setStatus((s) => ({ ...s, [r.line]: { s: "done" } }));
          else {
            failed++;
            setStatus((s) => ({ ...s, [r.line]: { s: "failed", err: d.error ?? "Failed" } }));
            if (res.status === 429 || /429/.test(d.error ?? "")) limited = true;
          }
        } catch {
          failed++;
          setStatus((s) => ({ ...s, [r.line]: { s: "failed", err: "Could not reach the server" } }));
        }
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    setRunning(false);
    if (limited) toast({ tone: "error", title: "Postiz rate limit reached", body: "Nothing more was sent. Press the button again in an hour to send what is left." });
    else if (failed) toast({ tone: "error", title: `${failed} post(s) failed`, body: "Finished ones are skipped if we press the button again." });
    else toast({ tone: "ok", title: "All posts are scheduled", body: "Open the calendar to see them." });
  }

  return (
    <div className="stack">
      <div className="grid g-main">
        <div className={`drop${over ? " over" : ""}`} role="button" tabIndex={0}
          onClick={() => input.current?.click()} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); onFile(e.dataTransfer.files[0]); }}>
          <span className="big"><Icon name={parsing ? "refresh" : "upload"} size={24} className={parsing ? "spin" : ""} /></span>
          <h3>{parsing ? "Reading the file..." : "Drop our posts file here"}</h3>
          <p>.xlsx or .csv with the columns date, time, platform, content</p>
          <input ref={input} type="file" accept=".xlsx,.csv" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
        </div>
        <div className="card stack">
          <label className="field"><span>Times in this timezone</span><input className="input" type="text" value={tz} onChange={(e) => setTz(e.target.value)} placeholder="Europe/Berlin" /></label>
          <ChannelSelects channels={channels} chosen={chosen} setChosen={setChosen} />
          <a href="/bulk-template.csv" download className="btn ghost sm"><Icon name="file" size={15} />Download a sample file</a>
          {chError && <p className="warn" style={{ margin: 0 }}>{chError}</p>}
        </div>
      </div>

      {rows.length > 0 && (
        <div className="card page">
          <div className="card-h">
            <div><h2>Preview</h2><p>{valid.length} of {rows.length} rows are ready. Others show why they are skipped.</p></div>
            <button className="btn" disabled={running || !todo.length || missingChannel} onClick={run}>
              <Icon name={running ? "refresh" : "check"} size={16} className={running ? "spin" : ""} />
              {running ? `Scheduling ${done} of ${valid.length}...` : `Schedule ${todo.length} post${todo.length === 1 ? "" : "s"}`}
            </button>
          </div>
          {(running || done > 0) && <div className="progress" style={{ marginBottom: 14 }}><div style={{ width: `${(done / Math.max(valid.length, 1)) * 100}%` }} /></div>}
          {valid.length > 80 && <div className="note" style={{ marginBottom: 14 }}><Icon name="info" size={18} />Postiz allows about 90 requests per hour, so more than 80 posts may need a second run later.</div>}
          <div className="scroll-x">
            <table className="table">
              <thead><tr><th>Row</th><th>When</th><th>Where</th><th>Post</th><th>Status</th></tr></thead>
              <tbody>
                {rows.map((r) => {
                  const st = status[r.line];
                  const problems = [...r.errors, ...(!r.errors.length && past(r) ? ["Date is in the past"] : [])];
                  return (
                    <tr key={r.line}>
                      <td className="hint">{r.line}</td>
                      <td style={{ whiteSpace: "nowrap" }}>{r.date.replace("T", " ")}</td>
                      <td>{r.platform ? <span className={`badge ${r.platform === "x" ? "x" : r.platform === "linkedin" ? "li" : ""}`}>{LABEL[r.platform]}</span> : <span className="warn">?</span>}</td>
                      <td><span className="clip">{r.content}</span></td>
                      <td>
                        {problems.length ? <span className="warn">{problems.join(". ")}</span>
                          : st?.s === "done" ? <span className="badge li"><Icon name="check" size={12} />Scheduled</span>
                          : st?.s === "failed" ? <span className="warn">{st.err}</span>
                          : st?.s === "sending" ? <span className="hint">Sending...</span> : <span className="badge queue">Ready</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {missingChannel && <p className="warn" style={{ marginBottom: 0 }}>A needed channel is not connected in Postiz.</p>}
        </div>
      )}
    </div>
  );
}
