import {TELC_PAPER_SUITES,getLegacyTelcSections} from './telc-exams.js';
import {TELC_A2_SECTIONS} from './telc-a2-exams.js';
import {TELC_B1_SECTIONS} from './telc-b1-exams.js';
import {TELC_B2_SECTIONS} from './telc-b2-exams.js';

export const EXAM_LEVELS = [
  {
    id: 'a1',
    code: 'A1',
    name: { en: 'A1 · Beginner', de: 'A1 · Anfänger' },
    desc: {
      en: 'First steps: simple sentences, everyday forms and questions.',
      de: 'Erste Schritte: einfache Sätze, Formulare und alltägliche Fragen.'
    },
    tasks: 986,
    free: true,
    boards: [
      { id: 'goethe-a1', name: 'Goethe A1', new: true, type: 'goethe', level: 'a1', timeMin: 65 },
      { id: 'telc-a1', name: 'telc A1', new: true, type: 'telc', level: 'a1', timeMin: 80 },
      { id: 'allg-a1', name: 'Allgemein A1', new: false, type: 'allgemein', level: 'a1', timeMin: 60 }
    ]
  },
  {
    id: 'a2',
    code: 'A2',
    name: { en: 'A2 · Elementary', de: 'A2 · Grundlagen' },
    desc: {
      en: 'Everyday situations, short emails, doctor visits, and past tense.',
      de: 'Alltagssituationen, kurze Briefe, Arztbesuche und Perfekt-Formen.'
    },
    tasks: 960,
    free: true,
    boards: [
      { id: 'goethe-a2', name: 'Goethe A2', new: true, type: 'goethe', level: 'a2', timeMin: 70 },
      { id: 'telc-a2', name: 'telc A2', new: true, type: 'telc', level: 'a2', timeMin: 85 },
      { id: 'allg-a2', name: 'Allgemein A2', new: false, type: 'allgemein', level: 'a2', timeMin: 70 }
    ]
  },
  {
    id: 'b1',
    code: 'B1',
    name: { en: 'B1 · Intermediate', de: 'B1 · Selbstständig & Einbürgerung' },
    desc: {
      en: 'Residence, citizenship (DTZ), formal applications, and complex discussions.',
      de: 'Aufenthalt, Einbürgerung (DTZ), Behördenbriefe und selbstständige Gespräche.'
    },
    tasks: 1261,
    free: false,
    boards: [
      { id: 'goethe-b1', name: 'Goethe B1', new: true, type: 'goethe', level: 'b1', timeMin: 105 },
      { id: 'telc-b1', name: 'telc B1', new: true, type: 'telc', level: 'b1', timeMin: 165 },
      { id: 'allg-b1', name: 'Allgemein B1', new: false, type: 'allgemein', level: 'b1', timeMin: 90 }
    ]
  },
  {
    id: 'b2',
    code: 'B2',
    name: { en: 'B2 · Advanced Professional', de: 'B2 · Beruf & Studium' },
    desc: {
      en: 'Professional workplace communication, university entrance, and complex texts.',
      de: 'Beruf, Studium, Verhandlungen und fachliche Anerkennung.'
    },
    tasks: 755,
    free: false,
    boards: [
      { id: 'goethe-b2', name: 'Goethe B2', new: true, type: 'goethe', level: 'b2', timeMin: 115 },
      { id: 'telc-b2', name: 'telc B2', new: true, type: 'telc', level: 'b2', timeMin: 120 },
      { id: 'allg-b2', name: 'Allgemein B2', new: false, type: 'allgemein', level: 'b2', timeMin: 100 }
    ]
  },
  {
    id: 'c1',
    code: 'C1',
    name: { en: 'C1 · Proficient', de: 'C1 · Fachlich & Hochschule' },
    desc: {
      en: 'Academic research, fluent negotiations, and high-level official register.',
      de: 'Studium und Beruf auf höchstem sprachlichen Niveau.'
    },
    tasks: 517,
    free: false,
    boards: [
      { id: 'goethe-c1', name: 'Goethe C1', new: true, type: 'goethe', level: 'c1', timeMin: 140 },
      { id: 'telc-c1', name: 'telc C1', new: true, type: 'telc', level: 'c1', timeMin: 140 },
      { id: 'allg-c1', name: 'Allgemein C1', new: false, type: 'allgemein', level: 'c1', timeMin: 120 }
    ]
  },
  {
    id: 'c2',
    code: 'C2',
    name: { en: 'C2 · Near-Native Mastery', de: 'C2 · Muttersprachliches Niveau' },
    desc: {
      en: 'Literary nuance, legal and academic register, and effortless rhetorical control.',
      de: 'Literarische Nuancen, Juristen- und Wissenschaftsdeutsch, souveräne Rhetorik.'
    },
    tasks: 389,
    free: false,
    boards: [
      { id: 'goethe-c2', name: 'Goethe C2 (GDS)', new: true, type: 'goethe', level: 'c2', timeMin: 200 },
      { id: 'telc-c2', name: 'telc C2', new: true, type: 'telc', level: 'c2', timeMin: 195 },
      { id: 'allg-c2', name: 'Allgemein C2', new: false, type: 'allgemein', level: 'c2', timeMin: 150 }
    ]
  },
  {
    id: 'fachsprache',
    code: 'Fachsprache',
    name: { en: 'Medical & Healthcare German', de: 'Fachsprache: Medizin & Pflege' },
    desc: {
      en: 'FSP exam for doctors, nurses, and hospital staff in Germany.',
      de: 'Fachsprachprüfung (FSP) für Ärzte, Pflegekräfte und medizinisches Personal.'
    },
    tasks: 233,
    free: false,
    boards: [
      { id: 'fsp-med', name: 'FSP Medizin', new: false, type: 'fsp', level: 'fachsprache', timeMin: 60 },
      { id: 'telc-b2-c1-med', name: 'telc B2·C1 Medizin', new: false, type: 'telc', level: 'fachsprache', timeMin: 90 }
    ]
  }
];

