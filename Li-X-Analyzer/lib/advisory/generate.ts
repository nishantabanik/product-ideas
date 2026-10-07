import { analyze } from "./engine.ts";
import { coachConfigured, runCoach } from "./coach.ts";
import { loadInput } from "./load.ts";
import { getAdvisory, saveAdvisory, type Stored } from "./store.ts";

export type GenerateResult = { day: string; findings: number; coach: "written" | "skipped" | "failed"; coachError: string | null; tokens?: { input: number; output: number } | null };

/**
 * Builds today's advisory from the stored data and saves it. The rules engine always runs. The Claude coach runs when a key is
 * set and the caller asks for it, and a failure there never loses the rules based advisory.
 */
export async function generateAdvisory(opts: { withCoach: boolean }): Promise<GenerateResult> {
  const input = await loadInput(new Date());
  const advisory = analyze(input);

  let coach: Stored["coach"] = null, coachError: string | null = null, model: string | null = null, tokens: GenerateResult["tokens"];
  let state: GenerateResult["coach"] = "skipped";

  if (opts.withCoach && (await coachConfigured())) {
    try {
      const r = await runCoach(advisory, input);
      coach = r.coach; model = r.model; tokens = r.usage; state = "written";
    } catch (e) {
      coachError = (e as Error).message;
      state = "failed";
    }
  }
  if (!coach) {
    // Regenerating without a new coach answer keeps today's earlier one instead of throwing it away.
    const earlier = await getAdvisory(advisory.day);
    if (earlier?.coach) { coach = earlier.coach; model = earlier.model; if (state === "skipped") coachError = earlier.coachError; }
  }
  await saveAdvisory(advisory, coach, coachError, model);
  return { day: advisory.day, findings: advisory.findings.length, coach: state, coachError, tokens };
}

/** Today's advisory, built on the spot (rules only, quick) the first time the page is opened on a new day. */
export async function ensureToday(): Promise<Stored | null> {
  const today = new Date().toISOString().slice(0, 10);
  const have = await getAdvisory(today);
  if (have) return have;
  await generateAdvisory({ withCoach: false });
  return getAdvisory(today);
}
