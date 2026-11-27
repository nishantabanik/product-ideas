// ============================================================
// PRACTICE BANK — innovative exercise formats per CEFR level
// Formats: cloze (Lückentext), dictation (Diktat), errorfix
// (Fehlerjagd), wordorder (Satzbau), situation (Was sagen Sie?),
// transform (Umschreiben), reading & listening comprehension.
// ============================================================

export const PRACTICE_CATEGORIES = [
  { id: 'lesen',     icon: '📖', color: '#10b981', name: { en: 'Reading', de: 'Lesen' },        desc: { en: 'Texts, emails, ads and signs with comprehension tasks.', de: 'Texte, E-Mails, Anzeigen und Schilder mit Verständnisfragen.' } },
  { id: 'hoeren',    icon: '🎧', color: '#3b82f6', name: { en: 'Listening', de: 'Hören' },      desc: { en: 'Announcements and dialogues with audio, plus dictation.', de: 'Durchsagen und Dialoge mit Audio und Diktaten.' } },
  { id: 'schreiben', icon: '✍️', color: '#f59e0b', name: { en: 'Writing', de: 'Schreiben' },     desc: { en: 'Messages, letters and transformation drills.', de: 'Nachrichten, Briefe und Umschreibungen.' } },
  { id: 'sprechen',  icon: '🗣️', color: '#ec4899', name: { en: 'Speaking', de: 'Sprechen' },    desc: { en: 'Situation prompts with live pronunciation scoring.', de: 'Situationen mit Live-Aussprachebewertung.' } },
  { id: 'grammatik', icon: '⚙️', color: '#8b5cf6', name: { en: 'Grammar', de: 'Grammatik' },     desc: { en: 'Error hunts, cloze tests and sentence building.', de: 'Fehlerjagd, Lückentexte und Satzbau.' } },
  { id: 'wortschatz',icon: '🗂️', color: '#14b8a6', name: { en: 'Vocabulary', de: 'Wortschatz' },desc: { en: 'Level-graded word packs with smart flashcards.', de: 'Niveaubasierte Wortpakete mit intelligenten Karten.' } }
];

const ex = (id, level, cat, o) => ({ id: `pb-${level}-${id}`, level, cat, skill: cat==='grammatik'?'grammar':cat==='wortschatz'?'vocabulary':cat, ...o });

