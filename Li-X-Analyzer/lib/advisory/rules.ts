import { commonTraits, liftTable, type LiftRow } from "./lift.ts";
import { liChange, xChange, type Ctx } from "./context.ts";
import { median, num, pct, WEEKDAYS } from "./stats.ts";
import type { Finding, Platform } from "./types.ts";

const name = (p: Platform) => (p === "x" ? "X" : "LinkedIn");
const f = (x: Omit<Finding, "basis"> & { basis?: Finding["basis"] }): Finding => ({ basis: "data", ...x });

/* ---------- LinkedIn account numbers ---------- */

export function linkedinRules(c: Ctx): Finding[] {
  const out: Finding[] = [];
  const li = c.li;

  if (!li.has) {
    out.push(f({
      id: "LI_NO_DATA", platform: "linkedin", group: "missing", severity: "high", metric: "data",
      title: "We have no LinkedIn numbers yet",
      why: "Without LinkedIn analytics we cannot see what works, so every other LinkedIn check is blind.",
      action: "Export our post analytics from LinkedIn and upload the file on Import data. One file already covers the whole range it was exported for.",
      evidence: [],
    }));
    return [...out, ...linkedinPostRules(c)];
  }

  if (li.staleDays !== null && li.staleDays >= 10) {
    out.push(f({
      id: "LI_STALE", platform: "linkedin", group: "missing", severity: li.staleDays >= 30 ? "high" : "medium", metric: "data",
      title: `Our LinkedIn numbers are ${li.staleDays} days old`,
      why: "Advice is only as fresh as the latest export. Our recent posts are not in the data yet, so anything below describes the past.",
      action: "Export the latest analytics from LinkedIn and upload it on Import data. Doing this once a week keeps this page current.",
      evidence: [`Latest day we hold: ${li.lastDay}`],
    }));
  }

  const ch = liChange(c);
  if (ch !== null && ch <= -10) {
    out.push(f({
      id: "LI_REACH_DOWN", platform: "linkedin", group: "holding_back", severity: ch <= -25 ? "high" : "medium", metric: "reach",
      title: `LinkedIn reach fell ${Math.abs(ch).toFixed(0)}% in four weeks`,
      why: "Fewer people saw our posts than in the four weeks before. The usual causes are fewer posts, weaker openings and less early engagement.",
      action: "Check the quiet days below, then rewrite our next three openings so the first two lines make a clear promise. Reply to every comment within the first hour.",
      evidence: [`Last 28 days: ${num(li.last28!.imp)} impressions`, `Previous 28 days: ${num(li.prev28!.imp)} impressions`],
    }));
  } else if (ch !== null && ch >= 15) {
    out.push(f({
      id: "LI_REACH_UP", platform: "linkedin", group: "working", severity: "low", metric: "reach",
      title: `LinkedIn reach grew ${ch.toFixed(0)}% in four weeks`,
      why: "More people saw our posts than in the four weeks before, so something we changed is working.",
      action: "Look at what changed in our top posts (topic, format, posting days) and repeat it for the next two weeks before changing anything else.",
      evidence: [`Last 28 days: ${num(li.last28!.imp)} impressions`, `Previous 28 days: ${num(li.prev28!.imp)} impressions`],
    }));
  }

  if (li.last28 && li.erBaseline && li.last28.imp > 0) {
    const er = li.last28.eng / li.last28.imp;
    const ratio = er / li.erBaseline;
    const ev = [`Engagement rate, last 28 days: ${pct(er * 100, 2)}`, `Our usual over the past year: ${pct(li.erBaseline * 100, 2)}`];
    if (ratio < 0.8) {
      out.push(f({
        id: "LI_ER_DOWN", platform: "linkedin", group: "holding_back", severity: ratio < 0.6 ? "high" : "medium", metric: "engagement",
        title: `LinkedIn engagement per view is ${Math.round((1 - ratio) * 100)}% below our usual`,
        why: "People who see our posts are reacting less than they normally do, so the content or the ask is landing worse.",
        action: "End each post with one specific question that is easy to answer from experience, and cut anything that does not serve the single idea of the post.",
        evidence: ev,
      }));
    } else if (ratio >= 1.2) {
      out.push(f({
        id: "LI_ER_UP", platform: "linkedin", group: "working", severity: "low", metric: "engagement",
        title: `LinkedIn engagement per view is ${Math.round((ratio - 1) * 100)}% above our usual`,
        why: "Our posts are connecting better with the people who see them.",
        action: "Keep the style of the last few weeks. Note what the best posts have in common and write the next ones the same way.",
        evidence: ev,
      }));
    }
  }

  const wd = li.weekday;
  if (wd) {
    const idx = wd.avg.map((v, i) => [v, i] as const).sort((a, b) => b[0] - a[0]);
    const [best, worst] = [idx[0], idx[idx.length - 1]];
    if (best[0] >= wd.overall * 1.2 && worst[0] <= wd.overall * 0.85) {
      out.push(f({
        id: "LI_WEEKDAY", platform: "linkedin", group: "experiment", severity: "medium", metric: "reach",
        title: `${WEEKDAYS[best[1]]} is our strongest LinkedIn day and ${WEEKDAYS[worst[1]]} our weakest`,
        why: `On ${WEEKDAYS[best[1]]} we average ${num(best[0])} impressions, ${Math.round((best[0] / wd.overall - 1) * 100)}% above our overall day. ${WEEKDAYS[worst[1]]} is ${Math.round((1 - worst[0] / wd.overall) * 100)}% below. Daily numbers also include readers of earlier posts, so treat this as a hint to test.`,
        action: `Publish our most important post of the week on ${WEEKDAYS[best[1]]}, and for two weeks try moving the ${WEEKDAYS[worst[1]]} post to ${WEEKDAYS[best[1]]} or the day after.`,
        evidence: idx.slice(0, 3).map(([v, i]) => `${WEEKDAYS[i]}: ${num(v)} impressions on average`),
      }));
    }
  }

  if (li.dead && li.dead.share >= 0.35) {
    out.push(f({
      id: "LI_DEAD_DAYS", platform: "linkedin", group: "holding_back", severity: li.dead.share >= 0.5 ? "high" : "medium", metric: "consistency",
      title: `${li.dead.days} of the last ${li.dead.of} days were very quiet on LinkedIn`,
      why: "On those days we got under a third of a normal day's impressions. The feed favours accounts that show up regularly, and quiet stretches let attention fade.",
      action: "Fix a rhythm of at least three posts a week and fill the gaps ahead of time with Bulk schedule, so the calendar is never empty.",
      evidence: [`A quiet day is one under 35% of our average day`, `${li.dead.days} quiet days out of ${li.dead.of}`],
    }));
  }

  if (li.topShare !== null && li.topShare >= 0.45) {
    out.push(f({
      id: "LI_HIT_DRIVEN", platform: "linkedin", group: "holding_back", severity: "medium", metric: "reach",
      title: "A few days carry most of our LinkedIn reach",
      why: `The best 10% of days produced ${Math.round(li.topShare * 100)}% of our impressions. Most posts do far less than our best, so we are relying on occasional hits.`,
      action: "Open the top five posts on the Analytics page and note the topic, the first line and the format. Write the next five posts in the same pattern and compare.",
      evidence: [`Best 10% of days: ${Math.round(li.topShare * 100)}% of impressions`],
    }));
  }

  if (li.weeklyCv !== null && li.weeklyCv >= 0.7) {
    out.push(f({
      id: "LI_VOLATILE", platform: "linkedin", group: "holding_back", severity: "low", metric: "consistency",
      title: "Our weekly LinkedIn reach swings a lot",
      why: "Reach jumps sharply from week to week, which usually means our output or our topics are uneven.",
      action: "Keep the posting rhythm fixed and change only one thing at a time (topic or format), so we can see what moves the numbers.",
      evidence: [`Week to week variation: ${li.weeklyCv.toFixed(2)} (above 0.7 is a lot)`],
    }));
  }

  return [...out, ...linkedinPostRules(c)];
}

