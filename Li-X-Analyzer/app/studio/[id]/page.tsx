import { notFound, redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { llmAvailable } from "@/lib/llm";
import { BUILT_IN, bestOpenings } from "@/lib/studio/library";
import { bestTimes } from "@/lib/studio/times";
import { nextSlotTimes } from "@/lib/studio/slots";
import { getDraft, getRequireApproval, getZone, listPillars, listSlots, listTemplates, postFacts, takenTimes } from "@/lib/studio/store";
import Editor, { type Insertable } from "./editor";

export const dynamic = "force-dynamic";

export default async function DraftPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) redirect("/login");
  const { id } = await params;
  const draft = await getDraft(id);
  if (!draft) notFound();
  const [pillars, saved, posts, slots, tz, llm, require] = await Promise.all([listPillars(), listTemplates(), postFacts(), listSlots(draft.platform), getZone(), llmAvailable(), getRequireApproval()]);
  const library: Insertable[] = [
    ...saved.map((t) => ({ name: `${t.name} (ours)`, body: t.body, platform: t.platform })),
    ...bestOpenings(posts, draft.platform, 5).map((o, i) => ({ name: `Our best opening ${i + 1}`, body: o, platform: draft.platform })),
    ...BUILT_IN.map((t) => ({ name: t.name, body: t.body, platform: t.platform })),
  ];
  // Suggested times: our queue slots, else the hours that worked best, else the starter times.
  const t = bestTimes(posts, draft.platform, tz);
  const rule = slots.length ? slots : (t.enough && t.top.length ? t.top.map((c) => ({ weekday: c.weekday, time: `${String(c.hour).padStart(2, "0")}:00` })) : t.starter.map((c) => ({ weekday: c.weekday, time: `${String(c.hour).padStart(2, "0")}:00` })));
  const suggested = nextSlotTimes(rule, tz, new Date(), 4, await takenTimes(draft.platform)).map((d) => d.toISOString());
  return (
    <div className="page">
      <div className="page-head"><div><h1>{draft.status === "idea" ? "Idea" : "Draft"}</h1><p>Write it, check it against our rules, get it approved, then schedule it.</p></div></div>
      <Editor draft={draft} pillars={pillars.map((p) => p.name)} library={library} suggested={suggested} llm={llm} requireApproval={require} />
    </div>
  );
}
