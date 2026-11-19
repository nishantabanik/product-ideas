import test from 'node:test';
import assert from 'node:assert/strict';
import {EXAM_LEVELS, TOPIC_PACKS, SITUATION_MODULES, MOCK_EXAM_SUITES} from '../src/curriculum.js';
import {loadExtras} from '../src/features.js';

test('exam suites cover Goethe and telc for A1, A2, and B1', () => {
  const expectedExams = ['goethe-a1', 'telc-a1', 'telc-a2', 'goethe-a2', 'telc-b1', 'goethe-b1'];
  for (const id of expectedExams) {
    const exam = MOCK_EXAM_SUITES[id];
    assert.ok(exam, `Missing exam suite for ${id}`);
    assert.ok(typeof exam.name === 'string' && exam.name.length > 0, `Exam ${id} has invalid name`);
    assert.ok(typeof exam.badge === 'string', `Exam ${id} has invalid badge`);
    assert.ok(exam.timeMinutes > 0, `Exam ${id} has invalid time`);
    assert.ok(Array.isArray(exam.sections) && exam.sections.length >= 3, `Exam ${id} has insufficient sections`);
  }
});

test('exam levels include A1 through C1 and Fachsprache', () => {
  const levelIds = EXAM_LEVELS.map(l => l.id);
  assert.deepEqual(levelIds, ['a1', 'a2', 'b1', 'b2', 'c1', 'fachsprache']);
  for (const lvl of EXAM_LEVELS) {
    assert.ok(lvl.name?.de && lvl.name?.en, `Level ${lvl.id} missing bilingual name`);
    assert.ok(Array.isArray(lvl.boards) && lvl.boards.length >= 2, `Level ${lvl.id} has too few boards`);
  }
});

test('topic packs are populated with bilingual names and preview terms', () => {
  assert.ok(TOPIC_PACKS.length >= 10, 'Expected at least 10 topic packs');
  for (const pack of TOPIC_PACKS) {
    assert.ok(pack.id, 'Topic missing id');
    assert.ok(pack.name?.de && pack.name?.en, `Topic ${pack.id} missing bilingual name`);
    assert.ok(typeof pack.preview === 'string' && pack.preview.length > 0, `Topic ${pack.id} missing preview`);
  }
});

test('real-world situations cover high-stakes immigrant moments', () => {
  const situationIds = SITUATION_MODULES.map(s => s.id);
  assert.ok(situationIds.includes('amt'), 'Missing amt situation');
  assert.ok(situationIds.includes('arzt'), 'Missing doctor/arzt situation');
  assert.ok(situationIds.includes('arbeit'), 'Missing work/arbeit situation');
  assert.ok(situationIds.includes('wortfallen'), 'Missing word traps');
  assert.ok(situationIds.includes('verben-b1'), 'Missing B1 verbs');
  assert.ok(situationIds.includes('verben-a2'), 'Missing A2 verbs');

  for (const sit of SITUATION_MODULES) {
    assert.ok(sit.title?.de && sit.title?.en, `Situation ${sit.id} missing title`);
    assert.ok(sit.desc?.de && sit.desc?.en, `Situation ${sit.id} missing description`);
  }
});

test('loadExtras accepts and validates sidebarLevel', () => {
  const extraDefault = loadExtras({getItem: () => null});
  assert.equal(extraDefault.sidebarLevel, 'a1');

  const extraA2 = loadExtras({getItem: () => JSON.stringify({sidebarLevel: 'a2'})});
  assert.equal(extraA2.sidebarLevel, 'a2');

  const extraInvalid = loadExtras({getItem: () => JSON.stringify({sidebarLevel: 'z99'})});
  assert.equal(extraInvalid.sidebarLevel, 'a1');
});
