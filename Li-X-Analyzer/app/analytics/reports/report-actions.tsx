"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "../../components/icons";
import Seg from "../../components/seg";
import { useToast } from "../../components/toast";

type Freq = "off" | "weekly" | "monthly";

export default function ReportActions({ freq, emailReady }: { freq: Freq; emailReady: boolean }) {
  const [value, setValue] = useState<Freq>(freq);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const toast = useToast();

  async function save(v: string) {
    const before = value;
    setValue(v as Freq);
    const res = await fetch("/api/reports", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ freq: v }) }).catch(() => null);
    if (!res || !res.ok) { setValue(before); toast({ tone: "error", title: "Not saved", body: "We could not save the setting." }); return; }
    toast({ tone: "ok", title: "Setting saved" });
    router.refresh();
  }

  async function email(f: "weekly" | "monthly") {
    setBusy(true);
    const res = await fetch("/api/reports", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ freq: f }) }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    setBusy(false);
    if (res?.ok) toast({ tone: "ok", title: "Report sent", body: "Check our inbox in a minute." });
    else toast({ tone: "error", title: "Not sent", body: d.error ?? "Could not reach the server" });
  }

  return (
    <div className="stack">
      <div className="row" style={{ gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <Seg small label="Send the report" value={value} onChange={save} options={[
          { value: "off", label: "Off" }, { value: "weekly", label: "Weekly on Mondays" }, { value: "monthly", label: "Monthly on the 1st" },
        ]} />
      </div>
      <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
        <a className="btn" href="/api/reports?freq=weekly"><Icon name="file" size={16} />Download weekly report</a>
        <a className="btn" href="/api/reports?freq=monthly"><Icon name="file" size={16} />Download monthly report</a>
        <button className="btn ghost" disabled={busy || !emailReady} onClick={() => email(value === "monthly" ? "monthly" : "weekly")}>
          <Icon name="send" size={16} />{busy ? "Sending..." : "Email the report now"}
        </button>
      </div>
      <p className="hint" style={{ margin: 0 }}>The email button sends the {value === "monthly" ? "monthly" : "weekly"} report. Choose Monthly above to send the monthly one.</p>
    </div>
  );
}
