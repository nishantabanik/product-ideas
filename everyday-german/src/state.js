import {sanitizeTelc} from './telc-format.js';
import {exercises,lessons,vocabulary,mockIds} from './content.js';
import {TELC_A2_EXERCISES} from './telc-a2-exams.js';
import {TELC_B1_EXERCISES} from './telc-b1-exams.js';
import {TELC_B2_EXERCISES} from './telc-b2-exams.js';
const stateExercises=[...exercises,...TELC_A2_EXERCISES,...TELC_B1_EXERCISES,...TELC_B2_EXERCISES];
export const STORAGE_KEY='everyday-german:v1';
export const initialState=()=>({version:1,lang:'en',attempts:{},drafts:{},lessons:[],words:{},history:[],mock:null,exams:[]});
export const normalize = value => String(value??'').trim().normalize('NFC').toLocaleLowerCase('de-DE').replace(/\s+/g,' ');
export const isObjective=q=>q.type==='choice'||q.type==='input';
export function grade(q,value){if(!isObjective(q))return null;return q.type==='choice'?Number.isInteger(value)&&value===q.answer:normalize(value)!==''&&(q.telcForm&&q.numericAnswer?String(value).replace(/[ ()+-]/g,'')===String(q.answer).replace(/[ ()+-]/g,''):normalize(value)===normalize(q.answer));}
export function objectiveResults(answers={}){
 const bySkill={};
 for(const group of mockIds){const qs=group.ids.map(id=>exercises.find(q=>q.id===id)).filter(isObjective);if(qs.length)bySkill[group.skill]={correct:qs.filter(q=>grade(q,answers[q.id])).length,total:qs.length};}
 return bySkill;
}
export function stats(state){const entries=Object.entries(state.attempts).filter(([id])=>stateExercises.some(q=>q.id===id));const objective=entries.filter(([id])=>isObjective(stateExercises.find(q=>q.id===id)));return {completed:entries.length,accuracy:objective.length?Math.round(objective.filter(([,v])=>v.correct===true).length/objective.length*100):null,lessons:state.lessons.length,words:Object.values(state.words).filter(x=>x==='known').length};}
const plain = v => v && typeof v==='object'&&!Array.isArray(v);
const validAnswers = raw => {
 const out={}; if(!plain(raw))return out;
 for(const q of stateExercises){const value=raw[q.id];if(q.type==='choice'&&Number.isInteger(value)&&value>=0&&value<q.options.length)out[q.id]=value;else if(['input','writing'].includes(q.type)&&typeof value==='string')out[q.id]=value.slice(0,5000);}
 return out;
};
export function sanitizeState(raw){
 const out=initialState();if(!plain(raw)||raw.version!==1)return out;
 out.lang=raw.lang==='de'?'de':'en';
 if(plain(raw.attempts))for(const q of stateExercises){const a=raw.attempts[q.id];if(plain(a)&&Number.isFinite(a.at)&&[true,false,null].includes(a.correct))out.attempts[q.id]={correct:isObjective(q)?a.correct:null,at:a.at,value:validAnswers({[q.id]:a.value})[q.id]??null};}
 out.drafts=validAnswers(raw.drafts);
 out.lessons=Array.isArray(raw.lessons)?[...new Set(raw.lessons.filter(id=>lessons.some(l=>l.id===id)))]:[];
 if(plain(raw.words))for(const v of vocabulary)if(['known','again'].includes(raw.words[v.id]))out.words[v.id]=raw.words[v.id];
 out.history=Array.isArray(raw.history)?raw.history.filter(x=>plain(x)&&stateExercises.some(q=>q.id===x.id)&&Number.isFinite(x.at)).slice(-100).map(x=>({id:x.id,at:x.at})):[];
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
