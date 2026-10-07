import type { Platform } from "./types.ts";

export type Template = { id: string; name: string; body: string; platform: "both" | Platform; uses: number; builtin?: boolean };

/** Shown when we have saved none. They can be inserted without saving. */
export const STARTER_TEMPLATES: Template[] = [
  { id: "starter-thanks", name: "Thanks", body: "Thanks [name], really glad it was useful.", platform: "both", uses: 0, builtin: true },
  { id: "starter-question", name: "Question follow up", body: "Thanks for the comment, [name]. What made you think of that? We would like to hear how it looks on your side.", platform: "both", uses: 0, builtin: true },
  { id: "starter-resource", name: "Link to a resource", body: "Good question, [name]. We wrote more about this here: [link]", platform: "both", uses: 0, builtin: true },
  { id: "starter-dm", name: "Let's talk by DM", body: "Thanks [name]. That is easier to answer in a message, so we will send you a DM.", platform: "both", uses: 0, builtin: true },
];

export const templateFits = (t: Pick<Template, "platform">, p: Platform) => t.platform === "both" || t.platform === p;
