import {exercises, lessons} from './content.js';
import {CEFR_LESSONS} from './cefr.js';
import {LEVEL_EXERCISES} from './level-exercises.js';
import {telcPaperExercises} from './telc-exams.js';
import {practiceUnits} from './practice-units.js';
import {followups} from './practice-followups.js';
import {grammarItems} from './practice-grammar.js';
import {PRACTICE_BANK, GRAMMAR_MAP} from './practice-bank.js';
import {LEVEL_WORDS} from './vocabulary-bank.js';

export const levels = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
export const practiceAreas = {
  lesen: ['Reading', 'Lesen'],
  hoeren: ['Listening', 'Hören'],
  schreiben: ['Writing', 'Schreiben'],
  sprechen: ['Speaking', 'Sprechen'],
  grammar: ['Grammar', 'Grammatik'],
  vocabulary: ['Vocabulary', 'Wortschatz']
};
export function practiceLevel(value){
  const level=String(value||'').toLowerCase();
  return levels.includes(level)?level:'a1';
}

const examIds = new Set(telcPaperExercises.map(item => item.id));
const basePractice = exercises.filter(item => !examIds.has(item.id));

// Practice-bank items already carry a normalised `skill` (set at the source).
const bankItemsByLevel = level => Object.values(PRACTICE_BANK[level]||{}).flat();

function choice(base, [prompt, correct, ...distractors], explanation){
  const options = [...distractors];
  const answer = [...base.id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % (options.length + 1);
  options.splice(answer, 0, correct);
  return {...base, type:'choice', prompt, options, answer, explanation};
}

function productive(base, type, [prompt, model]){
  const explanation = type === 'writing'
    ? {en:'Check how your text responds to the task and fits its audience. Compare your phrasing with the sample.', de:'Prüfen Sie, ob Ihr Text die Aufgabe erfüllt und zur Zielgruppe passt. Vergleichen Sie Ihre Formulierungen mit dem Beispiel.'}
    : {en:'Say your answer aloud before opening the example. Compare how clearly you explain your main point.', de:'Sprechen Sie Ihre Antwort laut, bevor Sie das Beispiel öffnen. Vergleichen Sie, wie klar Ihr Hauptgedanke wird.'};
  return {...base, type, prompt, model, explanation};
}

const synthesis = {
  a2: ['Schreiben Sie eine kurze Nachricht: Was ist neu und was soll die andere Person tun?', 'Erklären Sie zuerst die Ausgangslage und nennen Sie dann die Änderung.'],
  b1: ['Fassen Sie die Situation und die zweite Perspektive schriftlich für jemanden zusammen, der beides nicht kennt.', 'Erklären Sie den Unterschied zwischen den beiden Aussagen und schlagen Sie einen nächsten Schritt vor.'],
  b2: ['Schreiben Sie eine kurze Zusammenfassung beider Quellen. Unterscheiden Sie belegte Angaben und Schlussfolgerungen.', 'Nennen Sie je eine Information aus beiden Quellen, die für eine Entscheidung wichtig wäre. Begründen Sie Ihre Auswahl.'],
  c1: ['Verdichten Sie beide Quellen zu einer kurzen Sachnotiz. Machen Sie kenntlich, wo eine Einschränkung hinzukommt.', 'Vermitteln Sie beide Positionen in einem mündlichen Briefing. Kennzeichnen Sie, was offenbleibt.'],
  c2: ['Verfassen Sie eine knappe redaktionelle Notiz. Arbeiten Sie heraus, auf welche unausgesprochene Annahme die zweite Quelle reagiert.', 'Paraphrasieren Sie die beiden Argumente für ein fachfremdes Publikum. Erhalten Sie dabei Vorbehalte und Bedeutungsnuancen.']
};

export const newPracticeItems = levels.flatMap(level => [
  ...practiceUnits[level].flatMap(([title,text,reading,transcript,listening,writing,speaking,[term,...meanings]], index) => {
    const base = skill => ({id:['practice',level,index+1,skill].join('-'), level, skill, title});
    const evidence = ([,answer]) => ({en:'Look for evidence for “'+answer+'” in the passage.', de:'Achten Sie auf die Textstelle, die „'+answer+'“ stützt.'});
    const transfer = synthesis[level];
    const [summary,readStatement,readTrue,listenStatement,listenTrue] = followups[level]?.[index]||[];
    const verify = (skill,source,statement,truth) => choice({
      ...base(skill),id:base(skill).id+'-detail',title:title+' · Detail',...source
    },[statement,truth?'Richtig':'Falsch',truth?'Falsch':'Richtig'],{
      en:truth?'The statement is supported by the source.':'The source does not support this statement.',
      de:truth?'Die Aussage stimmt mit der Quelle überein.':'Die Aussage stimmt mit der Quelle nicht überein.'
    });
    return [
      choice({...base('lesen'),text},reading,evidence(reading)),
      choice({...base('hoeren'),transcript},listening,{en:'Listen again to find the detail or reasoning behind the answer.', de:'Hören Sie erneut und achten Sie auf das passende Detail oder die Begründung.'}),
      productive({...base('schreiben'),text},'writing',writing),
      productive({...base('sprechen'),text},'speaking',speaking),
      ...(transfer?[
        verify('lesen',{text},readStatement,readTrue),
        verify('hoeren',{transcript},listenStatement,listenTrue),
        productive({...base('schreiben'), id:base('schreiben').id+'-transfer', title:title+' · Zusammenfassung', text, transcript},
          'writing',[transfer[0],summary]),
        productive({...base('sprechen'), id:base('sprechen').id+'-transfer', title:title+' · Mündlicher Bericht', text, transcript},
          'speaking',[transfer[1],summary])
      ]:[]),
      choice({...base('vocabulary'), title:term, text},['Was bedeutet „'+term+'“?',...meanings],{en:term+' means: '+meanings[0]+'.',de:term+' bedeutet hier: '+meanings[0]+'.'})
    ];
  }),
  ...grammarItems[level].map(([en,de,prompt,options,enRule,deRule], index) =>
    choice({id:['practice',level,'grammar',index+1].join('-'), level, skill:'grammar', title:de, topic:[en,de]},[prompt,...options],{en:enRule,de:deRule}))
]);

export const practiceByLevel = Object.fromEntries(levels.map(level => [
  level,
  [...(level==='a1'?basePractice:LEVEL_EXERCISES[level]||[]), ...newPracticeItems.filter(item => item.level===level), ...bankItemsByLevel(level)]
]));

// Level-graded vocabulary for the Wortschatz area (A1 uses the core list).
export const vocabByLevel = Object.fromEntries(levels.map(level => [
  level,
  level==='a1' ? null : LEVEL_WORDS.filter(w => w.level===level)
]));

const lessonById = id => allLessonsForTopics.find(lesson => lesson.id===id);
const allLessonsForTopics = [...lessons, ...Object.values(CEFR_LESSONS).flat()];

// Grammar curriculum for every level: lessons, drills and practice-bank
// exercises grouped by topic (sources: existing A1 units, CEFR lessons,
// GRAMMAR_MAP taxonomy, grammar-drills modes).
export const grammarLessonGroups = Object.fromEntries(levels.map(level => [
  level,
  (GRAMMAR_MAP[level]||[]).map(topic => ({
    topic: [topic.en, topic.topic],
    lessons: topic.lessons.map(lessonById).filter(Boolean),
    drills: topic.drills||[],
    exercises: (PRACTICE_BANK[level]?.grammatik||[]).filter(q=>q.type==='choice'||q.type==='input')
  }))
]));