/** LinkedIn checks that rest on the posts we know about, not on the daily numbers. */
function linkedinPostRules(c: Ctx): Finding[] {
  const out: Finding[] = [];
  const known = c.posts.linkedin.length;
  if (known > 0 && c.recentPosts.linkedin < 8) {
    out.push(f({
      id: "LI_FREQUENCY", platform: "linkedin", group: "missing", severity: "medium", metric: "consistency",
      title: `We can see only ${c.recentPosts.linkedin} LinkedIn posts in the last 28 days`,
      why: "Accounts that grow on LinkedIn usually post three to five times a week. If these are all our posts, we are below that. If posts are missing, LinkedIn exports only the top 50 posts per file.",
      action: "Aim for three posts a week for the next month. To be sure we hold every post, export one month at a time and upload each file.",
      evidence: [`Known posts in the last 28 days: ${c.recentPosts.linkedin}`, `Known posts in total: ${known}`],
    }));
  }

  if (c.scheduled7.linkedin === 0) {
    out.push(f({
      id: "LI_EMPTY_QUEUE", platform: "linkedin", group: "missing", severity: "medium", metric: "consistency",
      title: "Nothing is scheduled on LinkedIn for the next 7 days",
      why: "Gaps usually appear on days when we had no time to write. A queue prevents them.",
      action: "Write three posts now and schedule them on Compose, or upload a week of posts with Bulk schedule.",
      evidence: ["Scheduled in Postiz for the next 7 days: 0"],
    }));
  }

  if (known >= 10 && c.withText.linkedin / known < 0.3) {
    out.push(f({
      id: "LI_NO_TEXT", platform: "linkedin", group: "missing", severity: "medium", metric: "data",
      title: "We cannot see the words of most of our LinkedIn posts",
      why: "LinkedIn exports hold numbers and links but not the text. We can see when posts went out and how they did, but not which openings, questions or lengths work.",
      action: "Publish our next posts through Compose or Bulk schedule, so the text is saved with its results. The opening, question and length checks then work for LinkedIn too.",
      evidence: [`${c.withText.linkedin} of ${known} LinkedIn posts have text`],
    }));
  }
  return out;
}

