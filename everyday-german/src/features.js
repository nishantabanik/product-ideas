import {cvTools,installCVTools} from './cv-tools.js';
import {exercises,lessons,vocabulary} from './content.js';
import {CEFR_LEVELS,CEFR_LESSONS} from './cefr.js';
import {DRILL_MODES,DRILL_ITEMS} from './grammar-drills.js';
import {INTONATION_PROFILES,detectPitch,drawPitchCanvas} from './pitch-trainer.js';
import {playAudioFile,playTTS} from './audio.js';
import {EXAM_LEVELS,TOPIC_PACKS,SITUATION_MODULES,MOCK_EXAM_SUITES} from './curriculum.js';

export const themes=['sage','ocean','lavender','sand','rose','dark'];

export const FREE_NATIVE_VOICES = [
  {
    id: 'katja',
    name: 'Katja (Neural)',
    gender: 'Female',
    audioUrl: '/public/audio/personas/katja.mp3',
    voiceMatch: 'Katja',
    style: { en: 'Warm, caring & empathetic', de: 'Warmherzig, fürsorglich & einfühlsam' },
    role: { en: 'Patient conversational coach; reduces speaking anxiety for newcomers', de: 'Geduldige Begleiterin gegen Sprechangst und Hemmungen im Alltag' },
    sampleText: {
      de: 'Hallo! Keine Sorge, Fehler gehören beim Deutschlernen dazu. Wir schaffen das Schritt für Schritt gemeinsam.',
      en: 'Hello! Do not worry, mistakes are part of learning German. We will take it step by step together.'
    },
    pitch: 1.04,
    rate: 0.94
  },
  {
    id: 'conrad',
    name: 'Conrad (Neural)',
    gender: 'Male',
    audioUrl: '/public/audio/personas/conrad.mp3',
    voiceMatch: 'Conrad',
    style: { en: 'Calm, steady & reassuring', de: 'Ruhig, gelassen & beruhigend' },
    role: { en: 'Stress-free listening comprehension and appointment preparation', de: 'Entspanntes Verstehen für Behörden, Termine und Beratungsgespräche' },
    sampleText: {
      de: 'Guten Tag! Willkommen in Deutschland. Nehmen Sie sich Zeit – entspanntes Verstehen kommt mit jedem Tag.',
      en: 'Good day! Welcome to Germany. Take your time – relaxed understanding comes day by day.'
    },
    pitch: 0.98,
    rate: 0.90
  },
  {
    id: 'amala',
    name: 'Amala (Neural)',
    gender: 'Female',
    audioUrl: '/public/audio/personas/amala.mp3',
    voiceMatch: 'Amala',
    style: { en: 'Gentle, encouraging & clear', de: 'Sanft, ermutigend & klar' },
    role: { en: 'Gentle guidance for beginners and confidence before exams', de: 'Ermutigender Ton für Anfänger und Sicherheit vor Prüfungen' },
    sampleText: {
      de: 'Ganz ruhig atmen. Sie haben sich gut vorbereitet und Sie können das schaffen.',
      en: 'Breathe calmly. You have prepared well and you can do this.'
    },
    pitch: 1.06,
    rate: 0.95
  },
  {
    id: 'killian',
    name: 'Killian (Neural)',
    gender: 'Male',
    audioUrl: '/public/audio/personas/killian.mp3',
    voiceMatch: 'Killian',
    style: { en: 'Clear, direct & authentic', de: 'Klar, direkt & authentisch' },
    role: { en: 'Everyday street German, train station announcements, and shopping', de: 'Alltagsdeutsch, Bahnhofsdurchsagen und Einkaufen' },
    sampleText: {
      de: 'Gleis vier. Der Zug nach Frankfurt am Main fährt heute mit zehn Minuten Verspätung ein.',
      en: 'Platform four. The train to Frankfurt am Main will arrive with ten minutes delay today.'
    },
    pitch: 0.96,
    rate: 0.92
  },
  {
    id: 'florian',
    name: 'Florian (Neural)',
    gender: 'Male',
    audioUrl: '/public/audio/personas/florian.mp3',
    voiceMatch: 'Florian',
    style: { en: 'Lively, modern & conversational', de: 'Lebendig, modern & umgangssprachlich' },
    role: { en: 'Workplace interactions, tech office dialogue, and casual conversations', de: 'Arbeitsplatz, Büroalltag und kollegialer Austausch' },
    sampleText: {
      de: 'Hey, hast du kurz Zeit? Lass uns die Präsentation vor dem Meeting schnell noch abstimmen.',
      en: 'Hey, do you have a quick moment? Let us quickly coordinate the presentation before the meeting.'
    },
    pitch: 1.08,
    rate: 0.98
  }
];

export const ELEVENLABS_NATIVE_VOICES = FREE_NATIVE_VOICES;

export const voiceProfiles = {
  lively: { id: 'lively', pitch: 1.08, rate: 0.96, label: { en: 'Lively & Expressive', de: 'Lebendig & Ausdrucksstark' }, desc: { en: 'Natural inflection with dynamic warmth for everyday conversations.', de: 'Natürliche Satzmelodie mit lebendiger Betonung für Alltag und Begegnungen.' } },
  friendly: { id: 'friendly', pitch: 1.04, rate: 0.92, label: { en: 'Friendly & Warm', de: 'Freundlich & Warm' }, desc: { en: 'Clear, welcoming tone ideal for appointments and polite questions.', de: 'Herzlicher, verständlicher Ton für Termine, Beratung und Bitten.' } },
  patient: { id: 'patient', pitch: 1.00, rate: 0.85, label: { en: 'Patient & Clear', de: 'Geduldig & Deutlich' }, desc: { en: 'Steady pace with articulated syllables for listening practice.', de: 'Ruhiges Tempo mit deutlicher Aussprache für entspanntes Verstehen.' } },
  official: { id: 'official', pitch: 0.94, rate: 0.90, label: { en: 'Official & Formal', de: 'Amtlich & Formell' }, desc: { en: 'Precise, authoritative delivery for public announcements and letters.', de: 'Präzise, sachliche Aussprache für Durchsagen und Behördentexte.' } }
};

const U=(lang,en,de)=>lang==='de'?de:en;
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function loadExtras(storage){
  let x={};try{x=JSON.parse(storage?.getItem('everyday-german:extras')||'{}')||{};}catch{}
  const string=v=>typeof v==='string'?v.slice(0,10000):'';
  const long=(v,n)=>typeof v==='string'?v.slice(0,n):'';
  return {
    cvSource:long(x.cvSource,100000),
    jobDescription:long(x.jobDescription,30000),
    theme:themes.includes(x.theme)?x.theme:'sage',
    activePersona:['katja','conrad','amala','killian','florian'].includes(x.activePersona)?x.activePersona:'katja',
    voice:string(x.voice),
    rate:[.85,.88,.9,.92,.94,.95,.96,.98,1,1.05,1.1].includes(x.rate)?x.rate:1,
    pitch:Number.isFinite(x.pitch)&&x.pitch>=0.7&&x.pitch<=1.4?x.pitch:1.04,
    voiceProfile:['lively','friendly','patient','official'].includes(x.voiceProfile)?x.voiceProfile:'lively',
    cefrLevel:['a1','a2','b1'].includes(x.cefrLevel)?x.cefrLevel:'a1',
    srs:x.srs&&typeof x.srs==='object'&&!Array.isArray(x.srs)?x.srs:{},
    goals:Array.isArray(x.goals)?x.goals.filter(x=>typeof x==='string').slice(0,100):[],
    cv:Object.fromEntries(Object.entries(x.cv&&typeof x.cv==='object'?x.cv:{}).filter(([k])=>cvFields.some(f=>f[0]===k)).map(([k,v])=>[k,string(v)])),
    cvTemplate:['classic','modern','compact'].includes(x.cvTemplate)?x.cvTemplate:'classic',
    sidebarLevel:['a1','a2','b1','b2','c1'].includes(x.sidebarLevel)?x.sidebarLevel:'a1',
    scores:Array.isArray(x.scores)?x.scores.filter(x=>Number.isFinite(x.score)&&Number.isFinite(x.total)&&typeof x.mode==='string').slice(-20):[]
  };
}

export const cvFields=[['name','Full name','Vollständiger Name'],['contact','Contact and city','Kontakt und Wohnort'],['profile','Profile','Profil'],['experience','Work experience (newest first)','Berufserfahrung (neueste zuerst)'],['education','Education','Ausbildung'],['certificates','Certificates and courses','Zertifikate und Kurse'],['internships','Internships','Praktika'],['languages','Languages and levels','Sprachen und Niveaus'],['skills','Skills','Kenntnisse'],['interests','Interests (optional)','Interessen (optional)']];

const titles={
  learn:['Learn German','Deutsch lernen'],
  journey:['My journey','Mein Lernweg'],
  exams:['Exam preparation','Prüfungsvorbereitung'],
  words:['Words & Vocabulary','Wortschatz & Themen'],
  situations:['Words in situations','Wörter in Situationen'],
  games:['Language playground','Sprachspiele'],
  cv:['CV studio','Lebenslauf-Studio'],
  settings:['Audio settings','Audioeinstellungen'],
  level:['A1 readiness check','A1-Lernstand prüfen'],
  cefr:['CEFR levels (A1, A2, B1)','GER-Stufen (A1, A2, B1)'],
  pronunciation:['Pronunciation & pitch trainer','Aussprache & Tonhöhen-Trainer'],
  drills:['Grammar mechanics drills','Grammatik-Mechanik']
};

