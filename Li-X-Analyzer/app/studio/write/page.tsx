import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { FORMATS, GROUPS, OUTPUTS, STRUCTURES, type Format } from "@/lib/studio/formats";
import type { Asset } from "@/lib/studio/assets";
import { listAssets } from "@/lib/studio/assets-store";
import { llmAvailable } from "@/lib/llm";
import StudioTabs from "../tabs";
import WriteClient from "./client";
import "./write.css";

export const dynamic = "force-dynamic";

export default async function WritePage() {
  if (!(await isAuthed())) redirect("/login");
  const llm = await llmAvailable().catch(() => false);
  const assets: Asset[] = await listAssets().catch(() => []);
  // Our own story formats join the list, first, as a group of their own.
  const own: Format[] = assets.filter((a) => a.kind === "format").map((a) => ({ id: `custom:${a.id}`, group: "Our formats", name: a.name, example: "", guide: a.body }));
  return (
    <div className="page">
      <div className="page-head"><div><h1>Write a post</h1><p>Type a topic, pick a story format, pick a model. We write the LinkedIn post and the X post in simple English.</p></div><StudioTabs active="write" /></div>
      <WriteClient llm={llm} groups={own.length ? ["Our formats", ...GROUPS] : [...GROUPS]} formats={[...own, ...FORMATS]} structures={STRUCTURES} assets={assets.filter((a) => a.kind !== "format")} outputs={OUTPUTS} />
    </div>
  );
}
