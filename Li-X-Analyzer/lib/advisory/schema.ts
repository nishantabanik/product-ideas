import { z } from "zod";

const platform = z.enum(["linkedin", "x"]);

/** What the AI coach writes. Kept small and flat so the output is reliable and quick to read. */
export const CoachSchema = z.object({
  summary: z.string(),
  why_behind: z.array(z.string()),
  rewrites: z.array(z.object({ platform, original: z.string(), problem: z.string(), rewrite: z.string() })),
  ideas: z.array(z.object({ platform, idea: z.string(), hook: z.string(), why: z.string() })),
  experiments: z.array(z.object({ hypothesis: z.string(), how: z.string(), measure: z.string() })),
  watch_out: z.array(z.string()),
});

export type Coach = z.infer<typeof CoachSchema>;
