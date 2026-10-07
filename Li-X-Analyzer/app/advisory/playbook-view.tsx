"use client";
import { useState } from "react";
import Seg from "../components/seg";
import { Icon } from "../components/icons";
import { PLAYBOOK, PLAYBOOK_NOTE } from "@/lib/advisory/playbook";

export default function PlaybookView() {
  const [p, setP] = useState<"linkedin" | "x">("linkedin");
  const pb = PLAYBOOK[p];
  return (
    <div className="card">
      <div className="card-h">
        <div><h2>Playbook</h2><p>What to do and what to avoid, so every post has the best chance</p></div>
        <Seg small label="Platform" value={p} onChange={(v) => setP(v as "linkedin" | "x")} options={[{ value: "linkedin", label: "LinkedIn" }, { value: "x", label: "X" }]} />
      </div>
      <div className="grid g-2" key={p}>
        <div>
          <div className="section-t" style={{ marginTop: 0 }}>Do</div>
          <div className="pb-list">{pb.do.map((i) => <div key={i.title} className="pb do"><Icon name="check" size={16} /><div><b>{i.title}</b><p>{i.why}</p></div></div>)}</div>
        </div>
        <div>
          <div className="section-t" style={{ marginTop: 0 }}>Avoid</div>
          <div className="pb-list">{pb.dont.map((i) => <div key={i.title} className="pb dont"><Icon name="x" size={16} /><div><b>{i.title}</b><p>{i.why}</p></div></div>)}</div>
        </div>
      </div>
      <p className="hint" style={{ margin: "18px 0 0" }}>{PLAYBOOK_NOTE}</p>
    </div>
  );
}
