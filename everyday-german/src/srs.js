// ponytail: SM-2 interval engine. Local calculation sufficient; server sync when multi-device required.
export const DEFAULT_EASE = 2.5;

export function initCard(id, now = Date.now()) {
  return { id, reps: 0, interval: 0, ease: DEFAULT_EASE, due: now, lapses: 0, lastReviewed: null };
}

export function rateCard(card, rating, now = Date.now()) {
  const current = card ? { ...card } : initCard('temp', now);
  let { reps, interval, ease, lapses } = current;
  // rating: 1 (again), 2 (hard), 3 (good), 4 (easy)
  if (rating === 1) {
    reps = 0;
    interval = 1;
    ease = Math.max(1.3, ease - 0.2);
    lapses += 1;
  } else if (rating === 2) {
    reps = Math.max(1, reps);
    interval = Math.max(1, Math.round(interval * 1.2) || 1);
    ease = Math.max(1.3, ease - 0.15);
  } else if (rating === 3) {
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 3;
    else if (reps === 2) interval = 6;
    else interval = Math.max(1, Math.round(interval * ease));
    reps += 1;
  } else if (rating === 4) {
    if (reps === 0) interval = 2;
    else if (reps === 1) interval = 5;
    else interval = Math.max(1, Math.round((interval || 2) * ease * 1.3));
    reps += 1;
    ease = Math.min(3.0, ease + 0.15);
  }
  const due = now + interval * 86400000;
  return { ...current, reps, interval, ease: Number(ease.toFixed(2)), due, lapses, lastReviewed: now };
}

export function previewIntervals(card) {
  const c = card || { reps: 0, interval: 0, ease: DEFAULT_EASE };
  return {
    again: '1d',
    hard: c.interval > 1 ? `${Math.max(1, Math.round(c.interval * 1.2))}d` : '1d',
    good: c.reps === 0 ? '1d' : c.reps === 1 ? '3d' : c.reps === 2 ? '6d' : `${Math.round((c.interval || 1) * c.ease)}d`,
    easy: c.reps === 0 ? '2d' : c.reps === 1 ? '5d' : `${Math.round((c.interval || 2) * c.ease * 1.3)}d`
  };
}

export function isDue(card, now = Date.now()) {
  return !card || !card.due || card.due <= now;
}

export function filterDue(items, srsMap, now = Date.now()) {
  return items.filter(v => isDue(srsMap[v.id], now));
}

export function srsSummary(items, srsMap, now = Date.now()) {
  let due = 0, learning = 0, mastered = 0, fresh = 0;
  for (const v of items) {
    const card = srsMap[v.id];
    if (!card || !card.lastReviewed) { fresh++; due++; }
    else if (card.due <= now) { due++; if (card.interval >= 21) mastered++; else learning++; }
    else if (card.interval >= 21) mastered++;
    else learning++;
  }
  return { total: items.length, due, learning, mastered, fresh };
}
