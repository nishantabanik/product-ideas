import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { BUILT_IN, bestOpenings } from "@/lib/studio/library";
import { listTemplates, postFacts } from "@/lib/studio/store";
import { Icon } from "../../components/icons";
import StudioTabs from "../tabs";
import LibraryClient from "./client";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  if (!(await isAuthed())) redirect("/login");
  let error: string | null = null;
  const [saved, posts] = await Promise.all([listTemplates(), postFacts()]).catch((e) => { error = (e as Error).message; return [[], []] as unknown as [Awaited<ReturnType<typeof listTemplates>>, Awaited<ReturnType<typeof postFacts>>]; });
  const mine = { linkedin: bestOpenings(posts, "linkedin", 8), x: bestOpenings(posts, "x", 8) };
  return (
    <div className="page">
      <div className="page-head"><div><h1>Library</h1><p>Openings and templates to start from. The best of them are the first lines of our own top posts.</p></div><StudioTabs active="library" /></div>
      {error && <div className="note"><Icon name="alert" size={18} />Database problem: {error}</div>}
      <LibraryClient builtIn={BUILT_IN} saved={saved} mine={mine} />
    </div>
  );
}
