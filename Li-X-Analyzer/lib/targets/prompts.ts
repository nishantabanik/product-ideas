export type CommentPrompt = { id: string; title: string; how: string; starter: string };

/** Eight ways to leave a comment that helps the author and shows people what we know. They work without a model. */
export const COMMENT_PROMPTS: CommentPrompt[] = [
  { id: "number", title: "Add a number or a real example", how: "Give one figure or one concrete case from our own work that backs up or sharpens their point.", starter: "We saw something close to this: [number or example]. It shows that..." },
  { id: "question", title: "Ask about one detail", how: "Pick one specific detail in the post and ask how it worked, not a general question.", starter: "On the part about [detail], how did you decide...?" },
  { id: "experience", title: "Share a related experience in two lines", how: "Say what happened to us in two short lines and how it fits their point.", starter: "We ran into this when [situation]. What helped was [one thing]." },
  { id: "counterpoint", title: "Add a respectful counterpoint with a reason", how: "Agree with the core, then name one case where it does not hold and why.", starter: "Agree for the most part. One case where it breaks: [case], because [reason]." },
  { id: "connect", title: "Connect their point to something we learned", how: "Link their idea to a lesson from our own posts or work, and say what we learned.", starter: "This matches what we learned from [our experience]: [lesson]." },
  { id: "thanks", title: "Thank them and name the exact thing that helped", how: "Name the specific line or idea, and what we will do with it.", starter: "Thank you. The point about [exact thing] helped us with [what]." },
  { id: "extend", title: "Add the next step", how: "Say what we would do after reading the post: the next small step that makes the idea work.", starter: "A next step that worked for us after this: [step]." },
  { id: "summarize", title: "Say it back in one line", how: "Restate the main idea in our own words in one line, then add the one thing we would add.", starter: "In short: [their point in our words]. We would add [one thing]." },
];