export const featureTitle=(path,lang)=>titles[path]?titles[path][lang==='de'?1:0]:path;
const card=(href,title,description)=>`<a class="card feature-card" href="${href}"><h2>${E(title)}</h2><p>${E(description)}</p><span>→</span></a>`;

const journeys={
  german:[['Complete a lesson','Eine Lektion beenden','#course'],['Practise all four skills','Alle vier Fertigkeiten üben','#practice'],['Review vocabulary','Wortschatz wiederholen','#vocabulary'],['Try a practice paper','Eine Übungsprüfung machen','#mock']],
  study:[['Choose a study goal','Ein Studienziel wählen'],['List course requirements','Kursanforderungen sammeln'],['Plan your German study time','Deutschlernzeit planen','#course'],['Prepare a short introduction','Eine kurze Vorstellung üben','#practice?skill=sprechen']],
  work:[['Write a first CV','Einen ersten Lebenslauf schreiben','#cv'],['Describe your experience','Berufserfahrung beschreiben','#cv'],['Practise an introduction','Eine Vorstellung üben','#exercise/s1'],['Prepare questions for an employer','Fragen für ein Unternehmen vorbereiten']],
  life:[['Practise appointment messages','Nachrichten für Termine üben','#practice?skill=schreiben'],['Learn transport vocabulary','Wörter für Verkehr lernen','#vocabulary'],['Practise asking for help','Um Hilfe bitten üben','#exercise/s5'],['Make your personal document checklist','Eine persönliche Dokumentenliste machen']]
};

let game=null;
let drill=null;
let pitchSession=null;
let situationSession=null;

function renderSituationRunner(session,lang){
  const mod=SITUATION_MODULES.find(m=>m.id===session.id)||SITUATION_MODULES[0];
  const sample=mod.sample;
  const isChecked=session.checked;
  const picked=session.picked;
  const isCorrect=isChecked&&picked===sample.answer;
  const u=(en,de)=>lang==='de'?de:en;

  return `
    <div class="apple-box" style="border:2px solid var(--accent);background:var(--surface);box-shadow:0 12px 35px rgba(0,0,0,0.12)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <span class="provider-badge" style="background:#3b82f622;color:#2563eb">${E(u(mod.title.en,mod.title.de))} · ${mod.level}</span>
        <button class="subtle-button" data-action="close-situation" style="font-size:16px;padding:2px 8px">✕</button>
      </div>
      <h3 style="font-size:17px;line-height:1.5;margin-bottom:16px">${E(sample.scene)}</h3>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
        ${sample.options.map((opt,i)=>`
          <button type="button" class="button secondary" data-action="answer-situation" data-index="${i}" ${isChecked?'disabled':''} style="text-align:left;padding:10px 14px;border-radius:10px;${isChecked&&i===sample.answer?'background:#10b98122;border-color:#10b981;font-weight:700':isChecked&&picked===i?'background:#ef444422;border-color:#ef4444':''}">
            <span style="display:inline-block;width:24px;font-weight:700">${String.fromCharCode(65+i)})</span> ${E(opt)}
          </button>
        `).join('')}
      </div>
      ${isChecked?`
        <div class="feedback ${isCorrect?'success':'wrong'}" style="margin-bottom:14px">
          <strong>${isCorrect?u('✓ Excellent choice!','✓ Hervorragend gewählt!'):u('✕ A valuable mistake to learn from.','✕ Aus diesem Fehler können Sie lernen.')}</strong>
          <p style="margin:6px 0 0;font-size:13px">${E(sample.explanation)}</p>
        </div>
        <div style="display:flex;justify-content:flex-end">
          <button class="button primary" data-action="close-situation">${u('Done','Fertig')} ✓</button>
        </div>
      `:''}
    </div>
  `;
}

