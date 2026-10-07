/** The platform's own id for a post, taken from its link: the X status id, or the LinkedIn activity, share or ugcPost number. */
export function externalId(url: string | null | undefined): string | null {
  if (!url) return null;
  return /\/status\/(\d+)/.exec(url)?.[1] ?? /urn:li:(?:activity|share|ugcPost):(\d+)/.exec(url)?.[1] ?? null;
}

/** LinkedIn posts are addressed by URN when we reply to a comment. */
export function linkedinUrn(url: string | null | undefined): string | null {
  const m = /urn:li:(activity|share|ugcPost):(\d+)/.exec(url ?? "");
  return m ? `urn:li:${m[1]}:${m[2]}` : null;
}
