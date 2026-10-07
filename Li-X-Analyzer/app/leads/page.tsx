import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { listLeads, type Lead } from "@/lib/leads/store";
import { Icon } from "../components/icons";
import LeadsClient from "./client";
import "./leads.css";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  if (!(await isAuthed())) redirect("/login");
  let error: string | null = null;
  let leads: Lead[] = [];
  try { leads = await listLeads(); } catch (e) { error = (e as Error).message; }
  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Leads</h1><p>People who could become customers, from first sign of interest to a won deal. Move a card as the talk moves on.</p></div>
      </div>
      {error && <div className="note"><Icon name="alert" size={18} />Database problem: {error}</div>}
      <LeadsClient leads={leads} nowIso={new Date().toISOString()} />
    </div>
  );
}
