// ponytail: Curated A2 and B1 modules. Expandable to B2/C1 when teacher-reviewed catalog arrives.
export const CEFR_LEVELS = [
  { id: 'a1', label: 'A1', name: { en: 'A1 · Breakthrough', de: 'A1 · Einstieg' }, summary: { en: 'Foundational everyday vocabulary, basic questions, simple notices.', de: 'Grundlagen für den Alltag, einfache Fragen, kurze Mitteilungen.' } },
  { id: 'a2', label: 'A2', name: { en: 'A2 · Elementary', de: 'A2 · Grundlagen' }, summary: { en: 'Past tense (Perfekt), office communication, doctor visits, apartment search.', de: 'Perfekt, Bürokommunikation, Arztbesuche, Wohnungssuche.' } },
  { id: 'b1', label: 'B1', name: { en: 'B1 · Intermediate & Citizenship', de: 'B1 · Selbstständig & Einbürgerung' }, summary: { en: 'Subjunctive II (politeness), passive voice, official letters and Einbürgerung prep.', de: 'Konjunktiv II, Passiv, Behördendeutsch und Einbürgerungsvorbereitung.' } }
];

export const CEFR_LESSONS = {
  a2: [
    {
      id: 'a2-perfekt',
      level: 'A2',
      title: { en: 'Talking about the past: Perfekt', de: 'Über die Vergangenheit sprechen: Perfekt' },
      subtitle: { en: 'haben / sein + Partizip II', de: 'haben / sein + Partizip II' },
      minutes: 8,
      rule: {
        en: 'In spoken German, use Perfekt for past events. Most verbs take “haben”; movement or change of state takes “sein”. Partizip II goes to the end.',
        de: 'In der gesprochenen Sprache nutzt man das Perfekt. Die meisten Verben bilden Perfekt mit „haben“; Orts- und Zustandswechsel verlangen „sein“.'
      },
      examples: [
        ['Ich habe gestern eine E-Mail geschrieben.', 'I wrote an email yesterday.'],
        ['Wir sind um 8 Uhr am Bahnhof angekommen.', 'We arrived at the station at 8 a.m.'],
        ['Haben Sie die Unterlagen schon eingereicht?', 'Have you already submitted the documents?']
      ],
      quiz: { prompt: 'Gestern ___ ich zum Bürgeramt gegangen.', options: ['bin', 'habe', 'war'], answer: 0 },
      explanation: { en: '“Gehen” indicates movement; it forms Perfekt with “sein”: ich bin gegangen.', de: '„Gehen“ drückt eine Ortsveränderung aus und bildet das Perfekt mit „sein“.' }
    },
    {
      id: 'a2-modal-past',
      level: 'A2',
      title: { en: 'Past modals: musste, konnte, wollte', de: 'Präteritum der Modalverben' },
      subtitle: { en: 'Expressing past obligations & ability', de: 'Vergangene Pflichten und Möglichkeiten' },
      minutes: 7,
      rule: {
        en: 'For modal verbs (müssen, können, dürfen, wollen), German uses Präteritum even in spoken conversation: musste, konnte, durfte, wollte.',
        de: 'Bei Modalverben nutzt man auch im Alltag das Präteritum: musste, konnte, durfte, wollte.'
      },
      examples: [
        ['Ich musste gestern lange arbeiten.', 'I had to work long hours yesterday.'],
        ['Er konnte den Termin leider nicht wahrnehmen.', 'Unfortunately he could not make the appointment.'],
        ['Wir wollten die Wohnung besichtigen.', 'We wanted to view the apartment.']
      ],
      quiz: { prompt: 'Ich ___ gestern zum Arzt gehen, weil ich krank war.', options: ['musste', 'gemusst', 'habe müssen'], answer: 0 },
      explanation: { en: 'Use the Präteritum “musste” for past necessity.', de: 'Für Pflichten in der Vergangenheit nutzt man das Präteritum „musste“.' }
    },
    {
      id: 'a2-work',
      level: 'A2',
      title: { en: 'Workplace: Calling in sick & daily office German', de: 'Arbeitsplatz: Krankmeldung & Büro-Alltag' },
      subtitle: { en: 'Professional notices and polite updates', de: 'Professionelle Meldungen und Absprachen' },
      minutes: 6,
      rule: {
        en: 'Inform employers early morning if sick (Krankmeldung). Mention estimated duration and whether you will visit a doctor (Arbeitsunfähigkeitsbescheinigung / eAU).',
        de: 'Melden Sie sich morgens vor Arbeitsbeginn krank. Nennen Sie die voraussichtliche Ausfallzeit und ob Sie zum Arzt gehen.'
      },
      examples: [
        ['Guten Morgen, ich bin heute krank und kann nicht kommen.', 'Good morning, I am sick today and cannot come in.'],
        ['Ich gehe heute zum Arzt und reiche die Bescheinigung nach.', 'I am seeing a doctor today and will submit the medical certificate.'],
        ['Können wir den Termin auf Donnerstag verschieben?', 'Could we postpone the appointment to Thursday?']
      ],
      quiz: { prompt: 'Sehr geehrte Kolleginnen und Kollegen, ich kann heute ___ Krankheit nicht teilnehmen.', options: ['wegen', 'für', 'ohne'], answer: 0 },
      explanation: { en: '“Wegen” expresses cause / reason: “wegen Krankheit”.', de: '„Wegen“ begründet den Ausfall: wegen Krankheit.' }
    }
  ],
  b1: [
    {
      id: 'b1-konjunktiv2',
      level: 'B1',
      title: { en: 'Polite requests: Konjunktiv II', de: 'Höfliche Bitten: Konjunktiv II' },
      subtitle: { en: 'könnte, würde, hätte, wäre', de: 'könnte, würde, hätte, wäre' },
      minutes: 8,
      rule: {
        en: 'Konjunktiv II softens requests and expresses wishes. In office and official settings, “Könnten Sie...” or “Ich würde gern...” is expected professional German.',
        de: 'Der Konjunktiv II macht Bitten besonders höflich: „Könnten Sie mir bitte helfen?“, „Ich hätte gern einen Termin“.'
      },
      examples: [
        ['Könnten Sie mir die Unterlagen bitte per E-Mail zusenden?', 'Could you please send me the documents by email?'],
        ['Ich würde gern einen Termin für nächste Woche vereinbaren.', 'I would like to arrange an appointment for next week.'],
        ['Es wäre sehr hilfreich, wenn Sie das prüfen könnten.', 'It would be very helpful if you could check that.']
      ],
      quiz: { prompt: '___ Sie mir bitte kurz bestätigen, dass die Nachricht angekommen ist?', options: ['Könnten', 'Konnten', 'Können'], answer: 0 },
      explanation: { en: '“Könnten Sie” is the polite subjunctive form.', de: '„Könnten Sie“ ist die höfliche Konjunktiv-II-Form.' }
    },
    {
      id: 'b1-passiv',
      level: 'B1',
      title: { en: 'Bureaucracy German: Passive Voice (Passiv)', de: 'Behördendeutsch: Das Passiv' },
      subtitle: { en: 'werden + Partizip II', de: 'werden + Partizip II' },
      minutes: 9,
      rule: {
        en: 'Official letters and regulations frequently use passive voice: “Ihr Antrag wird bearbeitet” (Your application is being processed). The action matters more than the actor.',
        de: 'Behördenbriefe nutzen häufig das Passiv: Das Geschehen steht im Vordergrund, nicht die handelnde Person.'
      },
      examples: [
        ['Ihr Antrag wird derzeit von der zuständigen Stelle bearbeitet.', 'Your application is currently being processed by the responsible office.'],
        ['Die Gebühr muss bis zum 15. des Monats überwiesen werden.', 'The fee must be transferred by the 15th of the month.'],
        ['Die Unterlagen wurden vollständig eingereicht.', 'The documents were submitted in full.']
      ],
      quiz: { prompt: 'Der Bescheid ___ Ihnen in den nächsten Tagen per Post zugestellt.', options: ['wird', 'hat', 'ist'], answer: 0 },
      explanation: { en: 'Passiv Präsens uses “wird + Partizip II”: wird zugestellt.', de: 'Das Passiv Präsens bildet man mit „wird + Partizip II“.' }
    },
    {
      id: 'b1-einbuergerung',
      level: 'B1',
      title: { en: 'Citizenship & Law: Einbürgerungstest Basics', de: 'Staat & Gesellschaft: Einbürgerungstest' },
      subtitle: { en: 'Grundgesetz, federal states and democratic principles', de: 'Grundgesetz, Bundesländer und Demokratie' },
      minutes: 10,
      rule: {
        en: 'The B1 / Einbürgerung exam tests German political structures, history, and constitutional rights. Key vocabulary includes Grundgesetz, Gewaltenteilung, and Rechtsstaat.',
        de: 'Für B1 und den Einbürgerungstest sind Begriffe wie Grundgesetz, Meinungsfreiheit, Rechtsstaat und Wahlen zentral.'
      },
      examples: [
        ['Deutschland ist ein demokratischer und sozialer Bundesstaat.', 'Germany is a democratic and social federal state.'],
        ['Alle Staatsgewalt geht vom Volke aus.', 'All state authority emanates from the people.'],
        ['Die Würde des Menschen ist unantastbar (Artikel 1 GG).', 'Human dignity is inviolable (Article 1 Basic Law).']
      ],
      quiz: { prompt: 'Wie viele Bundesländer hat die Bundesrepublik Deutschland?', options: ['16', '14', '18'], answer: 0 },
      explanation: { en: 'Germany consists of 16 federal states (Bundesländer).', de: 'Die Bundesrepublik Deutschland besteht aus 16 Bundesländern.' }
    }
  ]
};
