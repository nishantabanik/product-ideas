import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { Report } from "./report.ts";

/** Draws a report as an A4 PDF with the built in Helvetica fonts only, so it runs anywhere without font files. */

const W = 595.28, H = 841.89, M = 48;
const INK = rgb(0.1, 0.12, 0.16), MUTE = rgb(0.42, 0.45, 0.5), RULE = rgb(0.86, 0.88, 0.9);
const COLOR = { linkedin: rgb(0.224, 0.529, 0.898), x: rgb(0.851, 0.349, 0.149) };

const REPLACE: [RegExp, string][] = [
  [/[‘’‚′]/g, "'"], [/[“”„″]/g, '"'], [/[–—−]/g, "-"], [/…/g, "..."],
  [/[     ]/g, " "], [/[​-‍﻿]/g, ""], [/→/g, "->"], [/←/g, "<-"], [/[•●◦]/g, "-"],
  [/[\r\t]/g, " "],
];

let charset: Set<number> | null = null;
/** Text that the standard fonts can draw. Anything else becomes a plain letter, or "?" when no plain form exists. */
export async function sanitize(input: string, font?: PDFFont): Promise<string> {
  if (!charset) {
    const f = font ?? (await (await PDFDocument.create()).embedFont(StandardFonts.Helvetica));
    charset = new Set(f.getCharacterSet());
  }
  let s = String(input ?? "").normalize("NFC");
  for (const [re, to] of REPLACE) s = s.replace(re, to);
  let out = "";
  let lastUnknown = false;
  for (const ch of s) {
    const cp = ch.codePointAt(0)!;
    if (ch === "\n" || (cp >= 32 && charset.has(cp))) { out += ch; lastUnknown = false; continue; }
    const base = ch.normalize("NFD").replace(/\p{M}/gu, "");
    if (base && base !== ch && [...base].every((c) => charset!.has(c.codePointAt(0)!))) { out += base; lastUnknown = false; continue; }
    if (/\p{M}/u.test(ch) || cp < 32) continue;
    if (!lastUnknown) out += "?"; // one mark for a whole run of emoji or foreign letters
    lastUnknown = true;
  }
  return out;
}

const num = (n: number) => Math.round(n).toLocaleString("en-US");
const pct = (n: number) => `${(n * 100).toFixed(2)}%`;
const changeText = (c: number | null, kind: "count" | "rate") => (c === null ? "no earlier period" : `${c > 0 ? "+" : ""}${c.toFixed(1)}${kind === "rate" ? " pts" : "%"}`);

