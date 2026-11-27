import test from 'node:test';
import assert from 'node:assert/strict';
import {lessons} from '../src/content.js';
import {examFormats} from '../src/exam-formats.js';
import {findExercise} from '../src/exercise-catalog.js';
import {grammarLessonGroups, levels, practiceAreas, practiceByLevel} from '../src/practice-catalog.js';
import {initialState, recordAttempt, sanitizeState} from '../src/state.js';
import {telcPaperExercises} from '../src/telc-exams.js';

test('each level has six practice areas and separate Goethe and telc mock entries',()=>{
 const mockIds=new Set(telcPaperExercises.map(q=>q.id));
 const practiceIds=levels.flatMap(level=>practiceByLevel[level].map(q=>q.id));
 assert.equal(new Set(practiceIds).size,practiceIds.length);
 for(const level of levels){
  assert.ok(examFormats['goethe-'+level]);
  assert.ok(examFormats['telc-'+level]);
  for(const area of Object.keys(practiceAreas)){
   assert.ok(practiceByLevel[level].some(q=>q.skill===area),level+' '+area);
  }
  for(const q of practiceByLevel[level]){
   assert.ok(!mockIds.has(q.id));
   assert.equal(findExercise(q.id),q);
   if(q.type==='choice')assert.ok(q.options[q.answer],q.id);
  }
 }
});

test('A1 grammar topics retain every lesson and C2 practice attempts survive reload',()=>{
 assert.deepEqual(grammarLessonGroups.a1.flatMap(group=>group.lessons.map(l=>l.id)).sort(),lessons.map(l=>l.id).sort());
 const q=practiceByLevel.c2.find(item=>item.skill==='grammar');
 const state=initialState();
 recordAttempt(state,q,q.answer);
 assert.deepEqual(sanitizeState(state).attempts[q.id],state.attempts[q.id]);
});
