import { chromium } from "playwright-core";
const S = process.argv[2] || "./shots";
import { mkdirSync } from "node:fs";
mkdirSync(S, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ["--no-sandbox"] });
const page = await b.newPage({ viewport: { width: 1280, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text()));
const base = process.env.BASE || "http://localhost:3100";
await page.goto(base + "/login");
await page.fill("input[name=password]", "pw123");
await Promise.all([page.waitForURL(base + "/"), page.click("button")]);
await page.goto(base + "/");
await page.click("text=Sync from Postiz"); await page.waitForSelector("text=Synced from Postiz", { timeout: 60000 });
// settings, copilot flow
await page.goto(base + "/settings");
if (await page.locator("button:has-text('Sign out')").count()) { await page.click("button:has-text('Sign out')"); await page.waitForSelector("text=Sign in with GitHub"); }
await page.click("text=Sign in with GitHub");
await page.waitForSelector("text=ABCD-1234");
await page.waitForSelector("text=/Signed in as octo/", { timeout: 30000 });
await page.screenshot({ path: `${S}/c-settings.png`, fullPage: true });
await page.click("button:has-text('Test the model')"); await page.waitForSelector("text=/answered with/");
await page.click("button:has-text('Test connection')"); await page.waitForSelector("text=/Signed in as @me/");
// comments: X sync
await page.goto(base + "/comments");
console.log("step: x sync");
await page.click("text=Check X for replies");
await page.waitForSelector("text=Ann Lee", { timeout: 20000 });
console.log("X comments visible:", await page.locator("text=Bob Roy").count());
console.log("step: paste");
// paste comments for LinkedIn
await page.selectOption("select.input", { index: 1 });
await page.fill("textarea[placeholder^=\"On the post\"]", "Jane Doe\nGreat post, we saw the same.\n\nSam: Where can I read more?");
await page.click("button:has-text('Add comments')");
await page.waitForSelector("text=Jane Doe", { timeout: 20000 });
console.log("step: suggest");
// suggest and send reply on X comment
const card = page.locator("article.comment").filter({ hasText: "Ann Lee" }).first();
await card.locator("button:has-text('Suggest')").click();
await page.waitForSelector("text=Thanks, glad it helped");
await page.click("text=Thanks, glad it helped");
console.log("step: send");
await card.locator("button:has-text('Reply on X')").first().click();
await page.waitForTimeout(2500);
await page.screenshot({ path: `${S}/c-comments.png`, fullPage: true });
await page.goto(base + "/comments?s=replied");
console.log("replied tab has Ann:", await page.locator("text=Ann Lee").count());
console.log("ERRORS:", JSON.stringify(errors));
await b.close();
