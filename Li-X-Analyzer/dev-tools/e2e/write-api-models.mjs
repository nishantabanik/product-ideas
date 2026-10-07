import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ["--no-sandbox"] });
const page = await b.newPage({ viewport: { width: 1360, height: 1100 } });
const base = process.env.BASE || "http://localhost:3100";
await page.goto(base + "/login"); await page.fill("input[name=password]", "pw123");
await Promise.all([page.waitForURL(base + "/"), page.click("button")]);
const call = (model) => page.evaluate(async (m) => { const r = await fetch("/api/studio/write", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ topic: "Faster deploys", format: "before-after", platforms: ["linkedin", "x"], model: m }) }); return { status: r.status, body: await r.json() }; }, model);
for (const m of ["gateway::mock-model", "gateway::claude-Code", "gateway::claude-free"]) {
  const r = await call(m);
  console.log(m, r.status, r.status === 200 ? { li: r.body.linkedin.slice(0, 60), xlen: r.body.x.length, dash: /[—–]/.test(r.body.linkedin), fixed: r.body.fixed } : r.body.error.slice(0, 260));
}
await b.close();
