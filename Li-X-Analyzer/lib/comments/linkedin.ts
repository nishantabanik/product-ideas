/**
 * LinkedIn lets an app comment on a member's behalf (w_member_social) but does not let it read the comments on a personal
 * profile, because that permission is closed to new requests. So comments reach us by pasting, and this module sends the reply.
 * It needs our own LinkedIn developer app with the "Share on LinkedIn" product and "Sign In with LinkedIn using OpenID Connect".
 */
const authBase = () => (process.env.LINKEDIN_AUTH_BASE || "https://www.linkedin.com").replace(/\/$/, "");
const apiBase = () => (process.env.LINKEDIN_API_BASE || "https://api.linkedin.com").replace(/\/$/, "");
const version = () => process.env.LINKEDIN_VERSION || "202606";

export type LinkedinConn = { accessToken: string; expiresAt: number; personUrn: string; name: string };

export const linkedinOAuthConfigured = () => Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);
export const redirectUri = (origin: string) => `${(process.env.APP_URL || origin).replace(/\/$/, "")}/api/connect/linkedin/callback`;

export function authorizeUrl(origin: string, state: string) {
  const u = new URL(`${authBase()}/oauth/v2/authorization`);
  u.search = new URLSearchParams({ response_type: "code", client_id: process.env.LINKEDIN_CLIENT_ID!, redirect_uri: redirectUri(origin), state, scope: "openid profile w_member_social" }).toString();
  return u.toString();
}

export function explainLinkedin(status: number, body: string) {
  const snippet = body.replace(/\s+/g, " ").slice(0, 220);
  if (status === 401) return "LinkedIn rejected our token. It may have expired (they last 60 days). Connect LinkedIn again on the Settings page.";
  if (status === 403) return `LinkedIn refused this comment (HTTP 403). The connected account needs the w_member_social permission and must be allowed to comment on that post. ${snippet}`;
  if (status === 404) return `LinkedIn could not find that post or comment (HTTP 404). Check the comment link. ${snippet}`;
  if (status === 429) return "LinkedIn is rate limiting us (HTTP 429). Try again later.";
  return `LinkedIn answered HTTP ${status}. ${snippet}`;
}

export async function exchangeCode(code: string, origin: string): Promise<LinkedinConn> {
  const res = await fetch(`${authBase()}/oauth/v2/accessToken`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "authorization_code", code, client_id: process.env.LINKEDIN_CLIENT_ID!, client_secret: process.env.LINKEDIN_CLIENT_SECRET!, redirect_uri: redirectUri(origin) }),
    signal: AbortSignal.timeout(30_000),
  });
  const d = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!res.ok || !d.access_token) throw new Error(`LinkedIn did not accept the sign in. ${d.error_description ?? `HTTP ${res.status}`}`);
  const me = await fetch(`${apiBase()}/v2/userinfo`, { headers: { authorization: `Bearer ${d.access_token}` }, signal: AbortSignal.timeout(30_000) });
  const u = (await me.json().catch(() => ({}))) as { sub?: string; name?: string };
  if (!me.ok || !u.sub) throw new Error("LinkedIn signed us in but did not tell us who we are. Check that Sign In with LinkedIn using OpenID Connect is added to the app.");
  return { accessToken: d.access_token, expiresAt: Math.floor(Date.now() / 1000) + Number(d.expires_in ?? 5_184_000), personUrn: `urn:li:person:${u.sub}`, name: u.name ?? "LinkedIn member" };
}

/** Posts our reply under a comment (or, with no parent, as a comment on the post). Returns the new comment's id when LinkedIn gives one. */
export async function replyLinkedin(conn: LinkedinConn, o: { postUrn: string; parentCommentUrn?: string | null; text: string }): Promise<string | null> {
  if (conn.expiresAt < Date.now() / 1000) throw new Error("The LinkedIn connection has expired. Connect LinkedIn again on the Settings page.");
  const res = await fetch(`${apiBase()}/rest/socialActions/${encodeURIComponent(o.postUrn)}/comments`, {
    method: "POST",
    headers: { authorization: `Bearer ${conn.accessToken}`, "content-type": "application/json", "linkedin-version": version(), "x-restli-protocol-version": "2.0.0" },
    body: JSON.stringify({ actor: conn.personUrn, object: o.postUrn, message: { text: o.text }, ...(o.parentCommentUrn ? { parentComment: o.parentCommentUrn } : {}) }),
    signal: AbortSignal.timeout(30_000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(explainLinkedin(res.status, text));
  return res.headers.get("x-restli-id") ?? (JSON.parse(text || "{}") as { id?: string }).id ?? null;
}
