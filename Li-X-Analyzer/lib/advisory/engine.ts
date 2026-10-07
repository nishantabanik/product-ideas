import { buildAudits } from "./audit.ts";
import { buildContext, liChange, xChange, type Ctx } from "./context.ts";
import { linkedinScore, xScore } from "./scoring.ts";
import { commentRules, linkedinRules, standingExperiments, textRules, timingRules, xRules } from "./rules.ts";
import { WEEKDAYS, dayOfWeek } from "./stats.ts";
import type { Advisory, AdvisoryInput, Digest, Finding, Focus, Group, Severity } from "./types.ts";

const SEV: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
const GRP: Record<Group, number> = { holding_back: 0, missing: 1, stop: 2, experiment: 3, working: 4 };

export function sortFindings(list: Finding[]): Finding[] {
  const seen = new Set<string>();
  return list
    .filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)))
    .map((x, i) => ({ x, i }))
    .sort((a, b) => SEV[a.x.severity] - SEV[b.x.severity] || GRP[a.x.group] - GRP[b.x.group] || a.i - b.i)
    .map(({ x }) => x);
}

/** Up to three things to do today: what we are told is most costly, balanced across platforms, plus a timing nudge when it applies. */
function pickFocus(c: Ctx, findings: Finding[]): Focus[] {
  const out: Focus[] = [];
  const wd = c.li.weekday;
  if (wd) {
    const best = wd.avg.map((v, i) => [v, i] as const).sort((a, b) => b[0] - a[0])[0];
    if (best[0] >= wd.overall * 1.2 && best[1] === dayOfWeek(c.today)) {
      out.push({ platform: "linkedin", title: `Today is our strongest LinkedIn day`, action: `Publish the most important post of the week today. ${WEEKDAYS[best[1]]} averages ${Math.round((best[0] / wd.overall - 1) * 100)}% more impressions than our typical day.` });
    }
  }
  const actionable = findings.filter((x) => (x.group === "holding_back" || x.group === "missing" || x.group === "stop" || x.group === "experiment") && !(x.metric === "data" && x.severity === "low"));
  const perPlatform: Record<string, number> = {};
  for (const x of actionable) {
    if (out.length >= 3) break;
    if ((perPlatform[x.platform] ?? 0) >= 2) continue;
    perPlatform[x.platform] = (perPlatform[x.platform] ?? 0) + 1;
    out.push({ platform: x.platform, title: x.title, action: x.action });
  }
  return out.slice(0, 3);
}

function headline(c: Ctx, findings: Finding[]): string {
  const bits: string[] = [];
  const lc = liChange(c), xc = xChange(c);
  const word = (n: number) => (Math.abs(n) < 5 ? "is steady" : n > 0 ? `is up ${Math.round(n)}%` : `is down ${Math.round(Math.abs(n))}%`);
  if (!c.li.has) bits.push("We have no LinkedIn numbers yet");
  else if (lc !== null) bits.push(`LinkedIn reach ${word(lc)} over four weeks`);
  else bits.push(`LinkedIn has ${c.li.days} days of data`);
  if (!c.x.has) bits.push("no X numbers yet");
  else if (xc !== null) bits.push(`X reach ${word(xc)}`);
  const top = findings.find((x) => x.group === "holding_back" || x.group === "missing");
  return `${bits.join(", ")}.${top ? ` Top issue: ${top.title}.` : " Nothing urgent, keep the rhythm and keep testing."}`;
}

export function analyze(input: AdvisoryInput): Advisory {
  const c = buildContext(input);
  const findings = sortFindings([...linkedinRules(c), ...xRules(c), ...textRules(c), ...timingRules(c), ...commentRules(c), ...standingExperiments(c)]);

  const digest: Digest = {
    linkedin: {
      days: c.li.days, lastDay: c.li.lastDay, last28: c.li.last28?.imp ?? null, prev28: c.li.prev28?.imp ?? null,
      erLast28: c.li.last28 && c.li.last28.imp ? c.li.last28.eng / c.li.last28.imp : null, erBaseline: c.li.erBaseline,
      posts: c.posts.linkedin.length, postsWithText: c.withText.linkedin,
    },
    x: { weeksLoaded: input.xWeeks.length, last4: c.x.last4?.impressions ?? null, prev4: c.x.prev4?.impressions ?? null, posts: c.posts.x.length, postsWithText: c.withText.x },
  };

  return {
    generatedAt: input.now,
    day: c.today,
    headline: headline(c, findings),
    scores: { linkedin: linkedinScore(c), x: xScore(c) },
    focus: pickFocus(c, findings),
    findings,
    audits: buildAudits(input.posts),
    digest,
  };
}
