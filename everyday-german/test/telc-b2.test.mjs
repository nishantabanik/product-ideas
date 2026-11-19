import test from 'node:test';import assert from 'node:assert/strict';
import {startTelc,advanceTelc,beginOral,canVisit,telcScores,speakingCriteria,writingCriteria} from '../src/telc-format.js';
import {grade} from '../src/state.js';
import {TELC_B2_EXERCISES,TELC_B2_SECTIONS} from '../src/telc-b2-exams.js';
import {getMockSections,MOCK_EXAM_SUITES} from '../src/curriculum.js';

const bySkill=s=>TELC_B2_EXERCISES.filter(q=>q.skill===s);

test('telc B2 paper follows the official five-part structure',()=>{
  assert.equal(TELC_B2_EXERCISES.length,64);
  assert.deepEqual(TELC_B2_SECTIONS.map(s=>s.skill),['lesen','sprachbausteine','hoeren','schreiben','sprechen']);
  assert.equal(bySkill('lesen').length,20);
  assert.equal(bySkill('sprachbausteine').length,20);
  assert.equal(bySkill('hoeren').length,20);
  assert.equal(bySkill('schreiben').length,1);
  assert.equal(bySkill('sprechen').length,3);
});

test('Lesen splits into headline matching, article details and ad matching',()=>{
  const lesen=bySkill('lesen');
  assert.deepEqual([1,2,3].map(p=>lesen.filter(q=>q.part===p).length),[5,5,10]);
  for(const q of lesen.filter(q=>q.part===1))assert.equal(q.options.length,10);
  for(const q of lesen.filter(q=>q.part===2))assert.equal(q.options.length,3);
  for(const q of lesen.filter(q=>q.part===3))assert.equal(q.options.length,13);
});

test('Sprachbausteine has grammar choice and a 15-word bank',()=>{
  const g=bySkill('sprachbausteine');
  assert.deepEqual([1,2].map(p=>g.filter(q=>q.part===p).length),[10,10]);
  for(const q of g.filter(q=>q.part===1))assert.equal(q.options.length,3);
  for(const q of g.filter(q=>q.part===2))assert.equal(q.options.length,15);
});

test('Hören plays every recording once across the three parts',()=>{
  const h=bySkill('hoeren');
  assert.deepEqual([1,2,3].map(p=>h.filter(q=>q.part===p).length),[5,10,5]);
  assert.ok(h.every(q=>q.plays===1));
  assert.ok(h.every(q=>q.options.length===2),'all listening items are Richtig/Falsch');
  const shared=h.filter(q=>q.part===2);
  assert.equal(new Set(shared.map(q=>q.audioGroup)).size,1);
  assert.equal(shared.filter(q=>q.transcript).length,1,'the interview transcript is stored once');
});

test('every objective B2 answer grades as correct and a wrong answer fails',()=>{
  for(const q of TELC_B2_EXERCISES.filter(q=>q.type==='choice')){
    assert.equal(grade(q,q.answer),true,`${q.id} answer does not grade`);
    assert.equal(grade(q,(q.answer+1)%q.options.length),false,`${q.id} wrong answer grades`);
  }
});

test('B2 mock timing: 90 min shared block, 20 min listening, 30 min writing, 20+15 oral',()=>{
  const m=startTelc(1000,'telc-b2');
  assert.equal(m.formatVersion,5);
  assert.equal(m.phase,'reading-language');
  assert.equal(m.deadline,1000+90*60000);
  assert.equal(canVisit(m,0),true);assert.equal(canVisit(m,1),true);assert.equal(canVisit(m,2),false);
  advanceTelc(m,1000+90*60000);
  assert.equal(m.phase,'listening');assert.equal(m.deadline,1000+110*60000);assert.equal(m.section,2);
  advanceTelc(m,1000+110*60000);
  assert.equal(m.phase,'writing');assert.equal(m.deadline,1000+140*60000);assert.equal(m.section,3);
  advanceTelc(m,1000+140*60000);
  assert.equal(m.phase,'oral-ready');assert.equal(m.section,4);
  assert.equal(beginOral(m,2000000),true);
  assert.equal(m.phase,'oral-prep');assert.equal(m.deadline,2000000+20*60000);
  advanceTelc(m,2000000+20*60000);
  assert.equal(m.phase,'oral');assert.equal(m.deadline,2000000+35*60000);
});

test('sections resolve through getMockSections and the suite metadata matches',()=>{
  assert.deepEqual(getMockSections('telc-b2',[],5),TELC_B2_SECTIONS);
  const suite=MOCK_EXAM_SUITES['telc-b2'];
  assert.equal(suite.level,'b2');
  assert.equal(suite.sections.length,5);
  assert.equal(suite.sections.map(s=>s.id).join(','),'lesen,sprachbausteine,hoeren,schreiben,sprechen');
});

test('B2 scoring: written 225 with 135 pass, oral 75 with 45 pass',()=>{
  const result={...startTelc(0,'telc-b2'),finished:1};
  for(const group of TELC_B2_SECTIONS)for(const id of group.ids){
    const q=TELC_B2_EXERCISES.find(x=>x.id===id);
    if(q.type==='choice')result.answers[id]=q.answer;
    else if(q.type==='writing')result.answers[id]=q.model;
  }
  for(const [k,m]of writingCriteria(result))result.ratings.writing[k]=m;
  for(const [k,m]of speakingCriteria(result))result.ratings.speaking[k]=m;
  const s=telcScores(result,TELC_B2_SECTIONS,id=>TELC_B2_EXERCISES.find(q=>q.id===id),grade);
  assert.equal(s.lesen,75);assert.equal(s.sprachbausteine,30);assert.equal(s.hoeren,75);assert.equal(s.schreiben,45);
  assert.equal(s.written,225);assert.equal(s.speaking,75);assert.equal(s.total,300);assert.equal(s.passed,true);
  // all wrong answers → written fails, oral still passes
  const bad={...result,answers:{}};
  for(const group of TELC_B2_SECTIONS)for(const id of group.ids){
    const q=TELC_B2_EXERCISES.find(x=>x.id===id);
    if(q.type==='choice')bad.answers[id]=(q.answer+1)%q.options.length;
  }
  const sb=telcScores(bad,TELC_B2_SECTIONS,id=>TELC_B2_EXERCISES.find(q=>q.id===id),grade);
  assert.equal(sb.lesen+sb.sprachbausteine+sb.hoeren,0);
  assert.equal(sb.written,45,'only the manually rated writing part still counts');
  assert.equal(sb.passed,false);
});
