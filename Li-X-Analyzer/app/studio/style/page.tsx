import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import type { Asset } from "@/lib/studio/assets";
import { listAssets } from "@/lib/studio/assets-store";
import { Icon } from "../../components/icons";
import StudioTabs from "../tabs";
import StyleClient from "./client";
import "./style.css";

export const dynamic = "force-dynamic";

export default async function StylePage() {
  if (!(await isAuthed())) redirect("/login");
  let error: string | null = null;
  const assets: Asset[] = await listAssets().catch((e) => { error = (e as Error).message; return []; });
  return (
    <div className="page">
      <div className="page-head"><div><h1>My style</h1><p>Tell the writer who we are and how we write. Everything saved here can be switched on for a post in the Write tab.</p></div><StudioTabs active="style" /></div>
      {error && <div className="note"><Icon name="alert" size={18} />Database problem: {error}</div>}
      <StyleClient assets={assets} />
    </div>
  );
}
