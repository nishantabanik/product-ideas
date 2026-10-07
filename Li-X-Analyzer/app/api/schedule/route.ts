import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { listChannels, schedulePost } from "@/lib/postiz";

export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;

  const body = (await req.json()) as { content?: string; date?: string; channelIds?: string[]; now?: boolean };
  const content = body.content?.trim();
  if (!content) return NextResponse.json({ error: "Write something first" }, { status: 400 });
  if (!body.channelIds?.length) return NextResponse.json({ error: "Pick at least one channel" }, { status: 400 });

  const date = body.now ? new Date().toISOString() : new Date(body.date ?? "").toISOString();
  if (!body.now && new Date(date).getTime() < Date.now()) {
    return NextResponse.json({ error: "Pick a time in the future" }, { status: 400 });
  }

  try {
    const all = await listChannels();
    const channels = all.filter((c) => body.channelIds!.includes(c.id));
    if (channels.length !== body.channelIds.length) {
      return NextResponse.json({ error: "Unknown channel" }, { status: 400 });
    }
    if (channels.some((c) => c.identifier === "x") && content.length > 280) {
      return NextResponse.json({ error: `X limit is 280 characters, this is ${content.length}` }, { status: 400 });
    }
    await schedulePost({ content, date, channels, now: body.now });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
