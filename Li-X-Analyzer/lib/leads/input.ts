import { isSource, isStage, type Source, type Stage } from "./stages.ts";

export type LeadInput = { platform: "linkedin" | "x"; name: string; handle: string | null; profileUrl: string | null; source: Source; value: number | null; notes: string; nextStepAt: string | null };
export type LeadPatch = Partial<Omit<LeadInput, "platform" | "source">> & { stage?: Stage };
type R<T> = { ok: true; value: T } | { ok: false; error: string };

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const optUrl = (v: unknown): R<string | null> => {
  const s = str(v, 500);
  if (!s) return { ok: true, value: null };
  const u = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try { new URL(u); } catch { return { ok: false, error: "The profile link does not look right" }; }
  return { ok: true, value: u };
};
const optValue = (v: unknown): R<number | null> => {
  if (v === null || v === undefined || v === "") return { ok: true, value: null };
  const n = typeof v === "number" ? v : Number(String(v).replace(/[,\s]/g, ""));
  if (!Number.isFinite(n) || n < 0 || n > 1e12) return { ok: false, error: "Value must be a number, zero or more" };
  return { ok: true, value: n };
};
const optDate = (v: unknown): R<string | null> => {
  if (v === null || v === undefined || v === "") return { ok: true, value: null };
  const t = new Date(String(v));
  return Number.isNaN(t.getTime()) ? { ok: false, error: "The next step date does not look right" } : { ok: true, value: t.toISOString() };
};

export function parseLeadInput(b: Record<string, unknown>): R<LeadInput> {
  if (b.platform !== "linkedin" && b.platform !== "x") return { ok: false, error: "Choose LinkedIn or X" };
  const name = str(b.name, 120);
  if (!name) return { ok: false, error: "Add a name" };
  const url = optUrl(b.profileUrl); if (!url.ok) return url;
  const value = optValue(b.value); if (!value.ok) return value;
  const next = optDate(b.nextStepAt); if (!next.ok) return next;
  const source = b.source === undefined || b.source === "" ? "manual" : b.source;
  if (!isSource(source)) return { ok: false, error: "Unknown source" };
  return { ok: true, value: { platform: b.platform, name, handle: str(b.handle, 120).replace(/^@/, "") || null, profileUrl: url.value, source, value: value.value, notes: str(b.notes, 4000), nextStepAt: next.value } };
}

export function parseLeadPatch(b: Record<string, unknown>): R<LeadPatch> {
  const p: LeadPatch = {};
  if ("name" in b) { const n = str(b.name, 120); if (!n) return { ok: false, error: "Add a name" }; p.name = n; }
  if ("handle" in b) p.handle = str(b.handle, 120).replace(/^@/, "") || null;
  if ("notes" in b) p.notes = str(b.notes, 4000);
  if ("profileUrl" in b) { const u = optUrl(b.profileUrl); if (!u.ok) return u; p.profileUrl = u.value; }
  if ("value" in b) { const v = optValue(b.value); if (!v.ok) return v; p.value = v.value; }
  if ("nextStepAt" in b) { const d = optDate(b.nextStepAt); if (!d.ok) return d; p.nextStepAt = d.value; }
  if ("stage" in b) { if (!isStage(b.stage)) return { ok: false, error: "Unknown stage" }; p.stage = b.stage; }
  if (!Object.keys(p).length) return { ok: false, error: "Nothing to change" };
  return { ok: true, value: p };
}