export const TOPIC_PACKS = [
  { id: 'zahlen', icon: '🔢', count: 40, level: 'A1', name: { en: 'Numbers & Counting', de: 'Zahlen & Rechnen' }, preview: 'eins, zwei, erste, Million' },
  { id: 'familie', icon: '👨‍👩‍👧', count: 44, level: 'A1', name: { en: 'Family & People', de: 'Familie & Menschen' }, preview: 'die Eltern, das Kind, der Kollege' },
  { id: 'farben', icon: '🎨', count: 30, level: 'A1', name: { en: 'Colours & Appearance', de: 'Farben & Aussehen' }, preview: 'blau, rot, hell, dunkel' },
  { id: 'koerper', icon: '🫀', count: 30, level: 'A1', name: { en: 'Body Parts & Health', de: 'Körperteile & Gesundheit' }, preview: 'der Kopf, das Auge, der Rücken' },
  { id: 'essen', icon: '🍽️', count: 39, level: 'A1', name: { en: 'Food & Drink', de: 'Essen & Trinken' }, preview: 'das Brot, der Kaffee, das Wasser' },
  { id: 'obst', icon: '🍎', count: 30, level: 'A1', name: { en: 'Fruit & Vegetables', de: 'Obst & Gemüse' }, preview: 'der Apfel, die Tomate, die Kartoffel' },
  { id: 'haus', icon: '🏠', count: 46, level: 'A1', name: { en: 'Home & Furniture', de: 'Haus & Möbel' }, preview: 'die Wohnung, die Küche, das Zimmer' },
  { id: 'zeit', icon: '⏰', count: 40, level: 'A1', name: { en: 'Time & Calendar', de: 'Zeit & Kalender' }, preview: 'der Montag, heute, morgen, die Uhr' },
  { id: 'wetter', icon: '☀️', count: 30, level: 'A1', name: { en: 'Weather & Seasons', de: 'Wetter & Jahreszeiten' }, preview: 'die Sonne, der Regen, warm, kalt' },
  { id: 'grundverben', icon: '⚡', count: 100, level: 'A1', name: { en: 'Core Verbs', de: 'Grundverben' }, preview: 'sein, haben, machen, gehen, kommen' },
  { id: 'grundadjektive', icon: '💎', count: 70, level: 'A1', name: { en: 'Core Adjectives', de: 'Grundadjektive' }, preview: 'gut, neu, schnell, schön, wichtig' },
  { id: 'schulsachen', icon: '📚', count: 30, level: 'A1', name: { en: 'Study & Work Tools', de: 'Schulsachen & Büro' }, preview: 'das Buch, der Stift, der Computer' },
  { id: 'tiere', icon: '🐾', count: 34, level: 'A1', name: { en: 'Animals', de: 'Tiere' }, preview: 'der Hund, die Katze, das Pferd' },
  { id: 'kleidung', icon: '👕', count: 30, level: 'A1', name: { en: 'Clothing Basics', de: 'Grundkleidung' }, preview: 'die Jacke, die Hose, das Hemd' },
  { id: 'haushalt', icon: '🛋️', count: 50, level: 'A1', name: { en: 'Furniture & Living', de: 'Möbel & Haushalt' }, preview: 'der Tisch, der Stuhl, das Bett' },
  { id: 'einkaufen', icon: '🛒', count: 52, level: 'A1', name: { en: 'Shopping & Supermarket', de: 'Einkaufen & Markt' }, preview: 'kaufen, der Preis, die Kasse, der Bon' },
  { id: 'alltag', icon: '✋', count: 56, level: 'A1', name: { en: 'Greetings & Everyday Talk', de: 'Begrüßung & Alltag' }, preview: 'Guten Tag, bitte, danke, Tschüss' }
];

