import {newPracticeItems} from './practice-catalog.js';
import {exercises} from './content.js';
import {LEVEL_EXERCISES} from './level-exercises.js';
import {TELC_A2_EXERCISES} from './telc-a2-exams.js';
import {TELC_B1_EXERCISES} from './telc-b1-exams.js';
import {TELC_B2_EXERCISES} from './telc-b2-exams.js';
import {PRACTICE_BANK} from './practice-bank.js';

const practiceBankItems = Object.values(PRACTICE_BANK).flatMap(byCat => Object.values(byCat).flat());

// Tag A1 items in place so catalog and practice lists share references.
exercises.forEach(q => { if(!q.level) q.level = 'a1'; });

export const allExercises = [
  ...exercises,
  ...TELC_A2_EXERCISES,
  ...TELC_B1_EXERCISES,
  ...TELC_B2_EXERCISES,
  ...Object.values(LEVEL_EXERCISES).flat(),
  ...newPracticeItems,
  ...practiceBankItems
];

const exerciseById = new Map(allExercises.map(q => [q.id, q]));
export const findExercise = id => exerciseById.get(id);

// Level + category lookup for the separated Üben section.
export function getCategoryItems(level, cat) {
  const lvl = String(level||'a1').toLowerCase();
  const key = cat==='grammatik'||cat==='wortschatz' ? null : cat;
  if (!key) return [];
  return allExercises.filter(q => (q.level||(q.levelGuess)||'a1')===lvl && q.skill===key);
}
