"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./components/icons";
import { useToast } from "./components/toast";

export default function SyncButton({ label = "Sync from Postiz", ghost = false }: { label?: string; ghost?: boolean }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const toast = useToast();

  async function run() {
    setBusy(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) return toast({ tone: "error", title: "Sync failed", body: data.error });
      toast({
        tone: data.errors?.length ? "info" : "ok",
        title: "Synced from Postiz",
        body: `${data.channels} channels, ${data.posts} posts, ${data.postsWithMetrics} with numbers${data.xAccounts ? ", X account totals refreshed" : ""}.${data.errors?.length ? ` ${data.errors.length} warning(s).` : ""}`,
      });
      router.refresh();
    } catch {
      toast({ tone: "error", title: "Could not reach the server" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className={`btn${ghost ? " ghost" : ""}`} onClick={run} disabled={busy}>
      <Icon name="refresh" size={16} className={busy ? "spin" : ""} />{busy ? "Syncing..." : label}
    </button>
  );
}
