"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "../components/icons";
import { useToast } from "../components/toast";

export default function Regenerate({ coachConfigured }: { coachConfigured: boolean }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const toast = useToast();

  async function run() {
    setBusy(true);
    try {
      const res = await fetch("/api/advisory", { method: "POST" });
      const d = await res.json();
      if (!res.ok) return toast({ tone: "error", title: "Could not build the advisory", body: d.error });
      const coach = d.coach === "written" ? "Coach notes written." : d.coach === "failed" ? `Coach notes failed: ${d.coachError}` : coachConfigured ? "" : "Coach notes are off (no model connected).";
      toast({ tone: d.coach === "failed" ? "info" : "ok", title: "Advisory updated", body: `${d.findings} findings. ${coach}`.trim() });
      router.refresh();
    } catch {
      toast({ tone: "error", title: "Could not reach the server" });
    } finally {
      setBusy(false);
    }
  }
  return <button className="btn" onClick={run} disabled={busy}><Icon name="refresh" size={16} className={busy ? "spin" : ""} />{busy ? "Reviewing..." : "Review again now"}</button>;
}
