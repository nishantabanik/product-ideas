import test from 'node:test';
import assert from 'node:assert/strict';
import {exercises} from '../src/content.js';
import {TELC_PAPERS,TELC_PAPER_SUITES,telcPaperExercises,getTelcPaper,isTelcPaperKey} from '../src/telc-exams.js';
import {MOCK_EXAM_SUITES,getMockSections} from '../src/curriculum.js';
import {isObjective,grade} from '../src/state.js';

const RF = ['Richtig','Falsch'];
const AB = ['Anzeige a','Anzeige b'];

test('five complete telc A1 papers exist with the Start Deutsch 1 structure',()=>{
  assert.equal(TELC_PAPERS.length,5);
  for(const paper of TELC_PAPERS){
    assert.ok(isTelcPaperKey(paper.key),`paper key ${paper.key} should match the key pattern`);
    assert.equal(getTelcPaper(paper.key),paper);
    assert.equal(getTelcPaper('telc-a1-p99'),null);
    assert.equal(paper.timeMinutes,80); // 20 Hören + 45 Lesen/Schreiben + 15 Sprechen
    assert.deepEqual(paper.sections.map(s=>s.skill),['hoeren','lesen','schreiben','sprechen']);
    const [hoeren,lesen,schreiben,sprechen] = paper.sections;
    assert.equal(hoeren.ids.length,15);
    assert.equal(lesen.ids.length,15);
    assert.equal(schreiben.ids.length,6); // 5 form fields + 1 message
    assert.equal(sprechen.ids.length,3);  // 3 speaking tasks
  }
});

test('paper exercises are registered in the main catalogue with valid shape',()=>{
  const catalogue=new Map(exercises.map(q=>[q.id,q]));
  assert.equal(new Set(exercises.map(q=>q.id)).size,exercises.length,'all exercise IDs stay unique');
  for(const q of telcPaperExercises){
    assert.ok(catalogue.has(q.id),`missing in catalogue: ${q.id}`);
    assert.ok(q.explanation && q.explanation.en && q.explanation.de,`bilingual explanation missing on ${q.id}`);
    assert.ok(q.prompt,`prompt missing on ${q.id}`);
    assert.ok(q.title,`title missing on ${q.id}`);
    if(q.type==='choice'){
      assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length,`bad answer index on ${q.id}`);
      assert.equal(new Set(q.options).size,q.options.length,`duplicate options on ${q.id}`);
    }
    if(q.type==='input'){
      assert.equal(typeof q.answer,'string');
      assert.ok(q.answer.trim().length>0,`empty input answer on ${q.id}`);
    }
    if(q.type==='writing'||q.type==='speaking'){
      assert.ok(q.model,`model missing on ${q.id}`);
      assert.ok(Array.isArray(q.points)&&q.points.length>=2,`points missing on ${q.id}`);
    }
    if(q.skill==='hoeren'){
      assert.ok(q.transcript && q.transcript.length>40,`transcript too short on ${q.id}`);
      assert.ok(q.plays===1||q.plays===2,`plays hint missing on ${q.id}`);
    }
  }
});

test('Hören follows the telc part format: talks twice, announcements once, messages twice',()=>{
  for(const paper of TELC_PAPERS){
    const byId=new Map(exercises.map(q=>[q.id,q]));
    paper.sections[0].ids.forEach((id,i)=>{
      const q=byId.get(id);
      if(i<6){
        assert.equal(q.part,1);
        assert.equal(q.plays,2);
        assert.equal(q.options.length,3,'Teil 1 uses three choices');
      }else if(i<10){
        assert.equal(q.part,2);
        assert.equal(q.plays,1,'announcements play once');
        assert.deepEqual(q.options,RF);
      }else{
        assert.equal(q.part,3);
        assert.equal(q.plays,2);
        assert.equal(q.options.length,3);
      }
    });
  }
});