export async function buildPdf(report: Report): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const clean = (t: string) => sanitize(t, reg);
  doc.setTitle(await clean(`${report.title}, ${report.subtitle}`));
  doc.setCreator("Li X Analyzer");

  let page: PDFPage = doc.addPage([W, H]);
  let y = H - M;
  const pages: PDFPage[] = [page];

  const ensure = (need: number) => {
    if (y - need < M + 14) { page = doc.addPage([W, H]); pages.push(page); y = H - M; }
  };

  /** Breaks text into lines that fit the width. Words longer than a line are cut. */
  const wrap = (text: string, font: PDFFont, size: number, width: number): string[] => {
    const lines: string[] = [];
    for (const para of text.split("\n")) {
      let line = "";
      for (const word of para.split(/\s+/).filter(Boolean)) {
        let w = word;
        while (font.widthOfTextAtSize(w, size) > width) {
          let cut = w.length;
          while (cut > 1 && font.widthOfTextAtSize(w.slice(0, cut), size) > width) cut--;
          if (line) { lines.push(line); line = ""; }
          lines.push(w.slice(0, cut)); w = w.slice(cut);
        }
        const next = line ? `${line} ${w}` : w;
        if (font.widthOfTextAtSize(next, size) <= width) line = next;
        else { lines.push(line); line = w; }
      }
      lines.push(line);
    }
    return lines;
  };

  const paragraph = async (text: string, o: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; indent?: number; gap?: number } = {}) => {
    const size = o.size ?? 10, font = o.font ?? reg, indent = o.indent ?? 0, lh = size * 1.4;
    const lines = wrap(await clean(text), font, size, W - 2 * M - indent);
    for (const l of lines) {
      ensure(lh);
      y -= lh;
      if (l) page.drawText(l, { x: M + indent, y: y + size * 0.25, size, font, color: o.color ?? INK });
    }
    y -= o.gap ?? 0;
  };

  const heading = async (text: string) => {
    ensure(50);
    y -= 14;
    await paragraph(text, { size: 13, font: bold, gap: 2 });
    page.drawLine({ start: { x: M, y: y + 2 }, end: { x: W - M, y: y + 2 }, thickness: 0.6, color: RULE });
    y -= 6;
  };

  // title
  page.drawRectangle({ x: 0, y: H - 6, width: W, height: 6, color: COLOR.linkedin });
  await paragraph(report.title, { size: 22, font: bold });
  await paragraph(report.subtitle, { size: 12, color: MUTE, gap: 4 });
  await paragraph("Compared with the period just before it. All dates are UTC.", { size: 9, color: MUTE, gap: 2 });

  // KPI table
  await heading("Key numbers");
  if (report.kpis.length) {
    const cols = [M, M + 70, M + 190, M + 300, M + 410];
    ensure(24);
    y -= 14;
    ["Platform", "Metric", "This period", "Before", "Change"].forEach((t, i) => page.drawText(t, { x: cols[i], y, size: 9, font: bold, color: MUTE }));
    y -= 4;
    for (const k of report.kpis) {
      ensure(18);
      y -= 15;
      const v = (n: number | null) => (n === null ? "n/a" : k.kind === "rate" ? pct(n) : num(n));
      const up = k.change !== null && k.change > 0.05, down = k.change !== null && k.change < -0.05;
      page.drawText(k.platform === "x" ? "X" : "LinkedIn", { x: cols[0], y, size: 10, font: bold, color: COLOR[k.platform] });
      page.drawText(k.label, { x: cols[1], y, size: 10, font: reg, color: INK });
      page.drawText(v(k.current), { x: cols[2], y, size: 10, font: bold, color: INK });
      page.drawText(v(k.previous), { x: cols[3], y, size: 10, font: reg, color: MUTE });
      page.drawText(changeText(k.change, k.kind), { x: cols[4], y, size: 10, font: reg, color: up ? rgb(0.1, 0.5, 0.25) : down ? rgb(0.75, 0.2, 0.15) : MUTE });
    }
    y -= 4;
  } else {
    await paragraph("We have no impressions or engagement numbers for this period.", { color: MUTE });
  }

  // charts
  for (const c of report.charts) {
    const chartH = 90;
    ensure(chartH + 44);
    y -= 12;
    await paragraph(c.title, { size: 10.5, font: bold, gap: 4 });
    const max = Math.max(1, ...c.bars.map((b) => b.value ?? 0));
    const x0 = M + 34, w = W - 2 * M - 34, top = y, base = y - chartH;
    page.drawLine({ start: { x: x0, y: base }, end: { x: x0 + w, y: base }, thickness: 0.6, color: RULE });
    page.drawText(num(max), { x: M, y: top - 7, size: 7.5, font: reg, color: MUTE });
    page.drawText("0", { x: M + 24, y: base - 1, size: 7.5, font: reg, color: MUTE });
    const slot = w / Math.max(1, c.bars.length), bw = Math.max(2, slot * 0.7);
    c.bars.forEach((b, i) => {
      if (b.value === null) return;
      const bh = Math.max(b.value > 0 ? 1 : 0, (b.value / max) * (chartH - 10));
      page.drawRectangle({ x: x0 + i * slot + (slot - bw) / 2, y: base, width: bw, height: bh, color: COLOR[c.platform] });
    });
    const first = await clean(c.bars[0]?.label ?? ""), last = await clean(c.bars[c.bars.length - 1]?.label ?? "");
    page.drawText(first, { x: x0, y: base - 11, size: 7.5, font: reg, color: MUTE });
    page.drawText(last, { x: x0 + w - reg.widthOfTextAtSize(last, 7.5), y: base - 11, size: 7.5, font: reg, color: MUTE });
    y = base - 14;
    if (c.note) await paragraph(c.note, { size: 8.5, color: MUTE });
  }

  // top posts
  await heading("Top posts");
  if (!report.topPosts.length) await paragraph("No posts with numbers in this period.", { color: MUTE });
  for (const [i, p] of report.topPosts.entries()) {
    const text = (p.content || "(no text)").replace(/\s+/g, " ").trim();
    await paragraph(`${i + 1}. ${text.length > 220 ? `${text.slice(0, 217)}...` : text}`, { font: bold, size: 10 });
    const bits = [p.platform === "x" ? "X" : "LinkedIn", p.publishedAt ? p.publishedAt.slice(0, 10) : null, p.impressions !== null ? `${num(p.impressions)} impressions` : null, p.engagements !== null ? `${num(p.engagements)} engagements` : null].filter(Boolean);
    await paragraph(bits.join("  |  "), { size: 9, color: MUTE, indent: 12, gap: 5 });
  }

  // followers
  await heading("Followers");
  if (!report.followers.length) await paragraph("We have no follower numbers for this period.", { color: MUTE });
  for (const f of report.followers) await paragraph(f.line, { gap: 2 });

  // goals
  if (report.goals.length) {
    await heading("Goals");
    for (const g of report.goals) await paragraph(`- ${g}`, { gap: 2 });
  }

  if (report.pendingComments !== null) {
    await heading("Comments");
    await paragraph(report.pendingComments ? `${report.pendingComments} comment${report.pendingComments === 1 ? "" : "s"} still waiting for a reply.` : "No comments are waiting for a reply.");
  }

  if (report.nextSteps.length) {
    await heading("What to do next");
    for (const [i, s] of report.nextSteps.entries()) await paragraph(`${i + 1}. ${s}`, { gap: 3 });
  }

  if (report.notes.length) {
    await heading("Notes on the data");
    for (const n of report.notes) await paragraph(`- ${n}`, { size: 9, color: MUTE, gap: 2 });
  }

  const total = pages.length;
  for (const [i, p] of pages.entries()) {
    const t = `Li X Analyzer  |  ${await clean(report.subtitle)}  |  Page ${i + 1} of ${total}`;
    p.drawText(t, { x: M, y: 26, size: 8, font: reg, color: MUTE });
  }
  return doc.save();
}