export function extraView(path,params,{state,extra}){
  const lang=state.lang,u=(en,de)=>U(lang,en,de),head=(title,desc)=>`<div class="page-heading"><span class="eyebrow">EVERYDAY GERMAN · ${extra.cefrLevel.toUpperCase()}</span><h1 tabindex="-1">${E(title)}</h1><p>${E(desc)}</p></div>`;

  if(path==='learn'){
    const streak=extra.scores?.length||0;
    const planMin=extra.studyMinutes||15;
    return `
      <div class="page-heading" style="margin-bottom:20px">
        <span class="eyebrow">${u('EVERYDAY GERMAN · STUDY SPACE','MEIN LERNBEREICH')}</span>
        <h1 tabindex="-1">${u('Hello! Ready for the next lesson?','Hallo! Bereit für die nächste Lektion?')}</h1>
        <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-top:8px">
          <span class="provider-chip" style="background:#f59e0b22;color:#d97706;border-color:transparent">🔥 ${streak} ${u('Day streak','Tage Serie')}</span>
          <span class="provider-chip" style="background:#10b98122;color:#059669;border-color:transparent">🎯 ${planMin} ${u('Min daily goal','Min. Tagesziel')}</span>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;margin-bottom:22px">
        <div class="apple-box" style="display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,var(--surface),var(--soft))">
          <div>
            <span class="little-pill" style="font-size:10px;font-weight:700">TODAY</span>
            <h2 style="font-size:18px;margin:8px 0 4px">${u("Today's lesson · In the German class","Heutige Lektion · Im Deutschkurs")}</h2>
            <p style="font-size:12px;margin:0">${u('12 tasks · about 4 minutes','12 Aufgaben · ca. 4 Minuten')}</p>
          </div>
          <a href="#course" class="button primary" style="border-radius:50%;width:46px;height:46px;padding:0;display:flex;align-items:center;justify-content:center;font-size:18px">▶</a>
        </div>

        <div class="apple-box">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <strong style="font-size:15px">📅 ${u('Study plan','Lernplan')}</strong>
            <a href="#course" class="subtle-button" style="font-size:12px">${u('Change','Ändern')} ✎</a>
          </div>
          <p style="font-size:12px;line-height:1.5;margin:8px 0 12px">${u('Pick how many minutes a day, and the plan works out when the level is done.','Wählen Sie Ihre tägliche Lernzeit – Everyday German berechnet den Zeitplan.')}</p>
          <div style="display:flex;gap:8px;align-items:center">
            <span class="provider-chip">${planMin} ${u('min/day','Min/Tag')}</span>
            <a href="#course" class="text-link" style="font-size:12px">${u('Set minutes','Minuten einstellen')} →</a>
          </div>
        </div>
      </div>

      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:24px">
        <a href="#progress" class="apple-box" style="flex:1;min-width:240px;padding:14px 18px;display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:20px">🔄</span>
            <div><strong>${u('Review mistakes','Fehler wiederholen')}</strong><br><small class="small-muted">${u('Quizzes and situations in one list','Fehler aus Übungen gezielt wiederholen')}</small></div>
          </div>
          <span>→</span>
        </a>
        <a href="#words?filter=hard" class="apple-box" style="flex:1;min-width:240px;padding:14px 18px;display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:20px">⚡</span>
            <div><strong>${u('Hard words','Schwere Wörter')}</strong><br><small class="small-muted">${u('The words you miss most often','Vokabeln, die noch unsicher sind')}</small></div>
          </div>
          <span>→</span>
        </a>
      </div>

      <div style="margin-bottom:28px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <span class="eyebrow" style="margin:0">${u('LEARNING PATH','LERNWEG')}</span>
          <a href="#cefr" class="text-link" style="font-size:12px">${u('Detailed overview','Detaillierte Übersicht')} →</a>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${[
            { lvl: 'A1 – Beginner', badge: 'LEVEL A1', desc: '0/10 tasks · Articles, basic greetings, present tense', color: '#10b981' },
            { lvl: 'A2 – Elementary', badge: 'LEVEL DTZ', desc: '0/10 tasks · Past tense (Perfekt), office talk, doctor appointments', color: '#3b82f6' },
            { lvl: 'B1 – Intermediate', badge: 'LEVEL DTZ', desc: '0/14 tasks · Official letters, Konjunktiv II, citizenship exam prep', color: '#8b5cf6' },
            { lvl: 'B2 – Advanced', badge: 'LEVEL telc B2', desc: '0/10 tasks · Professional meetings, negotiations, complex essays', color: '#ec4899' },
            { lvl: 'C1 – Proficient', badge: 'LEVEL telc C1', desc: '0/6 tasks · Academic research, fluent rhetoric, official legal register', color: '#f59e0b' }
          ].map(p=>`
            <div class="apple-box" style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-left:4px solid ${p.color}">
              <div>
                <div style="display:flex;gap:8px;align-items:center">
                  <span class="provider-badge" style="background:${p.color}22;color:${p.color}">${p.badge}</span>
                  <strong style="font-size:16px">${p.lvl}</strong>
                </div>
                <p style="font-size:12px;margin:4px 0 0;color:var(--muted)">${p.desc}</p>
              </div>
              <a href="#course" class="button secondary" style="font-size:12px;padding:6px 12px">${u('Explore','Öffnen')}</a>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="word-of-day-banner">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span class="provider-badge" style="background:#3b82f622;color:#2563eb">WORT DES TAGES · B1</span>
          <button class="button secondary" data-action="speak-word-hero" data-word="die Hilfsbereitschaft" style="font-size:12px;padding:4px 10px">🔊 ${u('Audio','Anhören')}</button>
        </div>
        <h2 style="font-size:28px;margin:6px 0 2px">die Hilfsbereitschaft</h2>
        <span class="small-muted" style="font-size:12px;display:block;margin-bottom:12px">SUBSTANTIV, F. · Helpfulness, readiness to help</span>
        <blockquote style="font-size:13px;line-height:1.6;margin:0 0 16px;padding-left:12px;border-left:2px solid var(--accent);font-style:italic">
          „Die spontane Hilfsbereitschaft der Anwohner bei den Aufräumarbeiten nach dem Unwetter berührte alle tief.“
        </blockquote>

        <div class="apple-box" style="background:var(--surface)">
          <strong style="font-size:13px;display:block;margin-bottom:8px">❤️ ${u('THE WORD IN A SITUATION','DAS WORT IN EINER SITUATION')}</strong>
          <p style="font-size:13px;line-height:1.5;margin-bottom:12px">
            Am Bahnhof trägt ein Fremder Oma den schweren Koffer die Treppe hoch – sie bedankt sich für so viel _______.
          </p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px" id="hero-word-quiz">
            <button class="button secondary" data-action="check-hero-word" data-correct="true" style="font-size:12px;padding:8px">Hilfsbereitschaft</button>
            <button class="button secondary" data-action="check-hero-word" data-correct="false" style="font-size:12px;padding:8px">Hilflosigkeit</button>
            <button class="button secondary" data-action="check-hero-word" data-correct="false" style="font-size:12px;padding:8px">Rufbereitschaft</button>
            <button class="button secondary" data-action="check-hero-word" data-correct="false" style="font-size:12px;padding:8px">Zahlungsbereitschaft</button>
          </div>
          <div id="hero-word-feedback" style="margin-top:10px"></div>
        </div>
      </div>

      <div style="margin-bottom:30px">
        <span class="eyebrow">${u('GRAMMAR TOPICS A1','GRAMMATIKTHEMEN A1')}</span>
        <div class="apple-card-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-top:10px">
          ${[
            ['Articles (der, die, das)','Artikel','10','A1'],
            ['Personal Pronouns','Personalpronomen','10','A1'],
            ['Present Tense (Präsens)','Präsens','10','A1'],
            ['Noun Plurals','Pluralbildung','10','A1'],
            ['Accusative Case','Akkusativ','10','A1'],
            ['Modal Verbs','Modalverben','10','A1'],
            ['Negation (nicht vs kein)','Negation','7','A1']
          ].map(([en,de,cnt,lvl])=>`
            <div class="apple-box" style="padding:16px">
              <span class="provider-badge">${lvl} · ${cnt}</span>
              <h3 style="font-size:15px;margin:10px 0 4px">${E(u(en,de))}</h3>
              <a href="#practice" class="text-link" style="font-size:12px">${u('Practice','Üben')} →</a>
            </div>
          `).join('')}
        </div>
      </div>

      <div>
        <span class="eyebrow">${u('GRAMMAR MECHANICS DRILLS','SCHNELL-TRAINING DRILLS')}</span>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px">
          <a href="#situations" class="button primary" style="font-size:12px">💬 ${u('Words in situations','Wörter in Situationen')} →</a>
          <a href="#drills?mode=verben" class="button secondary" style="font-size:12px">⚡ ${u('Conjugation','Konjugation')}</a>
          <a href="#drills?mode=praeteritum" class="button secondary" style="font-size:12px">⏳ ${u('Simple past','Präteritum')}</a>
          <a href="#drills?mode=pronomen" class="button secondary" style="font-size:12px">👥 ${u('Pronouns','Pronomen')}</a>
          <a href="#drills?mode=adjektive" class="button secondary" style="font-size:12px">💎 ${u('Adjective endings','Adjektivdeklination')}</a>
          <a href="#drills?mode=konnektoren" class="button secondary" style="font-size:12px">🔗 ${u('Connectors','Konnektoren')}</a>
        </div>
      </div>
    `;
  }

  if(path==='exams'){
    const selectedLevel=params.get('lvl')||extra.sidebarLevel||'a1';
    return `
      <div class="page-heading" style="margin-bottom:24px">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
          <div>
            <span class="eyebrow">${u('EXAM PREPARATION','PRÜFUNGSVORBEREITUNG')}</span>
            <h1 tabindex="-1" style="margin-bottom:6px">${u('German Exams & Certifications','Deutschprüfungen & Zertifikate')}</h1>
            <p>${u('Compare Goethe and telc exam formats and open official practice materials for A1 to C1.','Vergleichen Sie Goethe- und telc-Prüfungsformate und öffnen Sie offizielle Übungsmaterialien für A1 bis C1.')}</p>
          </div>
          <div class="apple-segmented-bar" style="margin:0">
            ${EXAM_LEVELS.map(lvl=>`<a href="#exams?lvl=${lvl.id}" class="apple-segmented-item ${selectedLevel===lvl.id?'active':''}">${E(lvl.code)}</a>`).join('')}
          </div>
        </div>
      </div>

      <div class="exam-hub-grid">
        ${EXAM_LEVELS.map(lvl=>{
          const isLvlActive=selectedLevel===lvl.id;
          return `
            <div class="exam-hub-card ${isLvlActive?'active-level':''}" style="${isLvlActive?'border-color:var(--accent,#2563eb);box-shadow:0 0 0 1px var(--accent,#2563eb)':''}">
              <div>
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                  <div class="level-tag">${E(lvl.code)}</div>
                  ${lvl.free?`<span class="provider-badge" style="background:#10b98122;color:#059669">${u('Free','Kostenlos')}</span>`:''}
                </div>
                <h2 style="font-size:18px;margin:8px 0 6px">${E(u(lvl.name.en,lvl.name.de))}</h2>
                <p style="font-size:13px;line-height:1.5;margin-bottom:12px">${E(u(lvl.desc.en,lvl.desc.de))}</p>
                <div class="provider-chips">
                  ${lvl.boards.map(b=>`<span class="provider-chip">${E(b.name)}</span>`).join('')}
                </div>
              </div>
              <div>
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                  ${['a1','a2','b1','b2','c1'].includes(lvl.id)?`
                    <a href="#mock?exam=goethe-${lvl.id}" class="button primary" style="flex:1;min-width:105px;font-size:12px;padding:8px 8px;text-align:center">Goethe ${lvl.code} →</a>
                    <a href="#mock?exam=telc-${lvl.id}" class="button secondary" style="flex:1;min-width:105px;font-size:12px;padding:8px 8px;text-align:center">telc ${lvl.code} →</a>
                    <a href="#practice?level=${lvl.id}" class="button secondary" style="flex:1;min-width:105px;font-size:12px;padding:8px 8px;text-align:center">Allgemein ${lvl.code} →</a>
                  `:`
                    <a href="#practice" class="button secondary" style="flex:1;font-size:12px;padding:8px 12px;text-align:center">${u('Start practice','Übung starten')} →</a>
                  `}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div style="margin-top:36px">
        <span class="eyebrow">${u('LEARNING & GAMES','LERNEN & SPIELE')}</span>
        <div class="apple-card-grid" style="grid-template-columns:1fr 1fr;margin-top:12px">
          <div class="apple-box" style="display:flex;flex-direction:column;justify-content:space-between">
            <div>
              <h2 style="font-size:20px;margin-bottom:6px">${u('Learn','Lernen')}</h2>
              <p>${u('Grammar, core vocabulary, and interactive dialogues A1–C1.','Grammatik, Wörter und Dialoge A1–C1.')}</p>
            </div>
            <div style="margin-top:16px"><a href="#learn" class="button primary" style="font-size:13px">${u('Open learning path','Ansehen')} →</a></div>
          </div>
          <div class="apple-box" style="display:flex;flex-direction:column;justify-content:space-between">
            <div>
              <h2 style="font-size:20px;margin-bottom:6px">${u('Games & Mechanics','Spiele & Mechanik')}</h2>
              <p>${u('Gamified vocabulary drills, article trainer, and sentence builders.','Wörter spielerisch lernen, Artikelgarten und Satzwerkstatt.')}</p>
            </div>
            <div style="margin-top:16px"><a href="#games" class="button secondary" style="font-size:13px">${u('Play drills','Spielen')} →</a></div>
          </div>
        </div>
      </div>
    `;
  }

  if(path==='words'){
    const filterLvl=params.get('filter')||'all';
    const totalWords=8346;
    return `
      <div class="page-heading" style="margin-bottom:20px">
        <span class="eyebrow">${u('VOCABULARY & TOPIC PACKS','WORTSCHATZ & THEMEN')}</span>
        <h1 tabindex="-1">${u('Words & Topic Collections','Wortschatz & Themenkatalog')}</h1>
        <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin-top:10px">
          <span class="provider-chip"><strong>${totalWords}</strong> ${u('Total words','Gesamtwortschatz')}</span>
          <span class="provider-chip" style="background:#3b82f622;color:#2563eb"><strong>0</strong> ${u('Learning','Im Lernprozess')}</span>
          <span class="provider-chip" style="background:#f59e0b22;color:#d97706"><strong>0</strong> ${u('At risk','Unsicher')}</span>
          <span class="provider-chip" style="background:#10b98122;color:#059669"><strong>${vocabulary.length}</strong> ${u('Mastered A1','Gemeistert A1')}</span>
        </div>
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px">
        <a href="#vocabulary?mode=all" class="button primary" style="font-size:12px">🗂 ${u('Cards','Lernkarten')}</a>
        <a href="#games?mode=words" class="button secondary" style="font-size:12px">🧩 ${u('Pairs','Wortpaare')}</a>
        <a href="#words?filter=hard" class="button secondary" style="font-size:12px">⚡ ${u('Hard words','Schwere Wörter')}</a>
        <a href="#situations" class="button secondary" style="font-size:12px">💬 ${u('Situations','Situationen')}</a>
      </div>

      <div class="apple-segmented-bar">
        ${['all','a1','a2','b1','b2','beruf','pruefung','redewendungen'].map(f=>`
          <a href="#words?filter=${f}" class="apple-segmented-item ${filterLvl===f?'active':''}">
            ${f==='all'?u('All','Alle'):f.toUpperCase()}
          </a>
        `).join('')}
      </div>

      <div class="apple-card-grid">
        ${TOPIC_PACKS.map(tp=>`
          <div class="topic-tile">
            <div class="topic-icon-wrap">${tp.icon}</div>
            <div style="flex:1;min-width:0">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <strong style="font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${E(u(tp.name.en,tp.name.de))}</strong>
                <span class="small-muted" style="font-size:11px">0/${tp.count}</span>
              </div>
              <p style="font-size:11px;margin:2px 0 6px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${E(tp.preview)}</p>
              <a href="#vocabulary?mode=all" class="text-link" style="font-size:11px">${u('Practice cards','Karten lernen')} →</a>
            </div>
          </div>
        `).join('')}
      </div>

      <div style="margin-top:32px">
        <span class="eyebrow">${u('QUICK MECHANICS DRILLS','SCHNELL-TRAINING')}</span>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px">
          <a href="#games?mode=articles" class="button secondary" style="font-size:12px">📙 ${u('Articles (der/die/das)','Artikel')}</a>
          <a href="#games?mode=words" class="button secondary" style="font-size:12px">📚 ${u('Plural','Plural')}</a>
          <a href="#games?mode=grammar" class="button secondary" style="font-size:12px">↔ ${u('Opposites (Antonyme)','Gegenteile')}</a>
          <a href="#drills?mode=verben" class="button secondary" style="font-size:12px">⚡ ${u('Verbs with prepositions','Verben mit Präpositionen')}</a>
        </div>
      </div>
    `;
  }

  if(path==='situations'){
    return `
      <div class="page-heading" style="margin-bottom:20px">
        <a href="#learn" class="back-link" style="margin-bottom:12px;display:inline-block">← ${u('Back to Learning','Zurück zu Lernen')}</a>
        <h1 tabindex="-1">${u('Words in situations','Wörter in Situationen')}</h1>
        <p style="font-size:14px;max-width:680px;line-height:1.6">
          ${u('Words become events and mistakes, so they stop being abstract. Pick the word for the scene, then see what it would really have meant.','Wörter werden zu Situationen und echten Momenten, damit sie greifbar werden. Wählen Sie das passende Wort für die Szene und verstehen Sie die Nuancen.')}
        </p>
      </div>

      <div id="situation-runner" style="margin-bottom:24px" ${situationSession?'':'hidden'}>
        ${situationSession?renderSituationRunner(situationSession,lang):''}
      </div>

      <div class="apple-card-grid">
        ${SITUATION_MODULES.map(m=>`
          <div class="apple-box" style="display:flex;flex-direction:column;justify-content:space-between">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <span style="font-size:24px">${m.icon}</span>
                <span class="provider-badge">${m.level}</span>
              </div>
              <h2 style="font-size:17px;margin:6px 0">${E(u(m.title.en,m.title.de))}</h2>
              <p style="font-size:12px;line-height:1.5;margin-bottom:14px">${E(u(m.desc.en,m.desc.de))}</p>
              <div style="font-size:11px;color:var(--muted);margin-bottom:14px">
                <span>${m.situations} ${u('situations','Situationen')}</span> · <span>${m.words} ${u('words','Wörter')}</span>
              </div>
            </div>
            <button type="button" class="button primary" data-action="start-situation" data-id="${m.id}" style="font-size:12px;padding:8px 14px;text-align:center">
              ${u('Start','Starten')} →
            </button>
          </div>
        `).join('')}
      </div>

      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:28px">
        <a href="#progress" class="apple-box" style="flex:1;min-width:240px;padding:16px;display:flex;align-items:center;justify-content:space-between">
          <div>
            <strong>🔄 ${u('Review mistakes','Fehler wiederholen')}</strong>
            <p style="font-size:12px;margin:2px 0 0;color:var(--muted)">${u('Situations you answered wrong','Falsch beantwortete Situationen')}</p>
          </div>
          <span>→</span>
        </a>
        <a href="#words?filter=hard" class="apple-box" style="flex:1;min-width:240px;padding:16px;display:flex;align-items:center;justify-content:space-between">
          <div>
            <strong>⚡ ${u('My hard words','Meine schweren Wörter')}</strong>
            <p style="font-size:12px;margin:2px 0 0;color:var(--muted)">${u('The words you miss most often','Wörter, die Sie am häufigsten verwechseln')}</p>
          </div>
          <span>→</span>
        </a>
      </div>
    `;
  }

  if(path==='journey'){
    const selected=Object.hasOwn(journeys,params.get('track'))?params.get('track'):'german';const names={german:u('German','Deutsch'),study:u('Study','Studium'),work:u('Work','Arbeit'),life:u('Daily life','Alltag')};
    return head(featureTitle(path,lang),u('A personal checklist for your next steps. These are planning prompts; check institution requirements directly.','Eine persönliche Liste für Ihre nächsten Schritte. Prüfen Sie Anforderungen direkt bei der jeweiligen Einrichtung.'))+`<div class="skill-tabs">${Object.keys(journeys).map(k=>`<a class="tab ${selected===k?'active':''}" href="#journey?track=${k}">${names[k]}</a>`).join('')}</div><section class="card"><h2>${names[selected]}</h2><p>${extra.goals.filter(x=>x.startsWith(selected+'-')).length} / ${journeys[selected].length}</p>${journeys[selected].map(([en,de,href],i)=>`<div class="journey-step"><label><input type="checkbox" data-goal="${selected}-${i}" ${extra.goals.includes(selected+'-'+i)?'checked':''}> ${E(u(en,de))}</label>${href?`<a class="text-link" href="${href}">${u('Open','Öffnen')} →</a>`:''}</div>`).join('')}</section>`;
  }

  if(path==='settings'){
    const deVoices=(typeof window!=='undefined'&&window.speechSynthesis?.getVoices()||[]).filter(v=>v.lang.toLowerCase().replace('_','-').startsWith('de'));
    const isExpressive=v=>/natural|neural|premium|enhanced|siri|anna|yannick|katja|conrad|amala|killian|florian|google/i.test(v.name);
    const sortedVoices=[...deVoices].sort((a,b)=>Number(isExpressive(b))-Number(isExpressive(a)));

    return head(featureTitle(path,lang),u('Choose your listening preferences and 100% free expressive native German voices.','Wählen Sie Ihre Höreinstellungen und 100% kostenlose muttersprachliche Stimmen.'))+`
    <section class="card" style="margin-bottom:20px">
      <h2>${u('100% Free Expressive Native German Voices','100% kostenlose muttersprachliche Stimmen')}</h2>
      <p>${u('Human, empathetic native German voices. Play authentic audio recordings instantly or set as your active voice. 100% free with zero fees or accounts.','Menschliche, einfühlsame deutsche Stimmen. Hören Sie authentische Audioaufnahmen sofort an oder wählen Sie Ihre persönliche Lernstimme. 100% kostenlos ohne Registrierung.')}</p>
      
      <div class="personas-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;margin:16px 0">
        ${FREE_NATIVE_VOICES.map(p=>{
          const isActive=(extra.activePersona||'katja')===p.id;
          return `
          <div class="card persona-card" style="border:2px solid ${isActive?'var(--accent,#2563eb)':'var(--line)'};border-radius:12px;padding:16px;background:var(--surface);position:relative">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <strong style="font-size:16px">${E(p.name)}</strong>
              ${isActive?`<span class="little-pill" style="background:var(--accent,#2563eb);color:#fff;font-weight:600">✓ ${u('Active Practice Voice','Aktive Lernstimme')}</span>`:`<span class="little-pill">${E(p.gender)} · ${u(p.style.en.split(',')[0],p.style.de.split(',')[0])}</span>`}
            </div>
            <p style="font-size:13px;line-height:1.4;margin:4px 0 8px 0"><em>„${E(p.sampleText[lang])}“</em></p>
            <p class="small-muted" style="font-size:12px;margin-bottom:12px">${E(p.role[lang])}</p>
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
              <button type="button" class="button secondary" style="font-size:12px;padding:6px 12px" data-action="speak-persona" data-id="${p.id}" data-audio="${E(p.audioUrl)}" data-text="${E(p.sampleText[lang])}" data-pitch="${p.pitch}" data-rate="${p.rate}" data-voice="${E(p.voiceMatch)}" data-name="${E(p.name)}">
                ▶ ${u('Listen','Anhören')}
              </button>
              <button type="button" class="button secondary" style="font-size:12px;padding:6px 12px" data-action="stop-persona" data-name="${E(p.name)}">
                ⏹ ${u('Stop','Stoppen')}
              </button>
              ${isActive?`
                <button type="button" class="button primary" style="font-size:12px;padding:6px 12px;opacity:0.9;cursor:default" disabled>
                  ✓ ${u('Selected','Ausgewählt')}
                </button>
              `:`
                <button type="button" class="button primary" style="font-size:12px;padding:6px 12px" data-feature="apply-persona" data-id="${p.id}" data-pitch="${p.pitch}" data-rate="${p.rate}" data-voice="${E(p.voiceMatch)}" data-name="${E(p.name)}">
                  ${u('Set as active voice','Als Lernstimme wählen')}
                </button>
              `}
            </div>
          </div>
        `}).join('')}
      </div>

      <div class="notice" style="margin-top:14px">
        <p><strong>${u('100% Free Forever:','Dauerhaft 100% kostenlos:')}</strong> ${u('All 5 voices have studio-quality neural recordings stored directly in the app. No paid APIs, no subscriptions, and full offline support.','Alle 5 Stimmen enthalten echte Neural-Aufnahmen direkt in der App. Keine bezahlten Dienste, kein Abo und vollständige Offline-Unterstützung.')}</p>
      </div>
    </section>

    <section class="card">
      <h2>${u('Browser Speech & Prosody Settings','Browserstimme & Satzmelodie-Regler')}</h2>
      <p>${u('All audio across lessons, exams, words and games plays with the voice configured here — the selected persona or your browser voice, at the speed and pitch set below.','Alle Audios in Lektionen, Prüfungen, Wörtern und Spielen werden mit der hier gewählten Stimme abgespielt — der ausgewählten Lernstimme oder Ihrer Browserstimme, mit dem unten eingestellten Tempo und der Tonhöhe.')}</p>
      
      <label class="field-label">${u('Browser voice','Browserstimme')}
        <select id="voice-select">
          <option value="">${u('Best available expressive German voice','Beste verfügbare expressive deutsche Stimme')}</option>
          ${sortedVoices.map(v=>`<option value="${E(v.name)}" ${extra.voice===v.name||(extra.voice&&v.name.toLowerCase().includes(extra.voice.toLowerCase()))?'selected':''}>${isExpressive(v)?'★ ':''}${E(v.name)} (${E(v.lang)})${isExpressive(v)?u(' — Expressive / Natural',' — Natürlich & Ausdrucksstark'):''}</option>`).join('')}
        </select>
      </label>

      <h3>${u('Emotion & Tone Profile','Emotions- und Tonprofil')}</h3>
      <p class="small-muted">${u('Adjusts pitch inflection and cadence for everyday warmth vs formal clarity.','Passt Tonhöhenverlauf und Sprechtempo an Alltagswärme oder formelle Klarheit an.')}</p>
      <div class="emotion-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:15px 0">
        ${Object.values(voiceProfiles).map(p=>`
          <button type="button" class="card emotion-card ${extra.voiceProfile===p.id?'active':''}" data-feature="set-voice-profile" data-profile="${p.id}" style="text-align:left;cursor:pointer;border:2px solid ${extra.voiceProfile===p.id?'var(--accent)':'var(--line)'};padding:14px;border-radius:12px">
            <strong style="display:block;font-size:15px;margin-bottom:6px">${E(p.label[lang])}</strong>
            <p style="font-size:12px;line-height:1.5;margin-bottom:8px">${E(p.desc[lang])}</p>
            <span class="small-muted" style="font-size:11px">Pitch: ${p.pitch}× · Speed: ${p.rate}×</span>
          </button>
        `).join('')}
      </div>

      <div class="voice-controls-row" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px">
        <label class="field-label">${u('Tone & Pitch inflection','Tonhöhe & Intonation')}
          <select id="pitch-select">
            ${[
              [0.92,u('Deep & Official (0.92×)','Tief & Formell (0.92×)')],
              [0.96,u('Calm & Direct (0.96× · Killian)','Ruhig & Direkt (0.96× · Killian)')],
              [0.98,u('Patient & Reassuring (0.98× · Conrad)','Geduldig & Beruhigend (0.98× · Conrad)')],
              [1.00,u('Standard / Neutral (1.00×)','Standard / Ausgewogen (1.00×)')],
              [1.04,u('Warm & Empathetic (1.04× · Katja)','Warm & Einfühlsam (1.04× · Katja)')],
              [1.06,u('Gentle & Encouraging (1.06× · Amala)','Sanft & Ermutigend (1.06× · Amala)')],
              [1.08,u('Lively & Conversational (1.08× · Florian)','Lebendig & Modern (1.08× · Florian)')]
            ].map(([val,lbl])=>`<option value="${val}" ${Math.abs(extra.pitch-val)<0.02?'selected':''}>${lbl}</option>`).join('')}
          </select>
        </label>

        <label class="field-label">${u('Pacing & Speed','Sprechtempo')}
          <select id="rate-select">
            ${[
              [.85,u('0.85× (Slow & Patient)','0.85× (Ruhig & Deutlich)')],
              [.90,u('0.90× (Steady Comprehension · Conrad)','0.90× (Entspannt · Conrad)')],
              [.92,u('0.92× (Everyday German · Killian)','0.92× (Alltagsnah · Killian)')],
              [.94,u('0.94× (Gentle Warmth · Katja)','0.94× (Herzlich · Katja)')],
              [.95,u('0.95× (Calm Guidance · Amala)','0.95× (Ermutigend · Amala)')],
              [.98,u('0.98× (Conversational · Florian)','0.98× (Flüssig · Florian)')],
              [1,u('1.00× (Standard)','1.00× (Standard)')]
            ].map(([v,lbl])=>`<option value="${v}" ${Math.abs(extra.rate-v)<0.01?'selected':''}>${lbl}</option>`).join('')}
          </select>
        </label>
      </div>

      <div class="task-actions" style="margin-top:20px;display:flex;align-items:center;gap:12px">
        <button type="button" class="button primary" data-feature="test-voice">
          ▶ ${u('Preview current voice settings','Aktuelle Stimmeinstellungen testen')}
        </button>
        <span id="voice-preview-status" class="small-muted"></span>
      </div>

      <p id="audio-status" style="margin-top:16px">${u('Checking saved recordings…','Aufnahmen werden geprüft…')}</p>
    </section>`;
  }

  if(path==='cefr'){
    const selectedLevel=params.get('lvl')||extra.cefrLevel||'a1';
    const activeInfo=CEFR_LEVELS.find(l=>l.id===selectedLevel)||CEFR_LEVELS[0];
    const lessonsList=CEFR_LESSONS[selectedLevel]||[];

    return head(featureTitle(path,lang),u('Curriculum progression across CEFR levels. Transition from everyday basics to professional German and citizenship requirements.','GER-Stufenübersicht von den Grundlagen bis zur beruflichen Integration und Einbürgerung.'))+`
    <div class="skill-tabs">
      ${CEFR_LEVELS.map(l=>`<a class="tab ${selectedLevel===l.id?'active':''}" href="#cefr?lvl=${l.id}"><strong>${l.label}</strong> · ${E(l.name[lang].split('·')[1]||l.label)}</a>`).join('')}
    </div>

    <section class="card cefr-banner" style="margin-bottom:20px">
      <div class="section-heading" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:15px">
        <div>
          <h2>${E(activeInfo.name[lang])}</h2>
          <p>${E(activeInfo.summary[lang])}</p>
        </div>
        <button type="button" class="button ${extra.cefrLevel===selectedLevel?'secondary':'primary'}" data-feature="set-cefr" data-level="${selectedLevel}">
          ${extra.cefrLevel===selectedLevel?u('✓ Current active level','✓ Aktuelles Lernniveau'):u('Set as active level','Als aktives Niveau wählen')}
        </button>
      </div>
    </section>

    ${selectedLevel==='a1'?`
      <section class="card">
        <h2>${u('A1 Core Foundations','A1 Kern-Grundlagen')}</h2>
        <p>${u('Includes 75 micro-lessons, 300 practice tasks, flashcards and timed telc-style practice papers.','Enthält 75 Mikrolektionen, 300 Übungsaufgaben, Karteikarten und simulierte A1-Prüfungen.')}</p>
        <div class="lesson-grid" style="margin-top:16px">
          ${card('#course',u('75 A1 micro-lessons','75 A1-Mikrolektionen'),u('Start with greetings, articles, question words and everyday numbers.','Begrüßung, Artikel, Fragewörter und Alltagssituationen.'))}
          ${card('#practice',u('Four-skill practice paper','Vier Fertigkeiten üben'),u('Listening, reading, writing messages and speaking introductories.','Hören, Lesen, kurze Mitteilungen und Sprechtraining.'))}
        </div>
      </section>
    `:lessonsList.length?`
      <div class="lesson-grid">
        ${lessonsList.map(l=>`
          <section class="card lesson-card cefr-lesson-card">
            <div class="lesson-card-top">
              <span class="little-pill">${E(l.level)}</span>
              <span>${l.minutes} ${u('min','Min.')}</span>
            </div>
            <h2>${E(l.title[lang])}</h2>
            <p>${E(l.subtitle[lang])}</p>
            <div class="rule-block" style="margin:12px 0">
              <span class="eyebrow">${u('RULE','REGEL')}</span>
              <p>${E(l.rule[lang])}</p>
            </div>
            <h3>${u('Everyday Examples','Alltagsbeispiele')}</h3>
            <ul style="padding-left:18px;margin-bottom:15px">
              ${l.examples.map(([de,en])=>`<li><strong lang="de">${E(de)}</strong><br><small class="small-muted">${E(lang==='de'?de:en)}</small></li>`).join('')}
            </ul>
            <details class="cefr-quiz" style="margin-top:12px">
              <summary class="button secondary" style="cursor:pointer">${u('Try Quick Check','Schnellcheck ausprobieren')}</summary>
              <div style="padding-top:12px">
                <p lang="de"><strong>${E(l.quiz.prompt)}</strong></p>
                <div class="answer-options" style="margin-bottom:10px">
                  ${l.quiz.options.map((o,i)=>`<label class="answer-option"><input type="radio" name="cefr-quiz-${l.id}" value="${i}"> ${E(o)}</label>`).join('')}
                </div>
                <button type="button" class="button primary" data-feature="cefr-check" data-id="${l.id}" data-answer="${l.quiz.answer}" data-exp="${E(l.explanation[lang])}">${u('Check answer','Antwort prüfen')}</button>
                <div id="cefr-feedback-${l.id}" style="margin-top:10px"></div>
              </div>
            </details>
          </section>
        `).join('')}
      </div>
    `:''}`;
  }

  if(path==='pronunciation'){
    const profileKey=params.get('mode')||'statement';
    const profile=INTONATION_PROFILES[profileKey]||INTONATION_PROFILES.statement;
    const examples={
      statement:['Ich wohne und arbeite seit einem Jahr in Deutschland.','Guten Tag, mein Name ist Alex Schmidt.'],
      wQuestion:['Wo finde ich das Bürgeramt für die Anmeldung?','Wann hat die Ausländerbehörde morgen geöffnet?'],
      yesNoQuestion:['Haben Sie heute noch einen freien Termin für mich?','Können Sie die Meldebescheinigung ausdrucken?'],
      politeRequest:['Könnten Sie das bitte noch einmal langsam wiederholen?','Könnten Sie mir bitte die Durchwahl von Frau Wagner geben?']
    };
    const sampleSentences=examples[profileKey]||examples.statement;

    return head(featureTitle(path,lang),u('Visualise sentence melody and intonation contours. Real-time microphone analysis tracks your pitch against authentic German prosody.','Satzmelodie und Tonhöhenverlauf visualisieren. Mikrofonanalyse vergleicht Ihre Aussprache mit authentischer deutscher Prosodie.'))+`
    <div class="skill-tabs">
      ${Object.keys(INTONATION_PROFILES).map(k=>`<a class="tab ${profileKey===k?'active':''}" href="#pronunciation?mode=${k}">${E(INTONATION_PROFILES[k].name[lang])}</a>`).join('')}
    </div>

    <section class="card intonation-card">
      <div class="section-heading">
        <div>
          <h2>${E(profile.name[lang])}</h2>
          <p>${E(profile.rule[lang])}</p>
        </div>
        <span class="little-pill">${profileKey==='statement'||profileKey==='wQuestion'?u('Falling ↘','Fallend ↘'):u('Rising ↗','Steigend ↗')}</span>
      </div>

      <div class="stimulus" lang="de" style="margin:16px 0">
        ${sampleSentences.map(sent=>`
          <div style="display:flex;align-items:center;justify-content:space-between;margin:8px 0;gap:12px">
            <strong>${E(sent)}</strong>
            <button type="button" class="icon-button" data-action="speak-pronunciation" data-text="${E(sent)}" aria-label="${u('Listen','Anhören')}">▶</button>
          </div>
        `).join('')}
      </div>

      <h3>${u('Intonation Curve Visualiser','Satzmelodie-Visualisierung')}</h3>
      <p class="small-muted">${u('Blue dashed line: target native pitch. Green line: your live voice pitch contour.','Blaue gestrichelte Linie: Ziel-Tonhöhe. Grüne Linie: Ihre eigene Stimmkontur.')}</p>
      
      <div style="position:relative;margin:16px 0">
        <canvas id="pitch-canvas" width="640" height="180" class="pitch-canvas" style="width:100%;height:180px;background:var(--surface);border:1px solid var(--line);border-radius:12px"></canvas>
      </div>

      <div class="task-actions" style="display:flex;align-items:center;gap:12px">
        <button type="button" class="button primary" data-feature="pitch-toggle" data-profile="${profileKey}">
          <span class="pitch-indicator">🎙</span> ${u('Start microphone & match pitch','Mikrofon starten & Tonhöhe üben')}
        </button>
        <span id="pitch-status" class="small-muted">${u('Microphone idle. Click to start.','Mikrofon bereit. Klicken zum Starten.')}</span>
      </div>
      <div id="pitch-feedback" style="margin-top:12px"></div>
    </section>`;
  }

  if(path==='drills'){
    const mode=params.get('mode')||'kasus';
    if(!drill||drill.mode!==mode)drill=createDrill(mode);
    return drillView(drill,lang,head,u,extra);
  }

  if(path==='cv')return head(featureTitle(path,lang),u('Draft locally, preview, and print to PDF. Your text is not translated automatically.','Lokal schreiben, Vorschau ansehen und als PDF drucken. Ihr Text wird nicht automatisch übersetzt.'))+`${cvTools(extra,lang)}<div class="cv-layout"><section class="card"><label class="field-label">${u('Layout','Layout')}<select id="cv-template">${['classic','modern','compact'].map(t=>`<option ${extra.cvTemplate===t?'selected':''}>${t}</option>`).join('')}</select></label><form id="cv-form">${cvFields.map(([key,en,de])=>`<label class="field-label">${E(u(en,de))}<textarea rows="${['name','contact'].includes(key)?2:4}" maxlength="10000" name="${key}">${E(extra.cv[key]||'')}</textarea></label>`).join('')}</form><button class="button primary" data-feature="cv-print">${u('Print / Save as PDF','Drucken / Als PDF speichern')}</button><button class="button secondary" data-feature="cv-export">${u('Download draft','Entwurf herunterladen')}</button></section><article id="cv-preview" class="card cv-preview ${extra.cvTemplate}">${cvPreview(extra,lang)}</article></div>`;

  if(path==='games'||path==='level'){
    const mode=params.get('mode');
    if(path==='level'&&(!game||game.mode!=='readiness'))game=createGame('readiness');
    if(mode&&(!game||game.mode!==mode))game=createGame(mode);
    if(game&&(mode||path==='level'))return gameView(game,lang,head);
    return head(featureTitle(path,lang),u('Short rounds with immediate explanations. No pressure to race.','Kurze Runden mit direkten Erklärungen. Ohne Zeitdruck.'))+`<div class="lesson-grid">${[['articles','Article garden','Artikelgarten','Choose der, die or das.','Der, die oder das wählen.'],['words','Meaning match','Wortpaare','Match words to German meanings.','Wörter deutschen Bedeutungen zuordnen.'],['grammar','Grammar steps','Grammatik-Schritte','Complete short sentences.','Kurze Sätze ergänzen.'],['spelling','Listen & spell','Hören und schreiben','Listen, then type a word.','Hören und ein Wort schreiben.'],['order','Sentence workshop','Satzwerkstatt','Put words in order.','Wörter in die richtige Reihenfolge bringen.']].map(([id,en,de,e,d])=>card('#games?mode='+id,u(en,de),u(e,d))).join('')}</div><section class="card"><h2>${u('Recent rounds','Letzte Runden')}</h2>${extra.scores.map(s=>`<p>${E(s.mode)} · ${s.score}/${s.total}</p>`).join('')||'<p>—</p>'}</section>`;
  }

  return null;
}

function createDrill(mode){
  const items=DRILL_ITEMS[mode]||DRILL_ITEMS.kasus;
  const shuffled=[...items].sort(()=>Math.random()-.5);
  return {mode,items:shuffled,index:0,score:0,checked:false,correct:false,saved:false};
}

function drillView(d,lang,head,u,extra){
  if(d.index>=d.items.length){
    return head(u('Drill round complete','Trainingsrunde abgeschlossen'),`${d.score}/${d.items.length}`)+`
    <section class="card">
      <p>${u('Consistent daily drilling solidifies noun cases, adjective endings, and sentence structure.','Tägliches Wiederholen festigt Kasus, Adjektivendungen und Satzbau.')}</p>
      <button class="button primary" data-feature="drill-restart">${u('New drill round','Neue Trainingsrunde')}</button>
      <a class="button secondary" href="#drills" style="margin-left:10px">${u('Switch drill topic','Thema wechseln')}</a>
    </section>`;
  }

  const q=d.items[d.index];
  return head(u('Grammar mechanics drill','Grammatik-Mechanik'),`${d.index+1}/${d.items.length} · ${d.score} ${u('correct','richtig')}`)+`
  <div class="skill-tabs">
    ${DRILL_MODES.map(m=>`<a class="tab ${d.mode===m.id?'active':''}" href="#drills?mode=${m.id}">${E(m.name[lang])}</a>`).join('')}
  </div>

  <section class="card">
    <form id="drill-form">
      <h2 lang="de">${E(q.prompt)}</h2>
      <fieldset class="answer-options" lang="de">
        <legend>${u('Select correct ending or word:','Passende Endung oder Wort wählen:')}</legend>
        ${q.options.map((opt,i)=>`
          <label class="answer-option">
            <input type="radio" name="drill-answer" value="${i}" required ${d.checked?'disabled':''}>
            ${E(opt)}
          </label>
        `).join('')}
      </fieldset>

      ${d.checked?`
        <div class="feedback ${d.correct?'success':'wrong'}" style="margin:14px 0">
          <p>
            ${u(d.correct?'Correct!':'Rule check:',d.correct?'Richtig!':'Regelprüfung:')} 
            <strong lang="de">${E(q.options[q.answer])}</strong><br>
            <em>${E(q.rule)}</em><br>
            ${E(lang==='de'?q.de:q.en)}
          </p>
        </div>
        <button class="button primary" type="button" data-feature="drill-next">${u('Next','Weiter')}</button>
      `:`
        <button class="button primary" type="submit">${u('Check','Prüfen')}</button>
      `}
    </form>
  </section>`;
}

function createGame(mode){
  const nouns=vocabulary.filter(v=>/^(der|die|das) /.test(v.word));
  const pool=mode==='readiness'||mode==='grammar'?lessons.map(l=>({...l.quiz,explanation:l.explanation})):nouns.map((v,i)=>mode==='articles'?{prompt:v.word.replace(/^(der|die|das) /,''),options:['der','die','das'],answer:['der','die','das'].indexOf(v.word.split(' ')[0]),explanation:{en:v.word,de:v.word}}:mode==='words'?{prompt:v.word,options:[v.de,nouns[(i+1)%nouns.length].de,nouns[(i+2)%nouns.length].de],answer:0,explanation:{en:v.en,de:v.de}}:mode==='spelling'?{prompt:'Hören Sie das Wort und schreiben Sie es.',spoken:v.word,answer:v.word,explanation:{en:v.en,de:v.de}}:{prompt:'Bringen Sie die Wörter in die richtige Reihenfolge.',tokens:v.example.replace(/[.!?]$/,'').split(' ').reverse(),answer:v.example.replace(/[.!?]$/,''),explanation:{en:v.en,de:v.de}});
  const shuffled=[...pool].sort(()=>Math.random()-.5).slice(0,10).map(q=>{if(!q.options)return q;const pairs=q.options.map((v,i)=>({v,right:i===q.answer})).sort(()=>Math.random()-.5);return {...q,options:pairs.map(p=>p.v),answer:pairs.findIndex(p=>p.right)};});
  return {mode,items:shuffled,index:0,score:0,checked:false,correct:false,picked:[],saved:false};
}

function gameView(g,lang,head){
  const u=(en,de)=>U(lang,en,de);
  if(g.index>=g.items.length)return head(u('Round complete','Runde beendet'),`${g.score}/${g.items.length}`)+`<section class="card"><p>${u('Use your results to choose what to review. This short check does not certify a CEFR level.','Nutzen Sie das Ergebnis zum Wiederholen. Dieser kurze Check bestätigt kein GER-Niveau.')}</p><a class="button primary" href="#course">${u('Review lessons','Lektionen wiederholen')}</a><button class="button secondary" data-feature="game-restart">${u('New round','Neue Runde')}</button><a href="#games">${u('All games','Alle Spiele')}</a></section>`;
  const q=g.items[g.index];
  return head(g.mode==='readiness'?u('A1 readiness check','A1-Lernstand prüfen'):u('Practice round','Übungsrunde'),`${g.index+1}/${g.items.length} · ${g.score} ${u('correct','richtig')}`)+`<section class="card"><form id="game-form"><h2 lang="de">${E(q.prompt)}</h2>${q.options?`<fieldset class="answer-options" lang="de"><legend>${u('Choose an answer','Antwort wählen')}</legend>${q.options.map((o,i)=>`<label class="answer-option"><input type="radio" name="game-answer" value="${i}" required ${g.checked?'disabled':''}>${E(o)}</label>`).join('')}</fieldset>`:q.tokens?`<div class="word-tiles">${q.tokens.map((word,i)=>`<button type="button" data-token="${i}" ${g.picked.includes(i)||g.checked?'disabled':''}>${E(word)}</button>`).join('')}</div><p lang="de">${g.picked.map(i=>E(q.tokens[i])).join(' ')||'…'}</p><button type="button" data-feature="game-undo" ${g.checked?'disabled':''}>↶</button>`:`<button type="button" data-action="speak-game">▶ ${u('Listen','Anhören')}</button><label class="field-label">${u('Word with article','Wort mit Artikel')}<input name="game-answer" required ${g.checked?'disabled':''}></label>`}${g.checked?`<div class="feedback ${g.correct?'success':'wrong'}"><p>${u(g.correct?'Correct':'Try again next round',g.correct?'Richtig':'In der nächsten Runde wieder versuchen')} · <strong lang="de">${E(q.options?q.options[q.answer]:q.answer)}</strong><br>${E(q.explanation[lang])}</p></div><button class="button primary" type="button" data-feature="game-next">${u('Next','Weiter')}</button>`:`<button class="button primary" type="submit">${u('Check','Prüfen')}</button>`}</form></section>`;
}

export function cvPreview(extra,lang){
  const u=(en,de)=>U(lang,en,de);
  return `<span class="eyebrow">${u('CURRICULUM VITAE','LEBENSLAUF')}</span><h1>${E(extra.cv.name||u('Your name','Ihr Name'))}</h1><p class="cv-contact">${E(extra.cv.contact)}</p>${cvFields.slice(2).filter(([key])=>extra.cv[key]?.trim()).map(([key,en,de])=>`<section><h2>${E(u(en,de))}</h2><p>${E(extra.cv[key]).replace(/\n/g,'<br>')}</p></section>`).join('')}`;
}

export function installFeatures(app,{getState,getExtra,save,render,speak,stopAudio}){
  installCVTools(app,{getExtra,getLang:()=>getState().lang,save,render});

  app.addEventListener('click',async e=>{
    const extra=getExtra(),lang=getState().lang;
    const b=e.target.closest('button[data-theme],[data-feature],[data-token],[data-action]');
    if(!b)return;

    if(b.dataset.theme){
      extra.theme=b.dataset.theme;save();
      document.documentElement.dataset.theme=extra.theme;
      document.querySelectorAll('button[data-theme]').forEach(x=>{
        x.setAttribute('aria-pressed',String(x.dataset.theme===extra.theme));
        x.classList.toggle('selected',x.dataset.theme===extra.theme);
      });
      const menu=b.closest('.palette-menu');if(menu)menu.open=false;
      document.querySelector('.palette-menu summary')?.focus();
    }

    if(b.dataset.token!==undefined&&game&&!game.checked){
      const i=Number(b.dataset.token);
      if(!game.picked.includes(i))game.picked.push(i);
      render();
    }

    const action=b.dataset.feature;

    // Situation Interactive Runner Handlers
    if(b.dataset.action==='start-situation'){
      const sid=b.dataset.id;
      situationSession={id:sid,index:0,picked:null,checked:false};
      render();
      const runner=document.querySelector('#situation-runner');
      if(runner)runner.scrollIntoView({behavior:'smooth'});
      return;
    }
    if(b.dataset.action==='answer-situation'){
      if(situationSession&&!situationSession.checked){
        situationSession.picked=Number(b.dataset.index);
        situationSession.checked=true;
        render();
      }
      return;
    }
    if(b.dataset.action==='close-situation'){
      situationSession=null;
      render();
      return;
    }
    if(b.dataset.action==='speak-word-hero'){
      const word=b.dataset.word||'die Hilfsbereitschaft';
      speak(word,b);
      return;
    }
    if(b.dataset.action==='check-hero-word'){
      const isCorrect=b.dataset.correct==='true';
      const fb=document.querySelector('#hero-word-feedback');
      if(fb){
        fb.innerHTML=`
          <div class="feedback ${isCorrect?'success':'wrong'}" style="margin-top:10px">
            <strong>${isCorrect?(lang==='de'?'✓ Richtig! „die Hilfsbereitschaft“ passt perfekt.':'✓ Correct! “die Hilfsbereitschaft” is the exact word.'):(lang==='de'?'✕ Leider nicht. Richtig ist: „die Hilfsbereitschaft“.':'✕ Incorrect. The correct word is “die Hilfsbereitschaft”.')}</strong>
          </div>
        `;
      }
      return;
    }
    // Stop persona voice
    if(b.dataset.action==='stop-persona'){
      stopAudio?.();
      const st=document.querySelector('#voice-preview-status');
      if(st)st.textContent=lang==='de'?'Wiedergabe angehalten.':'Audio playback stopped.';
      return;
    }

    // Free Native Voice Apply & Playback
    if(action==='apply-persona'){
      const pId=b.dataset.id||'katja';
      const pPitch=Number(b.dataset.pitch)||1.04;
      const pRate=Number(b.dataset.rate)||0.94;
      const pName=b.dataset.name||'';
      const pVoice=b.dataset.voice||'';
      extra.activePersona=pId;
      extra.pitch=pPitch;
      extra.rate=pRate;
      if(pVoice)extra.voice=pVoice;
      save();
      render();
      const st=document.querySelector('#voice-preview-status');
      if(st)st.textContent=lang==='de'?`✓ ${pName} erfolgreich als aktive Lernstimme für alle Übungen aktiviert!`:`✓ ${pName} successfully activated as your learning voice for all exercises!`;
      return;
    }

    if(b.dataset.action==='speak-persona'){
      const text=b.dataset.text||'';
      const audioUrl=b.dataset.audio||'';
      const pId=b.dataset.id||'katja';
      const pName=b.dataset.name||'';

      stopAudio?.();
      const st=document.querySelector('#voice-preview-status');
      if(st)st.textContent=lang==='de'?`Wiedergabe von ${pName}…`:`Playing ${pName} sample…`;

      let played=false;
      if(audioUrl){
        try{
          played=await playAudioFile(audioUrl,b,()=>{
            if(st)st.textContent=lang==='de'?'Wiedergabe beendet.':'Sample finished.';
          });
        }catch{}
      }
      if(!played){
        try{
          played=await playTTS(text,pId,b,()=>{
            if(st)st.textContent=lang==='de'?'Wiedergabe beendet.':'Sample finished.';
          });
        }catch{}
      }
      if(!played){
        speak(text,b);
      }
      return;
    }

    // Emotional Voice Settings
    if(action==='set-voice-profile'){
      const pid=b.dataset.profile;
      if(voiceProfiles[pid]){
        extra.voiceProfile=pid;
        extra.pitch=voiceProfiles[pid].pitch;
        extra.rate=voiceProfiles[pid].rate;
        save();
        render();
      }
    }

    if(action==='test-voice'){
      const text=lang==='de'?'Guten Tag! Schön, dass Sie Deutsch lernen. Wie kann ich Ihnen heute helfen?':'Hello! Wonderful that you are learning German. How can I help you today?';
      speak(text,b);
      const st=document.querySelector('#voice-preview-status');
      if(st)st.textContent=lang==='de'?'Stimme wird abgespielt…':'Playing sample…';
    }

    // CEFR Level Switcher
    if(action==='set-cefr'){
      const lvl=b.dataset.level;
      if(['a1','a2','b1'].includes(lvl)){
        extra.cefrLevel=lvl;
        save();
        render();
      }
    }

    if(action==='cefr-check'){
      const id=b.dataset.id,target=Number(b.dataset.answer),exp=b.dataset.exp;
      const checkedInput=document.querySelector(`input[name="cefr-quiz-${id}"]:checked`);
      const fb=document.querySelector(`#cefr-feedback-${id}`);
      if(!checkedInput){if(fb)fb.innerHTML=`<span class="small-muted">${lang==='de'?'Bitte zuerst eine Option wählen.':'Please select an option first.'}</span>`;return;}
      const correct=Number(checkedInput.value)===target;
      if(fb)fb.innerHTML=`<div class="feedback ${correct?'success':'wrong'}"><p>${correct?(lang==='de'?'Richtig! ':'Correct! '):(lang==='de'?'Noch einmal probieren: ':'Review: ')}<strong>${E(exp)}</strong></p></div>`;
    }

    // Pronunciation & Pitch Trainer
    if(b.dataset.action==='speak-pronunciation'){
      speak(b.dataset.text,b);
    }

    if(action==='pitch-toggle'){
      const canvas=document.querySelector('#pitch-canvas');
      const statusEl=document.querySelector('#pitch-status');
      const feedbackEl=document.querySelector('#pitch-feedback');
      const profileKey=b.dataset.profile||'statement';
      const profile=INTONATION_PROFILES[profileKey]||INTONATION_PROFILES.statement;

      if(pitchSession){
        pitchSession.stop();
        pitchSession=null;
        b.innerHTML=`<span class="pitch-indicator">🎙</span> ${lang==='de'?'Mikrofon starten & Tonhöhe üben':'Start microphone & match pitch'}`;
        if(statusEl)statusEl.textContent=lang==='de'?'Aufnahme beendet.':'Recording stopped.';
        return;
      }

      if(!navigator.mediaDevices?.getUserMedia){
        if(statusEl)statusEl.textContent=lang==='de'?'Mikrofonzugriff in diesem Browser nicht unterstützt.':'Microphone access not supported in this browser.';
        return;
      }

      try {
        const stream=await navigator.mediaDevices.getUserMedia({audio:true});
        const audioCtx=new(window.AudioContext||window.webkitAudioContext)();
        const source=audioCtx.createMediaStreamSource(stream);
        const analyser=audioCtx.createAnalyser();
        analyser.fftSize=2048;
        source.connect(analyser);

        const buffer=new Float32Array(analyser.fftSize);
        const userContour=[];
        let active=true;

        b.innerHTML=`<span class="pitch-indicator">⏹</span> ${lang==='de'?'Zuhören läuft… Stoppen':'Listening… Stop'}`;
        if(statusEl)statusEl.textContent=lang==='de'?'Sprechen Sie jetzt den Zielsatz laut ins Mikrofon!':'Speak the target sentence aloud now!';

        const tick=()=>{
          if(!active)return;
          analyser.getFloatTimeDomainData(buffer);
          const hz=detectPitch(buffer,audioCtx.sampleRate);
          if(hz&&hz>=80&&hz<=400){
            userContour.push(hz);
            if(userContour.length>60)userContour.shift();
          }
          drawPitchCanvas(canvas,profile.target,userContour);
          requestAnimationFrame(tick);
        };
        drawPitchCanvas(canvas,profile.target,[]);
        requestAnimationFrame(tick);

        pitchSession={
          stop:()=>{
            active=false;
            stream.getTracks().forEach(t=>t.stop());
            audioCtx.close().catch(()=>{});
            if(userContour.length>5&&feedbackEl){
              const firstThird=userContour.slice(0,Math.floor(userContour.length/3));
              const lastThird=userContour.slice(-Math.floor(userContour.length/3));
              const avgFirst=firstThird.reduce((a,b)=>a+b,0)/(firstThird.length||1);
              const avgLast=lastThird.reduce((a,b)=>a+b,0)/(lastThird.length||1);
              const userTrend=avgLast-avgFirst;
              const expectRise=profile.target[profile.target.length-1]>profile.target[0];
              const match=(expectRise&&userTrend>5)||(!expectRise&&userTrend<-5);
              feedbackEl.innerHTML=`<div class="feedback ${match?'success':'wrong'}"><p>${match?(lang==='de'?'Hervorragend! Ihre Intonationskurve entspricht der deutschen Sprachmelodie.':'Great job! Your intonation contour matches the target German prosody.'):(lang==='de'?'Üben Sie die Endung: Am Satzende die Stimme bewusst heben oder senken.':'Tip: Pay attention to the sentence ending (rise for requests, fall for statements).')}</p></div>`;
            }
          }
        };
      } catch(err){
        if(statusEl)statusEl.textContent=lang==='de'?'Mikrofonerlaubnis verweigert.':'Microphone permission denied.';
      }
    }

    // Drills Navigation
    if(action==='drill-next'&&drill){
      drill.index++;
      drill.checked=false;
      if(drill.index===drill.items.length&&!drill.saved){
        extra.scores.push({mode:`drill-${drill.mode}`,score:drill.score,total:drill.items.length});
        extra.scores=extra.scores.slice(-20);
        drill.saved=true;
        save();
      }
      render();
    }
    if(action==='drill-restart'&&drill){
      drill=createDrill(drill.mode);
      render();
    }

    // Games Navigation
    if(action==='game-next'&&game){
      game.index++;game.checked=false;game.picked=[];
      if(game.index===game.items.length&&!game.saved){
        extra.scores.push({mode:game.mode,score:game.score,total:game.items.length});
        extra.scores=extra.scores.slice(-20);
        game.saved=true;
        save();
      }
      render();
    }
    if(action==='game-undo'&&game){game.picked.pop();render();}
    if(action==='game-restart'&&game){game=createGame(game.mode);render();}
    if(b.dataset.action==='speak-game'&&game)speak(game.items[game.index].spoken,b);

    if(action==='cv-print')window.print();
    if(action==='cv-export'){
      const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(extra.cv,null,2)],{type:'application/json'}));
      a.href=url;a.download='everyday-german-cv.json';a.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
    }
  });

  app.addEventListener('submit',e=>{
    if(e.target.id==='drill-form'&&drill&&!drill.checked){
      e.preventDefault();
      const q=drill.items[drill.index];
      const raw=new FormData(e.target).get('drill-answer');
      drill.correct=Number(raw)===q.answer;
      drill.score+=Number(drill.correct);
      drill.checked=true;
      render();
      return;
    }

    if(e.target.id==='game-form'&&game&&!game.checked){
      e.preventDefault();
      const q=game.items[game.index],raw=new FormData(e.target).get('game-answer');
      const answer=q.tokens?game.picked.map(i=>q.tokens[i]).join(' '):raw;
      game.correct=q.options?Number(answer)===q.answer:String(answer||'').trim().toLocaleLowerCase('de')===q.answer.toLocaleLowerCase('de');
      game.score+=Number(game.correct);
      game.checked=true;
      render();
      return;
    }
  });

  app.addEventListener('input',e=>{
    if(e.target.closest('#cv-form')){
      const extra=getExtra();
      extra.cv[e.target.name]=e.target.value;
      save();
      document.querySelector('#cv-preview').innerHTML=cvPreview(extra,getState().lang);
    }
  });

  app.addEventListener('change',e=>{
    const extra=getExtra();
    if(e.target.dataset.goal){
      const key=e.target.dataset.goal;
      extra.goals=extra.goals.filter(x=>x!==key);
      if(e.target.checked)extra.goals.push(key);
      save();render();
    }
    if(e.target.id==='voice-select'){extra.voice=e.target.value;save();}
    if(e.target.id==='pitch-select'){extra.pitch=Number(e.target.value);save();}
    if(e.target.id==='rate-select'){extra.rate=Number(e.target.value);save();}
    if(e.target.id==='cv-template'){extra.cvTemplate=e.target.value;save();render();}
  });
}
