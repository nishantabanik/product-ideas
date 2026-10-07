import { emailConfigured, sendEmail } from "../notify";
import { getState, setState } from "../connections";
import { buildPdf } from "./pdf";
import { loadReport } from "./load";
import { reportDue, reportEmail, type Freq } from "./report";

export const FREQ_KEY = "report:freq";
export const LAST_KEY = "report:last";

export async function getFrequency(): Promise<"off" | Freq> {
  const v = await getState(FREQ_KEY);
  return v === "weekly" || v === "monthly" ? v : "off";
}

/** Builds the report for the period that just ended and emails it with the PDF attached. */
export async function emailReport(freq: Freq, now: Date = new Date()): Promise<{ ok: boolean; key: string; error?: string }> {
  const report = await loadReport(freq, now);
  const key = report.period.key;
  if (!emailConfigured()) return { ok: false, key, error: "Email is not set up. Add RESEND_API_KEY and NOTIFY_EMAIL_TO in Vercel, then redeploy." };
  const pdf = await buildPdf(report);
  const mail = reportEmail(report);
  const sent = await sendEmail({ subject: mail.subject, html: mail.html, text: mail.text, attachments: [{ filename: `report-${key}.pdf`, content: pdf }] });
  return sent.ok ? { ok: true, key } : { ok: false, key, error: sent.error ?? "The email was not sent." };
}

/** Called by the daily job. Sends the report when a period has ended and has not been sent, and marks it sent only on success. */
export async function runScheduledReports(now: Date = new Date()): Promise<string[]> {
  const freq = await getState(FREQ_KEY);
  if (freq !== "weekly" && freq !== "monthly") return [];
  const { due, period } = reportDue(freq, now, await getState(LAST_KEY));
  if (!due || !period) return [];
  const r = await emailReport(freq, now);
  if (!r.ok) return [`The ${freq} report for ${r.key} was not sent: ${r.error}`];
  await setState(LAST_KEY, r.key);
  return [`Sent the ${freq} report for ${r.key}.`];
}
