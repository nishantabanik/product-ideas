import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import ComposeForm from "./form";

export default async function Compose({ searchParams }: { searchParams: Promise<{ date?: string; text?: string; to?: string }> }) {
  if (!(await isAuthed())) redirect("/login");
  const { date, text, to } = await searchParams;
  return (
    <div className="page">
      <div className="page-head"><div><h1>Compose</h1><p>Write one post, choose X, LinkedIn or both, then post it now or schedule it. Posts go out through Postiz.</p></div></div>
      <ComposeForm initialDate={/^\d{4}-\d{2}-\d{2}$/.test(date ?? "") ? date : undefined} initialText={text?.slice(0, 3000)} initialTarget={to === "x" || to === "linkedin" ? to : undefined} />
    </div>
  );
}
