import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/guard";
import { buildPdf } from "@/lib/reports/pdf";
import { loadReport } from "@/lib/reports/load";
import { emailReport, FREQ_KEY } from "@/lib/reports/schedule";
import { setState } from "@/lib/connections";

export const maxDuration = 60;

const freqOf = (v: unknown) => (v === "weekly" || v === "monthly" ? v : null);
const bad = () => NextResponse.json({ error: "Choose weekly or monthly." }, { status: 400 });

export async function GET(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  const freq = freqOf(new URL(req.url).searchParams.get("freq"));
  if (!freq) return bad();
  try {
    const report = await loadReport(freq);
    const pdf = await buildPdf(report);
    return new Response(Buffer.from(pdf), {
      headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="report-${report.period.key}.pdf"`, "cache-control": "no-store" },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  const b = (await req.json().catch(() => null)) as { freq?: string } | null;
  const freq = freqOf(b?.freq ?? new URL(req.url).searchParams.get("freq"));
  if (!freq) return bad();
  try {
    const r = await emailReport(freq);
    return r.ok ? NextResponse.json({ ok: true, key: r.key }) : NextResponse.json({ error: r.error }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  const b = (await req.json().catch(() => null)) as { freq?: string } | null;
  if (!b || !["off", "weekly", "monthly"].includes(b.freq ?? "")) return NextResponse.json({ error: "Choose off, weekly or monthly." }, { status: 400 });
  try {
    await setState(FREQ_KEY, b.freq as string);
    return NextResponse.json({ ok: true, freq: b.freq });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
