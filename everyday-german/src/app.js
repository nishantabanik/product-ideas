import {isTelcA1,isTelcA2,isTelcB1,isTelcB2,isCurrentTelc,startTelc,advanceTelc,beginOral,canVisit,writingCriteria,speakingCriteria,allowedRatings,telcScores} from './telc-format.js';
import {telcLive,telcInfo,renderTelcCards,telcAssessment} from './telc-ui.js';
import {loadExtras,extraView,installFeatures,featureTitle,themes,FREE_NATIVE_VOICES} from './features.js';
import {playRecording,playAudioFile,playTTS,stopRecording} from './audio.js';
import {exercises,lessons,vocabulary,skills,mockIds} from './content.js';
import {translate} from './i18n.js';
import {loadState,saveState,stats,recordAttempt,isObjective,grade,objectiveResults,startMock,remainingSeconds,finishMock} from './state.js';
import {initCard,rateCard,previewIntervals,isDue,srsSummary} from './srs.js';
import {evaluateSpeech,startSpeechRecognition,hasSpeechRecognition} from './speech-assessment.js';
import {MOCK_EXAM_SUITES,getMockSections} from './curriculum.js';
import {TELC_PAPERS} from './telc-exams.js';
import {LEVEL_EXERCISES,getExercisesForLevel} from './level-exercises.js';
import {TELC_A2_EXERCISES} from './telc-a2-exams.js';
import {TELC_B1_EXERCISES} from './telc-b1-exams.js';
import {TELC_B2_EXERCISES} from './telc-b2-exams.js';
import {dailyThought} from './daily-thought.js';
import {examFormats} from './exam-formats.js';

export const allExercises = [
  ...exercises,
  ...TELC_A2_EXERCISES,
  ...TELC_B1_EXERCISES,
  ...TELC_B2_EXERCISES,
  ...LEVEL_EXERCISES.a2,
  ...LEVEL_EXERCISES.b1,
  ...LEVEL_EXERCISES.b2,
  ...LEVEL_EXERCISES.c1
];
const exerciseById = new Map(allExercises.map(q => [q.id, q]));
export const findExercise = id => exerciseById.get(id);

