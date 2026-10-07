import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { listChannels, listPosts } from "@/lib/postiz";
import { platformOf, stripHtml } from "@/lib/sync";

const DAY = 86_400_000;

export async function GET(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;

  const q = new URL(req.url).searchParams;
  const start = new Date(q.get("start") ?? "");
  const end = new Date(q.get("end") ?? "");
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return NextResponse.json({ error: "Bad date range" }, { status: 400 });
  }
  if (end.getTime() - start.getTime() > 70 * DAY) {
    return NextResponse.json({ error: "Range too long" }, { status: 400 });
  }

  try {
    const [channels, posts] = await Promise.all([listChannels(), listPosts(start.toISOString(), end.toISOString())]);
    const byId = new Map(channels.map((c) => [c.id, c]));
    const items = posts
      .map((p) => {
        const ch = p.integration?.id ? byId.get(p.integration.id) : undefined;
        const identifier = ch?.identifier ?? p.integration?.providerIdentifier;
        const when = p.publishDate ? new Date(p.publishDate) : null;
        if (!identifier || !when || when < start || when >= end) return null;
        return {
          id: p.id,
          platform: platformOf(identifier),
          channel: ch?.name ?? p.integration?.name ?? "",
          state: p.state ?? "QUEUE",
          date: when.toISOString(),
          content: stripHtml(p.content ?? ""),
          url: p.releaseURL ?? null,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .filter((x) => x.platform === "x" || x.platform === "linkedin")
      .sort((a, b) => a.date.localeCompare(b.date));
    return NextResponse.json(items);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
