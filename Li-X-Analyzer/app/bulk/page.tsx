import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import BulkForm from "./form";

export default async function Bulk() {
  if (!(await isAuthed())) redirect("/login");
  return (
    <div className="page">
      <div className="page-head"><div><h1>Bulk schedule</h1><p>Upload one Excel or CSV file with many posts. Each row has its own date, time and platform, and we send them all to Postiz.</p></div></div>
      <BulkForm />
    </div>
  );
}