export const PRACTICE_BANK = {
  // ==================== A1 ====================
  a1: {
    grammatik: [
      ex('g1','a1','grammatik',{ type:'choice', title:'Fehlerjagd: Artikel', part:1, text:'Ich habe ein Apfel gekauft.', prompt:'Wo ist der Fehler? Wählen Sie den korrekten Satz.', options:['Ich habe einen Apfel gekauft.','Ich habe eine Apfel gekauft.','Ich habe dem Apfel gekauft.'], answer:0, explanation:{en:'„Apfel“ is masculine — the accusative of „ein“ is „einen“.',de:'„Apfel“ ist maskulin — der Akkusativ von „ein“ ist „einen“.'} }),
      ex('g2','a1','grammatik',{ type:'choice', title:'Fehlerjagd: Verb', part:1, text:'Du heiße Anna.', prompt:'Wo ist der Fehler? Wählen Sie den korrekten Satz.', options:['Du heißen Anna.','Du heißt Anna.','Du heißest Anna.'], answer:1, explanation:{en:'„du“ takes „heißt“: du heißt.',de:'Zu „du“ gehört „heißt“.'} }),
      ex('g3','a1','grammatik',{ type:'wordorder', title:'Satzbau: Frage', part:2, tokens:['kommt','Wann','der','Bus','?'], answer:'Wann kommt der Bus?', explanation:{en:'W-question: question word first, verb second.',de:'W-Frage: Fragewort zuerst, Verb an zweiter Stelle.'} }),
      ex('g4','a1','grammatik',{ type:'wordorder', title:'Satzbau: Aussage', part:2, tokens:['am','Ich','lerne','Montag','Deutsch','.'], answer:'Ich lerne am Montag Deutsch.', explanation:{en:'Subject first, verb second, time expression early.',de:'Subjekt zuerst, Verb an zweiter Stelle, Zeitangabe früh.'} }),
      ex('g5','a1','grammatik',{ type:'input', title:'Lückentext: Akkusativ', part:3, text:'Ich sehe ___ Mann dort. (der Mann)', prompt:'Setzen Sie das richtige Wort ein.', answer:'den', explanation:{en:'Masculine accusative: der → den.',de:'Maskulin Akkusativ: der → den.'} }),
      ex('g6','a1','grammatik',{ type:'input', title:'Lückentext: sein/haben', part:3, text:'Wir ___ heute keine Zeit.', prompt:'Setzen Sie das richtige Verb ein.', answer:'haben', explanation:{en:'Plural subject „wir“ takes „haben“.',de:'„Wir“ verlangt „haben“.'} })
    ],
    hoeren: [
      ex('h1','a1','hoeren',{ type:'input', dictation:true, title:'Diktat: Im Café', part:1, transcript:'Ich trinke gern Kaffee mit Milch.', prompt:'Hören Sie und schreiben Sie den Satz.', answer:'Ich trinke gern Kaffee mit Milch.', explanation:{en:'„gern“ expresses enjoying an activity.',de:'„gern“ drückt aus, dass man etwas mag.'} }),
      ex('h2','a1','hoeren',{ type:'input', dictation:true, title:'Diktat: Bahnhof', part:1, transcript:'Der Zug fährt um zehn Uhr ab.', prompt:'Hören Sie und schreiben Sie den Satz.', answer:'Der Zug fährt um zehn Uhr ab.', explanation:{en:'„abfahren“ is separable: „fährt … ab“.',de:'„abfahren“ ist trennbar: „fährt … ab“.'} }),
      ex('h3','a1','hoeren',{ type:'input', dictation:true, title:'Diktat: Termin', part:2, transcript:'Ich habe am Freitag einen Termin.', prompt:'Hören Sie und schreiben Sie den Satz.', answer:'Ich habe am Freitag einen Termin.', explanation:{en:'Days use „am“; the appointment is masculine accusative.',de:'Wochentage mit „am“; „einen Termin“ ist Akkusativ.'} })
    ],
    lesen: [
      ex('l1','a1','lesen',{ type:'input', title:'E-Mail verstehen: Lücke', part:1, text:'Hallo Lisa,\nich komme ___ Samstag zu deiner Party. Soll ich etwas mitbringen?\nLiebe Grüße\nTom', prompt:'Welches Wort passt in die Lücke? (am / im / um)', answer:'am', explanation:{en:'Days of the week take „am“.',de:'Wochentage verlangen „am“.'} }),
      ex('l2','a1','lesen',{ type:'choice', title:'Schild verstehen', part:2, text:'AUSHANG\nBitte hier nicht rauchen. Danke!', prompt:'Was dürfen Sie hier nicht tun?', options:['Rauchen','Sprechen','Essen'], answer:0, explanation:{en:'„nicht rauchen“ means smoking is forbidden.',de:'„Nicht rauchen“ bedeutet: Rauchen ist verboten.'} })
    ],
    schreiben: [
      ex('s1','a1','schreiben',{ type:'writing', title:'Umschreiben: du → Sie', part:1, prompt:'Schreiben Sie die Nachricht höflich um. Verwenden Sie „Sie“.\n\n„Kannst du mir bitte helfen? Ich brauche deine Adresse.“', points:['Höfliche Anrede','Sie-Form','Frage nach die Adresse'], model:'Können Sie mir bitte helfen? Ich brauche Ihre Adresse.', explanation:{en:'With „Sie“, verbs end in -en and possessives become „Ihre“.',de:'Bei „Sie“ enden Verben auf -en, Possessivartikel wird „Ihre“.'} }),
      ex('s2','a1','schreiben',{ type:'writing', title:'Nachricht schreiben: Termin', part:2, prompt:'Sie kommen morgen nicht zum Deutschkurs. Schreiben Sie eine kurze Nachricht an Ihre Lehrerin (ca. 30 Wörter).', points:['Grund nennen','Wann Sie wiederkommen','Höflicher Gruß'], model:'Guten Tag Frau Kern,\nich bin morgen krank und kann nicht zum Kurs kommen. Am Donnerstag komme ich wieder.\nVielen Dank!\nA. Schmidt', explanation:{en:'Include reason, return date and a polite closing.',de:'Nennen Sie Grund, Rückkehrdatum und Grußformel.'} })
    ],
    sprechen: [
      ex('p1','a1','sprechen',{ type:'choice', title:'Situation: Begrüßung', part:1, text:'Sie treffen Ihre Nachbarin um 9 Uhr morgens.', prompt:'Was sagen Sie?', options:['Guten Morgen!','Gute Nacht!','Guten Appetit!'], answer:0, explanation:{en:'Until about 11 a.m. Germans say „Guten Morgen“.',de:'Bis ca. 11 Uhr sagt man „Guten Morgen“.'} }),
      ex('p2','a1','sprechen',{ type:'choice', title:'Situation: Im Laden', part:2, text:'Sie möchten wissen, was das T-Shirt kostet.', prompt:'Was sagen Sie?', options:['Wie viel kostet das T-Shirt?','Wo kostet das T-Shirt?','Wann kostet das T-Shirt?'], answer:0, explanation:{en:'Prices are asked with „Wie viel“.',de:'Preise fragt man mit „Wie viel“ ab.'} })
    ]
  },

  // ==================== A2 ====================
  a2: {
    grammatik: [
      ex('g1','a2','grammatik',{ type:'choice', title:'Fehlerjagd: Perfekt', part:1, text:'Ich habe gestern meinen Freund gesuchst.', prompt:'Wo ist der Fehler? Wählen Sie den korrekten Satz.', options:['Ich habe gestern meinen Freund gesucht.','Ich habe gestern meinen Freund gesuche.','Ich habe gestern meinen Freund suchten.'], answer:0, explanation:{en:'Weak verbs form the Partizip II with ge-…-t: gesucht.',de:'Schwachverben bilden das Partizip II mit ge-…-t: gesucht.'} }),
      ex('g2','a2','grammatik',{ type:'choice', title:'Fehlerjagd: Dativ', part:1, text:'Ich helfe den alten Mann über die Straße.', prompt:'Wo ist der Fehler? Wählen Sie den korrekten Satz.', options:['Ich helfe dem alten Mann über die Straße.','Ich helfe der alten Mann über die Straße.','Ich helfe das alten Mann über die Straße.'], answer:0, explanation:{en:'„helfen“ takes Dativ; masculine Dativ is „dem“.',de:'„helfen“ verlangt Dativ; maskulin Dativ ist „dem“.'} }),
      ex('g3','a2','grammatik',{ type:'wordorder', title:'Satzbau: weil', part:2, tokens:['Ich','komme','weil','ich','später','bin','krank','.'], answer:'Ich komme später, weil ich krank bin.', explanation:{en:'„weil“ sends the conjugated verb to the end of the clause.',de:'„weil“ schickt das konjugierte Verb ans Satzende.'} }),
      ex('g4','a2','grammatik',{ type:'input', title:'Lückentext: Präteritum', part:3, text:'Als Kind ___ ich in Bonn. (wohnen, Präteritum)', prompt:'Setzen Sie die richtige Verbform ein.', answer:'wohnte', explanation:{en:'Regular verbs form the Präteritum with -te: wohnte.',de:'Regelmäßige Verben bilden das Präteritum mit -te: wohnte.'} }),
      ex('g5','a2','grammatik',{ type:'input', title:'Lückentext: Komparativ', part:3, text:'Berlin ist ___ als Bonn. (groß)', prompt:'Setzen Sie die Komparativform ein.', answer:'größer', explanation:{en:'Comparative of „groß“ is „größer“.',de:'Der Komparativ von „groß“ ist „größer“.'} }),
      ex('g6','a2','grammatik',{ type:'input', title:'Lückentext: reflexiv', part:3, text:'Ich freue ___ auf das Wochenende.', prompt:'Setzen Sie das richtige Reflexivpronomen ein.', answer:'mich', explanation:{en:'„sich freuen auf“ — with „ich“ it becomes „mich“.',de:'„sich freuen auf“ — bei „ich“ heißt es „mich“.'} })
    ],
    hoeren: [
      ex('h1','a2','hoeren',{ type:'input', dictation:true, title:'Diktat: Anrufbeantworter', part:1, transcript:'Ihr Termin am Donnerstag wurde auf Montag verschoben.', prompt:'Hören Sie und schreiben Sie den Satz.', answer:'Ihr Termin am Donnerstag wurde auf Montag verschoben.', explanation:{en:'„verschieben auf“ — the new date follows „auf“.',de:'„verschieben auf“ — das neue Datum folgt auf „auf“.'} }),
      ex('h2','a2','hoeren',{ type:'input', dictation:true, title:'Diktat: Einkaufszentrum', part:2, transcript:'Der Aufzug befindet sich neben dem Haupteingang.', prompt:'Hören Sie und schreiben Sie den Satz.', answer:'Der Aufzug befindet sich neben dem Haupteingang.', explanation:{en:'„sich befinden“ is reflexive; Dativ after „neben“ for location.',de:'„sich befinden“ ist reflexiv; nach „neben“ steht Dativ (Wo?).' } }),
      ex('h3','a2','hoeren',{ type:'choice', title:'Verständnis: Bahnhofsdurchsage', part:3, transcript:'Achtung: Der Regionalexpress nach Koblenz fällt heute wegen Bauarbeiten aus. Ersatz-SEVs fahren ab Gleis 11. Bitte beachten Sie die geänderten Abfahrtszeiten an der Anzeigetafel.', prompt:'Warum fährt der Zug nach Koblenz nicht?', options:['Wegen Bauarbeiten','Wegen eines Streiks','Wegen schlechten Wetters'], answer:0, explanation:{en:'The announcement names „Bauarbeiten“ as the reason.',de:'Die Durchsage nennt „Bauarbeiten“ als Grund.'} })
    ],
    lesen: [
      ex('l1','a2','lesen',{ type:'input', title:'Hausordnung: Lücke', part:1, text:'Bitte werfen Sie Ihren Müll ___ die richtige Tonne.', prompt:'Welche Präposition passt?', answer:'in', explanation:{en:'Movement into something takes „in“ + Akkusativ.',de:'Bewegung in etwas hinein verlangt „in“ + Akkusativ.'} }),
      ex('l2','a2','lesen',{ type:'choice', title:'Kleinanzeige verstehen', part:2, text:'SUCHE: 2-Zimmer-Wohnung, max. 600 € warm, ab sofort, lange Laufzeit bevorzugt. Nichtraucher, keine Haustiere.', prompt:'Wer passt zur Anzeige?', options:['Ein Raucher mit Katze','Ein Nichtraucher ohne Haustiere','Jemand mit Hund'], answer:1, explanation:{en:'The ad explicitly excludes smokers and pets.',de:'Die Anzeige schließt Raucher und Haustiere aus.'} })
    ],
    schreiben: [
      ex('s1','a2','schreiben',{ type:'writing', title:'Umschreiben: informal → formal', part:1, prompt:'Schreiben Sie die Nachricht formell um.\n\n„Hey, ich kann morgen nicht kommen. Ist das okay?“', points:['Formelle Anrede','Höfliche Entschuldigung','Frage nach Verständnis'], model:'Sehr geehrte Damen und Herren,\nleider kann ich morgen nicht zu dem Termin kommen. Wäre es möglich, einen neuen Termin zu vereinbaren?\nMit freundlichen Grüßen', explanation:{en:'Formal register: „Sehr geehrte…“, „leider“, „Mit freundlichen Grüßen“.',de:'Formelles Register: „Sehr geehrte…“, „leider“, „Mit freundlichen Grüßen“.'} }),
      ex('s2','a2','schreiben',{ type:'writing', title:'Krankmeldung schreiben', part:2, prompt:'Schreiben Sie eine kurze Krankmeldung an Ihren Chef (ca. 40 Wörter). Nennen Sie: Grund, Attest, Erreichbarkeit.', points:['Krankheit melden','Attest ankündigen','Erreichbarkeit nennen'], model:'Guten Tag Herr Weber,\nleider bin ich heute krank und kann nicht arbeiten. Ich werde heute zum Arzt gehen und schicke Ihnen morgen die Krankmeldung. Bei dringenden Fragen bin ich per E-Mail erreichbar.\nMit freundlichen Grüßen', explanation:{en:'Short, factual, with the three key points.',de:'Kurz, sachlich, mit den drei Kernpunkten.'} })
    ],
    sprechen: [
      ex('p1','a2','sprechen',{ type:'choice', title:'Situation: Arztpraxis', part:1, text:'Die Arzthelferin fragt nach Ihrer Versichertenkarte, aber Sie haben sie vergessen.', prompt:'Was sagen Sie?', options:['Entschuldigung, ich habe sie zu Hause vergessen.','Ich bin dagegen.','Das ist nicht Ihr Problem.'], answer:0, explanation:{en:'Own the mistake politely and explain.',de:'Fehler höflich zugeben und erklären.'} }),
      ex('p2','a2','sprechen',{ type:'choice', title:'Situation: Termin absagen', part:2, text:'Sie müssen einen Termin beim Amt absagen.', prompt:'Was sagen Sie am Telefon?', options:['Ich muss leider meinen Termin absagen. Geht es am Mittwoch?','Termin kaputt.','Ich will nicht.'], answer:0, explanation:{en:'Cancel politely and propose an alternative.',de:'Höflich absagen und Alternative vorschlagen.'} })
    ]
  },

  // ==================== B1 ====================
  b1: {
    grammatik: [
      ex('g1','b1','grammatik',{ type:'choice', title:'Fehlerjagd: Konjunktiv II', part:1, text:'Wenn ich mehr Zeit hätte, wäre ich gereist.', prompt:'Wo ist der Fehler? Wählen Sie den korrekten Satz.', options:['Wenn ich mehr Zeit hätte, würde ich reisen.','Wenn ich mehr Zeit haben würde, wäre ich gereist.','Wenn ich mehr Zeit hätte, reiste ich bin.'], answer:0, explanation:{en:'Standard Konjunktiv II: „hätte … würde reisen“.',de:'Üblicher Konjunktiv II: „hätte … würde reisen“.'} }),
      ex('g2','b1','grammatik',{ type:'choice', title:'Fehlerjagd: Passiv', part:1, text:'Das Formular wurde von mir ausgefüllt worden.', prompt:'Wo ist der Fehler? Wählen Sie den korrekten Satz.', options:['Das Formular wurde von mir ausgefüllt.','Das Formular ist von mir ausgefüllt worden.','Das Formular hat von mir ausgefüllt.'], answer:0, explanation:{en:'Simple past passive: „wurde + Partizip II“.',de:'Vorgangspassiv Präteritum: „wurde + Partizip II“.'} }),
      ex('g3','b1','grammatik',{ type:'wordorder', title:'Satzbau: Relativsatz', part:2, tokens:['Der','Mann','der','dort','steht','ist','mein','Nachbar','.'], answer:'Der Mann, der dort steht, ist mein Nachbar.', explanation:{en:'The relative pronoun follows the noun directly; verb goes to the end of the relative clause.',de:'Das Relativpronomen folgt direkt auf das Nomen; Verb ans Ende des Relativsatzes.'} }),
      ex('g4','b1','grammatik',{ type:'input', title:'Lückentext: Genitiv', part:3, text:'Das ist das Auto ___ Nachbarn. (der Nachbar)', prompt:'Setzen Sie die Genitivform ein.', answer:'meines', explanation:{en:'Genitiv masculine: des/meines Nachbarn.',de:'Genitiv maskulin: des/meines Nachbarn.'} }),
      ex('g5','b1','grammatik',{ type:'input', title:'Lückentext: indirekte Frage', part:3, text:'Können Sie mir sagen, wo der Bahnhof ___?', prompt:'Setzen Sie das Verb an die richtige Stelle (ein Wort).', answer:'ist', explanation:{en:'Indirect questions are subordinate clauses: verb at the end.',de:'Indirekte Fragen sind Nebensätze: Verb am Ende.'} })
    ],
    hoeren: [
      ex('h1','b1','hoeren',{ type:'input', dictation:true, title:'Diktat: Agentur für Arbeit', part:1, transcript:'Die Anerkennung Ihrer Qualifikation dauert etwa drei Monate.', prompt:'Hören Sie und schreiben Sie den Satz.', answer:'Die Anerkennung Ihrer Qualifikation dauert etwa drei Monate.', explanation:{en:'Long nominal phrases are typical for official German (Behördendeutsch).',de:'Lange Nominalphrasen sind typisch für das Behördendeutsch.'} }),
      ex('h2','b1','hoeren',{ type:'input', dictation:true, title:'Diktat: Radiobeitrag', part:2, transcript:'Immer mehr Unternehmen bieten ihren Mitarbeitern flexible Arbeitszeitmodelle an.', prompt:'Hören Sie und schreiben Sie den Satz.', answer:'Immer mehr Unternehmen bieten ihren Mitarbeitern flexible Arbeitszeitmodelle an.', explanation:{en:'„anbieten“ is separable — the prefix closes the sentence.',de:'„anbieten“ ist trennbar — das Präfix schließt den Satz.'} }),
      ex('h3','b1','hoeren',{ type:'choice', title:'Verständnis: Nachrichtensendung', part:3, transcript:'Die Bundesregierung plant eine Reform der Fachkräfteeinwanderung. Künftig sollen qualifizierte Bewerber aus Drittländern auch ohne formale Berufsanerkennung zunächst arbeiten dürfen, sofern sie einen Arbeitsvertrag vorweisen können.', prompt:'Was ist geplant?', options:['Qualifizierte Bewerber sollen leichter arbeiten dürfen.','Die Einwanderung soll komplett gestoppt werden.','Nur EU-Bürger dürfen arbeiten.'], answer:0, explanation:{en:'The reform eases entry for skilled workers from third countries.',de:'Die Reform erleichtert Fachkräften aus Drittländern den Einstieg.'} })
    ],
    lesen: [
      ex('l1','b1','lesen',{ type:'input', title:'Mietvertrag: Lücke', part:1, text:'Der Mieter ist verpflichtet, Schäden ___ Vermieter unverzüglich anzuzeigen.', prompt:'Setzen Sie das richtige Verb ein. (Hinweis: trennbares Verb, eine Wortform)', answer:'anzuzeigen', explanation:{en:'After „verpflichtet …“ the infinitive with „zu“ is used: an|zu|zeigen.',de:'Nach „verpflichtet“ folgt der Infinitiv mit „zu“: an|zu|zeigen.'} }),
      ex('l2','b1','lesen',{ type:'choice', title:'Artikel: Homeoffice', part:2, text:'Seit der Pandemie arbeiten Millionen Deutsche im Homeoffice. Doch rechtlich bleibt die Lage unklar: Ein gesetzlicher Anspruch auf Homeoffice existiert bislang nicht. Gewerkschaften fordern deshalb eine gesetzliche Regelung, die Arbeitnehmern mindestens zwölf Homeoffice-Tage pro Jahr garantiert.', prompt:'Was fordern die Gewerkschaften?', options:['Einen gesetzlichen Anspruch auf Homeoffice-Tage','Ein Verbot von Homeoffice','Höhere Gehälter für alle'], answer:0, explanation:{en:'The text says unions demand a legal rule guaranteeing home office days.',de:'Der Text nennt die Forderung nach einer gesetzlichen Homeoffice-Garantie.'} })
    ],
    schreiben: [
      ex('s1','b1','schreiben',{ type:'writing', title:'Umschreiben: Aktiv → Passiv', part:1, prompt:'Formen Sie den Satz ins Passiv um.\n\n„Die Behörde bearbeitet den Antrag innerhalb von vier Wochen.“', points:['Passiv-Form','Zeitangabe erhalten','Sachlich bleiben'], model:'Der Antrag wird von der Behörde innerhalb von vier Wochen bearbeitet.', explanation:{en:'Vorgangspassiv: „wird + Partizip II“; the agent follows with „von“.',de:'Vorgangspassiv: „wird + Partizip II“; der Urheber folgt mit „von“.'} }),
      ex('s2','b1','schreiben',{ type:'writing', title:'Beschwerde schreiben', part:2, prompt:'Ihr Internet funktioniert seit fünf Tagen nicht. Der Kundenservice reagiert nicht. Schreiben Sie eine förmliche Beschwerde (ca. 70 Wörter): Sachverhalt, bisherige Versuche, Forderung mit Frist.', points:['Sachverhalt schildern','Bisherige Kontaktversuche','Frist setzen und Konsequenz nennen'], model:'Sehr geehrte Damen und Herren,\nseit dem 3. März habe ich keinen Internetanschluss mehr. Ich habe dreimal Ihre Hotline kontaktiert und zwei E-Mails geschrieben, jedoch ohne Ergebnis. Ich fordere Sie auf, den Anschluss bis zum 15. März wiederherzustellen. Andernfalls werde ich den Vertrag kündigen und die Verbraucherzentrale einschalten.\nMit freundlichen Grüßen', explanation:{en:'Clear structure: facts → attempts → deadline → consequence.',de:'Klarer Aufbau: Sachverhalt → Versuche → Frist → Konsequenz.'} })
    ],
    sprechen: [
      ex('p1','b1','sprechen',{ type:'choice', title:'Situation: Meinungsäußerung', part:1, text:'In einer Diskussion über Homeoffice sagen Sie Ihre Meinung.', prompt:'Welcher Satz passt am besten?', options:['Meiner Meinung nach bringt Homeoffice mehr Konzentration, sofern man einen ruhigen Arbeitsplatz hat.','Homeoffice ist gut schlecht manchmal.','Ich habe keine Meinung über nichts.'], answer:0, explanation:{en:'„Meiner Meinung nach“ + qualified statement is B1 style.',de:'„Meiner Meinung nach“ + eingeschränkte Aussage ist typisch B1.'} }),
      ex('p2','b1','sprechen',{ type:'choice', title:'Situation: Gespräch beim Amt', part:2, text:'Der Beamte spricht sehr schnell und Sie verstehen etwas nicht.', prompt:'Was sagen Sie?', options:['Entschuldigung, könnten Sie das bitte langsamer wiederholen?','Sprechen Sie Deutsch richtig!','Ich verstehe nie etwas.'], answer:0, explanation:{en:'Politely ask for a slower repetition.',de:'Höflich um langsamere Wiederholung bitten.'} })
    ]
  },

  // ==================== B2 ====================
  b2: {
    grammatik: [
      ex('g1','b2','grammatik',{ type:'choice', title:'Fehlerjagd: Konnektoren', part:1, text:'Obwohl er krank war, aber er kam zur Arbeit.', prompt:'Wo ist der Fehler? Wählen Sie den korrekten Satz.', options:['Obwohl er krank war, kam er zur Arbeit.','Obwohl er krank war, aber kam er zur Arbeit.','Obwohl er war krank, er kam zur Arbeit.'], answer:0, explanation:{en:'„obwohl“ occupies position 0 alone — no „aber“ needed; verb comes first after the clause.',de:'„obwohl“ belegt allein Position 0; danach folgt das finite Verb.'} }),
      ex('g2','b2','grammatik',{ type:'choice', title:'Fehlerjagd: Genus', part:1, text:'Die Studie hat die Ergebnis der Umfrage widerlegt.', prompt:'Wo ist der Fehler? Wählen Sie den korrekten Satz.', options:['Die Studie hat das Ergebnis der Umfrage widerlegt.','Die Studie hat den Ergebnis der Umfrage widerlegt.','Die Studie hat der Ergebnis der Umfrage widerlegt.'], answer:0, explanation:{en:'„Ergebnis“ is neuter: das Ergebnis → accusative „das Ergebnis“.',de:'„Ergebnis“ ist neutral: das Ergebnis → Akkusativ „das Ergebnis“.'} }),
      ex('g3','b2','grammatik',{ type:'wordorder', title:'Satzbau: Partizipialattribut', part:2, tokens:['Der','vom','Vorstand','beschlossene','Plan','trat','in','Kraft','.'], answer:'Der vom Vorstand beschlossene Plan trat in Kraft.', explanation:{en:'Extended participial attribute sits between article and noun.',de:'Das erweiterte Partizipialattribut steht zwischen Artikel und Nomen.'} }),
      ex('g4','b2','grammatik',{ type:'input', title:'Lückentext: Konjunktiv I (indirekte Rede)', part:3, text:'Der Minister sagte, die Reform ___ noch in diesem Jahr beschlossen. (werden, Konjunktiv I)', prompt:'Setzen Sie die Konjunktiv-I-Form ein.', answer:'werde', explanation:{en:'Reported speech uses Konjunktiv I: er werde …',de:'Indirekte Rede nutzt Konjunktiv I: er werde …' } }),
      ex('g5','b2','grammatik',{ type:'input', title:'Lückentext: subjektive Modalbedeutung', part:3, text:'Er muss die Prüfung bestanden haben — er ___ sich schon gefreut. (wissen / vermuten: ein Wort)', prompt:'Welches Modalverb mit subjektiver Bedeutung passt?', answer:'muss', explanation:{en:'Subjective „muss“ expresses a confident deduction.',de:'Subjektives „muss“ drückt eine sichere Vermutung aus.'} })
    ],
    hoeren: [
      ex('h1','b2','hoeren',{ type:'input', dictation:true, title:'Diktat: Teamsitzung', part:1, transcript:'Wir müssen die Projekte priorisieren, um die Ressourcen optimal zu nutzen.', prompt:'Hören Sie und schreiben Sie den Satz.', answer:'Wir müssen die Projekte priorisieren, um die Ressourcen optimal zu nutzen.', explanation:{en:'„um … zu“ expresses purpose; infinitive construction stays together.',de:'„um … zu“ drückt Ziel aus; der Infinitiv bleibt zusammen.'} }),
      ex('h2','b2','hoeren',{ type:'input', dictation:true, title:'Diktat: Podiumsdiskussion', part:2, transcript:'Die Digitalisierung wird den Arbeitsmarkt langfristig stärker verändern als jede Reform zuvor.', prompt:'Hören Sie und schreiben Sie den Satz.', answer:'Die Digitalisierung wird den Arbeitsmarkt langfristig stärker verändern als jede Reform zuvor.', explanation:{en:'Comparative „stärker als“ + Futur I for prediction.',de:'Komparativ „stärker als“ + Futur I für die Vorhersage.'} }),
      ex('h3','b2','hoeren',{ type:'choice', title:'Verständnis: Fachvortrag', part:3, transcript:'Unsere Daten zeigen ein klares Muster: Teams, die in kurzen, regelmäßigen Zyklen arbeiten, liefern nicht nur schneller, sondern auch mit deutlich weniger Fehlern. Der entscheidende Faktor ist dabei nicht die Technologie, sondern die Taktung der Zusammenarbeit selbst.', prompt:'Was ist der entscheidende Faktor?', options:['Die Taktung der Zusammenarbeit','Die verwendete Technologie','Die Teamgröße'], answer:0, explanation:{en:'The speaker explicitly rules out technology and names the collaboration rhythm.',de:'Der Sprecher nennt die Taktung der Zusammenarbeit als Kernfaktor.'} })
    ],
    lesen: [
      ex('l1','b2','lesen',{ type:'input', title:'Richtlinie: Lücke', part:1, text:'Mitarbeiter sind verpflichtet, personenbezogene Daten ausschließlich ___ den freigegebenen Systemen zu verarbeiten.', prompt:'Welche Präposition passt?', answer:'in', explanation:{en:'Data is processed „in“ a system — standard in privacy directives.',de:'Daten werden „in“ einem System verarbeitet — Standard in Datenschutzrichtlinien.'} }),
      ex('l2','b2','lesen',{ type:'choice', title:'Kommentar: Digitalisierung', part:2, text:'Wird die Vier-Tage-Woche zum neuen Standard? Skeptiker verweisen auf Produktionsengpässe und Servicegarantien. Befürworter wiederum berufen sich auf Studien, die bei verkürzter Wochenarbeitszeit eine höhere Produktivität pro Stunde nachweisen. Realistisch dürfte ein Mittelweg sein: flexible Modelle, bei denen Teams ihre Arbeitszeit weitgehend selbst steuern.', prompt:'Welche Position vertritt der Autor?', options:['Einen Mittelweg mit flexiblen Modellen','Eine klare Ablehnung','Vollständige Unterstützung ohne Einschränkungen'], answer:0, explanation:{en:'The conclusion proposes a compromise with flexible models.',de:'Das Fazit schlägt einen Kompromiss mit flexiblen Modellen vor.'} })
    ],
    schreiben: [
      ex('s1','b2','schreiben',{ type:'writing', title:'Umschreiben: Verbalstil → Nominalstil', part:1, prompt:'Formen Sie den Satz in den Nominalstil um.\n\n„Weil das Unternehmen schnell wächst, muss es neue Mitarbeiter einstellen.“', points:['Nomen für „wachsen“','Nomen für „einstellen“','Logische Verbindung (durch / deshalb)'], model:'Aufgrund des schnellen Wachstums des Unternehmens ist die Einstellung neuer Mitarbeiter erforderlich.', explanation:{en:'Nominalstil packs actions into nouns connected by prepositions.',de:'Der Nominalstil packt Handlungen in Nomina mit Präpositionen.'} }),
      ex('s2','b2','schreiben',{ type:'writing', title:'Stellungnahme schreiben', part:2, prompt:'Schreiben Sie eine Stellungnahme für das Mitarbeitermagazin: „Sollte Ihr Unternehmen die Vier-Tage-Woche testen?“ (ca. 100 Wörter)', points:['Einleitung & Position','Argumente mit Belegen','Gegenposition würdigen','Fazit'], model:'Die Diskussion über die Vier-Tage-Woche verdient auch bei uns eine ernsthafte Prüfung. Internationale Studien zeigen, dass verkürzte Arbeitszeiten die Produktivität pro Stunde steigern und Fluktuation senken. Gleichzeitig darf die Erreichbarkeit unserer Kunden nicht leiden. Ein rollierendes Modell, bei dem Teams abwechselnd freigestellt werden, könnte beide Ziele verbinden. Ich plädiere deshalb für einen sechsmonatigen Pilotversuch mit klaren Kennzahlen.', explanation:{en:'Balanced argumentation: position → evidence → counterpoint → concrete proposal.',de:'Balancierte Argumentation: Position → Belege → Gegenposition → konkreter Vorschlag.'} })
    ],
    sprechen: [
      ex('p1','b2','sprechen',{ type:'choice', title:'Situation: Verhandeln', part:1, text:'Ihr Chef lehnt Ihren Homeoffice-Antrag ab. Sie reagieren professionell.', prompt:'Was sagen Sie?', options:['Ich verstehe Ihre Bedenken. Könnten wir einen Kompromiss finden, etwa zwei feste Homeoffice-Tage pro Woche?','Das ist ungerecht, ich kündige.','Egal, mache ich trotzdem.'], answer:0, explanation:{en:'Acknowledge, then propose a concrete compromise.',de:'Verständnis zeigen, dann konkreten Kompromiss vorschlagen.'} }),
      ex('p2','b2','sprechen',{ type:'choice', title:'Situation: Präsentation eröffnen', part:2, text:'Sie eröffnen eine Präsentation vor Kollegen.', prompt:'Welcher Einstieg passt?', options:['Sehr geehrte Kolleginnen und Kollegen, heute möchte ich Ihnen unsere neuen Prozesse vorstellen.','Hallo Leute, ich rede jetzt mal.','Ihr wisst ja alles schon, also kurz.'], answer:0, explanation:{en:'Professional B2 register with clear structural announcement.',de:'Professionelles B2-Register mit klarer Strukturankündigung.'} })
    ]
  },

  // ==================== C1 ====================
  c1: {
    grammatik: [
      ex('g1','c1','grammatik',{ type:'choice', title:'Fehlerjagd: Partizipialkonstruktion', part:1, text:'Die von der Kommission entwickelnde Richtlinie wurde verschärft.', prompt:'Wo ist der Fehler? Wählen Sie den korrekten Satz.', options:['Die von der Kommission entwickelte Richtlinie wurde verschärft.','Die von der Kommission entwickelnde Richtlinie war verschärft.','Die von der Kommission entwickelnde Richtlinie wurde verschärfen.'], answer:0, explanation:{en:'Past passive participle (Partizip II) as attribute: entwickelt.',de:'Das Partizip II dient hier als Attribut: entwickelt.'} }),
      ex('g2','c1','grammatik',{ type:'choice', title:'Fehlerjagd: erweiterter Konnektor', part:1, text:'Insofern die Zahlen stimmen, dass die Reform erfolgreich war.', prompt:'Wo ist der Fehler? Wählen Sie den korrekten Satz.', options:['Sofern die Zahlen stimmen, war die Reform erfolgreich.','Insofern die Zahlen stimmen, dass die Reform erfolgreich war.','Sofern die Zahlen stimmen, dass die Reform erfolgreich.'], answer:0, explanation:{en:'„sofern“ introduces a conditional subordinate clause with normal verb placement.',de:'„sofern“ leitet einen konditionalen Nebensatz mit normaler Verbstellung ein.'} }),
      ex('g3','c1','grammatik',{ type:'wordorder', title:'Satzbau: Nominalisierung', part:2, tokens:['Die','während','der','Sitzung','erfolgte','Verabschiedung','sorgte','für','Kritik','.'], answer:'Die während der Sitzung erfolgte Verabschiedung sorgte für Kritik.', explanation:{en:'Complex attribute with prepositional phrase between article and noun.',de:'Komplexes Attribut mit Präpositionalgruppe zwischen Artikel und Nomen.'} }),
      ex('g4','c1','grammatik',{ type:'input', title:'Lückentext: Konjunktiv I', part:3, text:'Der Berichterstatter führt an, die Kommission ___ keine abgesprochenen Zahlen veröffentlicht zu haben. (wollen, Konjunktiv I)', prompt:'Setzen Sie die Konjunktiv-I-Form ein (ein Wort).', answer:'wolle', explanation:{en:'Indirect speech in the past uses Konjunktiv I + Infinitiv II.',de:'Vergangene indirekte Rede nutzt Konjunktiv I + Infinitiv II.'} })
    ],
    hoeren: [
      ex('h1','c1','hoeren',{ type:'input', dictation:true, title:'Diktat: Vorlesung', part:1, transcript:'Die empirische Datenlage lässt darauf schließen, dass der Effekt maßgeblich kontextabhängig ist.', prompt:'Hören Sie und schreiben Sie den Satz.', answer:'Die empirische Datenlage lässt darauf schließen, dass der Effekt maßgeblich kontextabhängig ist.', explanation:{en:'Academic register: „lässt darauf schließen, dass“.',de:'Akademisches Register: „lässt darauf schließen, dass“.'} }),
      ex('h2','c1','hoeren',{ type:'input', dictation:true, title:'Diktat: Verhandlung', part:2, transcript:'Unter Berücksichtigung der geänderten Rahmenbedingungen erscheint eine Anpassung der Vertragsklausel geboten.', prompt:'Hören Sie und schreiben Sie den Satz.', answer:'Unter Berücksichtigung der geänderten Rahmenbedingungen erscheint eine Anpassung der Vertragsklausel geboten.', explanation:{en:'Nominalstil typical of legal German.',de:'Nominalstil, typisch für Juristendeutsch.'} }),
      ex('h3','c1','hoeren',{ type:'choice', title:'Verständnis: Podiumsdiskussion', part:3, transcript:'Wenn wir die Netzausbau-Investitionen nicht binnen fünf Jahren massiv subventionieren, dann werden die volkswirtschaftlichen Folgekosten das heutige Haushaltsdefizit um ein Vielfaches übersteigen. Die Schuldenbremse und die Transformation schließen sich nicht a priori aus, sofern die Mittel strikt wertschöpfend investiert werden.', prompt:'Welche Kernaussage trifft der Redner?', options:['Investitionen in Netze sind wirtschaftlich günstiger als deren Unterlassung.','Die Schuldenbremse darf nie gelockert werden.','Subventionen sind grundsätzlich schädlich.'], answer:0, explanation:{en:'The speaker argues inaction costs multiples of the investment.',de:'Der Redner argumentiert, Untätigkeit kostet ein Vielfaches.'} })
    ],
    lesen: [
      ex('l1','c1','lesen',{ type:'input', title:'Gutachten: Lücke', part:1, text:'Der Kläger beruft sich ___ eine Entscheidung des Bundesverwaltungsgerichts aus dem Jahr 2019.', prompt:'Welche Präposition passt?', answer:'auf', explanation:{en:'„sich berufen auf“ + Akkusativ.',de:'„sich berufen auf“ + Akkusativ.'} }),
      ex('l2','c1','lesen',{ type:'choice', title:'Essay: KI in der Wissenschaft', part:2, text:'Der Einzug generativer Sprachmodelle erzwingt eine Neukonzeption akademischer Prüfungsformate. Während reine Literaturreproduktion obsolet wird, gewinnt die dialogische Verteidigung im Kolloquium an Relevanz. Hochschuldidaktiker fordern mithin keinen Verbotskurs, sondern die Vermittlung reflektierter Urteilskraft im Umgang mit diesen Systemen.', prompt:'Welche Schlussfolgerung ziehen Hochschuldidaktiker?', options:['Statt Verbote: KI-Kompetenz vermitteln und Prüfungsformate anpassen.','KI-Tools sollten vollständig verboten werden.','Künftig soll KI die Prüfungen bewerten.'], answer:0, explanation:{en:'„keinen Verbotskurs, sondern…“ signals the alternative they advocate.',de:'„keinen Verbotskurs, sondern…“ nennt die befürwortete Alternative.'} })
    ],
    schreiben: [
      ex('s1','c1','schreiben',{ type:'writing', title:'Umschreiben: Nominalstil → Verbalstil', part:1, prompt:'Formen Sie den Satz in den Verbalstil um.\n\n„Nach der Unterzeichnung des Vertrags erfolgte die Umsetzung der Maßnahmen.“', points:['Verben für „Unterzeichnung“ und „Umsetzung“','Satzgefüge oder Satzverbindung','Stilniveau erhalten'], model:'Nachdem der Vertrag unterzeichnet worden war, wurden die Maßnahmen umgesetzt.', explanation:{en:'Verbalstil unpacks nominalizations into clauses.',de:'Der Verbalstil entpackt Nominalisierungen in Nebensätze.'} }),
      ex('s2','c1','schreiben',{ type:'writing', title:'Expertenstellungnahme', part:2, prompt:'Schreiben Sie eine differenzierte Stellungnahme (ca. 120 Wörter): „Sollte die Zwei-Klassen-Medizin in Deutschland zulasten der Gesetzlichen Krankenversicherung erlaubt bleiben?“', points:['Problemaufriss','Pro-Argument','Contra-Argument','Schlussfolgerung mit Vermittlung'], model:'Die Debatte über privatärztliche Zusatzleistungen berührt das Fundament der Solidargemeinschaft. Befürworter verweisen auf kürzere Wartezeiten und Innovationsoptionen, die über private Zahlungen finanziert würden. Kritiker hingegen warnen vor einer Aushöhlung des Gleichbehandlungsgrundsatzes, wonach die medizinische Versorgung nicht an der Zahlungsfähigkeit hängen darf. Eine grenzenlos freie Zwei-Klassen-Medizin würde den Solidarbeitrag nachhaltig beschädigen. Daher erscheint eine eng begrenzte, transparente Regelung mit klarer Trennung der Finanzierungsströme der einzig vertretbare Mittelweg.', explanation:{en:'High-register argumentation with hedged conclusion.',de:'Hochregister-Argumentation mit abgewogenem Fazit.'} })
    ],
    sprechen: [
      ex('p1','c1','sprechen',{ type:'choice', title:'Situation: Kolloquium', part:1, text:'In einer akademischen Debatte sollen Sie sich von einer These distanzieren, ohne den Redner anzugreifen.', prompt:'Welcher Satz passt?', options:['Ich würde die These in dieser Pauschalität so nicht vertreten; die Datenlage legt eine differenziertere Lesart nahe.','Das ist kompletter Unsinn.','Da haben Sie völlig recht, egal was die Daten sagen.'], answer:0, explanation:{en:'C1 register: diplomatic disagreement with justification.',de:'C1-Register: diplomatische Distanzierung mit Begründung.'} }),
      ex('p2','c1','sprechen',{ type:'choice', title:'Situation: Moderation', part:2, text:'Sie moderieren eine Podiumsdiskussion und müssen einen Redebeitrag beenden.', prompt:'Was sagen Sie?', options:['Vielen Dank für diese Perspektive — ich muss Sie leider für das Thema jetzt weiterleiten.','Stopp, Ihre Zeit ist um.','Sie reden zu viel.'], answer:0, explanation:{en:'Appreciate, then steer — professional moderation register.',de:'Wertschätzen, dann lenken — professionelles Moderationsregister.'} })
    ]
  },

  // ==================== C2 ====================
  c2: {
    grammatik: [
      ex('g1','c2','grammatik',{ type:'choice', title:'Fehlerjagd: Stilistik', part:1, text:'Der Minister hat die Kritik von sich gewiesen worden.', prompt:'Wo ist der Fehler? Wählen Sie den korrekten Satz.', options:['Der Minister hat die Kritik von sich gewiesen.','Der Minister ist die Kritik von sich gewiesen worden.','Der Minister wies die Kritik von sich gewiesen.'], answer:0, explanation:{en:'„etwas von sich weisen“ — active voice with perfect auxiliary „hat“.',de:'„etwas von sich weisen“ — Aktiv mit Perfekt-Hilfsverb „hat“.'} }),
      ex('g2','c2','grammatik',{ type:'choice', title:'Fehlerjagd: Valenz', part:1, text:'Er hat seiner Frau den Autounfall vorgestellt.', prompt:'Wo ist der Fehler? Wählen Sie den korrekten Satz.', options:['Er hat den Autounfall seiner Frau geschildert.','Er hat seiner Frau den Autounfall vorgestellt worden.','Er hat den Autounfall auf seiner Frau präsentiert.'], answer:0, explanation:{en:'„schildern“ takes two objects; „vorstellen“ (person) doesn\'t fit events.',de:'„schildern“ verlangt diese Valenz; „vorstellen“ passt nicht zu Ereignissen.'} }),
      ex('g3','c2','grammatik',{ type:'wordorder', title:'Satzbau: erweitertes Attribut', part:2, tokens:['Die','vom','Ausschuss','einstimmig','beschlossene','Resolution','wurde','publiziert','.'], answer:'Die vom Ausschuss einstimmig beschlossene Resolution wurde publiziert.', explanation:{en:'Extended attribute with „von“ + Dativ agent instead of Genitiv chain.',de:'Erweitertes Attribut mit „von“ + Dativ statt Genitivkette.'} }),
      ex('g4','c2','grammatik',{ type:'input', title:'Lückentext: Idiomatik', part:3, text:'Seine Ausführungen haben das Thema wieder auf den ___ gebracht. (Redewendung: den Punkt bringen)', prompt:'Vervollständigen Sie die Redewendung (ein Wort).', answer:'Punkt', explanation:{en:'„auf den Punkt bringen“ = to get to the heart of a matter.',de:'„auf den Punkt bringen“ = das Wesentliche treffen.'} })
    ],
    hoeren: [
      ex('h1','c2','hoeren',{ type:'input', dictation:true, title:'Diktat: Kommentar', part:1, transcript:'Dass die Debatte derart emotionalisiert geführt wird, spricht für ihre gesellschaftliche Sprengkraft.', prompt:'Hören Sie und schreiben Sie den Satz.', answer:'Dass die Debatte derart emotionalisiert geführt wird, spricht für ihre gesellschaftliche Sprengkraft.', explanation:{en:'„Dass“-clause as subject — C2 syntax pattern.',de:'„Dass“-Satz als Subjekt — C2-Satzbauplan.'} }),
      ex('h2','c2','hoeren',{ type:'input', dictation:true, title:'Diktat: Literaturkritik', part:2, transcript:'Ihr Prosastil zeichnet sich durch eine suggestive Bildhaftigkeit aus, die kaum einem Zeitgenossen ebenbürtig ist.', prompt:'Hören Sie und schreiben Sie den Satz.', answer:'Ihr Prosastil zeichnet sich durch eine suggestive Bildhaftigkeit aus, die kaum einem Zeitgenossen ebenbürtig ist.', explanation:{en:'Elevated literary register with relative clause.',de:'Gehobenes literarisches Register mit Relativsatz.'} }),
      ex('h3','c2','hoeren',{ type:'choice', title:'Verständnis: Hörfunkessay', part:3, transcript:'Man mag über die Resultate der Studie streiten — ihre methodische Stringenz steht außer Frage. Doch die eigentliche Pointe liegt woanders: Sie zeigt, dass schon die Art der Fragestellung das Ergebnis präformiert. Wer nach Bedrohung fragt, findet Bedrohung; wer nach Chancen fragt, findet Chancen. Die Studie ist damit weniger eine Antwort als ein Spiegel der Debatte selbst.', prompt:'Was ist die Pointe des Essays?', options:['Die Fragestellung präformiert schon das Ergebnis der Studie.','Die Studie ist methodisch unbrauchbar.','Die Debatte sollte beendet werden.'], answer:0, explanation:{en:'The essay\'s actual point: the framing of the question pre-shapes results.',de:'Die eigentliche Pointe: Die Frageformulierung prägt das Ergebnis.'} })
    ],
    lesen: [
      ex('l1','c2','lesen',{ type:'input', title:'Juristische Textsorte: Lücke', part:1, text:'Der Beklagte macht geltend, der Kläger habe die Beweislast ___ verkannt. (Grad / Partikel)', prompt:'Welches Wort verstärkt die Aussage angemessen?', answer:'offenbar', explanation:{en:'„offenbar“ hedges attribution in indirect speech — typical legal register.',de:'„offenbar“ relativiert in der indirekten Rede — typisches Juristenregister.'} }),
      ex('l2','c2','lesen',{ type:'choice', title:'Feuilleton: Sprachwandel', part:2, text:'Der Jubel über neue Sprachverbote verkennt die Eigendynamik lebendiger Idiome: Sprache reguliert sich nicht durch Dekret, sondern durch Übereinkunft der Sprechergemeinschaft. Wer Sprachpflege mit Sprachpolizei verwechselt, verteidigt nicht Reinheit, sondern behauptet Kontrolle — und verliert doch bei jeder Generation aufs Neue gegen den Eigensinn des Gebrauchs.', prompt:'Welche Haltung kritisiert der Autor?', options:['Sprachpflege als Kontrolle und Dekret','Den natürlichen Sprachwandel','Die Vielfalt der Dialekte'], answer:0, explanation:{en:'He criticizes those who confuse language care with language policing.',de:'Er kritisiert jene, die Sprachpflege mit Sprachpolizei verwechseln.'} })
    ],
    schreiben: [
      ex('s1','c2','schreiben',{ type:'writing', title:'Umschreiben: Fachsprache → Allgemeinsprache', part:1, prompt:'Formulieren Sie den Satz allgemeinverständlich um.\n\n„Die herbeigeführte Störung der Geschäftsgrundlage indiziert eine Vertragsanpassung.“', points:['Fachbegriffe auflösen','Aussage erhalten','Verständlichkeit erhöhen'], model:'Weil sich die wichtigen Voraussetzungen für den Vertrag geändert haben, muss der Vertrag angepasst werden.', explanation:{en:'Translate legal German into plain German while keeping the claim.',de:'Juristendeutsch in verständliches Deutsch übertragen, Aussage erhalten.'} }),
      ex('s2','c2','schreiben',{ type:'writing', title:'Essay: Sprachliche Vielfalt', part:2, prompt:'Schreiben Sie einen Essay (ca. 140 Wörter): „Sprachregulierung zwischen Schutz und Zensur — wo endet Sprachpflege, wo beginnt Sprachpolizei?“', points:['Begriffsklärung','Historisches oder aktuelles Beispiel','Differenzierte Abwägung','Eigene begründete Position'], model:'Sprachpflege beginnt dort, wo Sprecherinnen und Sprecher sich ihrer Traditionen bewusst werden; Sprachpolizei beginnt dort, wo Dritte den Gebrauch oktroyieren. Die Grenze verläuft mithin nicht zwischen Korrektur und Laissez-faire, sondern zwischen Überzeugung und Zwang. Ratschläge zur „richtigen“ Sprache, wie sie Sprachgesellschaften seit dem Barock publizieren, gehören zur ersten Kategorie; Verbotslisten und sanktionierte Sprechweisen zur zweiten. Eine lebendige Sprachgemeinschaft braucht beides: die Pflege, die Orientierung stiftet — und die Freiheit, sich gegen jede Vorschrift entscheiden zu können.', explanation:{en:'C2 register: conceptual distinction, example, dialectical structure, own position.',de:'C2-Register: Begriffsdifferenzierung, Beispiel, Dialektik, eigene Position.'} })
    ],
    sprechen: [
      ex('p1','c2','sprechen',{ type:'choice', title:'Situation: Rhetorische Distanzierung', part:1, text:'Jemand behauptet apodiktisch, Ihre Datenannahme sei falsch. Sie antworten souverän.', prompt:'Was sagen Sie?', options:['Ich lasse mich gern eines Besseren belehren — zeigen Sie mir Ihre Datenlage, dann vergleichen wir Grundlagen.','Falsch ist nur Ihre Meinung.','Da haben Sie Unrecht, Punkt.'], answer:0, explanation:{en:'Confident, ironic courtesy while demanding evidence — C2 pragmatics.',de:'Souveräne Ironie mit Aufforderung zur Evidenz — C2-Pragmatik.'} }),
      ex('p2','c2','sprechen',{ type:'choice', title:'Situation: Stilwechsel', part:2, text:'Sie erklären in einem Vortrag einen Fachbegriff vor Laien.', prompt:'Welcher Satz funktioniert?', options:['Vereinfacht gesagt bedeutet das: Die Vertragspartner müssen neu verhandeln, wenn sich die Grundlagen ändern.','Der Pacta sunt servanda-Grundsatz kollidiert mit der clausula rebus sic stantibus.','Das Thema ist zu komplex für Sie.'], answer:0, explanation:{en:'Register shift with „vereinfacht gesagt“ — the C2 skill of audience adaptation.',de:'Stilwechsel mit „vereinfacht gesagt“ — die C2-Fähigkeit der Publikumsanpassung.'} })
    ]
  }
};

