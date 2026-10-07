import { chromium } from "playwright-core";
const S = process.argv[2] || "./shots";
import { mkdirSync } from "node:fs";
mkdirSync(S, { recursive: true });
// CHROMIUM_PATH must point at a Chromium or Chrome binary.
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ["--no-sandbox"] });
const page = await b.newPage({ viewport: { width: 1360, height: 1000 }, timezoneId: "Europe/Berlin" });
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text()));
page.on("response", (r) => r.status() >= 400 && console.log("HTTP", r.status(), r.url()));
const base = process.env.BASE || "http://localhost:3100";
const step = (s) => console.log("step:", s);
const shot = (n) => page.screenshot({ path: `${S}/n-${n}.png`, fullPage: true });
const api = (path, body, method = "POST") => page.evaluate(async ([p, b, m]) => { const r = await fetch(p, { method: m, headers: { "content-type": "application/json" }, body: JSON.stringify(b) }); return { ok: r.ok, status: r.status, body: await r.text() }; }, [path, body, method]);

await page.goto(base + "/login"); await page.fill("input[name=password]", "pw123");
await Promise.all([page.waitForURL(base + "/"), page.click("button")]);
await page.click("text=Sync from Postiz"); await page.waitForSelector("text=Synced from Postiz", { timeout: 60000 });

step("alerts");
await page.goto(base + "/alerts");
await page.click("button:has-text('Check now')");
await page.waitForSelector("text=Taking off", { timeout: 30000 });
await page.waitForSelector("text=Slow start");
await page.reload(); await shot("alerts");
console.log("nav badge:", await page.locator("nav .nav-badge").allTextContents());

step("post speed");
await page.goto(base + "/posts/pnew1"); await page.waitForSelector("text=First hour");
await shot("post");

step("analytics tabs");
for (const t of ["benchmarks", "content", "goals", "growth", "reports"]) {
  await page.goto(base + "/analytics/" + t);
  await page.waitForSelector(`h1:has-text('${t[0].toUpperCase() + t.slice(1)}')`, { timeout: 20000 });
  await shot("an-" + t);
}

step("goal");
await page.goto(base + "/analytics/goals");
console.log("goal api:", JSON.stringify(await api("/api/goals", { platform: "linkedin", metric: "impressions", period: "month", target: 100000 })).slice(0, 120));
await page.reload(); await page.waitForSelector("text=/100,000/"); await shot("goals");

step("followers");
for (let i = 1; i <= 30; i++) {
  const d = new Date(Date.now() - (31 - i) * 86400000).toISOString().slice(0, 10);
  const r = await api("/api/followers", { platform: "linkedin", day: d, total: 1000 + i * 4 + (i % 7 === 0 ? 40 : 0) });
  if (!r.ok) { console.log("follower api fail", r.status, r.body.slice(0, 120)); break; }
}
await page.goto(base + "/analytics/growth"); await page.waitForSelector("text=Followers now"); await shot("growth");

step("reports");
const pdf = await page.evaluate(async () => { const r = await fetch("/api/reports?freq=weekly"); const t = new Uint8Array(await r.arrayBuffer()); return { ok: r.ok, type: r.headers.get("content-type"), head: String.fromCharCode(...t.slice(0, 5)), size: t.length }; });
console.log("pdf:", JSON.stringify(pdf));
await page.goto(base + "/analytics/reports");
await page.click("button:has-text('Email the report now')");
await page.waitForSelector("text=/sent|Sent/", { timeout: 30000 });
await shot("reports");

step("comments: messages, templates, reminders, lead");
await page.goto(base + "/comments");
await page.click("button:has-text('Message')");
await page.fill("textarea[placeholder^='Open the conversation']", "Jane Doe\nHi, loved your post. Do you do consulting?\n\nSam Roe\nCan we talk pricing?");
await page.click("button:has-text('Add messages')");
await page.waitForSelector("text=Jane Doe", { timeout: 20000 });
await page.goto(base + "/comments?k=dm"); await page.waitForSelector("text=Jane Doe");
await shot("comments-dm");
await page.click("button:has-text('Mark as lead') >> nth=0"); await page.waitForSelector("text=Added to Leads", { timeout: 15000 });
await page.click("button:has-text('Remind me') >> nth=1"); await page.waitForSelector("text=Tomorrow");
await page.click("text=Tomorrow"); await page.waitForTimeout(1500);
await page.goto(base + "/comments"); await page.waitForSelector("text=/Follow up/"); await shot("comments");

step("leads");
await page.goto(base + "/leads"); await page.waitForSelector("text=Jane Doe");
await shot("leads");

step("targets");
await page.goto(base + "/targets");
console.log("target api:", (await api("/api/targets", { platform: "x", name: "Ann Lee", handle: "ann", note: "SaaS founder" })).status);
await page.reload(); await page.waitForSelector("text=Ann Lee");
await page.click("button:has-text('Mark engaged') >> nth=0"); await page.waitForTimeout(800);
await page.waitForSelector("text=/1 of/", { timeout: 15000 }).catch(() => {});
await shot("targets");

step("features links");
await page.goto(base + "/features"); await page.waitForSelector("text=How to enable");
const hrefs = await page.evaluate(() => [...new Set([...document.querySelectorAll(".feat-name")].map((a) => a.getAttribute("href")))]);
for (const h of hrefs) {
  const r = await page.goto(base + h);
  const txt = await page.innerText("body");
  if (!r.ok() || /Application error|This page could not be found/.test(txt)) console.log("BAD LINK", h, r.status());
}
await page.goto(base + "/features"); await shot("features");
console.log("feature links checked:", hrefs.length);
console.log("ERRORS:", JSON.stringify(errors));
await b.close();
