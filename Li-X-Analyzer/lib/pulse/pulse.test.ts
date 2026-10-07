import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { interpolate, learnCurve, paceStatus } from "./pace.ts";
import { compareWithPrevious, curvePoints, firstHour, impressionsAt } from "./curve.ts";
import { emailConfigured, notifyAll, sendEmail, sendTelegram } from "../notify.ts";

test("pace: a strong start is flagged, a weak one too, and early or unknown posts are left alone", () => {
  const typical = 10_000;
  assert.equal(paceStatus({ ageMinutes: 10, impressions: 500, typicalFinal: typical }).state, "too_early");
  assert.equal(paceStatus({ ageMinutes: 60, impressions: 900, typicalFinal: null }).state, "no_baseline");
  const up = paceStatus({ ageMinutes: 60, impressions: 6000, typicalFinal: typical }); // expected 3500 at 60 min
  assert.equal(up.state, "taking_off");
  assert.ok(up.ratio! > 1.5);
  assert.equal(paceStatus({ ageMinutes: 90, impressions: 900, typicalFinal: typical }).state, "slow");
  assert.equal(paceStatus({ ageMinutes: 60, impressions: 3500, typicalFinal: typical }).state, "on_track");
  assert.equal(paceStatus({ ageMinutes: 600, impressions: 100, typicalFinal: typical }).state, "on_track"); // too late to call a slow start
  assert.equal(paceStatus({ ageMinutes: 30, impressions: 30, typicalFinal: 100 }).state, "on_track"); // tiny numbers never trigger taking off
});

test("pace: our own curve replaces the general one once there is history", () => {
  const post = (mult: number) => ({ snaps: [15, 30, 60, 120, 360, 1440, 2880].map((at) => ({ at, impressions: Math.round(1000 * mult * Math.min(1, at / 120 * 0.5 + (at >= 1440 ? 0.5 : 0))) })) });
  assert.equal(learnCurve([post(1), post(2)]), null, "two posts are not enough");
  const history = Array.from({ length: 9 }, (_, i) => post(1 + i / 10));
  const curve = learnCurve(history);
  assert.ok(curve);
  assert.equal(curve![0][0], 0);
  assert.ok(Math.abs(interpolate(curve!, 1440) - interpolate(curve!, 1440)) < 1e-9);
  for (let i = 1; i < curve!.length; i++) assert.ok(curve![i][1] >= curve![i - 1][1]);
});

test("curve: points, first hour and interpolation only when the snapshots are close enough", () => {
  const pub = "2026-10-05T10:00:00Z";
  const snap = (min: number, imp: number) => ({ takenAt: new Date(Date.parse(pub) + min * 60_000).toISOString(), impressions: imp, likes: 0, comments: 0, shares: 0, clicks: 0 });
  const pts = curvePoints([snap(-5, 1), snap(30, 200), snap(70, 500), snap(300, 900), snap(1500, 1200)], pub);
  assert.equal(pts.length, 4, "snapshots from before publishing are ignored");
  assert.equal(firstHour(pts), 200 + Math.round((300 * (60 - 30)) / 40));
  assert.equal(impressionsAt(pts, 2.5), 500 + Math.round((400 * (2.5 - 70 / 60)) / (5 - 70 / 60)));
  assert.equal(firstHour(curvePoints([snap(300, 900)], pub)), null, "no early snapshot, so no first hour figure");
  assert.equal(impressionsAt(curvePoints([snap(30, 100), snap(2000, 900)], pub), 10), null, "a gap this wide is not interpolated");
});

test("compare with the previous post", () => {
  const c = compareWithPrevious({ impressions: 1500, likes: 10, comments: null, shares: 0 }, { impressions: 1000, likes: 20, comments: 5, shares: 0 });
  assert.equal(c[0].change, 50);
  assert.equal(c[1].change, -50);
  assert.equal(c[2].change, null);
  assert.equal(c[3].change, null);
});

async function serve(handler: (url: string, body: string, headers: Record<string, unknown>) => number) {
  const seen: { url: string; body: string; headers: Record<string, unknown> }[] = [];
  const server = createServer((req, res) => {
    let body = ""; req.on("data", (c) => (body += c));
    req.on("end", () => { seen.push({ url: req.url ?? "", body, headers: req.headers }); res.statusCode = handler(req.url ?? "", body, req.headers); res.end("{}"); });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  return { base: `http://127.0.0.1:${(server.address() as { port: number }).port}`, seen, close: () => server.close() };
}

test("email and Telegram go to the services, and say why when they are not set up", async () => {
  const keep = { ...process.env };
  for (const k of ["RESEND_API_KEY", "NOTIFY_EMAIL_TO", "TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"]) delete process.env[k];
  assert.equal(emailConfigured(), false);
  assert.match((await sendEmail({ subject: "s", html: "h" })).error!, /RESEND_API_KEY/);
  assert.equal((await sendTelegram("hi")).skipped, true);

  const s = await serve(() => 200);
  Object.assign(process.env, { RESEND_API_BASE: s.base, TELEGRAM_API_BASE: s.base, RESEND_API_KEY: "rk", NOTIFY_EMAIL_TO: "a@x.io, b@x.io", TELEGRAM_BOT_TOKEN: "tok", TELEGRAM_CHAT_ID: "42" });
  const r = await sendEmail({ subject: "Report", html: "<p>x</p>", attachments: [{ filename: "r.pdf", content: new Uint8Array([1, 2, 3]) }] });
  assert.equal(r.ok, true);
  const mail = JSON.parse(s.seen[0].body);
  assert.deepEqual(mail.to, ["a@x.io", "b@x.io"]);
  assert.equal(mail.attachments[0].content, Buffer.from([1, 2, 3]).toString("base64"));
  assert.equal(s.seen[0].headers.authorization, "Bearer rk");
  const n = await notifyAll({ subject: "Alert", text: "Taking off" });
  assert.equal(n.email.ok && n.telegram.ok, true);
  assert.ok(s.seen.some((x) => x.url === "/bottok/sendMessage" && JSON.parse(x.body).chat_id === "42"));
  s.close();
  const bad = await serve(() => 500);
  process.env.RESEND_API_BASE = bad.base;
  assert.match((await sendEmail({ subject: "s", html: "h" })).error!, /HTTP 500/);
  bad.close();
  process.env = keep;
});