export const SITUATION_MODULES = [
  {
    id: 'wortfallen',
    icon: '🪤',
    level: 'A2–B1',
    title: { en: 'Word traps', de: 'Wortfallen' },
    desc: {
      en: 'Words that are easy to mix up: kündigen vs absagen, kennen vs wissen, leihen vs borgen.',
      de: 'Wörter, die leicht verwechselt werden: kündigen oder absagen, kennen oder wissen.'
    },
    situations: 40,
    words: 37,
    sample: {
      scene: 'Sie können morgen nicht zur gebuchten Stadtführung kommen. Sie möchten den Termin...',
      options: ['kündigen', 'absagen', 'aufgeben'],
      answer: 1,
      explanation: 'Einen Termin oder eine Reservierung sagt man ab („absagen“). Einen Arbeitsvertrag kündigt man („kündigen“).'
    }
  },
  {
    id: 'verben-a2',
    icon: '⚒️',
    level: 'A2',
    title: { en: 'A2 Verbs in context', de: 'A2-Verben in Aktion' },
    desc: {
      en: '40 core A2 verbs in real moments: explain, choose, apologize, manage in time.',
      de: '40 A2-Verben in echten Momenten: erklären, auswählen, entschuldigen, rechtzeitig schaffen.'
    },
    situations: 80,
    words: 40,
    sample: {
      scene: 'Der Zug hatte Verspätung. Sie kommen 15 Minuten zu spät ins Büro. Was sagen Sie?',
      options: ['Ich entschuldige die Verspätung.', 'Bitte entschuldigen Sie die Verspätung.', 'Ich verspäte mich entschuldigt.'],
      answer: 1,
      explanation: 'Höfliche Bitte um Entschuldigung: „Bitte entschuldigen Sie...“'
    }
  },
  {
    id: 'verben-b1',
    icon: '🧭',
    level: 'B1',
    title: { en: 'B1 Verbs for work & life', de: 'B1-Verben im Berufsalltag' },
    desc: {
      en: '50 B1 verbs in real moments: take into account, demand, do without, agree.',
      de: '50 B1-Verben: berücksichtigen, verlangen, verzichten, zustimmen.'
    },
    situations: 100,
    words: 50,
    sample: {
      scene: 'Ihr Kollege schlägt einen neuen Projektplan vor. Sie sind völlig einverstanden.',
      options: ['Ich verzichte dem Plan.', 'Ich stimme dem Plan zu.', 'Ich verlange den Plan.'],
      answer: 1,
      explanation: '„Zustimmen“ verlangt den Dativ: jemandem / einer Sache zustimmen.'
    }
  },
  {
    id: 'verben-b2',
    icon: '💼',
    level: 'B2',
    title: { en: 'B2 Professional verbs', de: 'B2-Verben für Fachkräfte' },
    desc: {
      en: '40 B2 verbs in professional life: cope, guarantee, reconsider, doubt.',
      de: '40 B2-Verben im Beruf: bewältigen, gewährleisten, überdenken, bezweifeln.'
    },
    situations: 80,
    words: 40,
    sample: {
      scene: 'Der Projektleiter verspricht, dass alle Sicherheitsstandards eingehalten werden.',
      options: ['Er bezweifelt die Standards.', 'Er gewährleistet die Einhaltung der Standards.', 'Er überdenkt die Standards.'],
      answer: 1,
      explanation: '„Gewährleisten“ bedeutet garantieren bzw. sicherstellen.'
    }
  },
  {
    id: 'pruefungstag',
    icon: '📝',
    level: 'B1–B2',
    title: { en: 'Exam day tactics', de: 'Prüfungstag B1–B2' },
    desc: {
      en: 'From journey to certificate: Vortrag vs Vertrag, Stellung nehmen vs geben, Bogen vs Boden.',
      de: 'Von der Anreise bis zum Zertifikat: Vortrag oder Vertrag, Stellung nehmen, Antwortbogen ausfüllen.'
    },
    situations: 80,
    words: 80,
    sample: {
      scene: 'In der mündlichen Prüfung sollen Sie Ihre persönliche Meinung zu einem Thema äußern.',
      options: ['Ich nehme einen Vortrag.', 'Dazu möchte ich kurz Stellung nehmen.', 'Ich gebe einen Standpunkt ein.'],
      answer: 1,
      explanation: 'Feste Nomen-Verb-Verbindung: „zu etwas Stellung nehmen“ = seine Meinung begründen.'
    }
  },
  {
    id: 'unterwegs',
    icon: '🚆',
    level: 'A1–A2',
    title: { en: 'On the road & DB train', de: 'Unterwegs: Bahn, Bus & Hotel' },
    desc: {
      en: 'Airport, train station and hotel: Gleis or Gate, Pass or Ausweis, Koffer or Gepäck.',
      de: 'Bahnhof, Flughafen und Hotel: Gleis oder Gate, Ausweis oder Fahrkarte, Umstieg schaffen.'
    },
    situations: 30,
    words: 30,
    sample: {
      scene: 'Am Hauptbahnhof suchen Sie den Bahnsteig für den ICE nach Frankfurt. Sie fragen nach dem...',
      options: ['Flugsteig', 'Gleis', 'Halteschild'],
      answer: 1,
      explanation: 'Züge fahren an einem „Gleis“ ab; Flugzeuge am „Gate“ oder „Flugsteig“.'
    }
  },
  {
    id: 'amt',
    icon: '🏛️',
    level: 'A1–A2',
    title: { en: 'Offices & forms', de: 'Auf dem Amt & Formulare' },
    desc: {
      en: 'Citizens’ office, Bürgeramt, and post: Antrag or Auftrag, Unterschrift, ledig or geschieden.',
      de: 'Bürgeramt, Ausländerbehörde und Post: Antrag, Meldebescheinigung, Unterschrift.'
    },
    situations: 30,
    words: 30,
    sample: {
      scene: 'Sie ziehen in eine neue Wohnung und müssen sich beim Bürgeramt anmelden. Sie stellen einen...',
      options: ['Auftrag auf Anmeldung', 'Antrag auf Wohnsitzanmeldung', 'Kaufvertrag'],
      answer: 1,
      explanation: 'Bei Behörden stellt man einen „Antrag“ (nicht Auftrag).'
    }
  },
  {
    id: 'arzt',
    icon: '🩺',
    level: 'A1–A2',
    title: { en: 'At the doctor’s', de: 'Beim Arzt & Apotheke' },
    desc: {
      en: 'Practice, pharmacy, hospital: Schnupfen or Husten, Grippe, Schmerz or Scherz, Rezept.',
      de: 'Praxis, Apotheke und Notdienst: Erkältung, Fieber, Rezept abholen, Krankschreibung.'
    },
    situations: 30,
    words: 30,
    sample: {
      scene: 'Sie sind krank und können nicht arbeiten. Ihr Arbeitgeber verlangt eine...',
      options: ['Quittung', 'Arbeitsunfähigkeitsbescheinigung (AU)', 'Gebrauchsanweisung'],
      answer: 1,
      explanation: 'Die Krankschreibung heißt offiziell „Arbeitsunfähigkeitsbescheinigung“ (AU).'
    }
  },
  {
    id: 'arbeit',
    icon: '💼',
    level: 'A1–A2',
    title: { en: 'At work & office', de: 'Bei der Arbeit & Büro' },
    desc: {
      en: 'Office, colleague talk, and computer: Chef or Koch, Vertrag or Vortrag, speichern or sparen.',
      de: 'Büro, Kollegengespräche und Rechner: Chef oder Koch, Arbeitsvertrag, Dateien speichern.'
    },
    situations: 30,
    words: 30,
    sample: {
      scene: 'Ihr Vorgesetzter im Büro heißt auf Deutsch...',
      options: ['der Koch', 'der Chef', 'der Kellner'],
      answer: 1,
      explanation: '„Der Chef“ ist der Vorgesetzte; „Chef“ auf Englisch bedeutet Koch (deutsch: der Koch).'
    }
  },
  {
    id: 'wohnen',
    icon: '🏠',
    level: 'A1–A2',
    title: { en: 'Home & tenancy', de: 'Wohnungssuche & Nachbarn' },
    desc: {
      en: 'Rent, neighbours, deposit: mieten or vermieten, Keller or Kellner, Klingel or Klinke.',
      de: 'Miete, Kaution, Nebenkosten, Hausordnung und Ruhezeiten.'
    },
    situations: 30,
    words: 30,
    sample: {
      scene: 'Vor dem Einzug verlangt der Vermieter eine Sicherheit für eventuelle Schäden. Das ist die...',
      options: ['Miete', 'Kaution', 'Provision'],
      answer: 1,
      explanation: 'Die Mietkaution ist die Mietsicherheit (meist 2 bis 3 Kaltmieten).'
    }
  },
  {
    id: 'einkaufen',
    icon: '🛒',
    level: 'A1–A2',
    title: { en: 'Shopping & supermarket', de: 'Einkaufen & Supermarkt' },
    desc: {
      en: 'Supermarket, till and return: umtauschen or zurückgeben, passen or stehen, Pfand or Pfund.',
      de: 'Supermarkt, Kasse, Pfandflaschen zurückgeben, Kassenbon verlangen.'
    },
    situations: 30,
    words: 30,
    sample: {
      scene: 'An der Kasse fragt die Kassiererin: „Brauchen Sie den Bon?“ Sie meint den...',
      options: ['Kassenbeleg / Quittung', 'Gutschein', 'Rabatt'],
      answer: 0,
      explanation: '„Der Bon“ oder „Kassenbon“ ist der gedruckte Kaufbeleg.'
    }
  }
];

