import { listChannels, listPosts, postAnalytics, summarizeSeries } from "../postiz";
import { db, ensureSchema } from "../db";
import { notifyAll } from "../notify";
import { platformOf, stripHtml } from "../sync";
import { learnCurve, paceStatus, type Snap } from "./pace.ts";
import { addAlert, recordSnapshots, snapshotHistory, typicalFinal } from "./store";

const MAX_POSTS_PER_RUN = 6; // each post is one Postiz call, and Postiz allows about 90 calls an hour

export type PulseResult = { checked: number; snapshots: number; alerts: { postId: string; kind: string; title: string }[]; notes: string[] };

/**
 * Looks at posts published in the last day and a half, stores a snapshot of their numbers, and raises an alert once when a post
 * is taking off or is off to a slow start. Safe to run often: snapshots are thinned and each alert is raised only once.
 */
export async function runPulse(now = new Date()): Promise<PulseResult> {
  await ensureSchema();
  const out: PulseResult = { checked: 0, snapshots: 0, alerts: [], notes: [] };
  const [channels, posts] = await Promise.all([
    listChannels(),
    listPosts(new Date(now.getTime() - 2 * 86_400_000).toISOString(), now.toISOString(), 60_000),
  ]);
  const platformByChannel = new Map(channels.map((c) => [c.id, platformOf(c.identifier)]));
  const recent = posts
    .filter((p) => p.state === "PUBLISHED" && p.publishDate && p.integration?.id && platformByChannel.has(p.integration.id))
    .filter((p) => now.getTime() - new Date(p.publishDate!).getTime() < 36 * 3_600_000)
    .sort((a, b) => (b.publishDate ?? "").localeCompare(a.publishDate ?? ""))
    .slice(0, MAX_POSTS_PER_RUN);
  if (!recent.length) { out.notes.push("No posts published in the last day and a half."); return out; }

  const sql = db();
  const history = await snapshotHistory().catch(() => []);
  const curve = learnCurve(history.map((h) => ({ snaps: h.snaps.map((s): Snap => ({ at: (new Date(s.takenAt).getTime() - new Date(h.publishedAt).getTime()) / 60_000, impressions: s.impressions })) })));
  const baselines = new Map<string, number | null>();

  const rows: Parameters<typeof recordSnapshots>[0] = [];
  const measured: { id: string; platform: string; text: string; ageMinutes: number; impressions: number | null }[] = [];
  for (const p of recent) {
    try {
      const series = await postAnalytics(p.id, 7);
      if (!Array.isArray(series)) { out.notes.push("Postiz has no numbers for one post (LinkedIn personal profiles give none)."); continue; }
      const m = summarizeSeries(series);
      if (!Object.keys(m).length) continue;
      out.checked++;
      rows.push({ postId: p.id, impressions: m.impressions ?? null, likes: m.likes ?? null, comments: m.comments ?? null, shares: m.shares ?? null, clicks: m.clicks ?? null });
      await sql`update posts set impressions = ${m.impressions ?? null}, likes = ${m.likes ?? null}, comments = ${m.comments ?? null}, shares = ${m.shares ?? null}, clicks = ${m.clicks ?? null}, updated_at = now() where id = ${p.id}`;
      measured.push({ id: p.id, platform: platformByChannel.get(p.integration!.id)!, text: stripHtml(p.content ?? ""), ageMinutes: (now.getTime() - new Date(p.publishDate!).getTime()) / 60_000, impressions: m.impressions ?? null });
    } catch (e) {
      out.notes.push(`post ${p.id}: ${(e as Error).message}`);
    }
  }
  out.snapshots = await recordSnapshots(rows);

  for (const m of measured) {
    if (!baselines.has(m.platform)) { const t = await typicalFinal(m.platform); baselines.set(m.platform, t.n >= 5 ? t.median : null); }
    const pace = paceStatus({ ageMinutes: m.ageMinutes, impressions: m.impressions, typicalFinal: baselines.get(m.platform) ?? null, curve });
    if (pace.state !== "taking_off" && pace.state !== "slow") continue;
    const snippet = m.text.slice(0, 70) + (m.text.length > 70 ? "..." : "");
    const title = pace.state === "taking_off" ? `Taking off: ${snippet}` : `Slow start: ${snippet}`;
    const fresh = await addAlert({ postId: m.id, kind: pace.state, title, detail: `${pace.reason} ${pace.state === "taking_off" ? "Reply to every comment now and stay close to the post." : "Reply to our comments, and add a useful comment on a post from our target list. Do not delete or repost."}`, level: pace.state === "taking_off" ? "good" : "warn" });
    if (fresh) out.alerts.push({ postId: m.id, kind: pace.state, title });
  }
  if (out.alerts.length) {
    await notifyAll({ subject: out.alerts.length === 1 ? out.alerts[0].title : `${out.alerts.length} post alerts`, text: out.alerts.map((a) => a.title).join("\n") + "\n\nOpen the Alerts page in Li X Analyzer for details." });
  }
  return out;
}
