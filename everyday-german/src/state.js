import {CEFR_LESSONS} from './cefr.js';
import {sanitizeTelc} from './telc-format.js';
import {lessons,vocabulary,mockIds} from './content.js';
import {findExercise} from './exercise-catalog.js';

const lessonIds = new Set([...lessons,...Object.values(CEFR_LESSONS).flat()].map(lesson => lesson.id));
export const STORAGE_KEY='everyday-german:v1';
export const initialState=()=>({version:1,lang:'en',attempts:{},drafts:{},lessons:[],words:{},history:[],mock:null,exams:[]});
export const normalize = value => String(value??'').trim().normalize('NFC').toLocaleLowerCase('de-DE').replace(/\s+/g,' ');
export const isObjective=q=>q.type==='choice'||q.type==='input'||q.type==='wordorder';
export function grade(q,value){if(!isObjective(q))return null;return q.type==='choice'?Number.isInteger(value)&&value===q.answer:normalize(value)!==''&&(q.telcForm&&q.numericAnswer?String(value).replace(/[ ()+-]/g,'')===String(q.answer).replace(/[ ()+-]/g,''):normalize(value)===normalize(q.answer));}
export function objectiveResults(answers={}){
 const bySkill={};
 for(const group of mockIds){const qs=group.ids.map(findExercise).filter(isObjective);if(qs.length)bySkill[group.skill]={correct:qs.filter(q=>grade(q,answers[q.id])).length,total:qs.length};}
 return bySkill;
}
export function stats(state){
 let completed=0, objective=0, correct=0;
 for(const [id,attempt] of Object.entries(state.attempts)){
  const q=findExercise(id);
  if(!q)continue;
  completed++;
  if(isObjective(q)){
   objective++;
   if(attempt.correct===true)correct++;
  }
 }
 return {
  completed,accuracy:objective?Math.round(correct/objective*100):null,
  lessons:state.lessons.length,words:Object.values(state.words).filter(x=>x==='known').length
 };
}

const plain = v => v && typeof v==='object'&&!Array.isArray(v);
function validAnswer(q,value){
  if(q.type==='choice'&&Number.isInteger(value)&&value>=0&&value<q.options.length)return value;
  if((q.type==='input'||q.type==='writing'||q.type==='wordorder')&&typeof value==='string')return value.slice(0,5000);
}
function validAnswers(raw){
 const out={};
 if(!plain(raw))return out;
 for(const [id,value] of Object.entries(raw)){
  const q=findExercise(id);
  if(!q)continue;
  const answer=validAnswer(q,value);
  if(answer!==undefined)out[id]=answer;
 }
 return out;
}
export function sanitizeState(raw){
 const out=initialState();if(!plain(raw)||raw.version!==1)return out;
 out.lang=raw.lang==='de'?'de':'en';
 if(plain(raw.attempts))for(const [id,attempt] of Object.entries(raw.attempts)){
  const q=findExercise(id);
  if(!q||!plain(attempt)||!Number.isFinite(attempt.at)||![true,false,null].includes(attempt.correct))continue;
  out.attempts[id]={
   correct:isObjective(q)?attempt.correct:null,
   at:attempt.at,
   value:validAnswer(q,attempt.value)??null
  };
 }
 out.drafts=validAnswers(raw.drafts);
 out.lessons=Array.isArray(raw.lessons)?[...new Set(raw.lessons.filter(id=>lessonIds.has(id)))]:[];
 if(plain(raw.words))for(const v of vocabulary)if(['known','again'].includes(raw.words[v.id]))out.words[v.id]=raw.words[v.id];
 out.history=Array.isArray(raw.history)?raw.history.filter(x=>plain(x)&&findExercise(x.id)&&Number.isFinite(x.at)).slice(-100).map(x=>({id:x.id,at:x.at})):[];
 const validMock = m=>plain(m)&&typeof m.id==='string'&&Number.isFinite(m.started)&&Number.isFinite(m.deadline)&&m.deadline>=m.started;
 if(validMock(raw.mock))out.mock=sanitizeTelc({id:raw.mock.id,exam:typeof raw.mock.exam==='string'?raw.mock.exam:'telc-a1',started:raw.mock.started,deadline:raw.mock.deadline,section:Math.max(0,Math.min(10,Number.isInteger(raw.mock.section)?raw.mock.section:0)),answers:validAnswers(raw.mock.answers)},raw.mock);
 out.exams=Array.isArray(raw.exams)?raw.exams.filter(m=>validMock(m)&&Number.isFinite(m.finished)).slice(-20).map(m=>sanitizeTelc({id:m.id,exam:typeof m.exam==='string'?m.exam:'telc-a1',started:m.started,deadline:m.deadline,finished:m.finished,answers:validAnswers(m.answers)},m)):[];
 return out;
}
export function loadState(storage){try{const raw=storage.getItem(STORAGE_KEY);return {state:raw?sanitizeState(JSON.parse(raw)):initialState(),error:false};}catch{return {state:initialState(),error:true};}}
export function saveState(storage,state){try{storage.setItem(STORAGE_KEY,JSON.stringify(state));return true;}catch{return false;}}
export function recordAttempt(state,q,value,now=Date.now()){const correct=grade(q,value);state.attempts[q.id]={correct,value:value??null,at:now};state.history.push({id:q.id,at:now});state.history=state.history.slice(-100);return correct;}
export function startMock(now=Date.now(), exam='telc-a1', timeMinutes=80){return {id:`exam-${now}`,exam,started:now,deadline:now+timeMinutes*60*1000,section:0,answers:{}};}
export function remainingSeconds(mock,now=Date.now()){return mock?Math.max(0,Math.ceil((mock.deadline-now)/1000)):0;}
export function finishMock(state,now=Date.now()){
 if(!state.mock)return null;const result={...state.mock,finished:now,answers:{...state.mock.answers}};
 state.exams=[...state.exams,result].slice(-20);state.mock=null;return result;
}
