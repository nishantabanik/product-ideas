// Transparent, local text heuristics. No hiring recommendations or third-party ATS claims.
const stop=new Set('the and for with from that this your you our are will have has must should can all any per job role team work working experience skills required requirements responsibilities using need build about company der die das den dem des ein eine einer einen einem und oder mit für von zu zur zum ist sind wir sie ihr ihre ihre im in auf am an als bei nach vor aus auch nicht sowie über unter werden wird sich sehr gute guten kenntnisse erfahrung aufgaben profil bieten suchen berufserfahrung qualifications qualification years jahr jahre'.split(' '));
export const tokenize=text=>String(text).normalize('NFKC').toLocaleLowerCase('de') .match(/[\p{L}\p{N}][\p{L}\p{N}+#.-]*/gu)?.map(x=>x.replace(/[.-]+$/g,''))||[];
export function analyzeCV(cv,jd){
 const text=String(cv).trim(),description=String(jd).trim();
 if(text.length<80)throw Error('cv-short');if(description.length<80)throw Error('jd-short');
 const counts=new Map();for(const t of tokenize(description))if(t.length>=3&&!stop.has(t)&&!/^\d+$/.test(t))counts.set(t,(counts.get(t)||0)+1);
 const terms=[...counts].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,40).map(([t])=>t);
 const cvTerms=new Set(tokenize(text));const found=terms.filter(t=>cvTerms.has(t)),missing=terms.filter(t=>!cvTerms.has(t));
 const checks=[
  {id:'contact',pass:/[^\s@]+@[^\s@]+\.[^\s@]+/.test(text)},
  {id:'experience',pass:/\b(experience|employment|berufserfahrung|beruflicher werdegang|tätigkeiten)\b/i.test(text)},
  {id:'education',pass:/\b(education|ausbildung|studium|bildung)\b/i.test(text)},
  {id:'skills',pass:/\b(skills|kenntnisse|kompetenzen|fähigkeiten)\b/i.test(text)},
  {id:'dates',pass:/\b(19|20)\d{2}\b/.test(text)},
  {id:'bullets',pass:/(^|\n)\s*[-•–]/.test(text)},
 ];
 return {coverage:terms.length?Math.round(found.length/terms.length*100):null,found,missing,checks,wordCount:tokenize(text).length};
}
const sectionKeys={profile:'profile',summary:'profile',profil:'profile',kurzprofil:'profile',experience:'experience','work experience':'experience',employment:'experience',berufserfahrung:'experience','beruflicher werdegang':'experience',education:'education',ausbildung:'education',studium:'education',certificates:'certificates',certifications:'certificates',zertifikate:'certificates','weiterbildung & zertifikate':'certificates',internships:'internships',praktika:'internships',languages:'languages',sprachen:'languages',skills:'skills',kenntnisse:'skills',kompetenzen:'skills',interests:'interests',interessen:'interests'};
export function importSections(text){
 const out={};let current='profile';const lines=String(text).split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
 // Preserve every line even when a source does not use recognizable section headings.
 const first=lines[0]||'';const skip=/^(curriculum vitae|lebenslauf|resume|cv)$/i.test(first);
 const nameIndex=skip?1:0;const candidate=lines[nameIndex]||'';
 if(candidate.length<80&&!sectionKeys[candidate.toLowerCase()]&&!candidate.includes('@')){out.name=candidate;}
 for(const [i,line] of lines.entries()){
  if((i===0&&skip)||(i===nameIndex&&out.name))continue;
  const key=sectionKeys[line.toLowerCase().replace(/:$/,'')];if(key){current=key;continue;}
  out[current]=(out[current]?out[current]+'\n':'')+line;
 }
 return out;
}
