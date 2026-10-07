/** A model picked in the app is written as "source::name", for example "copilot::gpt-4.1" or "gateway::claude-free-3.7". */
export type Source = "gateway" | "copilot";
export const formatChoice = (source: Source, model: string) => `${source}::${model}`;

export function parseChoice(value?: string | null): { provider?: Source; model?: string } {
  const v = (value ?? "").trim().slice(0, 160);
  if (!v) return {};
  const m = /^(gateway|copilot)::(.+)$/.exec(v);
  return m ? { provider: m[1] as Source, model: m[2].trim() } : { model: v };
}