/* ---------- X account numbers ---------- */

export function xRules(c: Ctx): Finding[] {
  const out: Finding[] = [];
  const x = c.x;

  if (!x.has) {
    out.push(f({
      id: "X_NO_DATA", platform: "x", group: "missing", severity: "high", metric: "data",
      title: "We have no X numbers yet",
      why: "Without the weekly X totals we cannot tell whether reach, likes and replies are going up or down.",
      action: "Press Refresh X numbers on the Analytics page, or Sync on the Overview.",
      evidence: [],
    }));
    return out;
  }

  const ch = xChange(c);
  if (ch !== null && ch <= -10 && x.last4 && x.prev4) {
    out.push(f({
      id: "X_REACH_DOWN", platform: "x", group: "holding_back", severity: ch <= -25 ? "high" : "medium", metric: "reach",
      title: `X impressions fell ${Math.abs(ch).toFixed(0)}% in four weeks`,
      why: "Fewer people saw our posts than in the four weeks before. On X, reach follows how often we post and how fast we answer replies.",
      action: "Post at least once a day for two weeks, answer every reply in the first hour and reply to five larger accounts in our niche each day.",
      evidence: [`Last 4 weeks: ${num(x.last4.impressions)} impressions`, `Previous 4 weeks: ${num(x.prev4.impressions)} impressions`],
    }));
  } else if (ch !== null && ch >= 15 && x.last4 && x.prev4) {
    out.push(f({
      id: "X_REACH_UP", platform: "x", group: "working", severity: "low", metric: "reach",
      title: `X impressions grew ${ch.toFixed(0)}% in four weeks`,
      why: "More people saw our posts than in the four weeks before.",
      action: "Look at which posts drove it and repeat that topic and format this week.",
      evidence: [`Last 4 weeks: ${num(x.last4.impressions)} impressions`, `Previous 4 weeks: ${num(x.prev4.impressions)} impressions`],
    }));
  }

  if (x.inactiveWeeks >= 1) {
    out.push(f({
      id: "X_INACTIVE", platform: "x", group: "holding_back", severity: x.inactiveWeeks >= 2 ? "high" : "medium", metric: "consistency",
      title: `${x.inactiveWeeks} of the last 4 weeks had no X impressions`,
      why: "A week with no posts lets the audience drift away. Consistency is the easiest thing to fix on X.",
      action: "Schedule at least five posts a week with Bulk schedule, so a quiet week cannot happen.",
      evidence: [`Weeks with zero impressions in the last 4: ${x.inactiveWeeks}`],
    }));
  }

  const l = x.last4;
  if (l && l.impressions >= 500) {
    const total = l.likes + l.comments + l.shares;
    if (total > 0 && l.comments / total < 0.08) {
      out.push(f({
        id: "X_LOW_CONVERSATION", platform: "x", group: "holding_back", severity: "medium", metric: "replies",
        title: "We get likes on X but few replies",
        why: `Only ${Math.round((l.comments / total) * 100)}% of our interactions are replies. Likes are passive. Replies are conversation, which the feed rewards most and which turns viewers into followers.`,
        action: "End the next five posts with a direct question or a choice (A or B). Answer every reply with a follow-up question so the thread keeps going.",
        evidence: [`Replies: ${num(l.comments)}`, `Likes: ${num(l.likes)}`, `Reposts and quotes: ${num(l.shares)}`],
      }));
    }
    if (total > 0 && l.shares / total < 0.03) {
      out.push(f({
        id: "X_FEW_REPOSTS", platform: "x", group: "holding_back", severity: "low", metric: "reach",
        title: "Our X posts are rarely shared",
        why: "Reposts and quotes carry a post to people who do not follow us yet. A post gets shared when it is useful or surprising on its own.",
        action: "Turn one idea a day into a checklist, a framework or a clear opinion in one sentence, the kinds of posts people pass on.",
        evidence: [`Reposts and quotes: ${num(l.shares)} against ${num(l.likes)} likes`],
      }));
    }
    const b = x.base;
    if (b && b.impressions > 500 && x.baseWeeks >= 4) {
      const rate = (w: { comments: number; likes: number; impressions: number }, k: "comments" | "likes") => w[k] / w.impressions;
      const checks: [string, "comments" | "likes", "replies" | "likes", string][] = [
        ["X_REPLY_RATE_DOWN", "comments", "replies", "Replies per view are dropping on X"],
        ["X_LIKE_RATE_DOWN", "likes", "likes", "Likes per view are dropping on X"],
      ];
      for (const [id, k, metric, title] of checks) {
        const [now, base] = [rate(l, k), rate(b, k)];
        if (base > 0 && now < base * 0.7) {
          out.push(f({
            id, platform: "x", group: "holding_back", severity: "medium", metric,
            title,
            why: `Per 1,000 impressions we now get ${(now * 1000).toFixed(1)} ${k === "comments" ? "replies" : "likes"}, against ${(base * 1000).toFixed(1)} in the weeks before. People see our posts but react less.`,
            action: "Open with a sharper first line and one concrete claim. Cut posts that only announce something and keep the ones that teach or take a position.",
            evidence: [`Last 4 weeks: ${(now * 1000).toFixed(1)} per 1,000 impressions`, `Weeks 5 to 12: ${(base * 1000).toFixed(1)} per 1,000 impressions`],
          }));
        }
      }
    }
  }

  const known = c.posts.x.length;
  if (known > 0 && c.recentPosts.x < 12) {
    out.push(f({
      id: "X_FREQUENCY", platform: "x", group: "missing", severity: "medium", metric: "consistency",
      title: `We can see only ${c.recentPosts.x} X posts in the last 28 days`,
      why: "Accounts that grow on X usually post once or more a day. If these are all our posts, we are below that. Posts written directly on X appear here only after an import.",
      action: "Plan one post a day for the next two weeks, using Bulk schedule for the batch.",
      evidence: [`Known posts in the last 28 days: ${c.recentPosts.x}`],
    }));
  }

  if (c.scheduled7.x === 0) {
    out.push(f({
      id: "X_EMPTY_QUEUE", platform: "x", group: "missing", severity: "medium", metric: "consistency",
      title: "Nothing is scheduled on X for the next 7 days",
      why: "Without a queue we skip days, and on X skipped days cost reach.",
      action: "Write a week of posts in one sitting and schedule them with Bulk schedule.",
      evidence: ["Scheduled in Postiz for the next 7 days: 0"],
    }));
  }
  return out;
}

