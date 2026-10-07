export type Platform = "linkedin" | "x";

export type PostFact = {
  id: string;
  platform: Platform;
  content: string;
  publishedAt: string | null; // ISO
  url: string | null;
  impressions: number | null;
  engagements: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  clicks: number | null;
  source: string;
};
export type DailyFact = { day: string; impressions: number | null; engagements: number | null }; // LinkedIn account, one row per day
export type XWeek = { week: number; impressions: number; likes: number; comments: number; shares: number; bookmarks: number }; // week 1 = last 7 days
export type Scheduled = { platform: Platform; date: string; text: string };

export type AdvisoryInput = {
  now: string; // ISO
  posts: PostFact[];
  linkedinDaily: DailyFact[];
  xWeeks: XWeek[];
  scheduled: Scheduled[] | null; // null when Postiz could not be reached
  comments?: CommentFact[];
};

export type CommentFact = { platform: Platform; open: number; oldestHours: number | null; last30: number; replied30: number };

export type Group = "holding_back" | "missing" | "working" | "stop" | "experiment";
export type Severity = "high" | "medium" | "low";
export type Metric = "reach" | "engagement" | "replies" | "likes" | "consistency" | "data";

export type Finding = {
  id: string;
  platform: Platform | "both";
  group: Group;
  severity: Severity;
  metric: Metric;
  title: string;
  why: string;
  action: string;
  evidence: string[];
  basis: "data" | "playbook";
};

export type ScorePart = { label: string; score: number; note: string };
export type Score = { overall: number; label: "Strong" | "Okay" | "Needs work"; parts: ScorePart[] };

export type Flag = { key: string; label: string; tone: "bad" | "good" | "info" };
export type PostAudit = {
  id: string;
  platform: Platform;
  snippet: string;
  url: string | null;
  date: string | null;
  impressions: number | null;
  engagements: number | null;
  rate: number | null;
  score: number | null;
  hasText: boolean;
  flags: Flag[];
};

export type Focus = { title: string; action: string; platform: Platform | "both" };

export type Digest = {
  linkedin: { days: number; lastDay: string | null; last28: number | null; prev28: number | null; erLast28: number | null; erBaseline: number | null; posts: number; postsWithText: number };
  x: { weeksLoaded: number; last4: number | null; prev4: number | null; posts: number; postsWithText: number };
};

export type Advisory = {
  generatedAt: string;
  day: string; // YYYY-MM-DD (UTC)
  headline: string;
  scores: { linkedin: Score | null; x: Score | null };
  focus: Focus[];
  findings: Finding[];
  audits: PostAudit[];
  digest: Digest;
};
