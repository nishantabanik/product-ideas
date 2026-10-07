export type Features = {
  chars: number;
  words: number;
  lines: number;
  firstLine: string;
  firstLineChars: number;
  hasQuestion: boolean;
  endsWithQuestion: boolean;
  numberInHook: boolean;
  hashtags: number;
  mentions: number;
  hasLink: boolean;
  emojis: number;
  hasList: boolean;
  shortLines: boolean;
  wall: boolean;
  cta: boolean;
  bait: boolean;
  cliche: boolean;
  thread: boolean;
};

const CLICHES = ["excited to announce", "thrilled to", "happy to share", "pleased to announce", "i am delighted", "i'm delighted", "in today's fast", "humbled to", "proud to announce", "big news"];
const BAIT = ["comment yes", "type yes", "like if you", "rt if", "retweet if", "tag a friend", "tag someone", "share if you agree", "follow for more", "drop a", "comment below"];
const CTA = /\b(comment|reply|replies|share|repost|follow|dm me|message me|thoughts|what do you|what's your|whats your|which one|do you|have you|agree|let me know|tell me|curious)\b/i;
const EMOJI = /\p{Extended_Pictographic}/gu;
const LINK = /https?:\/\/|\bwww\.|\b[a-z0-9-]+\.(com|io|co|ai|org|net|dev|app)\b\/?/i;

/** What the text of a post looks like. Everything here is something we can measure, not a judgement. */
export function textFeatures(raw: string): Features {
  const text = raw.replace(/\r/g, "").trim();
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const firstLine = lines[0] ?? "";
  const lower = text.toLowerCase();
  const sentences = text.split(/(?<=[.!?])\s+/);
  const last = (sentences[sentences.length - 1] ?? "").trim();
  const words = text ? text.split(/\s+/).length : 0;
  const longest = Math.max(0, ...lines.map((l) => l.length));
  return {
    chars: text.length,
    words,
    lines: lines.length,
    firstLine,
    firstLineChars: firstLine.length,
    hasQuestion: text.includes("?"),
    endsWithQuestion: last.endsWith("?") || (lines[lines.length - 1] ?? "").trim().endsWith("?"),
    numberInHook: /\d/.test(firstLine),
    hashtags: (text.match(/(^|\s)#[\p{L}\p{N}_]+/gu) ?? []).length,
    mentions: (text.match(/(^|\s)@\w+/g) ?? []).length,
    hasLink: LINK.test(text),
    emojis: (text.match(EMOJI) ?? []).length,
    hasList: lines.filter((l) => /^([-*•]|\d+[.)])\s/.test(l)).length >= 3,
    shortLines: lines.length >= 5 && mean(lines.map((l) => l.length)) < 90,
    wall: text.length > 600 && lines.length < 4 && longest > 400,
    cta: CTA.test(text),
    bait: BAIT.some((b) => lower.includes(b)),
    cliche: CLICHES.some((c) => lower.slice(0, 120).includes(c)),
    thread: /🧵|\b1\/\d*\b|\bthread\b/i.test(text),
  };
}

function mean(xs: number[]) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

export type LengthBucket = "short" | "medium" | "long";
export function lengthBucket(platform: "linkedin" | "x", chars: number): LengthBucket {
  if (platform === "x") return chars < 100 ? "short" : chars <= 200 ? "medium" : "long";
  return chars < 500 ? "short" : chars <= 1500 ? "medium" : "long";
}