/* ---------- what the text of our posts tells us ---------- */

const BAD = new Set(["link", "hashtags", "emoji", "mentions", "bait", "cliche", "longHook"]);
const GOOD = new Set(["question", "endsQuestion", "cta", "number", "list", "shortLines"]);

function liftFinding(p: Platform, r: LiftRow): Finding | null {
  const primary = Math.abs(r.rateLift) >= Math.abs(r.imprLift) ? r.rateLift : r.imprLift;
  const other = Math.abs(r.rateLift) >= Math.abs(r.imprLift) ? r.imprLift : r.rateLift;
  if (Math.abs(primary) < 0.25 || Math.sign(primary) !== Math.sign(other || primary)) return null;
  const byRate = Math.abs(r.rateLift) >= Math.abs(r.imprLift);
  const size = Math.round(Math.abs(primary) * 100);
  const what = byRate ? "engagement per view" : "median reach";
  const positive = primary > 0;
  const evidence = [
    `With it: ${r.withN} posts, engagement rate ${pct(r.rateWith * 100, 2)}, median ${num(r.imprWith)} impressions`,
    `Without it: ${r.withoutN} posts, engagement rate ${pct(r.rateWithout * 100, 2)}, median ${num(r.imprWithout)} impressions`,
    r.solid ? "Enough posts on both sides to take this seriously" : "Early signal, a small number of posts",
  ];
  const caution = ` This is a pattern in our own posts, not proof, so treat it as a hypothesis and test it.`;
  const title = `${name(p)} posts that ${r.label} get ${size}% ${positive ? "higher" : "lower"} ${what}`;
  const id = `TRAIT_${p}_${r.key}`;
  const severity = r.solid && size >= 40 ? "medium" : "low";
  const opposite = BAD.has(r.key) ? "stop" : "experiment";

  if (GOOD.has(r.key) || (!BAD.has(r.key) && positive)) {
    return positive
      ? f({ id, platform: p, group: "working", severity, metric: "engagement", title, why: `Our ${name(p)} posts that ${r.label} do better on ${what}.${caution}`, action: `Make this the default shape of our next ${name(p)} posts and check again in two weeks.`, evidence })
      : f({ id, platform: p, group: "experiment", severity: "low", metric: "engagement", title, why: `We expected posts that ${r.label} to do better, but ours do worse.${caution}`, action: `Test a sharper version for five posts: a more specific question, an easier answer, a clearer first line.`, evidence });
  }
  return positive
    ? f({ id, platform: p, group: "working", severity: "low", metric: "engagement", title, why: `Posts that ${r.label} do better for us, even though this is often advised against.${caution}`, action: `Keep doing it where it serves the goal, and test the usual alternative on five posts to confirm.`, evidence })
    : f({ id, platform: p, group: opposite, severity, metric: "engagement", title, why: `Our ${name(p)} posts that ${r.label} do worse on ${what}.${caution}`, action: `Leave it out of the next ten ${name(p)} posts and compare the results.`, evidence });
}

