export const dynamic = "force-dynamic";

import { requireAuth } from "@/lib/guard";
import AnalyticsTabs from "../tabs";
import AnalyticsChatPanel from "./client";
import { llmAvailable } from "@/lib/llm";

export default async function AnalyticsChatPage() {
  const denied = await requireAuth();
  if (denied) return denied;

  const llm = await llmAvailable();

  return (
    <main className="p">
      <div className="page-head">
        <h1>Ask AI about your numbers</h1>
        <AnalyticsTabs active="chat" />
      </div>
      <div className="card">
        <AnalyticsChatPanel llm={llm} />
      </div>
    </main>
  );
}
