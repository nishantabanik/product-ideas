"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { addDays, dayKey, gridDays, groupByDay, STATE_LABEL, type CalItem } from "@/lib/calendar";
import Seg from "../components/seg";
import { Icon } from "../components/icons";

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const stateBadge = (s: string) => (s === "ERROR" ? "err" : s === "QUEUE" ? "queue" : "");

type Entry = { at: number; items: CalItem[] };
const cache = new Map<string, Entry>();
const TTL = 60_000;

async function load(days: Date[]): Promise<CalItem[]> {
  const start = days[0].toISOString();
  const end = addDays(days[days.length - 1], 1).toISOString();
  const key = `${start}|${end}`;
  const res = await fetch(`/api/calendar?start=${start}&end=${end}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not load posts");
  cache.set(key, { at: Date.now(), items: data });
  return data;
}
const keyOf = (days: Date[]) => `${days[0].toISOString()}|${addDays(days[days.length - 1], 1).toISOString()}`;

export default function CalendarView() {
  const [view, setView] = useState<"month" | "week">("month");
  const [anchor, setAnchor] = useState(() => new Date());
  const [items, setItems] = useState<CalItem[] | null>(null);
  const [selected, setSelected] = useState(() => dayKey(new Date()));
  const [filter, setFilter] = useState<"all" | "x" | "linkedin">("all");
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const seq = useRef(0);

  const days = useMemo(() => gridDays(anchor, view), [anchor, view]);
  const todayKey = dayKey(new Date());

  useEffect(() => {
    const id = ++seq.current;
    const hit = cache.get(keyOf(days));
    if (hit) { setItems(hit.items); setStale(false); } else { setStale(true); }
    setError(null);
    if (!hit || Date.now() - hit.at > TTL) {
      load(days).then((d) => { if (id === seq.current) { setItems(d); setStale(false); } })
        .catch((e) => { if (id === seq.current) { setError(e.message); setStale(false); } });
    }
    // quietly warm the neighbouring periods so the arrows feel instant
    const step = view === "month" ? [new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1), new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1)] : [addDays(anchor, -7), addDays(anchor, 7)];
    const t = setTimeout(() => step.forEach((a) => { const g = gridDays(a, view); if (!cache.has(keyOf(g))) load(g).catch(() => {}); }), 600);
    return () => clearTimeout(t);
  }, [days, view, anchor]);

  const byDay = useMemo(() => groupByDay((items ?? []).filter((i) => filter === "all" || i.platform === filter)), [items, filter]);
  const dayItems = byDay.get(selected) ?? [];
  const step = (dir: number) => setAnchor(view === "month" ? new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1) : addDays(anchor, 7 * dir));
  const title = view === "month"
    ? anchor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : `${days[0].toLocaleDateString("en-GB", { day: "numeric", month: "short" })} to ${days[6].toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <>
      <div className="toolbar">
        <div className="row" style={{ gap: 6 }}>
          <button className="btn ghost sm" onClick={() => step(-1)} aria-label="Previous"><Icon name="left" size={16} /></button>
          <button className="btn ghost sm" onClick={() => step(1)} aria-label="Next"><Icon name="right" size={16} /></button>
          <button className="btn ghost sm" onClick={() => { setAnchor(new Date()); setSelected(todayKey); }}>Today</button>
        </div>
        <h2 style={{ fontSize: 20, minWidth: 190 }}>{title}</h2>
        <Seg small label="View" value={view} onChange={(v) => setView(v as "month" | "week")} options={[{ value: "month", label: "Month" }, { value: "week", label: "Week" }]} />
        <Seg small label="Platform" value={filter} onChange={(v) => setFilter(v as "all" | "x" | "linkedin")} options={[{ value: "all", label: "Both" }, { value: "linkedin", label: "LinkedIn" }, { value: "x", label: "X" }]} />
        <div className="legend grow"><span><i className="dotc" style={{ background: "var(--blue)" }} />LinkedIn</span><span><i className="dotc" style={{ background: "var(--orange)" }} />X</span></div>
      </div>

      {error && <div className="note" style={{ marginBottom: 12 }}><Icon name="alert" size={18} />{error}</div>}

      {items === null && !error ? (
        <div className="cal">{Array.from({ length: 42 }, (_, i) => <div key={i} className="skel" style={{ height: 116, borderRadius: 12 }} />)}</div>
      ) : view === "month" ? (
        <div className="cal month-anim" key={`${anchor.getFullYear()}-${anchor.getMonth()}`} style={{ opacity: stale ? 0.6 : 1, transition: "opacity .2s" }}>
          {DOW.map((d) => <div className="dow" key={d}>{d}</div>)}
          {days.map((d) => {
            const k = dayKey(d);
            const list = byDay.get(k) ?? [];
            return (
              <button key={k} onClick={() => setSelected(k)} className={`cell${d.getMonth() !== anchor.getMonth() ? " out" : ""}${k === todayKey ? " today" : ""}${k === selected ? " sel" : ""}`}>
                <div className="d"><span>{d.getDate()}</span>{list.length > 0 && <span className="hint">{list.length}</span>}</div>
                {list.slice(0, 3).map((it) => <span key={it.id} className={`ev ${it.platform} ${it.state}`}>{time(it.date)} {it.content}</span>)}
                {list.length > 3 && <div className="more">+{list.length - 3} more</div>}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="week month-anim" key={dayKey(days[0])}>
          {days.map((d, i) => {
            const k = dayKey(d);
            return (
              <div key={k} className={`col${k === todayKey ? " today" : ""}`} onClick={() => setSelected(k)}>
                <h4>{DOW[i]} {d.getDate()}</h4>
                {(byDay.get(k) ?? []).map((it) => <span key={it.id} className={`ev ${it.platform} ${it.state}`}>{time(it.date)} {it.content}</span>)}
              </div>
            );
          })}
        </div>
      )}

      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-h">
          <h2>{new Date(`${selected}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</h2>
          <Link href={`/compose?date=${selected}`} className="btn sm"><Icon name="plus" size={15} />New post this day</Link>
        </div>
        <div className="daylist">
          {dayItems.length === 0 && <p className="hint" style={{ margin: 0 }}>Nothing scheduled for this day.</p>}
          {dayItems.map((it) => (
            <div key={it.id} className={`item ${it.platform}`}>
              <div className="meta">
                <span className={`badge ${it.platform === "x" ? "x" : "li"}`}>{it.platform === "x" ? "X" : "LinkedIn"}</span>
                <span className={`badge ${stateBadge(it.state)}`}>{STATE_LABEL[it.state] ?? it.state}</span>
                <span>{time(it.date)}</span>
                {it.channel && <span>{it.channel}</span>}
                {it.url && <a href={it.url} target="_blank" rel="noreferrer">Open post <Icon name="external" size={12} /></a>}
              </div>
              <p>{it.content}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