export function textRules(c: Ctx): Finding[] {
  const out: Finding[] = [];
  for (const p of ["linkedin", "x"] as const) {
    const posts = c.text[p];
    if (posts.length < 8) continue;

    const rows = liftTable(posts, p)
      .map((r) => ({ r, weight: Math.max(Math.abs(r.rateLift), Math.abs(r.imprLift)) * Math.sqrt(Math.min(r.withN, r.withoutN)) }))
      .sort((a, b) => b.weight - a.weight);
    // "ask a question" and "end with a question" are the same idea, so the stronger one speaks for both
    const overlap: Record<string, string> = { question: "endsQuestion", endsQuestion: "question" };
    const emitted = new Map<string, Finding>();
    for (const { r } of rows) {
      if (emitted.size >= 6) break;
      if (overlap[r.key] && emitted.has(overlap[r.key])) continue;
      const fd = liftFinding(p, r);
      if (fd) { out.push(fd); emitted.set(r.key, fd); }
    }

    // What our best posts share. When a trait already has its own finding, the proof is added there instead of repeating it.
    for (const t of commonTraits(posts, p)) {
      const own = emitted.get(t.key) ?? emitted.get(overlap[t.key] ?? "");
      const line = `Our five best posts by engagement rate: ${Math.round(t.inBest * 100)}% ${t.label}, against ${Math.round(t.inAll * 100)}% of all ${posts.length} posts`;
      if (own) {
        own.evidence.push(line);
        if (own.group === "working") own.severity = "medium";
        continue;
      }
      out.push(f({
        id: `BEST_${p}_${t.key}`, platform: p, group: "working", severity: "medium", metric: "engagement",
        title: `Most of our best ${name(p)} posts ${t.label}`,
        why: `${Math.round(t.inBest * 100)}% of our five best posts by engagement rate ${t.label}, against ${Math.round(t.inAll * 100)}% of all our posts.`,
        action: "Write the next few posts in that shape and see whether the pattern holds.",
        evidence: [line],
      }));
    }

    const all = c.posts[p].filter((x) => x.content.trim());
    const feats = posts.map((t) => t.f);
    const share = (fn: (f: (typeof feats)[number]) => boolean) => feats.filter(fn).length;
    const n = feats.length;
    const bait = share((x) => x.bait);
    if (bait >= 2) out.push(f({ id: `BAIT_${p}`, platform: p, group: "stop", severity: "medium", metric: "engagement", title: `${bait} of our ${name(p)} posts use engagement bait`, why: "Phrases like comment YES or like if you agree bring empty interactions, and platforms push against them.", action: "Replace them with a real question about the topic of the post.", evidence: [`${bait} of ${n} posts`] }));
    const cliche = share((x) => x.cliche);
    if (cliche >= 2) out.push(f({ id: `CLICHE_${p}`, platform: p, group: "stop", severity: "low", metric: "engagement", title: `${cliche} of our ${name(p)} posts open with a cliche`, why: "Openings like excited to announce look like everything else in the feed and give no reason to keep reading.", action: "Start with the result, the surprise or the problem instead.", evidence: [`${cliche} of ${n} posts`] }));
    const noAsk = share((x) => !x.hasQuestion && !x.cta);
    if (n >= 10 && noAsk / n >= 0.6) out.push(f({ id: `NO_ASK_${p}`, platform: p, group: "missing", severity: "medium", metric: "replies", title: `Most of our ${name(p)} posts give people no reason to reply`, why: `${Math.round((noAsk / n) * 100)}% of our posts have no question and no invitation to answer. Replies and comments are the strongest signals we can ask for.`, action: "End every post with one specific question that is easy to answer from experience.", evidence: [`${noAsk} of ${n} posts`] }));
    const links = share((x) => x.hasLink);
    const linkRow = rows.find((x) => x.r.key === "link");
    if (links >= 3 && n && links / n >= 0.2 && !emitted.has("link") && !(linkRow && Math.abs(linkRow.r.rateLift) > 0.25)) out.push(f({ id: `LINKS_${p}`, platform: p, group: "stop", severity: "low", metric: "reach", title: `${links} of our ${name(p)} posts have a link in the post`, why: "Posts that send people off the platform are often shown to fewer people.", action: "Put the link in the first comment or the first reply for the next ten posts and compare reach.", evidence: [`${links} of ${n} posts`] }));
    void all;
  }

  // identical text on both platforms
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  const seen = new Map<string, Platform>();
  let same = 0;
  for (const p of c.posts.linkedin) if (p.content.trim()) seen.set(norm(p.content), "linkedin");
  for (const p of c.posts.x) if (p.content.trim() && seen.get(norm(p.content)) === "linkedin") same++;
  if (same >= 3) out.push(f({ id: "CROSSPOST", platform: "both", group: "stop", severity: "low", metric: "engagement", title: "We publish the same text on LinkedIn and X", why: "LinkedIn rewards longer, personal posts with white space. X rewards short, sharp ones. The same words rarely suit both.", action: "Write the LinkedIn version first, then rewrite it as a single sharp point for X.", evidence: [`${same} identical posts found`] }));
  return out;
}

