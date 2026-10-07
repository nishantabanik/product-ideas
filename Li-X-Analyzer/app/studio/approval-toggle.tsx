"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "../components/toast";

export default function ApprovalToggle({ on }: { on: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [v, setV] = useState(on);
  async function change(next: boolean) {
    setV(next);
    const r = await fetch("/api/studio/settings", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ requireApproval: next }) });
    if (!r.ok) { setV(!next); return toast({ tone: "error", title: "Could not save" }); }
    toast({ tone: "ok", title: next ? "Approval is now required before scheduling" : "Drafts can be scheduled without review" });
    router.refresh();
  }
  return (
    <label className="row" style={{ cursor: "pointer" }}>
      <input type="checkbox" checked={v} onChange={(e) => change(e.target.checked)} />
      <span>Require approval before anything is scheduled</span>
    </label>
  );
}
