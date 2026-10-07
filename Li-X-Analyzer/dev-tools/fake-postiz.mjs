import http from "node:http";
const D = 86400000, now = Date.now();
const topics = ["shipping on Fridays", "our last launch", "hiring the first engineer", "cold emails that get replies", "building in public", "writing shorter intros", "pricing our product", "customer interviews", "weekly planning", "remote work habits"];
const posts = [];
let id = 0;
const text = (platform, i) => {
  const t = topics[i % topics.length];
  const q = i % 2 === 0, link = i % 3 === 0, tags = i % 5 === 0, num = i % 4 === 0, cliche = i % 11 === 0;
  let s = cliche ? `Excited to announce what we learned about ${t}` : num ? `${3 + (i % 5)} lessons about ${t}` : `What we learned about ${t}`;
  if (platform === "linkedin") s += `\n\nWe tried it for a month and wrote down what changed.\n\nThe short version: small steps, every day.`;
  if (q) s += `\n\nWhat has worked for you?`;
  if (link) s += `\nhttps://example.com/p/${i}`;
  if (tags) s += `\n#startup #growth #saas #tips #product #marketing`;
  return s;
};
const feats = (s) => ({ q: s.includes("?"), link: /https?:/.test(s), tags: (s.match(/#\w+/g) || []).length > 3, num: /^\d/.test(s), cliche: /^excited/i.test(s) });
const impFor = (p) => {
  const f = feats(p.raw);
  const base = p.integration.id === "c-li" ? 1400 : 900;
  return Math.round(base * (0.8 + ((p.n * 37) % 40) / 100) * (f.q ? 1.8 : 1) * (f.link ? 0.5 : 1) * (f.tags ? 0.7 : 1) * (f.num ? 1.2 : 1) * (f.cliche ? 0.6 : 1));
};
const add = (dayOffset, hour, ch, state, raw, n) => {
  const d = new Date(now + dayOffset * D); d.setUTCHours(hour, 0, 0, 0);
  posts.push({ id: "p" + ++id, n, raw, content: `<p>${raw.replace(/\n/g, "<br>")}</p>`, publishDate: d.toISOString(), state, releaseURL: state === "PUBLISHED" ? `https://example.com/${id}` : null, integration: { id: ch } });
};
for (let i = -60; i <= -1; i++) {
  const n = -i;
  if (n % 3 !== 0) add(i, 9, "c-li", "PUBLISHED", text("linkedin", n), n);
  add(i, n % 2 ? 15 : 11, "c-x", "PUBLISHED", text("x", n + 3), n + 3);
}
for (let i = 1; i <= 9; i++) { if (i % 2) add(i, 9, "c-li", "QUEUE", text("linkedin", 100 + i), 100 + i); add(i, 15, "c-x", "QUEUE", text("x", 200 + i), 200 + i); }
const recent = (id, minutes, raw) => posts.push({ id, n: 999, raw, content: `<p>${raw}</p>`, publishDate: new Date(now - minutes * 60000).toISOString(), state: "PUBLISHED", releaseURL: `https://example.com/${id}`, integration: { id: "c-x" } });
recent("pnew1", 90, "A fresh post that is going great right now?");
recent("pnew2", 180, "A fresh post that is slow");
const special = { pnew1: 6000, pnew2: 25 };
http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const u = new URL(req.url, "http://x");
    const send = (o, code = 200) => { res.statusCode = code; res.setHeader("content-type", "application/json"); res.end(JSON.stringify(o)); };
    if (req.headers.authorization !== "testkey") return send({ msg: "bad key" }, 401);
    const p = u.pathname.replace("/public/v1", "");
    if (p === "/integrations") return send([{ id: "c-x", name: "Nishanta Banik", identifier: "x" }, { id: "c-li", name: "Nishanta Banik", identifier: "linkedin" }]);
    if (p === "/posts" && req.method === "GET") return send({ posts });
    if (p === "/posts" && req.method === "POST") { console.log("POST_POSTS " + body.slice(0, 900)); return send([{ ok: true }]); }
    if (p.startsWith("/analytics/post/")) {
      const post = posts.find((x) => x.id === p.split("/").pop());
      const imp = special[p.split("/").pop()] ?? (post ? impFor(post) : 500);
      const f = post ? feats(post.raw) : {};
      return send([
        { label: "Impressions", data: [{ total: String(imp), date: "d" }] },
        { label: "Likes", data: [{ total: String(Math.round(imp * 0.03)) , date: "d" }] },
        { label: "Replies", data: [{ total: String(Math.round(imp * (f.q ? 0.012 : 0.003))), date: "d" }] },
        { label: "Retweets", data: [{ total: String(Math.round(imp * 0.004)), date: "d" }] }]);
    }
    if (p.startsWith("/analytics/")) {
      const days = Number(u.searchParams.get("date"));
      const weekly = [900, 700, 1200, 400, 800, 0, 600, 900, 300, 500, 700, 200];
      const k = Math.min(12, Math.round(days / 7));
      const imp = weekly.slice(0, k).reduce((a, b) => a + b, 0);
      const mult = { IMPRESSION: 1, BOOKMARK: 0.01, LIKE: 0.04, QUOTE: 0.003, REPLY: 0.004, RETWEET: 0.006 };
      return send(Object.entries(mult).map(([label, m]) => ({ label, percentageChange: 5, data: [{ total: "0", date: "since" }, { total: String(Math.round(imp * m)), date: "until" }] })));
    }
    send({}, 404);
  });
}).listen(4010, () => console.log("fake postiz up", posts.length));
