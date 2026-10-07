import http from "node:http";
const log = [];
let polls = 0;
const send = (res, code, obj) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(obj)); };
http.createServer(async (req, res) => {
  const chunks = []; for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks).toString();
  const u = new URL(req.url, "http://x");
  log.push(`${req.method} ${u.pathname}`);
  if (u.pathname === "/__log") return send(res, 200, log);
  if (u.pathname === "/v1/models") return req.headers.authorization === "Bearer secret-key" ? send(res, 200, { data: [{ id: "mock-model" }, { id: "gpt-4o" }, { id: "claude-sonnet" }] }) : send(res, 401, { error: "bad" });
  if (u.pathname === "/emails") { console.log("EMAIL " + body.slice(0, 300)); return send(res, 200, { id: "e1" }); }
  if (u.pathname.endsWith("/sendMessage")) { console.log("TELEGRAM " + body.slice(0, 200)); return send(res, 200, { ok: true }); }
  // X
  if (u.pathname === "/2/users/me") return send(res, 200, { data: { id: "111", username: "me", name: "Me" } });
  if (u.pathname === "/2/users/111/mentions") return send(res, 200, { data: [
    { id: "9001", text: "@me great thread, which tool did you use?", author_id: "222", created_at: "2026-10-04T10:00:00Z", conversation_id: "7000000000123", referenced_tweets: [{ type: "replied_to", id: "7000000000123" }] },
    { id: "9002", text: "@me disagree with point 2", author_id: "333", created_at: "2026-10-04T11:00:00Z", conversation_id: "7000000000123", referenced_tweets: [{ type: "replied_to", id: "7000000000123" }] }],
    includes: { users: [{ id: "222", username: "ann", name: "Ann Lee" }, { id: "333", username: "bob", name: "Bob Roy" }] }, meta: { newest_id: "9002", result_count: 2 } });
  if (u.pathname === "/2/tweets" && req.method === "POST") return send(res, 201, { data: { id: "9100" } });
  // gateway (openai style)
  if (u.pathname === "/v1/chat/completions" || u.pathname === "/copilot/chat/completions") {
    const j = JSON.parse(body); const sys = j.messages[0].content;
    const usr = j.messages[1]?.content ?? "";
    console.log("CHATLOG " + JSON.stringify({ model: j.model, tone: sys.includes("Friendly, plain"), rule: sys.includes("One idea per line"), memory: sys.includes("DevOps team in Berlin"), skill: sys.includes("Open with a number"), simpleRule: sys.includes("Class 5"), format: usr.includes("Friday lesson"), output: usr.includes("Mini case study") }));
    const wrap = (t) => send(res, 200, { model: j.model, choices: [{ message: { content: t } }], usage: { prompt_tokens: 5, completion_tokens: 5 } });
    if (j.model === "claude-free") return send(res, 400, { error: { message: '[400]: {\n "error": {\n "code": "400",\n "message": "Unsupported model mimo-auto"\n }\n}\n', type: "invalid_request_error", code: "bad_request" } });
    if (/Fix these posts/.test(usr)) return wrap(j.model === "claude-Code" ? "Here are the fixed posts:\n\n**LinkedIn post:**\nI fixed a small bug today.\n\nIt took me a day.\n\nWhat did you fix this week?\n\n**X post:**\nI fixed a small bug today. It took one day.\n\nLet me know if you want changes!" : "===LINKEDIN===\nI fixed a small bug today.\n\nIt took me a day.\n\nWhat did you fix this week?\n===X===\nI fixed a small bug today. It took one day. Small wins count.");
    if (/Write these posts/.test(usr)) return wrap(j.model === "claude-Code" ? "Sure! I would be happy to help.\n\n**LinkedIn post:**\nWe cut deploy time \u2014 from 45 minutes to 4.\n\nThe implementation necessitated comprehensive reconsideration of organizational infrastructure.\n\n**X post:**\nOur deploys were slow. " + "We changed many small things and it got a lot faster for everyone. ".repeat(6) : "===LINKEDIN===\nWe cut deploy time \u2014 from 45 minutes to 4.\n\nThe implementation necessitated comprehensive reconsideration of organizational infrastructure.\n===X===\nOur deploys were slow. " + "We changed many small things and it got a lot faster for everyone. ".repeat(6));
    if (/Fix these posts/.test(usr)) return send(res, 200, { model: "mock-model", choices: [{ message: { content: JSON.stringify({ linkedin: "I fixed a small bug today.\n\nIt took me a day.\n\nWhat did you fix this week?", x: "I fixed a small bug today. It took one day. Small wins count." }) } }] });
    if (/Write these posts/.test(usr)) return send(res, 200, { model: "mock-model", choices: [{ message: { content: JSON.stringify({ linkedin: "We cut deploy time \u2014 from 45 minutes to 4.\n\nThe implementation necessitated comprehensive reconsideration of organizational infrastructure.", x: "Our deploys were slow. " + "We changed many small things and it got a lot faster for everyone on the team. ".repeat(6) }) } }] });
    if (/three different versions/.test(usr)) return send(res, 200, { model: "mock-model", choices: [{ message: { content: JSON.stringify({ variants: [
      { angle: "Story", text: "We cut reporting time by 60%.\n\nHere is what we changed.\n\nWhat would you cut first?" },
      { angle: "List", text: "3 reports we deleted this year:\n\n1. Weekly status\n2. Monthly deck\n3. Ad hoc exports\n\nWhich would you cut?" },
      { angle: "Thread", text: "We cut reporting time by 60%.", thread: ["We cut reporting time by 60%. A thread:", "1. We stopped copying numbers by hand.", "2. One weekly review replaced three meetings.", "What would you cut first?"] }] }) } }] });
    if (/post ideas/.test(usr)) return send(res, 200, { model: "mock-model", choices: [{ message: { content: JSON.stringify({ ideas: [{ title: "Why we deleted three reports", angle: "A story with numbers", pillar: "Data" }, { title: "Our weekly review", angle: "How it works" }, { title: "A hiring mistake", angle: "What we learned" }] }) } }] });
    if (/Adapt this/.test(usr)) return send(res, 200, { model: "mock-model", choices: [{ message: { content: JSON.stringify({ linkedin: "LinkedIn version\n\nShort paragraphs.", xShort: "Short X version.", xThread: ["Thread 1", "Thread 2", "Thread 3"] }) } }] });
    if (/write it again for today/i.test(usr)) return send(res, 200, { model: "mock-model", choices: [{ message: { content: JSON.stringify({ text: "A fresh opening for an old winner.\n\nSame substance." }) } }] });
    const out = /reply/i.test(sys) ? { replies: [{ tone: "friendly", text: "Thanks, glad it helped! Happy to share more." }, { tone: "short", text: "Thank you!" }, { tone: "question", text: "Thanks! What are you building?" }] } : { ok: true };
    return send(res, 200, { model: "mock-model", choices: [{ message: { content: JSON.stringify(out) } }], usage: { prompt_tokens: 5, completion_tokens: 5 } });
  }
  if (u.pathname === "/copilot/models") return send(res, 200, { data: [{ id: "gpt-4.1", capabilities: { type: "chat" } }, { id: "claude-sonnet-4", capabilities: { type: "chat" } }, { id: "text-embedding", capabilities: { type: "embeddings" } }] });
  // github device flow
  if (u.pathname === "/login/device/code") return send(res, 200, { device_code: "dc", user_code: "ABCD-1234", verification_uri: "http://localhost:4030/device", expires_in: 900, interval: 3 });
  if (u.pathname === "/login/oauth/access_token") return send(res, 200, ++polls < 2 ? { error: "authorization_pending" } : { access_token: "gho_x" });
  if (u.pathname === "/user") return send(res, 200, { login: "octo" });
  if (u.pathname === "/copilot_internal/v2/token") return send(res, 200, { token: "tid", expires_at: Math.floor(Date.now() / 1000) + 1500, endpoints: { api: "http://localhost:4030/copilot" } });
  send(res, 404, { error: "nope " + u.pathname });
}).listen(4030);