/* ---------- when to post, from posts with an exact time ---------- */

const BUCKETS = [["early morning (00:00 to 06:00)", 0, 6], ["morning (06:00 to 11:00)", 6, 11], ["midday (11:00 to 15:00)", 11, 15], ["afternoon (15:00 to 19:00)", 15, 19], ["evening (19:00 to 24:00)", 19, 24]] as const;

export function timingRules(c: Ctx): Finding[] {
  const out: Finding[] = [];
  for (const p of ["linkedin", "x"] as const) {
    const exact = c.text[p].filter((t) => t.post.source === "postiz" && t.post.publishedAt);
    if (exact.length < 12) continue;
    const med = median(exact.map((t) => t.impressions));
    const rows = BUCKETS.map(([label, a, b]) => {
      const ps = exact.filter((t) => { const h = new Date(t.post.publishedAt!).getUTCHours(); return h >= a && h < b; });
      return { label, n: ps.length, m: median(ps.map((t) => t.impressions)) };
    }).filter((r) => r.n >= 3);
    if (rows.length < 2) continue;
    const best = [...rows].sort((a, b) => b.m - a.m)[0];
    if (med > 0 && best.m >= med * 1.3) {
      out.push(f({
        id: `TIMING_${p}`, platform: p, group: "experiment", severity: "medium", metric: "reach",
        title: `Our ${name(p)} posts in the ${best.label.split(" (")[0]} reach ${Math.round((best.m / med - 1) * 100)}% more people`,
        why: `Posts published in the ${best.label} UTC have a median of ${num(best.m)} impressions, against ${num(med)} for all our ${name(p)} posts.`,
        action: `Move most of our ${name(p)} posts into that window for two weeks and compare. Our audience may live in another time zone, so check the hours in UTC.`,
        evidence: rows.map((r) => `${r.label}: ${r.n} posts, median ${num(r.m)} impressions`),
      }));
    }
  }
  return out;
}

