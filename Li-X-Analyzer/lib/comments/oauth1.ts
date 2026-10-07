import { createHmac, randomBytes } from "node:crypto";

export type Creds = { key: string; secret: string; token: string; tokenSecret: string };

/** RFC 3986 percent encoding, which is stricter than encodeURIComponent. */
export const enc = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());

/**
 * OAuth 1.0a signature and Authorization header for one request. Query parameters (and form fields) are part of the signature,
 * a JSON body is not.
 */
export function oauth1Header(method: string, url: string, params: Record<string, string>, c: Creds, o: { nonce?: string; timestamp?: string } = {}) {
  const oauth: Record<string, string> = {
    oauth_consumer_key: c.key,
    oauth_nonce: o.nonce ?? randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: o.timestamp ?? String(Math.floor(Date.now() / 1000)),
    oauth_token: c.token,
    oauth_version: "1.0",
  };
  const base = new URL(url);
  const all: [string, string][] = [...Object.entries(params), ...Object.entries(oauth), ...[...base.searchParams.entries()]];
  const normalized = all.map(([k, v]) => [enc(k), enc(v)] as const).sort((a, b) => (a[0] === b[0] ? (a[1] < b[1] ? -1 : 1) : a[0] < b[0] ? -1 : 1)).map(([k, v]) => `${k}=${v}`).join("&");
  const origin = `${base.protocol}//${base.host}${base.pathname}`;
  const sigBase = [method.toUpperCase(), enc(origin), enc(normalized)].join("&");
  const signature = createHmac("sha1", `${enc(c.secret)}&${enc(c.tokenSecret)}`).update(sigBase).digest("base64");
  return "OAuth " + Object.entries({ ...oauth, oauth_signature: signature }).sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => `${enc(k)}="${enc(v)}"`).join(", ");
}
