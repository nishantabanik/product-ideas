export type Platform = "linkedin" | "x";
export type CommentStatus = "new" | "replied" | "ignored";
export type CommentKind = "comment" | "dm";

export type NewComment = {
  platform: Platform;
  postId: string | null; // our posts.id when we know which post it belongs to
  postRef: string | null; // the platform's id of that post, kept even when we do not store the post
  externalId: string | null; // the platform's id of the comment
  authorName: string;
  authorHandle: string | null;
  authorUrl: string | null;
  body: string;
  commentedAt: string | null;
  source: "manual" | "paste" | "csv" | "x_api";
  commentUrl: string | null;
  likes: number | null;
  kind?: CommentKind; // default "comment"; "dm" is a direct message pasted in
};

export type CommentRow = {
  id: string;
  platform: Platform;
  postId: string | null;
  postRef: string | null;
  externalId: string | null;
  authorName: string;
  authorHandle: string | null;
  authorUrl: string | null;
  body: string;
  commentedAt: string | null;
  source: string;
  status: CommentStatus;
  commentUrl: string | null;
  likes: number | null;
  replyText: string | null;
  repliedAt: string | null;
  replyVia: string | null;
  createdAt: string;
  postContent: string | null;
  postUrl: string | null;
  kind: CommentKind;
  followUpAt: string | null;
};
