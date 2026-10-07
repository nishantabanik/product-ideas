/** What we can learn from the link to a LinkedIn comment ("Copy link to comment"). */
export type CommentLink = { commentUrn: string; postUrn: string; commentId: string };

export function parseLinkedinCommentLink(link: string | null | undefined): CommentLink | null {
  if (!link) return null;
  let text = link;
  try { text = decodeURIComponent(link); } catch { /* keep as is */ }
  // urn:li:comment:(activity:7000,7001) or urn:li:comment:(urn:li:activity:7000,7001)
  const m = /urn:li:comment:\(\s*(?:urn:li:)?(activity|share|ugcPost):(\d+)\s*,\s*(\d+)\s*\)/.exec(text);
  if (!m) return null;
  return { commentUrn: `urn:li:comment:(urn:li:${m[1]}:${m[2]},${m[3]})`, postUrn: `urn:li:${m[1]}:${m[2]}`, commentId: m[3] };
}
