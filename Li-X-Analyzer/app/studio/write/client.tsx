"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "../../components/icons";
import { useToast } from "../../components/toast";
import ModelSelect from "../model-select";
import { gradeLabel } from "@/lib/studio/simple";
import { tweetLength } from "@/lib/studio/thread";
import type { Format, Output, Structure } from "@/lib/studio/formats";
import { buildProfile, estimateTokens, type Asset } from "@/lib/studio/assets";

type Result = { linkedin?: string; x?: string; grade: { linkedin: number | null; x: number | null }; model: string; fixed: boolean; shortened?: string[]; profileTokens?: number };
const LS = "lix-write";

export default function WriteClient({ llm, groups, formats, structures, assets, outputs }: { llm: boolean; groups: string[]; formats: Format[]; structures: Structure[]; assets: Asset[]; outputs: Output[] }) {
  const router = useRouter();
  const toast = useToast();
  const [topic, setTopic] = useState("");
  const [details, setDetails] = useState("");
  const [format, setFormat] = useState("before-after");
  const [structure, setStructure] = useState("");
  const [search, setSearch] = useState("");
  const [li, setLi] = useState(true);
  const [x, setX] = useState(true);
  const [useVoice, setUseVoice] = useState(false);
  const [model, setModel] = useState("");
  // Our style: what is switched on by default in My style starts ticked, and each post can change it.
  const of = (k: Asset["kind"]) => assets.filter((a) => a.kind === k);
  const [toneId, setToneId] = useState(() => of("tone").find((a) => a.active)?.id ?? "");
  const [styleIds, setStyleIds] = useState<string[]>(() => of("style").filter((a) => a.active).map((a) => a.id));
  const [memoryIds, setMemoryIds] = useState<string[]>(() => of("memory").filter((a) => a.active).map((a) => a.id));
  const [skillIds, setSkillIds] = useState<string[]>(() => of("skill").filter((a) => a.active).map((a) => a.id));
  const [outputId, setOutputId] = useState("standard");
  const [simple, setSimple] = useState(true);
  const toggle = (list: string[], set: (v: string[]) => void, id: string) => set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const fitsPlatform = (a: Asset) => a.platform === "both" || (a.platform === "linkedin" ? li : x);
  const profile = useMemo(() => buildProfile({
    tone: of("tone").find((a) => a.id === toneId && fitsPlatform(a)) ?? null,
    styles: of("style").filter((a) => styleIds.includes(a.id) && fitsPlatform(a)),
    memories: of("memory").filter((a) => memoryIds.includes(a.id) && fitsPlatform(a)),
    skills: of("skill").filter((a) => skillIds.includes(a.id) && fitsPlatform(a)),
  }), [assets, toneId, styleIds, memoryIds, skillIds, li, x]); // eslint-disable-line react-hooks/exhaustive-deps
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Result | null>(null);
  const [liText, setLiText] = useState("");
  const [xText, setXText] = useState("");

  useEffect(() => {
    let saved: { format?: string; structure?: string; li?: boolean; x?: boolean; useVoice?: boolean } = {};
    try { saved = JSON.parse(localStorage.getItem(LS) ?? "{}"); } catch { /* private window */ }
    if (saved.format && formats.some((f) => f.id === saved.format)) setFormat(saved.format);
    if (saved.structure !== undefined) setStructure(saved.structure);
    if (saved.li !== undefined) setLi(saved.li);
    if (saved.x !== undefined) setX(saved.x);
    if (saved.useVoice !== undefined) setUseVoice(saved.useVoice);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { try { localStorage.setItem(LS, JSON.stringify({ format, structure, li, x, useVoice })); } catch { /* ignore */ } }, [format, structure, li, x, useVoice]);

  const chosen = formats.find((f) => f.id === format)!;
  const chosenStructure = structures.find((s) => s.id === structure);
  const q = search.trim().toLowerCase();
  const shown = useMemo(() => formats.filter((f) => !q || `${f.name} ${f.example} ${f.group}`.toLowerCase().includes(q)), [formats, q]);

  async function write() {
    setBusy(true);
    try {
      const platforms = [li && "linkedin", x && "x"].filter(Boolean);
      const r = await fetch("/api/studio/write", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ topic, details, format, structure, platforms, model, useVoice, tone: toneId, styles: styleIds, memories: memoryIds, skills: skillIds, output: outputId, simple }) });
      const d = await r.json();
      if (!r.ok) return toast({ tone: "error", title: "Could not write the post", body: d.error });
      setRes(d); setLiText(d.linkedin ?? ""); setXText(d.x ?? "");
    } catch { toast({ tone: "error", title: "Could not reach the server" }); } finally { setBusy(false); }
  }
  async function copy(t: string) { await navigator.clipboard.writeText(t).catch(() => {}); toast({ tone: "ok", title: "Copied" }); }
  async function save(platform: "linkedin" | "x", content: string) {
    const r = await fetch("/api/studio", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ platform, status: "draft", title: topic.slice(0, 80), content, source: "ai" }) });
    const d = await r.json();
    if (!r.ok) return toast({ tone: "error", title: "Could not save", body: d.error });
    toast({ tone: "ok", title: "Saved as a draft" });
    router.push(`/studio/${d.id}`);
  }
  const xLen = tweetLength(xText);
  const can = llm && topic.trim() && (li || x) && !busy;

  return (
    <div className="write">
      <div className="stack">
        <div className="card stack">
          <label className="field"><span>1. What is the post about?</span>
            <textarea className="input" style={{ minHeight: 84 }} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="For example: why we stopped doing daily status meetings" /></label>
          <label className="field"><span>Facts to use (optional, but it makes the post real)</span>
            <textarea className="input" style={{ minHeight: 70 }} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Numbers, names, what happened. We only use what we write here." /></label>
        </div>

        <div className="card stack">
          <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <strong>2. Pick a story format ({formats.length})</strong>
            <input className="input" style={{ maxWidth: 220 }} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search formats" aria-label="Search formats" />
          </div>
          <div className="write-formats">
            {groups.map((g) => {
              const list = shown.filter((f) => f.group === g);
              if (!list.length) return null;
              return <div key={g}><h4>{g}</h4><div className="opts-row">{list.map((f) => <button key={f.id} type="button" className={f.id === format ? "on" : ""} onClick={() => setFormat(f.id)}>{f.name}</button>)}</div></div>;
            })}
            {shown.length === 0 && <p className="hint">No format matches. Clear the search.</p>}
          </div>
          <div className="write-pick"><strong>{chosen.name}</strong>.{chosen.example ? <> Example: <em>{chosen.example}</em></> : null}<br />{chosen.guide}</div>
          <label className="field"><span>Story structure (optional, used inside the format)</span>
            <select className="input" value={structure} onChange={(e) => setStructure(e.target.value)}>
              <option value="">Let the format decide</option>
              {structures.map((s) => <option key={s.id} value={s.id}>{s.name}: {s.steps}</option>)}
            </select></label>
          {chosenStructure && <p className="hint" style={{ margin: 0 }}>{chosenStructure.guide}</p>}
        </div>

        <div className="card stack">
          <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <strong>3. Our style (optional)</strong>
            <Link className="hint" href="/studio/style">Edit in My style</Link>
          </div>
          <label className="field"><span>Kind of writing</span>
            <select className="input" value={outputId} onChange={(e) => setOutputId(e.target.value)}>
              {outputs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              {of("output").filter(fitsPlatform).map((o) => <option key={o.id} value={`custom:${o.id}`}>{o.name} (ours)</option>)}
            </select></label>
          {of("tone").length > 0 && (
            <label className="field"><span>Tone</span>
              <select className="input" value={toneId} onChange={(e) => setToneId(e.target.value)}>
                <option value="">No special tone</option>
                {of("tone").map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select></label>
          )}
          {([["style", "Way of writing", styleIds, setStyleIds], ["memory", "Memory", memoryIds, setMemoryIds], ["skill", "Skill files", skillIds, setSkillIds]] as const).map(([kind, label, ids, set]) => of(kind).length > 0 && (
            <div key={kind} className="field"><span>{label}</span>
              <div className="stack" style={{ gap: 4 }}>
                {of(kind).map((a) => (
                  <label key={a.id} className="row" style={{ cursor: "pointer", alignItems: "flex-start", opacity: fitsPlatform(a) ? 1 : 0.5 }}>
                    <input type="checkbox" checked={ids.includes(a.id)} onChange={() => toggle(ids, set, a.id)} style={{ marginTop: 3 }} />
                    <span>{a.name}{a.platform !== "both" ? <span className="hint"> ({a.platform === "x" ? "X only" : "LinkedIn only"})</span> : null}</span>
                  </label>
                ))}
              </div></div>
          ))}
          {assets.length === 0 && <p className="hint" style={{ margin: 0 }}>Nothing saved yet. Open <Link href="/studio/style">My style</Link> to add our tone, rules, memory and skill files.</p>}
          <label className="row" style={{ cursor: "pointer" }}><input type="checkbox" checked={simple} onChange={(e) => setSimple(e.target.checked)} />Keep the English simple (Class 5 level)</label>
          {profile.chars > 0 && <p className="hint" style={{ margin: 0 }}>Our style adds about {estimateTokens(profile.chars).toLocaleString("en-US")} tokens to each call.{profile.shortened.length ? ` Shortened to fit: ${profile.shortened.join(", ")}.` : ""}</p>}
        </div>

        <div className="card stack">
          <strong>4. Pick the model and the places</strong>
          <ModelSelect llm={llm} value={model} onChange={setModel} />
          <div className="row" style={{ flexWrap: "wrap", gap: 18 }}>
            <label className="row" style={{ cursor: "pointer" }}><input type="checkbox" checked={li} onChange={(e) => setLi(e.target.checked)} />LinkedIn</label>
            <label className="row" style={{ cursor: "pointer" }}><input type="checkbox" checked={x} onChange={(e) => setX(e.target.checked)} />X (279 characters or less)</label>
            <label className="row" style={{ cursor: "pointer" }}><input type="checkbox" checked={useVoice} onChange={(e) => setUseVoice(e.target.checked)} />Match the tone of our past posts</label>
          </div>
          <div><button className="btn" disabled={!can} onClick={write}><Icon name={busy ? "refresh" : "pen"} size={16} className={busy ? "spin" : ""} />{busy ? "Writing..." : "Write the post"}</button></div>
        </div>
      </div>

      <div className="stack write-out">
        {!res && !busy && <div className="card"><p className="hint" style={{ margin: 0 }}>Our posts will appear here. We write them in simple English, with no dashes, and the X post stays under 280 characters.</p></div>}
        {busy && <div className="card"><p className="hint" style={{ margin: 0 }}>Writing with {model ? model.replace(/^(gateway|copilot)::/, "") : "our model"}...</p></div>}
        {res && res.linkedin !== undefined && (
          <div className="card stack">
            <div className="row" style={{ justifyContent: "space-between" }}><h3 style={{ margin: 0 }}>LinkedIn post</h3><span className="chip tiny linkedin">LinkedIn</span></div>
            <textarea className="input" value={liText} onChange={(e) => setLiText(e.target.value)} style={{ minHeight: 260 }} />
            <div className="write-meta"><span>{liText.length} characters</span><span>Reading level: {res.grade.linkedin == null ? "too short to score" : `grade ${res.grade.linkedin}, ${gradeLabel(res.grade.linkedin)}`}</span></div>
            <div className="row"><button className="btn ghost sm" onClick={() => copy(liText)}><Icon name="copy" size={15} />Copy</button><button className="btn ghost sm" onClick={() => save("linkedin", liText)}>Save as a draft</button><button className="btn ghost sm" disabled={busy} onClick={write}>Write again</button></div>
          </div>
        )}
        {res && res.x !== undefined && (
          <div className="card stack">
            <div className="row" style={{ justifyContent: "space-between" }}><h3 style={{ margin: 0 }}>X post</h3><span className="chip tiny x">X</span></div>
            <textarea className="input" value={xText} onChange={(e) => setXText(e.target.value)} />
            <div className="write-meta"><span className={xLen > 279 ? "over" : ""}>{xLen} / 279 characters</span><span>Reading level: {res.grade.x == null ? "too short to score" : `grade ${res.grade.x}, ${gradeLabel(res.grade.x)}`}</span></div>
            <div className="row"><button className="btn ghost sm" onClick={() => copy(xText)}><Icon name="copy" size={15} />Copy</button><button className="btn ghost sm" disabled={xLen > 279} onClick={() => save("x", xText)}>Save as a draft</button><button className="btn ghost sm" disabled={busy} onClick={write}>Write again</button></div>
          </div>
        )}
        {res && <p className="hint" style={{ margin: 0 }}>Written by {res.model}{res.fixed ? ", then fixed once for length or reading level" : ""}. Saved drafts open in the editor, where they can be checked, approved and scheduled.</p>}
      </div>
    </div>
  );
}
