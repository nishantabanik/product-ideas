import test from 'node:test';
import assert from 'node:assert/strict';
import {initCard,rateCard,previewIntervals,isDue,srsSummary} from '../src/srs.js';
import {evaluateSpeech} from '../src/speech-assessment.js';
import {detectPitch,INTONATION_PROFILES} from '../src/pitch-trainer.js';
import {CEFR_LEVELS,CEFR_LESSONS} from '../src/cefr.js';
import {DRILL_MODES,DRILL_ITEMS} from '../src/grammar-drills.js';
import {voiceProfiles,loadExtras,FREE_NATIVE_VOICES,ELEVENLABS_NATIVE_VOICES} from '../src/features.js';

test('SM-2 SRS engine schedules intervals according to ratings', () => {
  const card = initCard('v1');
  assert.equal(card.reps, 0);
  assert.equal(card.interval, 0);

  // Rating 1 (Again) resets interval to 1
  const failed = rateCard(card, 1);
  assert.equal(failed.reps, 0);
  assert.equal(failed.interval, 1);

  // Rating 3 (Good) progresses reps and interval
  const good1 = rateCard(failed, 3);
  assert.equal(good1.reps, 1);
  assert.equal(good1.interval, 1);

  const good2 = rateCard(good1, 3);
  assert.equal(good2.reps, 2);
  assert.equal(good2.interval, 3);

  const good3 = rateCard(good2, 3);
  assert.equal(good3.reps, 3);
  assert.equal(good3.interval, 6);

  const good4 = rateCard(good3, 3);
  assert.equal(good4.reps, 4);
  assert.ok(good4.interval >= 12);

  // Preview intervals calculation
  const intervals = previewIntervals(good2);
  assert.ok(intervals.again);
  assert.ok(intervals.hard);
  assert.ok(intervals.good);
  assert.ok(intervals.easy);

  // Summary aggregation
  const mockVocab = [{id:'w1'},{id:'w2'},{id:'w3'}];
  const mockSrs = {
    w1: {...initCard('w1'), due: Date.now() - 1000, lastReviewed: Date.now() - 2000},
    w2: {...initCard('w2'), interval: 25, reps: 5, due: Date.now() + 1000000, lastReviewed: Date.now()}
  };
  const summary = srsSummary(mockVocab, mockSrs);
  assert.equal(summary.due, 2); // w1 is due, w3 has no record so is due
  assert.equal(summary.mastered, 1);
});

test('speech assessment grades spoken German with keyword fidelity', () => {
  const target = 'Guten Tag, mein Name ist Alex und ich komme aus Spanien.';
  const spoken = 'Guten Tag mein Name ist Alex und ich komme aus Spanien';
  const result = evaluateSpeech(spoken, target);
  assert.equal(result.score, 100);
  assert.ok(result.tokens.every(t => t.matched));

  const partialSpoken = 'Guten Tag mein Name Alex';
  const partial = evaluateSpeech(partialSpoken, target);
  assert.ok(partial.score > 20 && partial.score < 90);
  assert.ok(partial.tokens.some(t => !t.matched));

  const empty = evaluateSpeech('', target);
  assert.equal(empty.score, 0);
});

test('pitch detection identifies fundamental frequencies in audio buffers', () => {
  const sampleRate = 44100;
  const targetHz = 220; // 220 Hz tone
  const buffer = new Float32Array(2048);
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = Math.sin((2 * Math.PI * targetHz * i) / sampleRate);
  }
  const detected = detectPitch(buffer, sampleRate);
  assert.ok(detected !== null);
  assert.ok(Math.abs(detected - targetHz) < 10);

  // Silence produces null
  const silence = new Float32Array(2048);
  assert.equal(detectPitch(silence, sampleRate), null);

  // Intonation profiles exist with target curves
  for (const prof of Object.values(INTONATION_PROFILES)) {
    assert.ok(prof.target.length >= 4);
    assert.ok(prof.name.en && prof.name.de);
  }
});

test('CEFR curriculum covers A1, A2, and B1 with valid exercises', () => {
  assert.equal(CEFR_LEVELS.length, 3);
  assert.deepEqual(CEFR_LEVELS.map(l => l.id), ['a1', 'a2', 'b1']);

  for (const [lvl, list] of Object.entries(CEFR_LESSONS)) {
    for (const lesson of list) {
      assert.ok(lesson.id.startsWith(lvl));
      assert.ok(lesson.title.en && lesson.title.de);
      assert.ok(lesson.rule.en && lesson.rule.de);
      assert.ok(lesson.examples.length >= 2);
      assert.ok(lesson.quiz.options.length >= 3);
      assert.ok(lesson.quiz.answer >= 0 && lesson.quiz.answer < lesson.quiz.options.length);
      assert.ok(lesson.explanation.en && lesson.explanation.de);
    }
  }
});