const app=document.querySelector('#app');
let storage;try{storage=window.localStorage;}catch{storage=null;}
const loaded=loadState(storage);let state=loaded.state,storageError=loaded.error;
let extra=loadExtras(storage);
const saveExtra=()=>{try{storage.setItem('everyday-german:extras',JSON.stringify(extra));}catch{announce(t('localWarning'));}};
let synthesisFinish=null,telcPlayingId=null;
let mobileOpen=false,wordRevealed=false,wordMeaning=false,audioRunning=false,audioButton=null,audioMarkup='',audioLabel='',audioVersion=0;
const checked=new Map(),lessonChecks=new Map(),selfReviews=new Set();
const t=key=>translate(state.lang,key);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={home:'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',book:'M3 4h6a4 4 0 0 1 3 2 4 4 0 0 1 3-2h6v15h-6a4 4 0 0 0-3 2 4 4 0 0 0-3-2H3Zm9 2v15',headphones:'M3 14v-3a9 9 0 0 1 18 0v3M3 12h3v8H3zm15 0h3v8h-3z',pen:'m15 4 5 5M4 20l5-1L21 7l-5-5L4 14Z',chat:'M21 11a9 9 0 0 1-9 9H4l-2 2v-8a9 9 0 1 1 19-3ZM7 10h10M7 14h6',clock:'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',chart:'M4 20V12m8 8V4m8 16V8',arrow:'M5 12h14m-6-6 6 6-6 6',check:'m5 12 4 4L19 6',spark:'m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z',globe:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z',play:'m9 5 11 7-11 7Z',leaf:'M5 20C-1 7 10 3 21 3c0 11-4 20-16 17Zm0 0L17 7',wave:'M3 12c3-7 6 7 9 0s6 7 9 0',menu:'M4 6h16M4 12h16M4 18h16',close:'m5 5 14 14M5 19 19 5',info:'M12 11v6m0-10v.1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',cards:'M4 3h13v17H4Zm13 3h4v15H8',download:'M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4',volume:'M4 9h4l5-5v16l-5-5H4Zm12-2c4 2 4 8 0 10',chevron:'m9 5 7 7-7 7'};
const icon=(name,cls='')=>`<svg class="icon ${cls}" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[name]||paths.book}"/></svg>`;
const skillIcon={lesen:'book',hoeren:'headphones',schreiben:'pen',sprechen:'chat'};
const label=key=>`<span class="eyebrow">${esc(t(key))}</span>`;
const btn=(href,text,primary=true,extra='')=>`<a class="button ${primary?'primary':'secondary'} ${extra}" href="${href}">${esc(text)}${icon('arrow')}</a>`;
const route=()=>{const [path,query]=location.hash.slice(1).split('?');return {path:path||'home',params:new URLSearchParams(query||'')};};
const persist=()=>{storageError=!saveState(storage,state);const warning=document.querySelector('#storage-warning');if(warning)warning.hidden=!storageError;};
const announce=msg=>{document.querySelector('#announcer').textContent=msg;};
const date=value=>new Intl.DateTimeFormat(state.lang==='de'?'de-DE':'en-GB',{day:'numeric',month:'short'}).format(value);
const savedStatus=q=>state.attempts[q.id]?(state.attempts[q.id].correct===false?'pending':'done'):'new';
function stopAudio(){const finish=synthesisFinish;synthesisFinish=null;if(finish)finish(false);audioVersion++;stopRecording();if('speechSynthesis' in window)window.speechSynthesis.cancel();audioRunning=false;if(audioButton?.isConnected){audioButton.innerHTML=audioMarkup;audioButton.setAttribute('aria-label',audioLabel);}audioButton=null;}
function renderRoute(){
  mobileOpen=false;
  wordRevealed=false;
  wordMeaning=false;
  sidebarSelection=null;
  render(true);
}
function navigate(hash){
  if(location.hash!==hash)history.pushState(null,'',hash);
  renderRoute();
}
let sidebarSelection=null;
function selectSidebarLevel(level){
  sidebarSelection=level;
  extra.sidebarLevel=level;
  const sidebar=document.querySelector('.sidebar');
  for(const tab of sidebar.querySelectorAll('[data-action="pick-exam-level"]')){
    const selected=tab.dataset.level===level;
    tab.classList.toggle('active',selected);
    tab.setAttribute('aria-pressed',String(selected));
  }
  const {path,params}=route();
  const exam=path==='mock'?params.get('exam')||'telc-a1':path==='mock/live'?state.mock?.exam:null;
  const active=exam?'mock?exam='+exam:'';
  sidebar.querySelector('.exam-board-subnav').innerHTML=renderExamBoardSubnav(level,active);
  saveExtra();
}
function pageHeader(k,desc,badge='sample'){return `<div class="page-heading">${label(badge)}<h1 tabindex="-1">${esc(t(k))}</h1><p>${esc(t(desc))}</p></div>`;}
function renderExamBoardSubnav(level, active){
  const lvl = level || 'a1';
  const upper = lvl.toUpperCase();
  const list = [
    { name: `Goethe ${upper}`, url: `mock?exam=goethe-${lvl}` },
    { name: `telc ${upper}`, url: `mock?exam=telc-${lvl}` },
    { name: `Allgemein ${upper}`, url: `practice?level=${lvl}` }
  ];
  return list.map(item => `
    <a href="#${item.url}" class="exam-provider-row ${active===item.url?'active':''}" ${active===item.url?'aria-current="page"':''}>
      <span>${esc(item.name)}</span>
    </a>
  `).join('');
}

function sidebar(active){
  const {path,params}=route();
  const examKey=path==='mock'?params.get('exam')||'telc-a1':path==='mock/live'?state.mock?.exam:null;
  const routeLevel=examKey?.match(/-(a1|a2|b1|b2|c1)(?:-p\d+)?$/)?.[1]
    || (path==='exams'?params.get('lvl'):path==='practice'?params.get('level'):null);
  const curLvl=sidebarSelection||(/^(a1|a2|b1|b2|c1)$/.test(routeLevel)?routeLevel:null)||extra.sidebarLevel||'a1';
  const activeExam=examKey?`mock?exam=${examKey}`:path==='practice'&&routeLevel?`practice?level=${routeLevel}`:active;
  const thought=dailyThought(state.lang);
  return `<aside class="sidebar ${mobileOpen?'open':''}" aria-label="${esc(t('menu'))}">
  <a class="brand" href="#home"><img src="/public/icon.svg" alt="" width="38" height="38"><span>Everyday<span>German<span class="brand-dot">.</span></span></span></a><p class="brand-tag">${esc(t('tagline'))}</p>
  <a href="#home" class="nav-link ${active==='home'?'active':''}">${icon('home')}${state.lang==='de'?'Start':'Start'}</a>

  <div style="display:flex;justify-content:space-between;align-items:center;margin:18px 0 6px">
    <span class="nav-caption" style="margin:0">${esc(t('exams')).toUpperCase()}</span>
    <a href="#exams" class="small-muted" style="font-size:11px;font-weight:600">${esc(t('allLevels'))} →</a>
  </div>
  <div class="exam-level-pills" role="group" aria-label="${esc(t('allLevels'))}">
    ${['a1','a2','b1','b2','c1'].map(l=>`
      <button type="button" class="level-pill-btn ${curLvl===l?'active':''}" data-action="pick-exam-level" data-level="${l}" aria-pressed="${curLvl===l}">
        ${l.toUpperCase()}
      </button>
    `).join('')}
  </div>
  <div class="exam-board-subnav" style="margin-bottom:14px">
    ${renderExamBoardSubnav(curLvl, activeExam)}
  </div>

  <div class="nav-caption" style="margin:16px 0 8px">${esc(t('learnAndPractice')).toUpperCase()}</div>
  <a href="#learn" class="nav-link ${active==='learn'?'active':''}">
    ${icon('book')}
    <span style="flex:1">${esc(t('learnTitle'))}</span>
    <span class="little-pill" style="font-size:9px;padding:2px 6px">A1–C1</span>
  </a>
  <a href="#words" class="nav-link ${active==='words'?'active':''}">
    ${icon('cards')}
    <span>${esc(t('wordsTitle'))}</span>
  </a>
  <a href="#situations" class="nav-link ${active==='situations'?'active':''}">
    ${icon('spark')}
    <span>${esc(t('situationsTitle'))}</span>
  </a>

  <div class="nav-caption" style="margin:18px 0 8px">${state.lang==='de'?'RESSOURCEN & EINSTELLUNGEN':'RESOURCES & SETTINGS'}</div>
  <a href="#cv" class="nav-link ${active==='cv'?'active':''}">${icon('pen')}${state.lang==='de'?'Lebenslauf-Studio':'CV studio'}</a>
  <a href="#settings" class="nav-link ${active==='settings'?'active':''}">${icon('globe')}${state.lang==='de'?'Audioeinstellungen':'Audio settings'}</a>
  <a href="#about" class="nav-link ${active==='about'?'active':''}">${icon('info')}${esc(t('about'))}</a>

  <div class="sidebar-bottom" style="margin-top:auto;padding-top:16px">
    <div class="grow-note">${icon('spark')}<p><strong>${esc(thought.title)}</strong><br><span data-daily-thought>${esc(thought.text)}</span><br><small data-daily-source>${state.lang==='de'?'Inspiriert von':'Inspired by'} ${esc(thought.source)}</small></p></div>
    <div class="sidebar-foot">EVERYDAY GERMAN · 2026</div>
  </div></aside>`;
}
function shell(content){const {path,params}=route();const active=path.startsWith('exercise')?'practice':path.startsWith('lesson')?'course':path.split('/')[0];const examKey=path==='mock'?params.get('exam'):path==='mock/live'?state.mock?.exam:null;const crumbLevel=examKey?.match(/-(a1|a2|b1|b2|c1)(?:-p\d+)?$/)?.[1]||extra.cefrLevel||'a1';return `${sidebar(active)}${mobileOpen?'<button class="scrim" data-action="menu" aria-label="'+esc(t('close'))+'"></button>':''}<div class="workspace" ${mobileOpen?'inert':''}><header class="topbar"><div class="breadcrumb"><button class="icon-button mobile-menu" data-action="menu" aria-label="${esc(t('menu'))}" aria-expanded="${mobileOpen}">${icon('menu')}</button><span>${esc((['learn','journey','exams','games','cv','settings','level','cefr','pronunciation','drills'].includes(active)?featureTitle(active,state.lang):t(active==='home'?'dashboard':active)))}</span><span class="breadcrumb-divider">/</span><strong>${esc(crumbLevel.toUpperCase())}</strong></div><div class="topbar-right"><span class="local-label">${icon('check')}${esc(t('progressNote'))}</span><div class="language-switch" role="group" aria-label="${esc(t('language'))}">${icon('globe')}<button data-action="lang" data-lang="en" aria-pressed="${state.lang==='en'}" class="${state.lang==='en'?'selected':''}">EN</button><span>/</span><button data-action="lang" data-lang="de" aria-pressed="${state.lang==='de'}" class="${state.lang==='de'?'selected':''}">DE</button></div><details class="palette-menu"><summary class="theme-shortcut" aria-label="${state.lang==='de'?'Farbpalette öffnen':'Open colour palette'}">◐</summary><div class="palette-options" role="group" aria-label="${state.lang==='de'?'Farben':'Colours'}">${themes.map(theme=>`<button type="button" data-theme="${theme}" aria-pressed="${extra.theme===theme}" aria-label="${esc(state.lang==='de'?({sage:'Salbei',ocean:'Ozean',lavender:'Lavendel',sand:'Sand',rose:'Rose',dark:'Dunkel'}[theme]):theme)}" class="palette-choice ${extra.theme===theme?'selected':''}"><i style="background:${{sage:'#527b5c',ocean:'#306e99',lavender:'#7962a0',sand:'#aa7635',rose:'#a65873',dark:'#1c2533'}[theme]}"></i>${esc(state.lang==='de'?({sage:'Salbei',ocean:'Ozean',lavender:'Lavendel',sand:'Sand',rose:'Rose',dark:'Dunkel'}[theme]):theme)}</button>`).join('')}</div></details></div></header><main id="main">${content}</main></div>`;}
function skillCard(skill){const total=exercises.filter(q=>q.skill===skill).length;const count=exercises.filter(q=>q.skill===skill&&state.attempts[q.id]).length;return `<a class="skill-card ${skill}" href="#practice?skill=${skill}"><div class="skill-top"><span class="skill-icon">${icon(skillIcon[skill])}</span><span class="small-muted">${total} ${esc(t('tasks'))}</span></div><h3>${skill==='hoeren'?'Hören':skill[0].toUpperCase()+skill.slice(1)}</h3><span class="skill-translation">${esc(t(skill))}</span><p>${esc(t(skill+'Desc'))}</p><div class="skill-bottom"><span>${count}/${total} ${esc(t('completed'))}</span>${icon('arrow')}</div></a>`;}
function statCards(){const s=stats(state);return `<div class="stats-strip">${[[s.completed,t('tasks')+' '+t('completed'),'check'],[s.accuracy===null?'—':s.accuracy+'%',t('accuracy'),'chart'],[s.lessons+'/'+lessons.length,t('lessonsDone'),'book'],[s.words,t('wordsLearned'),'cards']].map(([n,name,ico])=>`<div class="stat">${icon(ico)}<div><strong>${n}</strong><span>${esc(name)}</span></div></div>`).join('')}</div>`;}
function plantArt(){return `<div class="hero-art" aria-hidden="true"><span class="art-orbit orbit-one"></span><span class="art-orbit orbit-two"></span><div class="art-sun"></div><div class="art-flower"><i></i><i></i><i></i><i></i><i></i><i></i><b></b></div><div class="art-stem"></div><div class="art-leaf leaf-one"></div><div class="art-leaf leaf-two"></div><div class="art-pot"></div><div class="art-ground"></div><div class="art-note">Hallo!<span>Guten Tag.</span></div><span class="art-star">✳</span></div>`;}
function dashboard(){const lesson=lessons.find(l=>!state.lessons.includes(l.id))||lessons[0],s=stats(state);const percent=Math.round(s.lessons/lessons.length*100);const word=vocabulary[new Date().getDate()%vocabulary.length];return `<section class="hero">${label('welcome')}<h1 tabindex="-1">${esc(t('heroA'))}<br><em>${esc(t('heroB'))}</em></h1><p>${esc(t('heroText'))}</p>${btn('#practice',t('start'))}${plantArt()}</section>${statCards()}
 <div class="dashboard-grid"><section class="card daily-card">${label('daily')}<div class="daily-layout"><div><h2>${esc(t('dailyTitle'))}</h2><p>${esc(t('dailyText'))}</p><a href="#lesson/${lesson.id}" class="text-link">${esc(state.lessons.length?t('continue'):t('startLesson'))}${icon('arrow')}</a></div><div class="daily-illustration" aria-hidden="true"><span>Guten<br><em>Tag!</em></span><i>☺</i></div></div><div class="card-foot"><span class="little-pill">${esc(t('lesson'))} ${lessons.indexOf(lesson)+1}</span><span>${icon('clock')}${lesson.minutes} ${esc(t('minutes'))}</span></div></section>
 <section class="card word-card">${label('dayWord')}<button class="icon-button word-audio" data-action="speak-word" data-id="${word.id}" aria-label="${esc(t('listen'))}">${icon('volume')}</button><div lang="de"><h2>${esc(word.word)}</h2><p>${esc(word.example)}</p></div>${wordMeaning?`<p class="word-meaning">${esc(state.lang==='en'?word.en:word.de)}</p>`:`<button class="subtle-button" data-action="word-meaning">${esc(t('reveal'))} ${icon('arrow')}</button>`}</section></div>
 <section class="section"><div class="section-heading"><div><h2>${esc(t('skillsTitle'))}</h2><p>${esc(t('skillsText'))}</p></div><span class="little-pill">${esc((extra.cefrLevel||'a1').toUpperCase())}</span></div><div class="skills-grid">${skills.map(skillCard).join('')}</div></section>
 <div class="dashboard-grid lower"><section class="card journey-card"><div class="section-heading"><div><h2>${esc(t('yourJourney'))}</h2><p>${esc(t('journeyText'))}</p></div><div class="progress-ring" style="--progress:${percent}%"><strong>${percent}%</strong></div></div><div class="mini-lessons">${lessons.slice(0,3).map((l,i)=>`<a href="#lesson/${l.id}"><span class="lesson-number ${state.lessons.includes(l.id)?'finished':''}">${state.lessons.includes(l.id)?icon('check'):String(i+1).padStart(2,'0')}</span><span><strong>${esc(l.title[state.lang])}</strong><small>${esc(l.subtitle[state.lang])}</small></span>${icon('chevron')}</a>`).join('')}</div><a href="#course" class="text-link">${esc(t('viewCourse'))}${icon('arrow')}</a></section><section class="exam-promo"><div class="exam-promo-icon">${icon('clock')}</div>${label('mockBadge')}<h2>${esc(t('examReady'))}</h2><p>${esc(t('examText'))}</p>${btn('#mock',t('exploreExam'),false)}</section></div>`;}
function filteredExercises(params){
  const level=(params.get('level')||'a1').toLowerCase();
  const levelList=getExercisesForLevel(level,exercises);
  const skill=params.get('skill')||'all';
  const part=params.get('part')||'all';
  const query=(params.get('q')||'').toLocaleLowerCase();
  return levelList.filter(q=>(skill==='all'||q.skill===skill)&&(part==='all'||q.part===Number(part))&&`${q.title} ${q.prompt} ${q.text||''}`.toLocaleLowerCase().includes(query));
}

function exerciseList(params){
  const qs=filteredExercises(params);
  return qs.length?qs.map(q=>`<a class="activity-row" href="#exercise/${q.id}"><span class="activity-icon ${q.skill}">${icon(skillIcon[q.skill])}</span><div class="activity-info"><div class="activity-meta">${esc(t(q.skill))}<span>·</span>${esc(t('part'))} ${q.part}</div><h3 lang="de">${esc(q.title)}${q.type==='input'?' · '+esc(q.prompt):''}</h3></div><span class="status ${savedStatus(q)}">${savedStatus(q)==='done'?icon('check'):''}${esc(t(savedStatus(q)))}</span>${icon('chevron')}</a>`).join(''):`<div class="empty-state">${icon('book')}<p>${esc(t('empty'))}</p></div>`;
}

function practice(params){
  const level=(params.get('level')||'a1').toLowerCase();
  const levelList=getExercisesForLevel(level,exercises);
  const selected=params.get('skill')||'all';
  const levelBadge=level.toUpperCase();
  return `${pageHeader('practiceHeading','practiceIntro')}
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;flex-wrap:wrap">
    <span class="little-pill" style="font-weight:700;font-size:12px;padding:6px 14px;background:var(--accent);color:var(--on-accent)">Allgemein ${levelBadge}</span>
    <span class="small-muted">${levelList.length} ${esc(t('tasks'))} · ${esc(state.lang==='de'?'Lesen, Hören, Schreiben, Sprechen':'Reading, Listening, Writing, Speaking')}</span>
  </div>
  <div class="skill-tabs" role="group" aria-label="${esc(t('practice'))}">${['all',...skills].map(s=>`<a href="#practice?level=${level}${s==='all'?'':'&skill='+s}" class="tab ${selected===s?'active':''}" ${selected===s?'aria-current="true"':''}>${s==='all'?'':icon(skillIcon[s])}${esc(t(s))}${s==='all'?` <span>${levelList.length}</span>`:''}</a>`).join('')}</div>
  <form class="filters" id="filters">
    <input type="hidden" name="level" value="${esc(level)}">
    <label class="search-field">${icon('book')}<span class="sr-only">${esc(t('search'))}</span><input id="search" name="q" placeholder="${esc(t('searchPlaceholder'))}" value="${esc(params.get('q')||'')}" autocomplete="off"></label>
    <label><span class="sr-only">${esc(t('part'))}</span><select id="part-filter" name="part"><option value="all">${esc(t('allParts'))}</option>${[1,2,3,4].map(p=>`<option value="${p}" ${params.get('part')===String(p)?'selected':''}>${esc(t('part'))} ${p}</option>`).join('')}</select></label>
  </form>
  <section class="card activity-list" id="exercise-list">${exerciseList(params)}</section>
  <p class="content-note">${icon('info')}${esc(t('draft'))}</p>`;
}

function audioBlock(q,exam=false){const limited=exam&&isCurrentTelc(state.mock),key=q.audioGroup||q.id;const exhausted=limited&&(state.mock.audioPlays?.[key]||0)>=q.plays;return `<div class="audio-block"><button class="audio-play" type="button" data-action="audio" data-id="${q.id}" ${exhausted?'disabled':''} aria-label="${esc(t('playAudio'))}">${icon('play')}</button><div><strong>${esc(q.title)}</strong><p>${esc(state.lang==='de'?'Audio wird mit der in den Audioeinstellungen gewählten Stimme abgespielt.':'Audio plays with the voice configured in Audio settings.')} <a href="#settings">${state.lang==='de'?'Stimme anpassen':'Adjust voice'}</a></p>${q.plays?`<span class="audio-note">${esc(q.plays===2?t('playsTwice'):t('playsOnce'))}</span>`:''}<span class="audio-error" role="status"></span></div><span class="audio-wave" aria-hidden="true">▂ ▅ ▃ ▇ ▄ ▂ ▆ ▃ ▅ ▂ ▄ ▇ ▂ ▅ ▃</span></div>${exam?'':`<button type="button" class="subtle-button" data-action="transcript" aria-expanded="false">${esc(t('transcript'))}</button><div class="stimulus transcript" lang="de" hidden>${esc(q.transcript)}</div>`}`;}

function taskFields(q,value,disabled=false){if(q.type==='choice')return `<fieldset class="answer-options" lang="de"><legend>${esc(q.prompt)}</legend>${q.options.map((option,i)=>`<label class="answer-option ${value===i?'chosen':''}"><input type="radio" name="${q.id}" value="${i}" ${value===i?'checked':''} ${disabled?'disabled':''} required><span class="answer-letter">${q.optionLabels?.[i]??(/^t[1-5]-|^a2telc-|^b1telc-|^b2telc-/.test(q.id)?(q.options[0]==='Richtig'&&q.options[1]==='Falsch'?(i===0?'+':'−'):String.fromCharCode(97+i)):String.fromCharCode(65+i))}</span><span>${esc(option)}</span>${value===i?icon('check'):''}</label>`).join('')}</fieldset>`;if(q.type==='input')return `<label class="field-label" lang="de">${esc(q.prompt)}<input name="${q.id}" value="${esc(value||'')}" maxlength="100" autocomplete="off" ${disabled?'disabled':''} required></label>`;return '';}

function reviewBlock(q){const checks=[t('selfCheck'),t(q.type==='speaking'?'speakingCheck2':'selfCheck2'),t(q.type==='speaking'?'speakingCheck3':'selfCheck3')];return `<section class="model-review"><h3>${esc(t('modelTitle'))}</h3><div class="stimulus model" lang="de">${esc(q.model)}</div><p>${esc(q.explanation[state.lang]||q.explanation.de||q.explanation.en)}</p><h3>${esc(t('checklist'))}</h3><div class="self-checks">${checks.map((text,i)=>`<label><input type="checkbox" name="self-${i}" required><span>${esc(text)}</span></label>`).join('')}</div></section>`;}

function exerciseView(id){
  const q=findExercise(id);
  if(!q)return notFound();
  const checkedValue=checked.get(id),isChecked=checked.has(id),attempt=state.attempts[id];
  const list=(q.level&&q.level!=='a1'?LEVEL_EXERCISES[q.level]||[]:exercises).filter(x=>x.skill===q.skill);
  const index=list.findIndex(x=>x.id===id);
  const val=isChecked?checkedValue:state.drafts[id];
  const result=isObjective(q)&&isChecked?grade(q,checkedValue):null;
  const backLevel = q.level || 'a1';
  return `<a class="back-link" href="#practice?level=${backLevel}&skill=${q.skill}">← ${esc(t('backPractice'))} (${backLevel.toUpperCase()})</a>
  <div class="task-heading">${label('practiceNotExam')}
    <h1 lang="de" tabindex="-1">${esc(q.title)}</h1>
    <div class="task-meta">
      <span class="little-pill">${backLevel.toUpperCase()}</span>
      <span>${esc(t(q.skill))} · ${esc(t('part'))} ${q.part}</span>
      <span>${index>=0?index+1:1} / ${Math.max(1,list.length)}</span>
    </div>
  </div>
  <section class="card task-card">
    <form id="exercise-form" data-id="${id}">
      ${q.text?`<div class="stimulus" lang="de">${esc(q.text)}</div>`:''}
      ${q.transcript?audioBlock(q):''}${renderTelcCards(q)}
      ${isObjective(q)?taskFields(q,val,isChecked):`
        <p class="task-instructions">${esc(t(q.type==='writing'?'writingHelp':'speakingHelp'))}</p>
        <div class="stimulus" lang="de">
          <strong>${esc(q.prompt)}</strong>
          ${q.points?`<ul>${q.points.map(p=>`<li>${esc(p)}</li>`).join('')}</ul>`:''}
        </div>
        ${q.type==='writing'?`<label class="field-label">${esc(t('yourText'))}<textarea lang="de" name="draft" maxlength="5000" rows="7" placeholder="Liebe …">${esc(state.drafts[id]||'')}</textarea></label><div class="draft-meta"><span id="word-count">${countWords(state.drafts[id]||'')} ${esc(t('words'))}</span><span>${esc(t('draftSaved'))}</span></div>`:''}
      `}
      ${isObjective(q)?isChecked?`<div class="feedback ${result?'success':'wrong'}" role="status">${icon(result?'check':'info')}<div><h3>${esc(t(result?'correct':'incorrect'))}</h3>${!result?`<p>${esc(t('answer'))}: <strong lang="de">${esc(q.type==='choice'?q.options[q.answer]:q.answer)}</strong></p>`:''}<p>${esc(q.explanation[state.lang]||q.explanation.de||q.explanation.en)}</p></div></div><div class="task-actions"><button class="button secondary" type="button" data-action="retry" data-id="${id}">${esc(t('retry'))}</button>${index>=0&&index<list.length-1?btn('#exercise/'+list[index+1].id,t('next')):btn('#practice?level='+backLevel+'&skill='+q.skill,t('backPractice'))}</div>`:`<div class="task-actions"><span class="small-muted">${esc(t('practiceNotExam'))}</span><button class="button primary" type="submit">${esc(t('check'))}${icon('check')}</button></div>`:
      selfReviews.has(id)?`${reviewBlock(q)}<div class="task-actions"><button class="button primary" type="submit">${esc(t('markReviewed'))}${icon('check')}</button></div>`:`<button class="button primary" type="button" data-action="model" data-id="${id}">${esc(t('model'))}${icon('arrow')}</button>`}
      ${q.type==='speaking'?`
        <div class="card speech-eval-box" style="margin-top:18px;border:1px solid var(--line);background:var(--surface);padding:16px;border-radius:12px">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
            <div>
              <strong style="font-size:15px">${esc(t('speechAssessTitle'))}</strong>
              <p class="small-muted" style="margin:3px 0">${esc(state.lang==='de'?'Sprechen Sie laut. Ihr Browser bewertet Aussprache und Wortwahl live.':'Speak aloud. Your browser evaluates pronunciation and keyword coverage live.')}</p>
            </div>
            <button type="button" class="button secondary" data-action="speech-assess" data-id="${id}" data-target="${esc(q.model||(q.points||[]).join(' '))}">
              🎙 ${esc(t('speechAssessBtn'))}
            </button>
          </div>
          <div id="speech-eval-${id}" class="speech-eval-result" style="margin-top:10px"></div>
        </div>
      `:''}
      ${attempt&& !isChecked?`<p class="small-muted">${esc(t('completedDate'))}: ${esc(date(attempt.at))}</p>`:''}
    </form>
  </section>`;
}
function course(){return `${pageHeader('courseHeading','courseIntro')}<div class="course-banner"><span class="course-letter">Aa<span>01</span></span><div>${label('levelName')}<h2>${esc(t('yourJourney'))}</h2><p>${stats(state).lessons} / ${lessons.length} ${esc(t('lessonsDone'))}</p></div><div class="course-doodles" aria-hidden="true">ä &nbsp; ö &nbsp; ü</div></div><div class="lesson-grid">${lessons.map((l,i)=>`<a class="card lesson-card" href="#lesson/${l.id}"><div class="lesson-card-top"><span class="lesson-number ${state.lessons.includes(l.id)?'finished':''}">${state.lessons.includes(l.id)?icon('check'):String(i+1).padStart(2,'0')}</span><span>${icon('clock')}${l.minutes} ${esc(t('minutes'))}</span></div><h2>${esc(l.title[state.lang])}</h2><p>${esc(l.subtitle[state.lang])}</p><div class="lesson-card-bottom">${esc(t(state.lessons.includes(l.id)?'review':'startLesson'))}${icon('arrow')}</div></a>`).join('')}</div>`;}
function lessonView(id){const l=lessons.find(x=>x.id===id);if(!l)return notFound();const c=lessonChecks.get(id);return `<a class="back-link" href="#course">← ${esc(t('viewCourse'))}</a><div class="task-heading">${label('lesson')}<h1 tabindex="-1">${esc(l.title[state.lang])}</h1><p>${esc(l.subtitle[state.lang])} · ${l.minutes} ${esc(t('minutes'))}</p></div><section class="card lesson-detail"><div class="rule-block">${label('rule')}<p>${esc(l.rule[state.lang])}</p></div><h2>${esc(t('examples'))}</h2><div class="examples">${l.examples.map(([de,en])=>`<div><strong lang="de">${esc(de)}</strong>${state.lang==='en'?`<p>${esc(en)}</p>`:''}</div>`).join('')}</div><h2>${esc(t('quickCheck'))}</h2><form id="lesson-form" data-id="${id}">${taskFields({...l.quiz,type:'choice',id:'quiz'},c?.value,c!==undefined)}${c?`<div class="feedback ${c.correct?'success':'wrong'}"><div><h3>${esc(t(c.correct?'correct':'incorrect'))}</h3><p>${esc(l.explanation[state.lang])}</p></div></div>${c.correct?`<button class="button primary" type="button" data-action="lesson-done" data-id="${id}">${esc(t('completeLesson'))}${icon('check')}</button>`:`<button class="button secondary" type="button" data-action="lesson-retry" data-id="${id}">${esc(t('retry'))}</button>`}`:`<button class="button primary" type="submit">${esc(t('check'))}${icon('check')}</button>`}</form></section>`;}

function vocab(params){
  const mode=params.get('mode')||'all';
  const srsStats=srsSummary(vocabulary,extra.srs);
  const words=mode==='due'?vocabulary.filter(v=>isDue(extra.srs[v.id])):mode==='review'?vocabulary.filter(v=>state.words[v.id]!=='known'):vocabulary;
  const index=Math.min(Math.max(0,Number(params.get('i'))||0),Math.max(0,words.length-1)),v=words[index];
  const cardSrs=v?(extra.srs[v.id]||initCard(v.id)):null;
  const intervals=cardSrs?previewIntervals(cardSrs):{again:'1d',hard:'1d',good:'3d',easy:'6d'};

  return `${pageHeader('vocabHeading','vocabIntro')}
  <div class="section-heading">
    <div class="skill-tabs">
      <a href="#vocabulary" class="tab ${mode==='all'?'active':''}">${esc(t('allWords'))} <span>${vocabulary.length}</span></a>
      <a href="#vocabulary?mode=due" class="tab ${mode==='due'?'active':''}">${esc(t('srsDueToday'))} <span>${srsStats.due}</span></a>
      <a href="#vocabulary?mode=review" class="tab ${mode==='review'?'active':''}">${esc(t('reviewWords'))} <span>${vocabulary.filter(v=>state.words[v.id]!=='known').length}</span></a>
    </div>
    <span class="small-muted">${stats(state).words} ${esc(t('known'))} · ${srsStats.mastered} ${esc(t('srsMastered'))}</span>
  </div>
  ${!v?`<section class="card empty-state">${icon('check')}<h2>${esc(t('noReview'))}</h2>${btn('#vocabulary',t('allWords'))}</section>`:`
    <section class="flashcard-wrap">
      <div class="flashcard-counter">${index+1} / ${words.length} ${cardSrs?.reps?`· Reps: ${cardSrs.reps}`:''}</div>
      <div class="card flashcard">
        <div class="flashcard-top">
          ${label('topic')}
          <button class="icon-button" data-action="speak-word" data-id="${v.id}" aria-label="${esc(t('listen'))}">${icon('volume')}</button>
        </div>
        <div class="flashcard-word" lang="de">
          <h2>${esc(v.word)}</h2>
          <p>${esc(t('plural'))}: <span lang="de">${esc(v.plural)}</span></p>
        </div>
        <p class="flashcard-example" lang="de">${esc(v.example)}</p>
        ${wordRevealed?`<div class="flashcard-meaning"><h3>${esc(state.lang==='en'?v.en:v.de)}</h3></div>`:`<button class="button secondary" data-action="flip">${esc(t('flip'))}${icon('arrow')}</button>`}
      </div>
      ${wordRevealed?`
        <div class="srs-actions" style="display:flex;gap:8px;flex-wrap:wrap;margin:16px 0">
          <button class="button secondary" data-action="srs-rate" data-id="${v.id}" data-rating="1" data-index="${index}" data-mode="${mode}" style="flex:1;min-width:75px">
            <strong>${esc(t('again'))}</strong><small class="small-muted" style="display:block;font-size:10px">&lt; 1d</small>
          </button>
          <button class="button secondary" data-action="srs-rate" data-id="${v.id}" data-rating="2" data-index="${index}" data-mode="${mode}" style="flex:1;min-width:75px">
            <strong>${esc(t('srsHard'))}</strong><small class="small-muted" style="display:block;font-size:10px">${intervals.hard}</small>
          </button>
          <button class="button primary" data-action="srs-rate" data-id="${v.id}" data-rating="3" data-index="${index}" data-mode="${mode}" style="flex:1;min-width:75px">
            <strong>${esc(t('srsGood'))}</strong><small class="small-muted" style="display:block;font-size:10px">${intervals.good}</small>
          </button>
          <button class="button primary" data-action="srs-rate" data-id="${v.id}" data-rating="4" data-index="${index}" data-mode="${mode}" style="flex:1;min-width:75px">
            <strong>${esc(t('srsEasy'))}</strong><small class="small-muted" style="display:block;font-size:10px">${intervals.easy}</small>
          </button>
        </div>
      `:''}
      <div class="flashcard-nav">
        <a class="button secondary" href="#vocabulary?mode=${mode}&i=${Math.max(0,index-1)}">← ${esc(t('previous'))}</a>
        <a class="button secondary" href="#vocabulary?mode=${mode}&i=${Math.min(words.length-1,index+1)}">${esc(t('next'))} →</a>
      </div>
    </section>
  `}`;
}

function progress(){const mistakes=exercises.filter(q=>state.attempts[q.id]?.correct===false);return `${pageHeader('progressHeading','progressIntro')}${statCards()}<div class="dashboard-grid progress-grid"><section class="card"><h2>${esc(t('bySkill'))}</h2><div class="progress-bars">${skills.map(s=>{const all=exercises.filter(q=>q.skill===s),done=all.filter(q=>state.attempts[q.id]);return `<div><div><strong>${esc(t(s))}</strong><span>${done.length}/${all.length}</span></div><progress value="${done.length}" max="${all.length}" aria-label="${esc(t(s))}"></progress></div>`;}).join('')}</div><p class="small-muted">${esc(t('progressNote'))}</p></section><section class="card"><h2>${esc(t('recent'))}</h2>${state.history.length?`<div class="recent-list">${[...state.history].reverse().slice(0,5).map(h=>{const q=exercises.find(q=>q.id===h.id);return `<a href="#exercise/${q.id}"><span class="activity-icon ${q.skill}">${icon(skillIcon[q.skill])}</span><span lang="de">${esc(q.title)}</span><small>${date(h.at)}</small></a>`;}).join('')}</div>`:`<p>${esc(t('noHistory'))}</p>${btn('#practice',t('start'),false)}`}</section></div><section class="section"><div class="section-heading"><div><h2>${esc(t('mistakes'))}</h2><p>${esc(t('mistakesIntro'))}</p></div><span class="little-pill">${mistakes.length}</span></div><div class="card activity-list">${mistakes.length?mistakes.map(q=>`<a class="activity-row" href="#exercise/${q.id}"><span class="activity-icon ${q.skill}">${icon(skillIcon[q.skill])}</span><div class="activity-info"><h3 lang="de">${esc(q.title)}</h3><span>${esc(t(q.skill))}</span></div>${icon('arrow')}</a>`).join(''):`<div class="empty-state compact">${icon('check')}<p>${esc(t('noMistakes'))}</p></div>`}</div></section><section class="section"><h2>${esc(t('examHistory'))}</h2><div class="card">${state.exams.length?[...state.exams].reverse().map(e=>`<a class="exam-history-row" href="#mock/result/${e.id}"><span>${esc(t('mockBadge'))}</span><span>${date(e.finished)}</span>${icon('arrow')}</a>`).join(''):`<p>${esc(t('noExamHistory'))}</p>`}</div></section><div class="task-actions"><button class="button secondary" data-action="export">${icon('download')}${esc(t('export'))}</button><button class="button subtle" data-action="reset">${esc(t('reset'))}</button></div>`;}
function telcPaperRows(){
  return TELC_PAPERS.map(p=>{
    const results=state.exams.filter(e=>e.exam===p.key);
    const last=results[results.length-1];
    let lastScore='';
    if(last){
      let correct=0,total=0;
      for(const group of p.sections)for(const qid of group.ids){const q=findExercise(qid);if(q&&isObjective(q)){total++;if(grade(q,last.answers[qid]))correct++;}}
      lastScore=`<span class="small-muted">${esc(t('lastResult'))}: ${correct}/${total} ${esc(t('total'))}</span>`;
      if(isCurrentTelc(last)){const score=telcScores(last,p.sections,findExercise,grade);if(score.complete)lastScore=`<span class="small-muted">${esc(t('lastResult'))}: ${score.total}/60 · ${state.lang==='de'?'manuelle Übungsbewertung':'manual practice assessment'}</span>`;}
    }
    return `<div class="activity-row">
      <span class="activity-icon schreiben">${icon('book')}</span>
      <div class="activity-info"><div class="activity-meta">${esc(p.label)}<span>·</span>${p.timeMinutes} ${esc(t('minutes'))}<span>·</span>39 ${esc(t('tasks'))}</div><h3 lang="de">${esc(p.name)}</h3>${lastScore}</div>
      <button class="button secondary" data-action="start-mock" data-exam="${esc(p.key)}">${esc(t('startExam'))}</button>
    </div>`;
  }).join('');
}

function officialPractice(format){
  const de=state.lang==='de';
  return `<section class="card exam-format-guide">
    <h2>${de?'Prüfungsformat':'Exam format'}</h2>
    <div class="task-actions">
      ${format.online?`<a class="button primary" href="${esc(format.online)}" target="_blank" rel="noopener">${de?'Offiziellen Modellsatz online üben':'Practise the official model exam online'} ↗</a>`:''}
      <a class="button ${format.online?'secondary':'primary'}" href="${esc(format.download||format.source)}" target="_blank" rel="noopener">${de?'Offizielles Aufgabenheft, Audio und Lösungen':'Official booklet, audio and answer key'} ${format.download?'↓':'↗'}</a>
      ${format.download?`<a href="${esc(format.source)}" target="_blank" rel="noopener">${de?'Prüfungsanbieter':'Exam provider'} ↗</a>`:''}
    </div>
    <ul class="exam-details">${format.rows.map(([section, minutes, parts])=>`<li>
      ${icon(skillIcon[section==='Hören'?'hoeren':section.toLowerCase()]||'book')}
      <div><strong lang="de">${esc(section)}</strong> · ${esc(minutes)} ${esc(t('minutes'))}
      <ol lang="de">${parts.map(part=>`<li>${esc(part)}</li>`).join('')}</ol></div>
    </li>`).join('')}</ul>
    ${format.rows.some(([, minutes])=>minutes.endsWith('*'))?`<p class="small-muted">${de?'* Gemeinsame Prüfungszeit für die markierten Bereiche.':'* The marked sections share one time limit.'}</p>`:''}
    ${format.rows.some(([, minutes])=>minutes.includes('+'))?`<p class="small-muted">${de?'Beim Sprechen steht die Vorbereitungszeit nach dem Pluszeichen.':'For speaking, the time after the plus sign is preparation.'}</p>`:''}
    ${format.breakMinutes?`<p>${de?'Nach Lesen und Sprachbausteinen folgt eine Pause von 20 Minuten.':'A 20-minute break follows Reading and Language Elements.'}</p>`:''}
  </section>`;
}

function mockLanding(){
  const {params}=route();
  const examKey=params.get('exam')||'telc-a1';
  const suite=MOCK_EXAM_SUITES[examKey]||MOCK_EXAM_SUITES['telc-a1'];
  const format=examFormats[examKey]||(isTelcA1(examKey)?examFormats['telc-a1']:null);
  if(format&&!format.native){
    const de=state.lang==='de';
    return `<div class="page-heading"><h1 tabindex="-1">${esc(format.name)}</h1><p>${de?'Der vollständige Modellsatz steht beim Prüfungsanbieter mit Hörtexten und Lösungen bereit.':'The exam provider hosts the full model exam with recordings and solutions.'}</p></div>${officialPractice(format)}
      <div class="task-actions">${btn('#practice?level='+suite.level,de?'Allgemeines Sprachtraining':'General language practice',false)}${state.mock?btn('#mock/live',t('mockResume'),false):''}</div>`;
  }
  const intro=isTelcA2(examKey)?`<div class="page-heading"><span class="eyebrow">TELC A2 · START DEUTSCH 2</span><h1 tabindex="-1">${state.lang==='de'?'Eigene A2-Übungen':'Original A2 practice'}</h1><p>${state.lang==='de'?'Eine vollständige Übungsprüfung im aktuellen Format von Start Deutsch 2. Aufgaben und Lösungen bleiben auf Deutsch.':'A complete practice paper in the current Start Deutsch 2 format. Questions and answers stay in German.'}</p></div>`:isTelcB1(examKey)?`<div class="page-heading"><span class="eyebrow">TELC B1 · ZERTIFIKAT DEUTSCH</span><h1 tabindex="-1">${state.lang==='de'?'Eigene B1-Übungsprüfung':'Original B1 practice'}</h1><p>${state.lang==='de'?'Üben Sie alle fünf Prüfungsteile im telc-B1-Format. Aufgaben und Lösungen sind auf Deutsch.':'Practice all five exam sections in the telc B1 format. Questions and answers stay in German.'}</p></div>`:isTelcB2(examKey)?`<div class="page-heading"><span class="eyebrow">TELC B2 · ZERTIFIKAT DEUTSCH</span><h1 tabindex="-1">${state.lang==='de'?'Eigene B2-Übungsprüfung':'Original B2 practice'}</h1><p>${state.lang==='de'?'Üben Sie alle fünf Prüfungsteile im telc-B2-Format. Aufgaben und Lösungen sind auf Deutsch.':'Practice all five exam sections in the telc B2 format. Questions and answers stay in German.'}</p></div>`:pageHeader('mockHeading','mockIntro');
  return `${intro}${isTelcA1(examKey)||isTelcA2(examKey)||isTelcB1(examKey)||isTelcB2(examKey)?telcInfo(state.lang,examKey):''}
  <section class="mock-intro card">
    <div class="mock-cover">
      ${icon('book')}
      <span>Everyday<br>German.</span>
      <strong>${esc((suite.badge||'A1').split(' ')[1]||suite.badge||'A1')}</strong>
      <small>${esc(suite.badge||'ÜBUNGSPRÜFUNG')}</small>
      <div aria-hidden="true">✳</div>
    </div>
    <div class="mock-description">
      <div style="margin-bottom:12px">
        <span class="provider-badge" style="background:#3b82f622;color:#2563eb;font-size:12px;padding:4px 8px">${esc(suite.name)}</span>
      </div>
      <h2>${esc(suite.name)} · ${esc(t('examReady'))}</h2>
      <p>${suite.timeMinutes} ${esc(t('minutes'))} · ${suite.sections.length} ${esc(t('examSections'))}</p>
      <h3>${esc(t('mockDetails'))}</h3>
      <ul class="exam-details">
        ${suite.sections.map(s=>`<li>${icon(skillIcon[s.id]||'book')}<div><strong>${esc(s.title)} (${esc(s.time)})</strong><span>${esc(s.desc)}</span></div></li>`).join('')}
      </ul>
      <div class="notice">
        ${icon('info')}
        <p>${isTelcA1(examKey)||isTelcA2(examKey)||isTelcB1(examKey)||isTelcB2(examKey)?esc(state.lang==='de'?'Eigene Aufgaben nach dem telc-Format. Hörtexte sind synthetisch. Schreiben und Sprechen werden manuell bewertet.':'Original tasks following the telc format. Listening uses synthetic speech. Writing and speaking need manual practice assessment.'):esc(t('mockCaution'))}</p>
      </div>
      ${state.mock?`
        ${btn('#mock/live',state.mock.exam===examKey?t('mockResume'):(state.lang==='de'?'Laufende Prüfung fortsetzen':'Resume current '+state.mock.exam.replace(/-/g,' ').toUpperCase()+' attempt'))}
        <button class="text-button" data-action="new-mock" data-exam="${esc(examKey)}">${esc(t('mockNew'))}</button>
      `:`
        <button class="button primary" data-action="start-mock" data-exam="${esc(examKey)}">${esc(t('mockStart'))}${icon('arrow')}</button>
      `}
    </div>
  </section>
  ${examKey==='telc-a1'?`<section class="section"><div class="section-heading"><div><h2>${esc(t('telcPapersTitle'))}</h2><p>${esc(t('telcPapersText'))}</p></div><span class="little-pill">${TELC_PAPERS.length}</span></div><div class="card activity-list">${telcPaperRows()}</div></section>`:''}
  ${format?officialPractice(format):''}`;
}

function mockLive(){
  if(!state.mock)return mockLanding();
  const examKey=state.mock.exam||'telc-a1';
  const suite=MOCK_EXAM_SUITES[examKey]||MOCK_EXAM_SUITES['telc-a1'];
  const sections=getMockSections(examKey,mockIds,state.mock?.formatVersion||1);
  if(isCurrentTelc(state.mock))return telcLive(state.mock,{lang:state.lang,suite,sections,find:findExercise,taskFields,audioBlock,formatTime});
  const sectionIdx=Math.min(sections.length-1,Math.max(0,state.mock.section||0));
  const section=sections[sectionIdx];
  return `<div class="mock-toolbar">
    <div>
      <div style="font-size:11px;font-weight:700;color:var(--accent);letter-spacing:1px;margin-bottom:4px">${esc(suite.name)}</div>
      ${label('mockLive')}
      <h1 tabindex="-1">${esc(t(section.skill))}</h1>
    </div>
    <div class="timer"><span>${esc(t('remaining'))}</span><strong id="timer" aria-live="off">${formatTime(remainingSeconds(state.mock))}</strong></div>
    <a href="#mock?exam=${esc(examKey)}" class="button secondary">${esc(t('saveExit'))}</a>
  </div>
  <nav class="exam-section-tabs" aria-label="${esc(t('section'))}">
    ${sections.map((s,i)=>`<button class="tab ${i===sectionIdx?'active':''}" data-action="mock-section" data-section="${i}" ${i===sectionIdx?'aria-current="step"':''}>${i+1}. ${esc(t(s.skill))}</button>`).join('')}
  </nav>
  <p class="section-help">${esc(t('sectionHelp'))}</p>
  <form id="mock-form">
    <div class="mock-questions">
      ${section.ids.map((id,index)=>{
        const q=findExercise(id);
        if(!q)return '';
        const val=state.mock.answers[id];
        return `<section class="card mock-question">
          <div class="task-meta"><span>${esc(t('question'))} ${index+1}</span><span>${esc(t('part'))} ${q.part}</span></div>
          <h2 lang="de">${esc(q.title)}</h2>
          ${q.text?`<div class="stimulus" lang="de">${esc(q.text)}</div>`:''}
          ${q.transcript?audioBlock(q,true):''}
          ${isObjective(q)?taskFields(q,val):`
            <p>${esc(t(q.type==='writing'?'mockWritingHelp':'mockSpeakingHelp'))}</p>
            <div class="stimulus" lang="de">
              <strong>${esc(q.prompt)}</strong>
              ${q.points?`<ul>${q.points.map(p=>`<li>${esc(p)}</li>`).join('')}</ul>`:''}
            </div>
            ${q.type==='writing'?`<label class="field-label">${esc(t('yourText'))}<textarea name="${q.id}" lang="de" maxlength="5000" rows="7">${esc(val||'')}</textarea></label>`:''}
          `}
        </section>`;
      }).join('')}
    </div>
    <div class="task-actions mock-actions">
      <button class="button secondary" type="button" data-action="submit-mock">${esc(t('submit'))}</button>
      ${sectionIdx<sections.length-1?`<button class="button primary" type="button" data-action="mock-section" data-section="${sectionIdx+1}">${esc(t('nextSection'))}${icon('arrow')}</button>`:''}
    </div>
  </form>`;
}

function mockResults(id){
  const result=state.exams.find(e=>e.id===id);
  if(!result)return notFound();
  const examKey=result.exam||'telc-a1';
  const suite=MOCK_EXAM_SUITES[examKey]||MOCK_EXAM_SUITES['telc-a1'];
  const sections=getMockSections(examKey,mockIds,result.formatVersion||1);
  const scores={};
  for(const group of sections){
    const qs=group.ids.map(qid=>findExercise(qid)).filter(Boolean).filter(isObjective);
    if(qs.length) scores[group.skill]={correct:qs.filter(q=>grade(q,result.answers[q.id])).length,total:qs.length};
  }
  const keys=Object.keys(scores);
  const totalCorrect=keys.reduce((sum,k)=>sum+scores[k].correct,0),totalMax=keys.reduce((sum,k)=>sum+scores[k].total,0);
  const allIds=sections.flatMap(s=>s.ids);
  return `${pageHeader('mockComplete','mockResultIntro')}${isCurrentTelc(result)?telcAssessment(result,{lang:state.lang,sections,find:findExercise,grade}):''}
  <section class="card result-summary">
    <div class="result-flower" aria-hidden="true">✳</div>
    <div>
      <span class="provider-badge" style="font-size:12px;padding:4px 8px;margin-bottom:8px;display:inline-block">${esc(suite.name)}</span>
      <h2>${esc(t('objective'))}</h2>
      <div class="result-scores">
        ${keys.map(k=>`<div><span>${esc(t(k==='schreiben'?'form':k))}</span><strong>${scores[k].correct}<small>/${scores[k].total}</small></strong></div>`).join('')}
      </div>
      <p><strong>${totalCorrect}/${totalMax}</strong> ${esc(t('total'))}</p>
      <p>${esc(t('notScored'))}</p>
      <p class="small-muted">${esc(t('noPass'))}</p>
    </div>
  </section>
  <section class="section">
    <h2>${esc(t('reviewAnswers'))}</h2>
    <div class="review-answer-list">
      ${allIds.map(qid=>{
        const q=findExercise(qid);
        if(!q)return '';
        const v=result.answers[qid],correct=grade(q,v);
        return `<details class="card answer-review">
          <summary>
            <span class="review-indicator ${correct===null?'neutral':correct?'right':'wrong'}">${icon(correct===null?'pen':correct?'check':'close')}</span>
            <span lang="de">${esc(q.title)}${q.type==='input'?` · ${esc(q.prompt)}`:''}</span>
            <span class="summary-skill">${esc(t(q.skill))}</span>
            ${icon('chevron')}
          </summary>
          <div class="review-body">
            ${q.text?`<div class="stimulus" lang="de">${esc(q.text)}</div>`:''}
            ${q.transcript?`<div class="stimulus" lang="de">${esc(q.transcript)}</div>`:''}
            <p lang="de"><strong>${esc(q.prompt)}</strong></p>${q.points?`<ul lang="de">${q.points.map(p=>`<li>${esc(p)}</li>`).join('')}</ul>`:''}${renderTelcCards(q)}
            ${isObjective(q)?`
              <p>${esc(t('yourAnswer'))}: <span lang="de">${esc(v===undefined?t('unanswered'):q.type==='choice'?q.options[v]:v)}</span></p>
              <p>${esc(t('answer'))}: <strong lang="de">${esc(q.type==='choice'?q.options[q.answer]:q.answer)}</strong></p>
            `:`
              ${q.type==='writing'?`<h3>${esc(t('yourText'))}</h3><div class="stimulus" lang="de">${esc(v||t('unanswered'))}</div>`:''}
              <h3>${esc(t('modelTitle'))}</h3>
              <div class="stimulus" lang="de">${esc(q.model)}</div>
              <p>${esc(t('notScored'))}</p>
            `}
            <p>${esc(q.explanation[state.lang]||q.explanation.de||q.explanation.en)}</p>
            <a href="#exercise/${q.id}" class="text-link">${esc(t('practiceThis'))}${icon('arrow')}</a>
          </div>
        </details>`;
      }).join('')}
    </div>
  </section>
  <div class="task-actions">
    ${btn('#mock?exam='+examKey,t('tryAnother'),false)}
    ${btn('#practice?level='+(suite.level||'a1'),t('returnPractice'),true)}
  </div>`;
}

function about(){return `${pageHeader('aboutHeading','aboutText')}<div class="about-grid">${[['privacyTitle','privacyText','globe'],['contentTitle','contentText','book'],['roadmapTitle','roadmapText','leaf']].map(([title,text,ico])=>`<section class="card"><span class="skill-icon">${icon(ico)}</span><h2>${esc(t(title))}</h2><p>${esc(t(text))}</p></section>`).join('')}</div><div class="official-link"><a href="https://www.telc.net/en/language-examinations/certificate-exams/german/start-german1-telc-german-a1/" target="_blank" rel="noopener noreferrer">${esc(t('official'))} ↗</a><a href="https://www.telc.net/en/language-examinations/certificate-exams/german/start-german-2-telc-german-a2/" target="_blank" rel="noopener noreferrer">Official telc A2 exam information ↗</a></div>`;}
function notFound(){return `<section class="card empty-state"><h1 tabindex="-1">${esc(t('notAvailable'))}</h1>${btn('#practice',t('return'))}</section>`;}
function render(focus=false){stopAudio();const {path,params}=route();let content;if(path==='home')content=dashboard();else if(path==='practice')content=practice(params);else if(path.startsWith('exercise/'))content=exerciseView(path.split('/')[1]);else if(path==='course')content=course();else if(path.startsWith('lesson/'))content=lessonView(path.split('/')[1]);else if(path==='vocabulary')content=vocab(params);else if(path==='progress')content=progress();else if(path==='mock')content=mockLanding();else if(path==='mock/live')content=mockLive();else if(path.startsWith('mock/result/'))content=mockResults(path.split('/')[2]);else if(path==='about')content=about();else content=extraView(path,params,{state,extra})??notFound();document.documentElement.dataset.theme=extra.theme;document.documentElement.lang=state.lang;document.title=`Everyday German · ${['learn','journey','exams','games','cv','settings','level','cefr','pronunciation','drills'].includes(path)?featureTitle(path,state.lang):t(path.startsWith('lesson')?'course':path.startsWith('exercise')?'practice':path==='home'?'dashboard':path.split('/')[0])}`;app.innerHTML=shell(content);warmPageAudio();if(path==='settings')fetch('/api/audio-status').then(r=>r.json()).then(data=>{const el=document.querySelector('#audio-status');if(el)el.textContent=state.lang==='de'?`${data.available.length} gespeicherte Aufnahmen verfügbar.`:`${data.available.length} saved studio neural recordings available.`;}).catch(()=>{});if(focus){document.querySelector('h1')?.focus({preventScroll:true});window.scrollTo(0,0);}}
function countWords(text){return text.trim()?text.trim().split(/\s+/u).length:0;}
function formatTime(seconds){return `${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`;}

function ttsRateFor(){
  const activePersona=extra.activePersona||'katja';
  const personaDef=FREE_NATIVE_VOICES.find(p=>p.id===activePersona)||FREE_NATIVE_VOICES[0];
  const userRate=Math.max(0.7,Math.min(1.4,Number(extra.rate||personaDef.rate||0.94)));
  return Math.round((userRate-1)*100);
}
function ttsPitchFor(){
  const activePersona=extra.activePersona||'katja';
  const personaDef=FREE_NATIVE_VOICES.find(p=>p.id===activePersona)||FREE_NATIVE_VOICES[0];
  const userPitch=Math.max(0.7,Math.min(1.4,Number(extra.pitch||personaDef.pitch||1.04)));
  return Math.round((userPitch-1)*100);
}

// Background warm-up: pre-generate the neural voice for on-screen listening tasks
// so the first Play click starts instantly (adc: fix audio start delay).
const ttsWarmQueue=[];const ttsWarmSeen=new Set();let ttsWarming=false;
function warmTTS(text){
  const clean=(text||'').trim();
  if(!clean||ttsWarmSeen.has(clean))return;
  ttsWarmSeen.add(clean);
  if(ttsWarmQueue.length>=10)return;
  ttsWarmQueue.push(clean);
  if(!ttsWarming)runWarm();
}
function runWarm(){
  const text=ttsWarmQueue.shift();
  if(!text){ttsWarming=false;return;}
  ttsWarming=true;
  const params=new URLSearchParams({voice:extra.activePersona||'katja',text});
  const rate=ttsRateFor();
  if(rate)params.set('rate',String(rate));
  const pitch=ttsPitchFor();
  if(pitch)params.set('pitch',String(pitch));
  fetch('/api/tts?'+params.toString()).catch(()=>{}).finally(()=>{setTimeout(runWarm,400);});
}
async function warmPageAudio(){
  const buttons=[...document.querySelectorAll('button[data-action="audio"]')].slice(0,8);
  if(!buttons.length)return;
  // Skip warming only when the selected browser voice is actually available on this device
  if(extra.voice){
    const synth=('speechSynthesis'in window)?window.speechSynthesis:null;
    const voices=synth?(synth.getVoices()||[]):[];
    const deVoices=voices.filter(v=>v.lang&&(v.lang.startsWith('de')||v.lang.startsWith('de-')));
    if(findConfiguredVoice(deVoices))return;
  }
  const seen=new Set();
  for(const b of buttons){
    const q=findExercise(b.dataset.id);
    if(!q||!q.transcript||seen.has(q.id))continue;
    seen.add(q.id);
    warmTTS(q.transcript);
  }
}

function speakSynthesis(text,synth,voice,personaDef,button,version){
 return new Promise(resolve=>{
  const utterance=new SpeechSynthesisUtterance(text);utterance.lang='de-DE';if(voice)utterance.voice=voice;
  utterance.rate=Math.max(0.7,Math.min(1.4,Number(extra.rate||personaDef.rate||0.94)));utterance.pitch=Math.max(0.7,Math.min(1.4,Number(extra.pitch||personaDef.pitch||1.04)));
  window._activeUtterance=utterance;let settled=false;
  const finish=ok=>{if(settled)return;settled=true;synthesisFinish=null;window._activeUtterance=null;resolve(ok);};synthesisFinish=()=>finish('cancelled');
  utterance.onend=()=>{finish(true);if(version===audioVersion)stopAudio();};utterance.onerror=()=>{finish(false);if(version===audioVersion){stopAudio();audioError(button);}};
  try{synth.cancel();synth.resume();synth.speak(utterance);}catch{finish(false);stopAudio();audioError(button);}
 });
}

function browserVoiceFor(deVoices,personaDef){
  const isMale=personaDef.gender==='male';
  return deVoices.find(v=>isMale?/male|reed|rocko|flo|eddy|yannick|conrad|killian|florian/i.test(v.name):/female|anna|sandy|shelley|helena|katja|amala/i.test(v.name))||deVoices[0]||null;
}

// The exact browser voice selected on the Audio settings page (never a heuristic guess)
function findConfiguredVoice(deVoices){
  if(!extra.voice)return null;
  const needle=extra.voice.toLowerCase();
  return deVoices.find(v=>v.name===extra.voice)||deVoices.find(v=>v.name.toLowerCase().includes(needle))||null;
}

// German voices load asynchronously in some browsers — retry instead of giving up,
// otherwise exam questions could fall through to the wrong voice (adc: settings voice fix)
async function loadGermanVoices(synth,aborted){
  if(!synth)return [];
  try{synth.resume();}catch{}
  let voices=synth.getVoices()||[];
  for(const delay of [500,700]){
    if(voices.some(v=>v.lang&&(v.lang.startsWith('de')||v.lang.startsWith('de-'))))break;
    if(aborted())break;
    await new Promise(resolve=>{let done=false;const end=()=>{if(done)return;done=true;synth.removeEventListener('voiceschanged',end);resolve();};synth.addEventListener('voiceschanged',end);setTimeout(end,delay);});
    voices=synth.getVoices()||[];
  }
  return voices.filter(v=>v.lang&&(v.lang.startsWith('de')||v.lang.startsWith('de-')));
}

async function speak(text,button,recordingId){
 const sameButton=audioRunning&&audioButton===button;stopAudio();if(sameButton)return 'cancelled';const version=audioVersion;
 audioRunning=true;audioButton=button;audioMarkup=button?button.innerHTML:'';audioLabel=button?(button.getAttribute('aria-label')||t('listen')):'';if(button){button.innerHTML=icon('close');button.setAttribute('aria-label',t('stopAudio'));}
 const personaDef=FREE_NATIVE_VOICES.find(p=>p.id===(extra.activePersona||'katja'))||FREE_NATIVE_VOICES[0];
 const synth=('speechSynthesis'in window)?window.speechSynthesis:null;const deVoices=await loadGermanVoices(synth,()=>version!==audioVersion||(button&&!button.isConnected));
 if(version!==audioVersion||(button&&!button.isConnected))return 'cancelled';
 const chosen=findConfiguredVoice(deVoices);if(chosen)return await speakSynthesis(text,synth,chosen,personaDef,button,version);
 for(const instant of [true,false]){
  let ended=false;try{const played=await playTTS(text,extra.activePersona||'katja',button,()=>{ended=true;if(version===audioVersion)stopAudio();},{rate:ttsRateFor(),pitch:ttsPitchFor(),instant});if(ended)return true;if(version!==audioVersion)return 'cancelled';if(played)return true;}catch{}
 }
 if(deVoices.length)return await speakSynthesis(text,synth,browserVoiceFor(deVoices,personaDef),personaDef,button,version);
 if(recordingId){let ended=false;try{const played=await playRecording(recordingId,button,()=>{ended=true;if(version===audioVersion)stopAudio();});if(ended)return true;if(version!==audioVersion)return 'cancelled';if(played)return true;}catch{}}
 stopAudio();audioError(button);return false;
}
async function playTelcQuestion(q,button){
 const m=state.mock;if(!isCurrentTelc(m)||m.phase!=='listening')return;
 const key=q.audioGroup||q.id;
 if(telcPlayingId===key){telcPlayingId=null;stopAudio();return;}
 telcPlayingId=key;const examId=m.id;
 const update=()=>{const used=m.audioPlays[key]||0;const text=document.querySelector(`[data-play-count="${key}"]`);if(text)text.textContent=(state.lang==='de'?'Wiedergaben verwendet: ':'Playbacks used: ')+used+'/'+q.plays;button.disabled=used>=q.plays;};
 while(state.mock?.id===examId&&m.phase==='listening'&&button.isConnected&&telcPlayingId===key&&(m.audioPlays[key]||0)<q.plays){
  m.audioPlays[key]=(m.audioPlays[key]||0)+1;persist();update();button.disabled=false;
  const success=await speak(q.transcript,button,q.id);if(success===false){m.audioPlays[key]--;persist();update();break;}update();if(success!==true)break;
  if((m.audioPlays[key]||0)<q.plays)await new Promise(resolve=>setTimeout(resolve,1500));
 }
 if(telcPlayingId===key)telcPlayingId=null;update();
}

function audioError(button){const area=button?.closest('.audio-block')?.querySelector('.audio-error');if(area)area.textContent=t('speechUnavailable');else announce(t('speechUnavailable'));}
function submitMock(expired=false){
  if(!state.mock)return;
  for(const q of allExercises.filter(isObjective)){
    const v=state.mock.answers[q.id];
    if(v!==undefined)recordAttempt(state,q,v);
  }
  const result=finishMock(state);
  persist();
  navigate('#mock/result/'+result.id);
  if(expired)announce(t('expired'));
}

app.addEventListener('click',e=>{
 const link=e.target.closest('a[href^="#"]');
 if(link&&!e.defaultPrevented&&e.button===0&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey&&!link.target&&!link.hasAttribute('download')){
   e.preventDefault();
   navigate(link.getAttribute('href'));
   return;
 }
 const button=e.target.closest('[data-action]');if(!button)return;const action=button.dataset.action,id=button.dataset.id;
 if(action==='menu'){mobileOpen=!mobileOpen;render();document.querySelector(mobileOpen?'.sidebar a':'.mobile-menu')?.focus();}
 if(action==='lang'){state.lang=button.dataset.lang==='de'?'de':'en';persist();render();announce('');}
 if(action==='pick-exam-level'){selectSidebarLevel(button.dataset.level);return;}
 if(action==='word-meaning'){wordMeaning=true;render();}
 if(action==='retry'){checked.delete(id);delete state.drafts[id];persist();render();}
 if(action==='model'){const q=findExercise(id);if(!q)return;if(q.type==='writing'&&!state.drafts[id]?.trim()){document.querySelector('textarea')?.focus();announce(t('needDraft'));return;}selfReviews.add(id);render();}
 if(action==='transcript'){const area=button.nextElementSibling;area.hidden=!area.hidden;button.textContent=t(area.hidden?'transcript':'hideTranscript');button.setAttribute('aria-expanded',String(!area.hidden));}
 if(action==='audio'){const q=findExercise(id);if(q){if(isCurrentTelc(state.mock)&&route().path==='mock/live')playTelcQuestion(q,button);else speak(q.transcript,button,q.id);}}
 if(action==='speak-word'){const v=vocabulary.find(v=>v.id===id);speak(v.word+'. '+v.example,button);}
 if(action==='lesson-retry'){lessonChecks.delete(id);render();}
 if(action==='lesson-done'){if(!state.lessons.includes(id))state.lessons.push(id);persist();announce(t('lessonSaved'));navigate('#course');}
 if(action==='flip'){wordRevealed=true;render();}
 if(action==='word-mark'){state.words[id]=button.dataset.value;persist();wordRevealed=false;const mode=button.dataset.mode;const count=mode==='review'?vocabulary.filter(v=>state.words[v.id]!=='known').length:vocabulary.length;let index=Number(button.dataset.index);if(mode==='all'||button.dataset.value==='again')index++;index=count?index%count:0;navigate(`#vocabulary?mode=${mode}&i=${index}`);}

 // Spaced Repetition Rating
 if(action==='srs-rate'){
   const rating=Number(button.dataset.rating)||3;
   extra.srs[id]=rateCard(extra.srs[id],rating);
   saveExtra();
   state.words[id]=rating===1?'again':'known';
   persist();
   wordRevealed=false;
   const mode=button.dataset.mode;
   const words=mode==='due'?vocabulary.filter(v=>isDue(extra.srs[v.id])):mode==='review'?vocabulary.filter(v=>state.words[v.id]!=='known'):vocabulary;
   let index=Number(button.dataset.index);
   if(mode==='all'||rating===1)index++;
   index=words.length?index%words.length:0;
   navigate(`#vocabulary?mode=${mode}&i=${index}`);
 }

 // Speech Assessment
 if(action==='speech-assess'){
   const targetText=button.dataset.target||'';
   const resEl=document.querySelector(`#speech-eval-${id}`);
   if(!hasSpeechRecognition()){
     if(resEl)resEl.innerHTML=`<span class="small-muted">${state.lang==='de'?'Spracherkennung wird in diesem Browser nicht unterstützt (bitte Chrome/Edge nutzen).':'Speech recognition not supported in this browser (please use Chrome/Edge).' }</span>`;
     return;
   }
   button.disabled=true;
   if(resEl)resEl.innerHTML=`<span class="small-muted">🎙 ${state.lang==='de'?'Zuhören... Bitte jetzt sprechen.':'Listening... Please speak now.'}</span>`;
   startSpeechRecognition({
     lang:'de-DE',
     onResult:(transcript)=>{
       const evalRes=evaluateSpeech(transcript,targetText);
       if(resEl){
         resEl.innerHTML=`
           <div class="feedback ${evalRes.score>=65?'success':'wrong'}" style="margin-top:8px">
             <strong>${esc(t('speechResult'))}: ${evalRes.score}% ${esc(t('speechAccuracy'))}</strong>
             <p style="margin:6px 0"><em>„${esc(evalRes.transcript)}“</em></p>
             <div style="font-size:12px;margin-top:6px">
               ${evalRes.tokens.map(tk=>`<span class="speech-token ${tk.matched?'matched':'missing'}" style="display:inline-block;padding:2px 6px;margin:2px;border-radius:4px;background:${tk.matched?'#d4edda':'#fff3cd'};color:${tk.matched?'#155724':'#856404'}">${esc(tk.word)}</span>`).join(' ')}
             </div>
           </div>
         `;
       }
     },
     onError:()=>{
       if(resEl)resEl.innerHTML=`<span class="small-muted">${state.lang==='de'?'Mikrofonfehler oder keine Sprache erkannt.':'Microphone error or speech not detected.'}</span>`;
     },
     onEnd:()=>{
       button.disabled=false;
     }
   });
 }

 if(action==='start-mock'||action==='new-mock'){
   if(state.mock&&!window.confirm(t('mockNewConfirm')))return;
   const examKey=button.dataset.exam||route().params.get('exam')||'telc-a1';
   const suite=MOCK_EXAM_SUITES[examKey]||MOCK_EXAM_SUITES['telc-a1'];
   state.mock=isTelcA1(examKey)||isTelcA2(examKey)||isTelcB1(examKey)||isTelcB2(examKey)?startTelc(Date.now(),examKey):startMock(Date.now(),examKey,suite.timeMinutes);
   persist();
   navigate('#mock/live');
 }
 if(action==='mock-section'){if(!state.mock)return;const before=state.mock.phase;advanceTelc(state.mock,Date.now());if(before!==state.mock.phase){persist();render(true);return;}const index=Number(button.dataset.section);if(!canVisit(state.mock,index))return;state.mock.section=index;persist();render(true);}
 if(action==='telc-start-oral'&&beginOral(state.mock,Date.now())){persist();render(true);}
 if(action==='submit-mock'){if(window.confirm(t('submitConfirm')))submitMock();}
 if(action==='export'){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='everyday-german-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);announce(t('exportDone'));}
 if(action==='reset'&&window.confirm(t('resetConfirm'))){const lang=state.lang;state=loadState({getItem:()=>null}).state;state.lang=lang;checked.clear();lessonChecks.clear();selfReviews.clear();persist();render();}
});

app.addEventListener('submit',e=>{
 e.preventDefault();const form=e.target,id=form.dataset.id;
 if(form.id==='exercise-form'){
   const q=findExercise(id);
   if(!q)return;
   if(isObjective(q)){
     const raw=new FormData(form).get(id);
     if(raw===null||String(raw).trim()===''){announce(t('choose'));return;}
     const value=q.type==='choice'?Number(raw):String(raw);
     checked.set(id,value);
     recordAttempt(state,q,value);
     persist();
     render();
     announce(t(grade(q,value)?'correct':'incorrect'));
   }else{
     recordAttempt(state,q,null);
     persist();
     selfReviews.delete(id);
     announce(t('reviewed'));
     navigate('#practice?level='+(q.level||'a1')+'&skill='+q.skill);
   }
 }
  if(form.id==='lesson-form'){const raw=new FormData(form).get('quiz');if(raw===null)return;const lesson=lessons.find(l=>l.id===id);lessonChecks.set(id,{value:Number(raw),correct:Number(raw)===lesson.quiz.answer});render();}
});

app.addEventListener('input',e=>{
 const field=e.target;
 if(field.id==='search'){updateFilters();return;}
 const form=field.closest('form');
 if(form?.id==='exercise-form'){const id=form.dataset.id;if(field.name==='draft'){state.drafts[id]=field.value;const wc=document.querySelector('#word-count');if(wc)wc.textContent=`${countWords(field.value)} ${t('words')}`;}else state.drafts[id]=field.type==='radio'?Number(field.value):field.value;persist();}
 if(form?.id==='mock-form'&&state.mock){const phase=state.mock.phase;const complete=advanceTelc(state.mock,Date.now());if(complete){submitMock(true);return;}if(phase!==state.mock.phase){persist();render(true);return;}state.mock.answers[field.name]=field.type==='radio'?Number(field.value):field.value;persist();}
 if(field.type==='radio'){field.closest('fieldset')?.querySelectorAll('.answer-option').forEach(label=>label.classList.toggle('chosen',label.querySelector('input').checked));}
});

app.addEventListener('change',e=>{
 const field=e.target;if(field.dataset.telcRating||field.dataset.telcForm){const result=state.exams.find(x=>x.id===field.dataset.result);if(!isCurrentTelc(result))return;result.ratings||={writing:{},speaking:{}};result.formReviews||={};if(field.dataset.telcRating){const domain=field.dataset.telcRating;const entry=(domain==='writing'?writingCriteria(result):speakingCriteria(result)).find(([k])=>k===field.dataset.key);if(!entry)return;if(field.value==='')delete result.ratings[domain][entry[0]];else if(allowedRatings(entry[1]).includes(Number(field.value)))result.ratings[domain][entry[0]]=Number(field.value);}else{if(field.value==='')delete result.formReviews[field.dataset.telcForm];else result.formReviews[field.dataset.telcForm]=field.value==='1';}persist();const openDetails=[...document.querySelectorAll('.telc-assessment details')].map(x=>x.open);const old=document.querySelector('.telc-assessment');const sections=getMockSections(result.exam,mockIds,result.formatVersion);old.outerHTML=telcAssessment(result,{lang:state.lang,sections,find:findExercise,grade});document.querySelectorAll('.telc-assessment details').forEach((x,i)=>x.open=openDetails[i]);return;}if(e.target.id==='part-filter')updateFilters();});
function updateFilters(){const current=route().params;const query=document.querySelector('#search').value,part=document.querySelector('#part-filter').value;if(query)current.set('q',query);else current.delete('q');if(part!=='all')current.set('part',part);else current.delete('part');history.replaceState(null,'','#practice'+(current.size?'?'+current.toString():''));document.querySelector('#exercise-list').innerHTML=exerciseList(current);}
window.addEventListener('hashchange',renderRoute);
document.querySelector('.skip-link').addEventListener('click',e=>{e.preventDefault();const main=document.querySelector('#main');main.setAttribute('tabindex','-1');main.focus();main.scrollIntoView();});
window.addEventListener('pagehide',stopAudio);
document.addEventListener('click',e=>{const palette=document.querySelector('.palette-menu');if(palette&&!palette.contains(e.target))palette.open=false;});
window.addEventListener('keydown',e=>{if(e.key==='Escape'){const palette=document.querySelector('.palette-menu');if(palette?.open){palette.open=false;palette.querySelector('summary').focus();}}if(e.key==='Escape'&&mobileOpen){mobileOpen=false;render();document.querySelector('.mobile-menu')?.focus();}});
installFeatures(app,{getState:()=>state,getExtra:()=>extra,save:saveExtra,render,speak,stopAudio});
function tickExam(){if(!state.mock)return;const before=state.mock.phase;if(isCurrentTelc(state.mock)){const ended=advanceTelc(state.mock,Date.now());if(ended){submitMock(true);return;}if(before!==state.mock.phase){persist();if(route().path==='mock/live')render(true);}}else if(remainingSeconds(state.mock)===0){submitMock(true);return;}const timer=document.querySelector('#timer');if(timer&&state.mock?.phase!=='oral-ready'){timer.textContent=formatTime(remainingSeconds(state.mock));timer.classList.toggle('time-low',remainingSeconds(state.mock)<300);}}
if(state.mock){const ended=isCurrentTelc(state.mock)?advanceTelc(state.mock,Date.now()):remainingSeconds(state.mock)===0;if(ended)submitMock(true);else{persist();render();}}else render();
setInterval(tickExam,1000);

window.speechSynthesis?.addEventListener('voiceschanged',()=>{if(route().path==='settings'&&document.activeElement?.tagName!=='SELECT')render();});
