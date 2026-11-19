import test from 'node:test';
import assert from 'node:assert/strict';
import {exercises,lessons,vocabulary,mockIds} from '../src/content.js';
import {messages} from '../src/i18n.js';
import {initialState,grade,recordAttempt,stats,loadState,saveState,sanitizeState,startMock,remainingSeconds,finishMock,objectiveResults,STORAGE_KEY} from '../src/state.js';

test('objective grading handles correct, wrong and missing answers without marking productive skills',()=>{
 const q=exercises.find(q=>q.id==='r1');assert.equal(grade(q,1),true);assert.equal(grade(q,0),false);assert.equal(grade(q,undefined),false);assert.equal(grade(q,'1'),false);
 assert.equal(grade(exercises.find(q=>q.id==='f1'),'  KELLER  '),true);
 assert.equal(grade(exercises.find(q=>q.id==='w1'),'Any text'),null);
 assert.equal(grade(exercises.find(q=>q.id==='s1'),null),null);
});
test('latest attempts drive accuracy and retry clears a mistake, while history retains both attempts',()=>{
 const s=initialState(),q=exercises.find(q=>q.id==='r1');recordAttempt(s,q,0,1);assert.equal(stats(s).accuracy,0);recordAttempt(s,q,1,2);assert.equal(stats(s).completed,1);assert.equal(stats(s).accuracy,100);assert.equal(s.history.length,2);
 recordAttempt(s,exercises.find(q=>q.id==='s1'),null,3);assert.equal(stats(s).accuracy,100);assert.equal(stats(s).completed,2);
});
test('state persists and restores German preference, drafts, progress and exam answers',()=>{
 let saved;const storage={setItem:(key,value)=>{assert.equal(key,STORAGE_KEY);saved=value;},getItem:()=>saved};
 const s=initialState();s.lang='de';s.drafts.w1='Liebe Lara, ich komme am Samstag.';s.lessons=['hello'];s.words.v1='known';s.mock=startMock(100);s.mock.answers.r1=1;
 recordAttempt(s,exercises[0],1,50);assert.equal(saveState(storage,s),true);const loaded=loadState(storage);assert.equal(loaded.error,false);assert.deepEqual(loaded.state,s);
});
test('invalid or blocked local storage does not crash the learning session',()=>{
 assert.equal(loadState({getItem:()=>'{broken'}).error,true);assert.equal(loadState(null).error,true);assert.equal(saveState({setItem:()=>{throw Error('quota');}},initialState()),false);
 assert.deepEqual(sanitizeState({version:8}),initialState());
});
test('untrusted storage is bounded and rejects unknown IDs, malformed answers and duplicate lessons',()=>{
 const s=sanitizeState({version:1,lang:'<script>',attempts:{oops:{correct:true,at:1},r1:{correct:true,at:'bad'}},drafts:{r1:900,w1:'x'.repeat(6000),fake:'value'},lessons:['hello','hello','fake'],words:{v1:'known',fake:'known',v2:'hacked'},mock:{id:'x',started:10,deadline:1}});
 assert.equal(s.lang,'en');assert.deepEqual(s.attempts,{});assert.equal(s.drafts.r1,undefined);assert.equal(s.drafts.w1.length,5000);assert.deepEqual(s.lessons,['hello']);assert.deepEqual(s.words,{v1:'known'});assert.equal(s.mock,null);
});
test('mock timer uses an absolute deadline, survives reload and never goes negative',()=>{
 const m=startMock(1000);assert.equal(remainingSeconds(m,1000),4800);assert.equal(remainingSeconds(m,61000),4740);const restored=sanitizeState({...initialState(),mock:m});assert.equal(remainingSeconds(restored.mock,m.deadline-10),1);assert.equal(remainingSeconds(m,m.deadline+10000),0);
});
test('finishing an exam captures answers once and retains a reviewable history',()=>{
 const s=initialState();s.mock=startMock(1000);s.mock.answers.r1=1;const result=finishMock(s,2000);assert.equal(s.mock,null);assert.equal(result.answers.r1,1);assert.equal(s.exams.length,1);assert.equal(finishMock(s,3000),null);assert.equal(s.exams.length,1);
});
test('mock has 15 listening and 15 reading answers; unattempted items score zero and subjective work is excluded',()=>{
 const blank=objectiveResults({});assert.deepEqual(blank,{hoeren:{correct:0,total:15},lesen:{correct:0,total:15},schreiben:{correct:0,total:5}});
 const all={};for(const q of exercises)all[q.id]=q.type==='choice'||q.type==='input'?q.answer:'text';const perfect=objectiveResults(all);assert.equal(perfect.lesen.correct,15);assert.equal(perfect.hoeren.correct,15);assert.equal(perfect.schreiben.correct,5);assert.equal(perfect.sprechen,undefined);
});
test('catalogue integrity: unique IDs, valid keys, bilingual explanations and no missing exam references',()=>{
 assert.equal(new Set(exercises.map(q=>q.id)).size,exercises.length);assert.equal(exercises.length,500); // 300 core + 195 existing paper tasks + five corrected dialogue items; legacy IDs retained
 for(const q of exercises){assert.ok(q.explanation.en);assert.ok(q.explanation.de);assert.ok(q.prompt);if(q.type==='choice'){assert.ok(q.answer>=0&&q.answer<q.options.length);assert.equal(new Set(q.options).size,q.options.length);}if(q.skill==='hoeren')assert.ok(q.transcript.length>40);}
 for(const section of mockIds)for(const id of section.ids)assert.ok(exercises.find(q=>q.id===id));
 assert.equal(lessons.length,75);assert.equal(vocabulary.length,24);
});
test('English and German UI dictionaries have matching keys with no missing translations',()=>{
 assert.deepEqual(Object.keys(messages.en).sort(),Object.keys(messages.de).sort());for(const lang of ['en','de'])for(const text of Object.values(messages[lang]))assert.ok(text.trim());
});
test('expanded catalogue has balanced activities per skill and varied correct positions',()=>{
 const expectedPerSkill={lesen:150,hoeren:155,schreiben:105,sprechen:90}; // 75 core each + existing paper tasks + five versioned sixth dialogues
 for(const skill of ['lesen','hoeren','schreiben','sprechen'])assert.equal(exercises.filter(q=>q.skill===skill).length,expectedPerSkill[skill]);
 for(const l of lessons){assert.ok(l.rule.en);assert.ok(l.rule.de);assert.ok(l.examples.length>=3);assert.equal(new Set(l.quiz.options).size,l.quiz.options.length);assert.ok(l.quiz.options[l.quiz.answer]);}
});
