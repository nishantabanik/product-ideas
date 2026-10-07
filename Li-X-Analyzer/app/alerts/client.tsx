"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "../components/icons";
import { useToast } from "../components/toast";

export function AlertActions({ unseen }: { unseen: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  async function check() {
    setBusy(true);
    try {
      const r = await fetch("/api/alerts", { method: "POST" });
      const d = await r.json();
      if (!r.ok) return toast({ tone: "error", title: "Could not check", body: d.error });
      toast({ tone: d.alerts.length ? "ok" : "info", title: d.alerts.length ? `${d.alerts.length} new alert${d.alerts.length === 1 ? "" : "s"}` : "Nothing to flag", body: `${d.checked} recent post${d.checked === 1 ? "" : "s"} looked at. ${d.notes[0] ?? ""}`.trim() });
      router.refresh();
    } catch { toast({ tone: "error", title: "Could not reach the server" }); } finally { setBusy(false); }
  }
  async function seen() { await fetch("/api/alerts", { method: "PATCH" }); router.refresh(); }
  return (
    <div className="row">
      {unseen && <button className="btn ghost" onClick={seen}>Mark all as seen</button>}
      <button className="btn" onClick={check} disabled={busy}><Icon name="refresh" size={16} className={busy ? "spin" : ""} />{busy ? "Checking..." : "Check now"}</button>
    </div>
  );
}