export const MOCK_EXAM_SUITES = {
  'telc-a1': {...TELC_PAPER_SUITES['telc-a1-p1'],code:'telc-a1',name:'telc Deutsch A1 · Start Deutsch 1',badge:'TELC A1'},
  'goethe-a1': {
    code: 'goethe-a1',
    name: 'Goethe-Zertifikat A1 · Start Deutsch 1',
    badge: 'GOETHE A1',
    level: 'a1',
    timeMinutes: 65,
    sections: [
      { id: 'hoeren', title: 'Hören', time: '20 min', count: 15, desc: 'Alltagsgespräche am Telefon, Durchsagen und Nachrichten.' },
      { id: 'lesen', title: 'Lesen', time: '25 min', count: 15, desc: 'E-Mails, SMS, Aushänge und Hinweisschilder verstehen.' },
      { id: 'schreiben', title: 'Schreiben', time: '10 min', count: 6, desc: 'Angaben zur Person in ein Formular eintragen und kurze E-Mail verfassen.' },
      { id: 'sprechen', title: 'Sprechen', time: '10 min', count: 3, desc: 'Fragen zur Person beantworten, Wortkarten nutzen und Bitten äußern.' }
    ]
  },
  'telc-a2': {
    code: 'telc-a2',
    name: 'telc Deutsch A2 · Start Deutsch 2',
    badge: 'TELC A2',
    level: 'a2',
    timeMinutes: 85,
    sections: [
      { id: 'hoeren', title: 'Hören', time: '20 min', count: 3, desc: 'Telefonnotizen, Radioinformationen und ein längeres Zuordnungsgespräch.' },
      { id: 'lesen', title: 'Lesen', time: '50 min shared', count: 3, desc: 'Wegweiser lesen, Aussagen zu einem Artikel prüfen und Anzeigen zuordnen.' },
      { id: 'schreiben', title: 'Schreiben', time: '50 min shared', count: 2, desc: 'Fünf Formularangaben ergänzen und eine Nachricht mit etwa 40 Wörtern verfassen.' },
      { id: 'sprechen', title: 'Sprechen', time: '15 min', count: 3, desc: 'Sich vorstellen, ein Alltagsgespräch führen und gemeinsam etwas aushandeln.' }
    ]
  },
  'goethe-a2': {
    code: 'goethe-a2',
    name: 'Goethe-Zertifikat A2',
    badge: 'GOETHE A2',
    level: 'a2',
    timeMinutes: 70,
    sections: [
      { id: 'lesen', title: 'Lesen', time: '30 min', count: 4, desc: 'Zeitungsberichte, E-Mails, Kleinanzeigen und Aushänge.' },
      { id: 'hoeren', title: 'Hören', time: '20 min', count: 3, desc: 'Alltagsgespräche, Radiomeldungen und Anrufbeantworter.' },
      { id: 'schreiben', title: 'Schreiben', time: '15 min', count: 1, desc: 'Formelle E-Mail mit drei Leitpunkten verfassen.' },
      { id: 'sprechen', title: 'Sprechen', time: '10 min', count: 1, desc: 'Von sich erzählen und gemeinsame Pläne formulieren.' }
    ]
  },
  'telc-b1': {
    code: 'telc-b1',
    name: 'telc Deutsch B1 · Zertifikat Deutsch',
    badge: 'TELC B1',
    level: 'b1',
    timeMinutes: 165,
    sections: [
      { id: 'lesen', title: 'Lesen', time: '90 min shared', count: 3, desc: 'Globales, detailliertes und selektives Lesen.' },
      { id: 'sprachbausteine', title: 'Sprachbausteine', time: '90 min shared', count: 2, desc: 'Grammatik und Wortschatz: Multiple Choice und Wortbank.' },
      { id: 'hoeren', title: 'Hören', time: '30 min', count: 3, desc: 'Globale, detaillierte und selektive Hörtexte.' },
      { id: 'schreiben', title: 'Schreiben', time: '30 min', count: 1, desc: 'Persönliche oder halbformelle E-Mail mit vier Leitpunkten.' },
      { id: 'sprechen', title: 'Sprechen', time: '20 min prep + 15 min', count: 3, desc: 'Kennenlernen, über ein Thema sprechen und gemeinsam planen.' }
    ]
  },
  'goethe-b1': {
    code: 'goethe-b1',
    name: 'Goethe-Zertifikat B1',
    badge: 'GOETHE B1',
    level: 'b1',
    timeMinutes: 105,
    sections: [
      { id: 'lesen', title: 'Lesen', time: '65 min', count: 2, desc: 'Blogbeiträge, Presseartikel, Anzeigen und Richtlinien.' },
      { id: 'hoeren', title: 'Hören', time: '40 min', count: 2, desc: 'Durchsagen, Vortrag, Diskussion und persönliche Meinungen.' },
      { id: 'schreiben', title: 'Schreiben', time: '60 min', count: 1, desc: 'Persönliche Mitteilung, Meinungsäußerung und Beschwerde.' },
      { id: 'sprechen', title: 'Sprechen', time: '15 min', count: 1, desc: 'Gemeinsam etwas planen, Präsentation halten und Feedback geben.' }
    ]
  },
  'telc-b2': {
    code: 'telc-b2',
    name: 'telc Deutsch B2 · Beruf & Allgemein',
    badge: 'TELC B2',
    level: 'b2',
    timeMinutes: 155,
    sections: [
      { id: 'lesen', title: 'Lesen', time: '90 min shared', count: 3, desc: 'Überschriften zuordnen, einen Artikel verstehen und Situationen zu Anzeigen ordnen.' },
      { id: 'sprachbausteine', title: 'Sprachbausteine', time: '90 min shared', count: 2, desc: 'Grammatik im Brief und Wortschatz aus einer Liste ergänzen.' },
      { id: 'hoeren', title: 'Hören', time: '20 min', count: 3, desc: 'Nachrichten, ein Radiointerview und kurze Durchsagen — jede Aufnahme einmal.' },
      { id: 'schreiben', title: 'Schreiben', time: '30 min', count: 1, desc: 'Formeller Brief mit etwa 150 Wörtern: Beschwerde oder Bitte um Information.' },
      { id: 'sprechen', title: 'Sprechen', time: '20 min prep + 15 min', count: 3, desc: 'Präsentation, Diskussion eines Impulses und gemeinsam einen Ausflug planen.' }
    ]
  },
  'goethe-b2': {
    code: 'goethe-b2',
    name: 'Goethe-Zertifikat B2',
    badge: 'GOETHE B2',
    level: 'b2',
    timeMinutes: 115,
    sections: [
      { id: 'lesen', title: 'Lesen', time: '65 min', count: 2, desc: 'Kommentare, Berichte und Fachtexte aus Wirtschaft und Gesellschaft.' },
      { id: 'hoeren', title: 'Hören', time: '40 min', count: 1, desc: 'Präsentationen, Interviews und Fachdiskussionen.' },
      { id: 'schreiben', title: 'Schreiben', time: '75 min', count: 1, desc: 'Argumentativer Forumsbeitrag und formelle Beschwerde.' },
      { id: 'sprechen', title: 'Sprechen', time: '15 min', count: 1, desc: 'Präsentation eines komplexen Themas und Diskussion.' }
    ]
  },
  'telc-c1': {
    code: 'telc-c1',
    name: 'telc Deutsch C1 · Hochschule & Beruf',
    badge: 'TELC C1',
    level: 'c1',
    timeMinutes: 140,
    sections: [
      { id: 'lesen', title: 'Lesen', time: '90 min', count: 1, desc: 'Wissenschaftliche Abhandlungen und juristische Gutachten.' },
      { id: 'hoeren', title: 'Hören', time: '40 min', count: 1, desc: 'Fachpodiumsdiskussionen und akademische Vorlesungen.' },
      { id: 'schreiben', title: 'Schreiben', time: '70 min', count: 1, desc: 'Wissenschaftlicher Aufsatz mit differenzierter Argumentation.' },
      { id: 'sprechen', title: 'Sprechen', time: '20 min', count: 1, desc: 'Kolloquium und Verteidigung ethischer Thesen.' }
    ]
  },
  'goethe-c1': {
    code: 'goethe-c1',
    name: 'Goethe-Zertifikat C1',
    badge: 'GOETHE C1',
    level: 'c1',
    timeMinutes: 140,
    sections: [
      { id: 'lesen', title: 'Lesen', time: '70 min', count: 1, desc: 'Anspruchsvolle Kommentare, Sachbücher und Essayistik.' },
      { id: 'hoeren', title: 'Hören', time: '40 min', count: 1, desc: 'Radiobeiträge, Vorträge und Podiumsgespräche im Originaltempo.' },
      { id: 'schreiben', title: 'Schreiben', time: '80 min', count: 1, desc: 'Akademisch strukturierter Text mit Ursache-Wirkung-Synthese.' },
      { id: 'sprechen', title: 'Sprechen', time: '15 min', count: 1, desc: 'Fachmonolog und kontroverse Debatte im universitären Register.' }
    ]
  },
  'goethe-c2': {
    code: 'goethe-c2',
    name: 'Goethe-Zertifikat C2 · GDS',
    badge: 'GOETHE C2',
    level: 'c2',
    timeMinutes: 200,
    sections: [
      { id: 'lesen', title: 'Lesen', time: '80 min', count: 1, desc: 'Anspruchsvolle Sachtexte, literarische Prosa und Kommentare.' },
      { id: 'hoeren', title: 'Hören', time: '35 min', count: 1, desc: 'Vorträge, Radiobeiträge und komplexe Gespräche im Originaltempo.' },
      { id: 'schreiben', title: 'Schreiben', time: '80 min', count: 1, desc: 'Essay und Rezension auf muttersprachlichem Niveau.' },
      { id: 'sprechen', title: 'Sprechen', time: '15 min', count: 1, desc: 'Vortrag und Diskussion mit stilistischer Souveränität.' }
    ]
  },
  'telc-c2': {
    code: 'telc-c2',
    name: 'telc Deutsch C2 · Allgemein',
    badge: 'TELC C2',
    level: 'c2',
    timeMinutes: 195,
    sections: [
      { id: 'lesen', title: 'Lesen', time: '90 min', count: 1, desc: 'Feuilleton, Fachtexte und literarische Nuancen.' },
      { id: 'hoeren', title: 'Hören', time: '40 min', count: 1, desc: 'Hörfunkessays, Gesprächsrunden und Diskussionen.' },
      { id: 'schreiben', title: 'Schreiben', time: '75 min', count: 1, desc: 'Essay mit Registerwechsel und stilistischer Differenzierung.' },
      { id: 'sprechen', title: 'Sprechen', time: '15 min', count: 1, desc: 'Präsentation, Verhandlung und rhetorische Interaktion.' }
    ]
  }
};

