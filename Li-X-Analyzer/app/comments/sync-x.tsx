"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "../components/icons";
import { useToast } from "../components/toast";

export default function SyncX() {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const toast = useToast();
  async function run() {
    setBusy(true);
    try {
      const res = await fetch("/api/comments/sync", { method: "POST" });
      const d = await res.json();
      if (!res.ok) return toast({ tone: "error", title: "Could not read X", body: d.error });
      toast({ tone: "ok", title: "X checked", body: d.added ? `${d.added} new comment${d.added === 1 ? "" : "s"}.` : "No new replies." });
      router.refresh();
    } catch { toast({ tone: "error", title: "Could not reach the server" }); } finally { setBusy(false); }
  }
  return <button className="btn ghost" onClick={run} disabled={busy}><Icon name="refresh" size={16} className={busy ? "spin" : ""} />{busy ? "Reading X..." : "Check X for replies"}</button>;
}
