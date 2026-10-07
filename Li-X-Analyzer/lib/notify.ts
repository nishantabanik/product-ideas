/**
 * Sending messages out: email through Resend (a free plan is enough) and Telegram. Both are optional and each does nothing,
 * with a clear reason, when it is not set up. The API bases can be overridden so tests can point at a local server.
 */
const resendBase = () => (process.env.RESEND_API_BASE || "https://api.resend.com").replace(/\/$/, "");
const telegramBase = () => (process.env.TELEGRAM_API_BASE || "https://api.telegram.org").replace(/\/$/, "");

export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL_TO);
export const telegramConfigured = () => Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);

export type Attachment = { filename: string; content: Uint8Array };
export type Sent = { ok: boolean; skipped?: boolean; error?: string };

export async function sendEmail(o: { subject: string; html: string; text?: string; to?: string; attachments?: Attachment[] }): Promise<Sent> {
  const to = o.to || process.env.NOTIFY_EMAIL_TO;
  if (!process.env.RESEND_API_KEY || !to) return { ok: false, skipped: true, error: "Email is not set up. Add RESEND_API_KEY and NOTIFY_EMAIL_TO." };
  try {
    const res = await fetch(`${resendBase()}/emails`, {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        from: process.env.NOTIFY_EMAIL_FROM || "Li X Analyzer <onboarding@resend.dev>",
        to: to.split(",").map((x) => x.trim()).filter(Boolean),
        subject: o.subject, html: o.html, text: o.text,
        attachments: o.attachments?.map((a) => ({ filename: a.filename, content: Buffer.from(a.content).toString("base64") })),
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return { ok: false, error: `Resend answered HTTP ${res.status}: ${(await res.text()).replace(/\s+/g, " ").slice(0, 200)}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Email could not be sent: ${(e as Error).message}` };
  }
}

export async function sendTelegram(text: string): Promise<Sent> {
  if (!telegramConfigured()) return { ok: false, skipped: true, error: "Telegram is not set up. Add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID." };
  try {
    const res = await fetch(`${telegramBase()}/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: text.slice(0, 3900), disable_web_page_preview: true }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return { ok: false, error: `Telegram answered HTTP ${res.status}: ${(await res.text()).replace(/\s+/g, " ").slice(0, 200)}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Telegram message failed: ${(e as Error).message}` };
  }
}

/** Tells us on every channel that is set up. Never throws. */
export async function notifyAll(o: { subject: string; text: string; html?: string }) {
  const [email, telegram] = await Promise.all([
    emailConfigured() ? sendEmail({ subject: o.subject, html: o.html ?? `<p>${o.text.replace(/\n/g, "<br>")}</p>`, text: o.text }) : Promise.resolve<Sent>({ ok: false, skipped: true }),
    telegramConfigured() ? sendTelegram(`${o.subject}\n\n${o.text}`) : Promise.resolve<Sent>({ ok: false, skipped: true }),
  ]);
  return { email, telegram };
}
