export type Parsed = { ok: true; value: Record<string, unknown> } | { ok: false; error: string };
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export function parseTargetInput(b: Record<string, unknown>, partial = false): Parsed {
  const v: Record<string, unknown> = {};
  if (!partial) {
    if (b.platform !== "linkedin" && b.platform !== "x") return { ok: false, error: "Choose LinkedIn or X" };
    v.platform = b.platform;
  }
  if (!partial || "name" in b) { const n = str(b.name, 120); if (!n) return { ok: false, error: "Add a name" }; v.name = n; }
  if (!partial || "handle" in b) v.handle = str(b.handle, 120).replace(/^@/, "") || null;
  if (!partial || "profileUrl" in b) {
    const s = str(b.profileUrl, 500);
    if (s) { const u = /^https?:\/\//i.test(s) ? s : `https://${s}`; try { new URL(u); } catch { return { ok: false, error: "The profile link does not look right" }; } v.profileUrl = u; } else v.profileUrl = null;
  }
  if (!partial || "note" in b) v.note = str(b.note, 1000);
  if (!partial || "topics" in b) v.topics = str(b.topics, 300);
  if ("active" in b) { if (typeof b.active !== "boolean") return { ok: false, error: "Bad value for active" }; v.active = b.active; }
  if (partial && !Object.keys(v).length) return { ok: false, error: "Nothing to change" };
  return { ok: true, value: v };
}
