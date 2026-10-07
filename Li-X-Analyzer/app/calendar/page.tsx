import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import CalendarView from "./view";

export default async function CalendarPage() {
  if (!(await isAuthed())) redirect("/login");
  return (
    <div className="page">
      <div className="page-head"><div><h1>Calendar</h1><p>Every scheduled, published and failed post on LinkedIn and X, live from Postiz.</p></div></div>
      <CalendarView />
    </div>
  );
}
