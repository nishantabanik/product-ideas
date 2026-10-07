// Builds LinkedIn style exports: ENGAGEMENT (daily) + TOP POSTS (two side by side tables, max 50 each)
const ExcelJS = require("/home/user/Li-X-Analyzer/node_modules/exceljs");
const fs = require("fs");
const out = process.argv[2];
const DAY = 86400000;
const today = Date.UTC(2026, 9, 4); // 4 Oct 2026
const N = 549; // 1.5 years of days
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// ground truth for the whole 549 days
const days = Array.from({ length: N }, (_, i) => {
  const t = today - (N - 1 - i) * DAY;
  const posted = rnd() < 0.45;
  const impressions = posted ? Math.round(300 + rnd() * 3000) : Math.round(rnd() * 150);
  return { t, impressions, engagements: Math.round(impressions * (0.02 + rnd() * 0.06)), posted };
});
const posts = days.filter((d) => d.posted).map((d, i) => ({ ...d, url: `https://www.linkedin.com/feed/update/urn:li:activity:${7000000000000 + i}/` }));
fs.writeFileSync(out + "/truth.json", JSON.stringify({ days: N, posts: posts.length, impressions: days.reduce((a, d) => a + d.impressions, 0) }));

const us = (t) => { const d = new Date(t); return `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`; };

async function make(name, fromIdx, toIdx, opts = {}) {
  const wb = new ExcelJS.Workbook();
  const perf = wb.addWorksheet("PERFORMANCE");
  perf.addRows([["Overall performance"], ["Impressions", 123], ["Members reached", 99]]);
  const eng = wb.addWorksheet("ENGAGEMENT");
  eng.addRow(["Date", "Impressions", "Engagements"]);
  for (let i = fromIdx; i <= toIdx; i++) {
    const d = days[i];
    const stale = opts.staleLast && i > toIdx - 3; // recent days are still counting when exported early
    const imp = stale ? Math.round(d.impressions * 0.6) : d.impressions;
    eng.addRow([opts.dateCells ? new Date(d.t) : us(d.t), imp, stale ? Math.round(d.engagements * 0.6) : d.engagements]);
  }
  const top = wb.addWorksheet("TOP POSTS");
  top.addRow(["Maximum of 50 posts can be displayed"]);
  top.addRow(["Post URL", "Post publish date", "Engagements", "", "Post URL", "Post publish date", "Impressions"]);
  const inRange = posts.filter((p) => p.t >= days[fromIdx].t && p.t <= days[toIdx].t);
  const byEng = [...inRange].sort((a, b) => b.engagements - a.engagements).slice(0, 50);
  const byImp = [...inRange].sort((a, b) => b.impressions - a.impressions).slice(0, 50);
  for (let r = 0; r < 50; r++) {
    const a = byEng[r], b = byImp[r];
    top.addRow([a?.url ?? "", a ? us(a.t) : "", a?.engagements ?? "", "", b?.url ?? "", b ? us(b.t) : "", b?.impressions ?? ""]);
  }
  await wb.xlsx.writeFile(`${out}/${name}`);
  return { posts: inRange.length };
}
(async () => {
  console.log("full", await make("full.xlsx", 0, N - 1));
  console.log("part1", await make("part1.xlsx", 0, 365, { staleLast: true }));
  console.log("part2", await make("part2.xlsx", 183, N - 1, { dateCells: true }));
  console.log(fs.readFileSync(out + "/truth.json", "utf8"));
})();
