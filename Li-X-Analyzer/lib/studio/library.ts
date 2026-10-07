import type { Platform } from "./types.ts";

export type Template = { name: string; platform: Platform | "both"; kind: "hook" | "template"; body: string };

/** Starting points that have worked for many writers. Fill the brackets, then judge them by our own numbers. */
export const BUILT_IN: Template[] = [
  { name: "The surprising result", platform: "both", kind: "hook", body: "We [did X] and [unexpected result]." },
  { name: "The number first", platform: "both", kind: "hook", body: "[Number] [things] I learned from [experience] that [benefit]." },
  { name: "The mistake", platform: "both", kind: "hook", body: "The most expensive mistake I made in [area]: [mistake]." },
  { name: "The contrarian line", platform: "both", kind: "hook", body: "Most people think [common belief]. The data says [opposite]." },
  { name: "The before and after", platform: "both", kind: "hook", body: "From [bad starting point] to [result] in [time]. Here is what changed." },
  { name: "The question", platform: "both", kind: "hook", body: "What would you do if [specific situation]?" },
  { name: "The quiet truth", platform: "both", kind: "hook", body: "Nobody tells you this about [topic]:" },
  { name: "The checklist", platform: "both", kind: "hook", body: "Before you [action], check these [number] things:" },
  { name: "Story with a lesson", platform: "linkedin", kind: "template", body: "[Hook line]\n\n[What happened, in two or three short lines]\n\n[The turning point]\n\n[The lesson in one sentence]\n\n[One easy question for the reader]" },
  { name: "Lessons list", platform: "linkedin", kind: "template", body: "[Number] lessons from [experience]:\n\n1. [Lesson]. [One line why]\n2. [Lesson]. [One line why]\n3. [Lesson]. [One line why]\n\nWhich one do you disagree with?" },
  { name: "Myth and fact", platform: "linkedin", kind: "template", body: "Myth: [common belief]\n\nFact: [what is true]\n\n[Evidence or example in two lines]\n\n[What to do instead]" },
  { name: "Thread starter", platform: "x", kind: "template", body: "[Promise with a number]. A thread:\n\n[Post 1 detail]\n\n[Post 2 detail]\n\n[Post 3 detail]\n\n[Summary and one question]" },
  { name: "One strong claim", platform: "x", kind: "template", body: "[Claim in one sentence].\n\n[Why, in one or two sentences]." },
];

/** The first lines of our best posts, as openings we know land with our own audience. */
export function bestOpenings(posts: { content: string; impressions: number | null; platform: Platform }[], platform: Platform, limit = 8): string[] {
  return posts
    .filter((p) => p.platform === platform && (p.impressions ?? 0) > 0 && p.content.trim().length > 40)
    .sort((a, b) => b.impressions! - a.impressions!)
    .map((p) => p.content.trim().split("\n").map((l) => l.trim()).find(Boolean) ?? "")
    .filter((l, i, all) => l && all.indexOf(l) === i)
    .slice(0, limit);
}
