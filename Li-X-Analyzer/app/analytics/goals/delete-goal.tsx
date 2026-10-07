"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "../../components/icons";
import { useToast } from "../../components/toast";

export default function DeleteGoal({ id }: { id: string }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  async function del() {
    setBusy(true);
    try {
      const res = await fetch("/api/goals", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
      if (!res.ok) return toast({ tone: "error", title: "Could not delete", body: (await res.json()).error });
      router.refresh();
    } catch { toast({ tone: "error", title: "Could not reach the server" }); } finally { setBusy(false); }
  }
  return <button type="button" className="icon-btn" aria-label="Delete goal" title="Delete goal" disabled={busy} onClick={del}><Icon name="x" size={16} /></button>;
}