// ============================================================
// GRAMMAR TAXONOMY — organizes existing lessons + drills + bank
// items into a proper curriculum per level.
// ============================================================

export const GRAMMAR_MAP = {
  a1: [
    { topic:'Begrüßung & Vorstellung', en:'Greetings & introductions', lessons:['hello'], drills:[] },
    { topic:'Alphabet & Buchstabieren', en:'Alphabet & spelling', lessons:['unit-1','unit-2','unit-3'], drills:[] },
    { topic:'Personalpronomen', en:'Personal pronouns', lessons:['unit-4','unit-5','unit-6'], drills:['pronomen'] },
    { topic:'sein & haben', en:'sein & haben', lessons:['unit-7','unit-8','unit-9','unit-10','unit-11','unit-12'], drills:['verben'] },
    { topic:'Verben im Präsens', en:'Present tense verbs', lessons:['unit-13','unit-14','unit-15'], drills:['verben'] },
    { topic:'Satzbau & Verbposition', en:'Word order & verb position', lessons:['unit-16','unit-17','unit-18','questions'], drills:['wordOrder'] },
    { topic:'Artikel: der/die/das & ein/eine', en:'Definite & indefinite articles', lessons:['articles','unit-19','unit-20','unit-21'], drills:[] },
    { topic:'Negation: nicht & kein', en:'Negation', lessons:['unit-22','unit-23','unit-24','unit-25','unit-26','unit-27'], drills:[] },
    { topic:'Akkusativ', en:'Accusative case', lessons:['unit-28','unit-29','unit-30'], drills:['kasus'] },
    { topic:'Possessivartikel', en:'Possessives', lessons:['unit-31','unit-32','unit-33'], drills:['pronomen'] },
    { topic:'Modalverben', en:'Modal verbs', lessons:['unit-34','unit-35','unit-36','unit-37','unit-38','unit-39'], drills:[] },
    { topic:'Trennbare Verben', en:'Separable verbs', lessons:['unit-40','unit-41','unit-42'], drills:['verben'] },
    { topic:'Starke Verben', en:'Irregular vowels', lessons:['unit-43','unit-44','unit-45'], drills:['verben'] },
    { topic:'Pluralformen', en:'Plural forms', lessons:['unit-46','unit-47','unit-48'], drills:[] },
    { topic:'Dativ & Präpositionen', en:'Dative & prepositions', lessons:['unit-49','unit-50','unit-51','unit-52','unit-53','unit-54','unit-55','unit-56','unit-57'], drills:['prepositions','kasus'] },
    { topic:'Perfekt', en:'Perfect tense', lessons:['unit-58','unit-59','unit-60','unit-61','unit-62','unit-63'], drills:[] },
    { topic:'Konnektoren', en:'Joining ideas', lessons:['unit-64','unit-65','unit-66'], drills:['konnektoren','wordOrder'] },
    { topic:'Höflichkeit & Imperativ', en:'Politeness & imperative', lessons:['requests','messages','unit-67','unit-68','unit-69'], drills:[] },
    { topic:'Zeit & Zahlen', en:'Time & numbers', lessons:['time'], drills:[] }
  ],
  a2: [
    { topic:'Präteritum vs. Perfekt', en:'Simple past vs. perfect', lessons:['a2-perfekt','a2-modal-past'], drills:['praeteritum'], bank:['a2'] },
    { topic:'Büroalltag & Arbeit', en:'Office & work communication', lessons:['a2-work'], drills:[], bank:['a2'] },
    { topic:'Dativ-Verben', en:'Dative verbs', lessons:[], drills:['kasus'], bank:['a2'] },
    { topic:'Adjektivdeklination', en:'Adjective endings', lessons:[], drills:['adjectives'], bank:['a2'] },
    { topic:'Konnektoren: weil, deshalb, dass', en:'Connectors', lessons:[], drills:['konnektoren','wordOrder'], bank:['a2'] },
    { topic:'Komparativ & Superlativ', en:'Comparatives', lessons:[], drills:['adjektive'], bank:['a2'] },
    { topic:'Reflexive Verben', en:'Reflexive verbs', lessons:[], drills:['verben'], bank:['a2'] },
    { topic:'Wechselpräpositionen', en:'Two-way prepositions', lessons:[], drills:['prepositions'], bank:['a2'] }
  ],
  b1: [
    { topic:'Konjunktiv II', en:'Konjunktiv II', lessons:['b1-konjunktiv2'], drills:[], bank:['b1'] },
    { topic:'Passiv', en:'Passive voice', lessons:['b1-passiv'], drills:[], bank:['b1'] },
    { topic:'Einbürgerung & Behördendeutsch', en:'Citizenship & official German', lessons:['b1-einbuergerung'], drills:[], bank:['b1'] },
    { topic:'Relativsätze', en:'Relative clauses', lessons:[], drills:[], bank:['b1'] },
    { topic:'Genitiv', en:'Genitive case', lessons:[], drills:['kasus'], bank:['b1'] },
    { topic:'Indirekte Fragen & Rede', en:'Indirect questions & speech', lessons:[], drills:[], bank:['b1'] },
    { topic:'Präpositionen im Detail', en:'Prepositions in depth', lessons:[], drills:['prepositions'], bank:['b1'] }
  ],
  b2: [
    { topic:'Konnektoren & Satzbau (Position 0/1)', en:'Connectors & word order', lessons:[], drills:['wordOrder','konnektoren'], bank:['b2'] },
    { topic:'Partizipialattribute', en:'Extended participles', lessons:[], drills:[], bank:['b2'] },
    { topic:'Konjunktiv I (indirekte Rede)', en:'Konjunktiv I', lessons:[], drills:[], bank:['b2'] },
    { topic:'Subjektive Modalverben', en:'Subjective modality', lessons:[], drills:[], bank:['b2'] },
    { topic:'Nominalstil vs. Verbalstil', en:'Nominal vs. verbal style', lessons:[], drills:[], bank:['b2'] },
    { topic:'Adjektivdeklination II', en:'Adjective endings advanced', lessons:[], drills:['adjectives'], bank:['b2'] }
  ],
  c1: [
    { topic:'Partizipialkonstruktionen', en:'Participle constructions', lessons:[], drills:[], bank:['c1'] },
    { topic:'Nominalisierung & Verbalisierung', en:'Nominalization', lessons:[], drills:[], bank:['c1'] },
    { topic:'Konjunktiv in Texten', en:'Subjunctive in texts', lessons:[], drills:[], bank:['c1'] },
    { topic:'Textkohäsion & Referenz', en:'Text cohesion', lessons:[], drills:['wordOrder','konnektoren'], bank:['c1'] },
    { topic:'Präfixverben & Valenz', en:'Prefix verbs & valency', lessons:[], drills:['verben'], bank:['c1'] },
    { topic:'Stilistische Register', en:'Stylistic registers', lessons:[], drills:['adjektive'], bank:['c1'] }
  ],
  c2: [
    { topic:'Stilistik & Rhetorik', en:'Stylistics & rhetoric', lessons:[], drills:[], bank:['c2'] },
    { topic:'Idiomatik & Redewendungen', en:'Idioms', lessons:[], drills:[], bank:['c2'] },
    { topic:'Fachsprachen & Textsorten', en:'Special registers & genres', lessons:[], drills:[], bank:['c2'] },
    { topic:'Valenz & Kollokationen', en:'Valency & collocations', lessons:[], drills:['verben'], bank:['c2'] },
    { topic:'Sprachreflexion', en:'Language awareness', lessons:[], drills:['konnektoren'], bank:['c2'] }
  ]
};

export function getPracticeItems(level, cat) {
  const bank = PRACTICE_BANK[level]?.[cat] || [];
  return bank;
}

export function getGrammarTopics(level) {
  return GRAMMAR_MAP[level] || [];
}
