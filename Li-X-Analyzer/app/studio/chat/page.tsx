import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { llmAvailable } from "@/lib/llm";
import StudioTabs from "../tabs";
import ChatClient from "./client";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  if (!(await isAuthed())) redirect("/login");
  const llm = await llmAvailable().catch(() => false);
  return (
    <div className="page">
      <div className="page-head"><div><h1>Chat</h1><p>Ask our writing assistant anything about LinkedIn and X posts. It knows our voice from our best posts.</p></div><StudioTabs active="chat" /></div>
      <ChatClient llm={llm} />
    </div>
  );
}