test('grammar mechanics drills are fully populated and valid', () => {
  assert.ok(DRILL_MODES.length >= 4);
  for (const mode of DRILL_MODES) {
    const items = DRILL_ITEMS[mode.id];
    assert.ok(items && items.length >= 4);
    for (const item of items) {
      assert.ok(item.prompt);
      assert.ok(item.options.length >= 2);
      assert.ok(item.answer >= 0 && item.answer < item.options.length);
      assert.ok(item.rule);
      assert.ok(item.en && item.de);
    }
  }
});

test('voice profiles and audio preferences support emotional inflection', () => {
  assert.ok(voiceProfiles.lively.pitch > 1.0);
  assert.ok(voiceProfiles.friendly.rate < 1.0);
  assert.ok(voiceProfiles.official.pitch < 1.0);

  const fakeStorage = {
    getItem: () => JSON.stringify({
      activePersona: 'conrad',
      voiceProfile: 'friendly',
      pitch: 1.04,
      rate: 0.92,
      cefrLevel: 'b1'
    })
  };
  const loaded = loadExtras(fakeStorage);
  assert.equal(loaded.activePersona, 'conrad');
  assert.equal(loaded.voiceProfile, 'friendly');
  assert.equal(loaded.pitch, 1.04);
  assert.equal(loaded.rate, 0.92);
  assert.equal(loaded.cefrLevel, 'b1');
});

test('curated 100% free native German personas are configured with audio files and empathic parameters', () => {
  assert.equal(FREE_NATIVE_VOICES.length, 5);
  for (const voice of FREE_NATIVE_VOICES) {
    assert.ok(voice.id.length >= 3);
    assert.ok(voice.name);
    assert.ok(voice.audioUrl.endsWith('.mp3'));
    assert.ok(voice.style.en && voice.style.de);
    assert.ok(voice.role.en && voice.role.de);
    assert.ok(voice.sampleText.de);
    assert.ok(voice.pitch >= 0.8 && voice.pitch <= 1.3);
    assert.ok(voice.rate >= 0.7 && voice.rate <= 1.2);
  }
});

test('Goethe and telc exam suites and Allgemein practice sets exist for all levels A1 through C1', async () => {
  const { MOCK_EXAM_SUITES, EXAM_LEVELS } = await import('../src/curriculum.js');
  const { LEVEL_EXERCISES, getExercisesForLevel } = await import('../src/level-exercises.js');
  const { exercises } = await import('../src/content.js');

  const levels = ['a1', 'a2', 'b1', 'b2', 'c1'];
  for (const lvl of levels) {
    assert.ok(MOCK_EXAM_SUITES[`goethe-${lvl}`], `Goethe ${lvl} exam suite must exist`);
    assert.ok(MOCK_EXAM_SUITES[`telc-${lvl}`], `telc ${lvl} exam suite must exist`);
    assert.ok(MOCK_EXAM_SUITES[`goethe-${lvl}`].name.includes('Goethe'));
    assert.ok(MOCK_EXAM_SUITES[`telc-${lvl}`].name.includes('telc'));

    const levelExercises = getExercisesForLevel(lvl, exercises);
    assert.ok(levelExercises.length >= 4, `Level ${lvl} must have at least 4 Allgemein exercises`);

    const skillsFound = new Set(levelExercises.map(e => e.skill));
    assert.ok(skillsFound.has('lesen'), `Level ${lvl} must have reading exercises`);
    assert.ok(skillsFound.has('hoeren'), `Level ${lvl} must have listening exercises`);
    assert.ok(skillsFound.has('schreiben'), `Level ${lvl} must have writing exercises`);
    assert.ok(skillsFound.has('sprechen'), `Level ${lvl} must have speaking exercises`);

    // Ensure level questions are distinct and level-tagged
    if (lvl !== 'a1') {
      for (const ex of LEVEL_EXERCISES[lvl]) {
        assert.equal(ex.level, lvl);
        assert.ok(ex.title && ex.prompt && ex.explanation);
      }
    }
  }
});
