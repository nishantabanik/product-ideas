export type Platform = "linkedin" | "x";
export type DraftStatus = "idea" | "draft" | "review" | "approved" | "scheduled" | "published";
export const STATUSES: DraftStatus[] = ["idea", "draft", "review", "approved", "scheduled", "published"];

export type Draft = {
  id: string;
  platform: Platform;
  status: DraftStatus;
  title: string;
  content: string;
  thread: string[]; // X only: one entry per post, empty means a single post in content
  pillar: string | null;
  source: "manual" | "ai" | "repurpose" | "recycle";
  parentId: string | null;
  parentPostId: string | null;
  scheduledFor: string | null;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PostFact = {
  id: string;
  platform: Platform;
  content: string;
  publishedAt: string | null;
  impressions: number | null;
  engagements: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
};