test('Lesen follows the telc part format: texts, advert a/b choice, signs',()=>{
  for(const paper of TELC_PAPERS){
    const byId=new Map(exercises.map(q=>[q.id,q]));
    paper.sections[1].ids.forEach((id,i)=>{
      const q=byId.get(id);
      if(i<5){
        assert.equal(q.part,1);
        assert.deepEqual(q.options,RF);
        assert.ok(q.text,'Teil 1 statements need their source text');
      }else if(i<10){
        assert.equal(q.part,2);
        assert.deepEqual(q.options,AB);
        assert.ok(/\na\) /.test(q.text) && /\nb\) /.test(q.text),'Teil 2 needs both adverts in the stimulus');
      }else{
        assert.equal(q.part,3);
        assert.deepEqual(q.options,RF);
        assert.ok(q.text && q.text.length<120,'signs stay short');
      }
    });
  }
});

test('Schreiben and Sprechen follow the telc part format',()=>{
  for(const paper of TELC_PAPERS){
    const byId=new Map(exercises.map(q=>[q.id,q]));
    const schreiben=paper.sections[2].ids.map(id=>byId.get(id));
    assert.equal(schreiben.filter(q=>q.type==='input').length,5);
    assert.equal(schreiben.filter(q=>q.type==='input').every(q=>q.part===1),true);
    const message=schreiben.find(q=>q.type==='writing');
    assert.equal(message.part,2);
    assert.equal(message.points.length,3,'the message task has exactly three bullet points');
    assert.ok(/30 Wörter/.test(message.prompt),'the prompt asks for about 30 words');
    const sprechen=paper.sections[3].ids.map(id=>byId.get(id));
    assert.deepEqual(sprechen.map(q=>q.part),[1,2,3]);
    assert.ok(sprechen[0].points.includes('Name'),'Teil 1 starts with self-introduction points');
    const spellPoint=sprechen[0].points.find(p=>/buchstabieren/i.test(p));
    assert.ok(spellPoint,'Teil 1 includes spelling a word');
  }
});

test('every objective paper answer grades as correct with its own key',()=>{
  for(const q of telcPaperExercises){
    if(!isObjective(q))continue;
    const value=q.type==='choice'?q.answer:q.answer;
    assert.equal(grade(q,value),true,`answer key of ${q.id} does not grade correctly`);
    assert.equal(grade(q,q.type==='choice'?1-q.answer:'__wrong__'),false,`anti-answer of ${q.id} unexpectedly grades correct`);
  }
});

test('form fields within one paper ask for distinct, non-empty details',()=>{
  for(const paper of TELC_PAPERS){
    const byId=new Map(exercises.map(q=>[q.id,q]));
    const fields=paper.sections[2].ids.slice(0,5).map(id=>byId.get(id));
    assert.equal(new Set(fields.map(q=>q.prompt)).size,5,'form field prompts are distinct');
    assert.equal(new Set(fields.map(q=>q.answer.toLocaleLowerCase())).size,5,'form field answers are distinct');
    assert.ok(fields.every(q=>q.text && q.text.length>40),'each form field shows the profile');
  }
});

test('papers are registered as exam suites and served by getMockSections',()=>{
  for(const paper of TELC_PAPERS){
    const suite=MOCK_EXAM_SUITES[paper.key];
    assert.ok(suite,`suite missing for ${paper.key}`);
    assert.equal(suite.timeMinutes,80);
    assert.equal(suite.level,'a1');
    assert.ok(Array.isArray(suite.sections)&&suite.sections.length===4);
    const sections=getMockSections(paper.key,[]);
    assert.deepEqual(sections,paper.sections);
  }
  const dummy=[{skill:'hoeren',ids:['h1']}];
  assert.deepEqual(getMockSections('telc-a1',dummy),TELC_PAPERS[0].sections);
  const base=getMockSections('telc-a1',dummy,1);
  assert.deepEqual(base.map(s=>s.skill),['hoeren']); // non-paper keys keep returning the passed base groups
  assert.equal(base[0].ids.length,1);
});

test('paper writing and speaking tasks are excluded from objective scoring',()=>{
  for(const paper of TELC_PAPERS){
    const byId=new Map(exercises.map(q=>[q.id,q]));
    const objective=paper.sections.flatMap(g=>g.ids).map(id=>byId.get(id)).filter(isObjective);
    assert.equal(objective.length,35,'exactly 35 objective answers per paper');
    for(const q of objective)assert.equal(grade(q,q.answer),true);
  }
});