/* ---------- standing experiments, always worth running ---------- */

export function commentRules(c: Ctx): Finding[] {
  const out: Finding[] = [];
  for (const k of c.input.comments ?? []) {
    if (k.open > 0 && (k.oldestHours ?? 0) > 24) {
      out.push(f({
        id: `COMMENTS_WAITING_${k.platform.toUpperCase()}`, platform: k.platform, group: "holding_back", severity: (k.oldestHours ?? 0) > 72 ? "high" : "medium", metric: "replies",
        title: `${k.open} ${name(k.platform)} comment${k.open === 1 ? "" : "s"} still waiting for a reply`,
        why: "People who comment are our warmest audience. A reply tells them we read it, and every reply is another comment on the post, which helps it travel.",
        action: "Open the Comments tab and answer the oldest ones first. A short reply with a follow-up question is enough.",
        evidence: [`Oldest unanswered comment: ${Math.round(k.oldestHours ?? 0)} hours`, `Comments in the last 30 days: ${k.last30}, answered: ${k.replied30}`],
      }));
    } else if (k.last30 >= 5 && k.replied30 / k.last30 < 0.5) {
      out.push(f({
        id: `COMMENTS_REPLY_RATE_${k.platform.toUpperCase()}`, platform: k.platform, group: "missing", severity: "low", metric: "replies",
        title: `We answered ${Math.round((k.replied30 / k.last30) * 100)}% of ${name(k.platform)} comments this month`,
        why: "Conversations grow a post. Unanswered comments are lost reach.",
        action: "Aim to answer every comment in the first day.",
        evidence: [`${k.replied30} of ${k.last30} comments answered`],
      }));
    }
  }
  return out;
}

export function standingExperiments(c: Ctx): Finding[] {
  const out: Finding[] = [];
  const have = (id: string, list: Finding[]) => list.some((x) => x.id === id);
  void have;
  out.push(f({
    id: "EXP_HOOKS", platform: "both", group: "experiment", severity: "low", metric: "engagement", basis: "playbook",
    title: "Write every opening two ways and publish the stronger one",
    why: "The first line decides whether anyone reads on. Drafting two versions makes us notice which one makes a clearer promise.",
    action: "For the next week, write two first lines for each post. Pick the one that names a result, a surprise or a problem. Keep both in our notes and compare with the numbers later.",
    evidence: [],
  }));
  out.push(f({
    id: "EXP_REPLY_WINDOW", platform: "both", group: "experiment", severity: "low", metric: "replies", basis: "playbook",
    title: "Stay online for 30 minutes after every post",
    why: "The first hour decides how far a post travels. Fast replies keep the conversation going and show the platform that the post is worth showing.",
    action: "After each post, answer every comment with a follow-up question and leave three useful comments on other people's posts in our niche.",
    evidence: [],
  }));
  if (c.text.linkedin.length < 8) {
    out.push(f({
      id: "EXP_FIRST_COMMENT", platform: "linkedin", group: "experiment", severity: "low", metric: "reach", basis: "playbook",
      title: "Move links into the first comment for ten posts",
      why: "Posts with outbound links are often shown to fewer people. We do not have enough LinkedIn text yet to check this on our own data.",
      action: "For the next ten LinkedIn posts, keep the post free of links and add the link as the first comment. Compare impressions with our previous ten.",
      evidence: [],
    }));
  }
  return out;
}