// Five full telc A1-format papers register themselves as selectable exam suites.
Object.assign(MOCK_EXAM_SUITES, TELC_PAPER_SUITES);

export function getMockSections(examKey = 'telc-a1', baseMockIds = [], formatVersion = 2) {
  if(formatVersion===1){const legacy=getLegacyTelcSections(examKey);if(legacy)return legacy;if(examKey==='telc-a1')return baseMockIds;}
  if(examKey==='telc-a2')return formatVersion===3?TELC_A2_SECTIONS:[
    {skill:'lesen',ids:['a2-r1','a2-r2','a2-r3','a2-r4']},
    {skill:'hoeren',ids:['a2-h1','a2-h2','a2-h3']},
    {skill:'schreiben',ids:['a2-w1']},
    {skill:'sprechen',ids:['a2-s1']}
  ];
  if(examKey==='telc-b1'&&formatVersion===4)return TELC_B1_SECTIONS;
  if(examKey==='telc-b2'&&formatVersion===5)return TELC_B2_SECTIONS;
  const paperSuite = TELC_PAPER_SUITES[examKey==='telc-a1'?'telc-a1-p1':examKey];
  if (paperSuite) return paperSuite.paperIds;
  const suite = MOCK_EXAM_SUITES[examKey];
  const level = suite?.level || (examKey && examKey.includes('a2') ? 'a2' : examKey && examKey.includes('b1') ? 'b1' : examKey && examKey.includes('b2') ? 'b2' : examKey && examKey.includes('c1') ? 'c1' : 'a1');
  if (level === 'a1') return baseMockIds;
  if (level === 'a2') {
    return [
      { skill: 'lesen', ids: ['a2-r1', 'a2-r2', 'a2-r3', 'a2-r4'] },
      { skill: 'hoeren', ids: ['a2-h1', 'a2-h2', 'a2-h3'] },
      { skill: 'schreiben', ids: ['a2-w1'] },
      { skill: 'sprechen', ids: ['a2-s1'] }
    ];
  }
  if (level === 'b1') {
    return [
      { skill: 'lesen', ids: ['b1-r1', 'b1-r2'] },
      { skill: 'hoeren', ids: ['b1-h1', 'b1-h2'] },
      { skill: 'schreiben', ids: ['b1-w1'] },
      { skill: 'sprechen', ids: ['b1-s1'] }
    ];
  }
  if (level === 'b2') {
    return [
      { skill: 'lesen', ids: ['b2-r1', 'b2-r2'] },
      { skill: 'hoeren', ids: ['b2-h1'] },
      { skill: 'schreiben', ids: ['b2-w1'] },
      { skill: 'sprechen', ids: ['b2-s1'] }
    ];
  }
  if (level === 'c1') {
    return [
      { skill: 'lesen', ids: ['c1-r1'] },
      { skill: 'hoeren', ids: ['c1-h1'] },
      { skill: 'schreiben', ids: ['c1-w1'] },
      { skill: 'sprechen', ids: ['c1-s1'] }
    ];
  }
  if (level === 'c2') {
    return [
      { skill: 'lesen', ids: ['c2-r1'] },
      { skill: 'hoeren', ids: ['c2-h1'] },
      { skill: 'schreiben', ids: ['c2-w1'] },
      { skill: 'sprechen', ids: ['c2-s1'] }
    ];
  }
  return baseMockIds;
}

