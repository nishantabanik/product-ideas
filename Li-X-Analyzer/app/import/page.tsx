import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { coverage, postTotals } from "@/lib/analytics-data";
import { Icon } from "../components/icons";
import ImportForm from "./form";

export const dynamic = "force-dynamic";
const nice = (d: string | null) => (d ? new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "");

export default async function ImportPage() {
  if (!(await isAuthed())) redirect("/login");
  let cov = { min: null as string | null, max: null as string | null, days: 0 };
  let posts = { posts: 0, first: null as string | null, last: null as string | null };
  let xPosts = { posts: 0 };
  try {
    [cov, posts, xPosts] = await Promise.all([coverage("linkedin"), postTotals("linkedin"), postTotals("x")]);
  } catch { /* the form still works, the summary just stays empty */ }

  return (
    <div className="page">
      <div className="page-head">
        <div><h1>Import data</h1><p>Upload LinkedIn analytics exports (and X exports). We keep one row per day and one per post, so uploading the same file again, or an overlapping one later, never counts anything twice.</p></div>
      </div>
      <div className="grid g-main stagger">
        <div className="stack">
          <ImportForm />
          <div className="card">
            <div className="card-h"><div><h2>What we hold</h2><p>Updated after every import</p></div></div>
            <div className="pills">
              <span className="badge li">LinkedIn: {cov.days.toLocaleString("en-US")} days{cov.min && cov.max ? `, ${nice(cov.min)} to ${nice(cov.max)}` : ""}</span>
              <span className="badge li">{posts.posts.toLocaleString("en-US")} LinkedIn posts</span>
              <span className="badge x">{xPosts.posts.toLocaleString("en-US")} X posts</span>
            </div>
          </div>
        </div>
        <div className="stack">
          <div className="card">
            <div className="card-h"><h2>Export from LinkedIn</h2></div>
            <ol className="steps">
              <li>Open linkedin.com/analytics/creator/content (or Show all analytics on our profile).</li>
              <li>Pick the time range at the top. We can use a long one, the daily numbers cover all of it.</li>
              <li>Click Export, an Excel file downloads.</li>
              <li>Drop it here. Select several files at once if we have more.</li>
            </ol>
          </div>
          <div className="note info"><Icon name="info" size={18} /><span><b>Why not every post?</b> LinkedIn lists only the top 50 posts per export, but the daily impressions and engagements cover the whole range. To capture older posts too, export shorter ranges, for example one month at a time, and upload them together. Overlaps are fine.</span></div>
        </div>
      </div>
    </div>
  );
}
