"use client";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import Seg from "../components/seg";
import { Icon } from "../components/icons";
import { useToast } from "../components/toast";

export type PostOption = { id: string; platform: "linkedin" | "x"; label: string };

export default function AddComments({ posts, llm, fixed }: { posts: PostOption[]; llm: boolean; fixed?: { id: string; platform: "linkedin" | "x" } }) {
  const router = useRouter();
  const toast = useToast();
  const [platform, setPlatform] = useState<"linkedin" | "x">(fixed?.platform ?? "linkedin");
  const [kind, setKind] = useState<"comment" | "dm">("comment");
  const dm = kind === "dm" && !fixed;
  const [mode, setMode] = useState<"paste" | "single" | "file">("paste");
  const [post, setPost] = useState(fixed?.id ?? "");
  const [postLink, setPostLink] = useState("");
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [link, setLink] = useState("");
  const [smart, setSmart] = useState(llm);
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const options = useMemo(() => posts.filter((p) => p.platform === platform), [posts, platform]);
  const target = dm ? "" : fixed?.id ?? (post || postLink.trim());

  const done = (d: { added: number; skipped: number; found: number; method?: string }) => {
    toast({ tone: d.added ? "ok" : "info", title: d.added ? `${d.added} new ${dm ? "message" : "comment"}${d.added === 1 ? "" : "s"} added` : "Nothing new", body: `${d.found} found${d.skipped ? `, ${d.skipped} already here` : ""}${d.method === "model" ? ". Read by our model." : ""}` });
    setText(""); setAuthor(""); setLink(""); router.refresh();
  };

  async function submit() {
    setBusy(true);
    try {
      let res: Response;
      if (mode === "file" && !dm) {
        const f = file.current?.files?.[0];
        if (!f) return toast({ tone: "error", title: "Choose a file first" });
        const body = new FormData();
        body.set("file", f); body.set("platform", platform); body.set("post", target);
        res = await fetch("/api/comments/file", { method: "POST", body });
      } else {
        res = await fetch("/api/comments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: dm ? "dm" : "comment", platform, post: target || null, mode: mode === "single" ? "single" : "paste", text, smart, author, body: text, link: link || null }) });
      }
      const d = await res.json();
      if (!res.ok) return toast({ tone: "error", title: "Could not add", body: d.error });
      done(d);
    } catch { toast({ tone: "error", title: "Could not reach the server" }); } finally { setBusy(false); }
  }

  return (
    <div className="card stack">
      <div className="card-h" style={{ marginBottom: 0 }}>
        <div><h2>{dm ? "Add messages" : "Add comments"}</h2><p>{dm ? `${platform === "linkedin" ? "LinkedIn" : "X"} does not let apps read direct messages, so we capture them here. Replies to messages are always sent by us on the platform.` : platform === "linkedin" ? "LinkedIn does not let apps read the comments on a personal profile, so we capture them here." : "X replies come in automatically when the X keys are set. Add any others here."}</p></div>
        <div className="row">
          {!fixed && <Seg small label="Type" value={kind} onChange={(v) => { setKind(v as "comment" | "dm"); if (v === "dm" && mode === "file") setMode("paste"); }} options={[{ value: "comment", label: "Comment" }, { value: "dm", label: "Message" }]} />}
          {!fixed && <Seg small label="Platform" value={platform} onChange={(v) => { setPlatform(v as "linkedin" | "x"); setPost(""); }} options={[{ value: "linkedin", label: "LinkedIn" }, { value: "x", label: "X" }]} />}
          <Seg small label="How" value={mode} onChange={(v) => setMode(v as typeof mode)} options={[{ value: "paste", label: "Paste many" }, { value: "single", label: "Add one" }, ...(dm ? [] : [{ value: "file", label: "From a file" }])]} />
        </div>
      </div>

      {!fixed && !dm && (
        <div className="grid g-2">
          <label className="field"><span>Which of our posts</span>
            <select className="input" value={post} onChange={(e) => setPost(e.target.value)}>
              <option value="">Choose a post</option>
              {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select></label>
          <label className="field"><span>Or the link of the post</span><input className="input" value={postLink} onChange={(e) => setPostLink(e.target.value)} placeholder="https://www.linkedin.com/feed/update/..." disabled={!!post} /></label>
        </div>
      )}

      {mode === "paste" && (
        <>
          <label className="field"><span>{dm ? "Paste the messages" : "Paste the comments"}</span>
            <textarea className="input" style={{ minHeight: 150 }} value={text} onChange={(e) => setText(e.target.value)}
              placeholder={dm ? "Open the conversation, select the messages from the other person, copy and paste here.\n\nOne per block, a blank line between blocks:\nJane Doe\nCan we talk about pricing?" : "On the post page, select the comments, copy and paste here.\n\nOr one per block, a blank line between blocks:\nJane Doe\nGreat post, we saw the same thing.\n\nSam: Where can I read more?"} /></label>
          <label className="row" style={{ cursor: llm ? "pointer" : "default", opacity: llm ? 1 : 0.55 }}>
            <input type="checkbox" checked={smart && llm} disabled={!llm} onChange={(e) => setSmart(e.target.checked)} />
            <span>Smart paste: let our model find the authors and {dm ? "messages" : "comments"} in messy text{llm ? "" : " (connect a model on the Settings page)"}</span>
          </label>
        </>
      )}
      {mode === "single" && (
        <div className="stack" style={{ gap: 12 }}>
          <div className="grid g-2">
            <label className="field"><span>Who wrote it</span><input className="input" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Jane Doe" /></label>
            {!dm && <label className="field"><span>Link to the comment (optional)</span><input className="input" value={link} onChange={(e) => setLink(e.target.value)} placeholder={platform === "linkedin" ? "From Copy link to comment, lets us send the reply from here" : "https://x.com/..."} /></label>}
          </div>
          <label className="field"><span>{dm ? "The message" : "The comment"}</span><textarea className="input" style={{ minHeight: 100 }} value={text} onChange={(e) => setText(e.target.value)} /></label>
        </div>
      )}
      {mode === "file" && (
        <label className="field"><span>An Excel or CSV file with the columns author and comment (optional: date, link, post)</span><input ref={file} className="input" type="file" accept=".xlsx,.csv" /></label>
      )}
      <div className="row"><button className="btn" disabled={busy || (mode !== "file" && !text.trim())} onClick={submit}><Icon name={busy ? "refresh" : "plus"} size={16} className={busy ? "spin" : ""} />{busy ? "Adding..." : dm ? "Add messages" : "Add comments"}</button></div>
    </div>
  );
}
