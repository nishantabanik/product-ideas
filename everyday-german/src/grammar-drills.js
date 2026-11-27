// ponytail: Static grammar matrix with deterministic rules. Dynamic generator when 1000+ permutations required.
export const DRILL_MODES = [
  { id: 'kasus', name: { en: 'Case Matrix (Akk / Dat)', de: 'Kasus-Matrix (Akk / Dat)' }, desc: { en: 'Master der/die/das changes in Akkusativ and Dativ.', de: 'Artikelformen in Akkusativ und Dativ trainieren.' } },
  { id: 'prepositions', name: { en: 'Two-Way Prepositions (Wo / Wohin)', de: 'Wechselpräpositionen (Wo / Wohin)' }, desc: { en: 'Pick Dativ for location (Wo) or Akkusativ for movement (Wohin).', de: 'Dativ für Position (Wo) oder Akkusativ für Richtung (Wohin).' } },
  { id: 'adjectives', name: { en: 'Adjective Endings', de: 'Adjektivendungen' }, desc: { en: 'Pick the right ending (-e, -en, -er, -es, -em).', de: 'Die richtige Adjektivendung im Kontext wählen.' } },
  { id: 'wordOrder', name: { en: 'Connectors & Verb Position', de: 'Konnektoren & Verbstellung' }, desc: { en: 'Choose between Position 0, Position 1 and Verb-End.', de: 'Position 0 (denn), Position 1 (deshalb) oder Verb-Ende (weil).' } },
  { id: 'verben', name: { en: 'Verb Conjugation', de: 'Verbkonjugation' }, desc: { en: 'Present tense endings and separable verbs.', de: 'Endungen im Präsens und trennbare Verben.' } },
  { id: 'praeteritum', name: { en: 'Simple Past (Präteritum)', de: 'Präteritum' }, desc: { en: 'Past tense forms of haben, sein and more.', de: 'Vergangenheitsformen von haben, sein und mehr.' } },
  { id: 'pronomen', name: { en: 'Personal Pronouns', de: 'Personalpronomen' }, desc: { en: 'Nominativ, Akkusativ and Dativ pronouns.', de: 'Pronomen im Nominativ, Akkusativ und Dativ.' } },
  { id: 'adjektive', name: { en: 'Comparatives', de: 'Komparativ & Superlativ' }, desc: { en: 'Compare with -er, mehr and am … sten.', de: 'Vergleichen mit -er, mehr und am … sten.' } },
  { id: 'konnektoren', name: { en: 'Connector Meanings', de: 'Konnektoren-Bedeutung' }, desc: { en: 'Pick obwohl, damit, trotzdem or weil by meaning.', de: 'obwohl, damit, trotzdem oder weil nach Bedeutung wählen.' } }
];

export const DRILL_ITEMS = {
  kasus: [
    { prompt: 'Ich sehe ___ Mann. (der Mann)', options: ['den', 'dem', 'der'], answer: 0, rule: 'Akkusativ maskulin: der → den.', en: 'Direct object (Akkusativ maskulin) takes “den”.', de: 'Direktes Objekt (Akkusativ maskulin) verlangt „den“.' },
    { prompt: 'Ich helfe ___ Frau. (die Frau)', options: ['die', 'der', 'den'], answer: 1, rule: 'Dativ feminin: die → der.', en: '“Helfen” takes Dativ. Feminine takes “der”.', de: '„Helfen“ verlangt Dativ. Weiblich wird zu „der“.' },
    { prompt: 'Das Buch gehört ___ Kind. (das Kind)', options: ['dem', 'das', 'den'], answer: 0, rule: 'Dativ neutral: das → dem.', en: '“Gehören” takes Dativ. Neuter takes “dem”.', de: '„Gehören“ verlangt Dativ. Sächlich wird zu „dem“.' },
    { prompt: 'Wir danken ___ Kollegen (Plural).', options: ['die', 'der', 'den'], answer: 2, rule: 'Dativ Plural: die → den + n.', en: 'Dativ plural takes “den”.', de: 'Im Dativ Plural steht immer „den“.' },
    { prompt: 'Er sucht ___ Schlüssel (der Schlüssel).', options: ['den', 'dem', 'der'], answer: 0, rule: 'Akkusativ maskulin: der → den.', en: 'Seeking an object requires Akkusativ.', de: 'Akkusativ maskulin für das gesuchte Objekt: „den“.' }
  ],
  prepositions: [
    { prompt: 'Das Buch liegt auf ___ Tisch. (der Tisch - Wo?)', options: ['dem', 'den', 'das'], answer: 0, rule: 'Wo? (Location / Ruhe) → Dativ.', en: 'Stationary position (Wo?) takes Dativ: auf dem Tisch.', de: 'Ortsangabe (Wo?) verlangt Dativ: auf dem Tisch.' },
    { prompt: 'Ich lege das Buch auf ___ Tisch. (der Tisch - Wohin?)', options: ['dem', 'den', 'der'], answer: 1, rule: 'Wohin? (Movement / Richtung) → Akkusativ.', en: 'Movement towards (Wohin?) takes Akkusativ: auf den Tisch.', de: 'Richtung/Bewegung (Wohin?) verlangt Akkusativ: auf den Tisch.' },
    { prompt: 'Das Bild hängt an ___ Wand. (die Wand - Wo?)', options: ['die', 'der', 'den'], answer: 1, rule: 'Wo? → Dativ feminin: an der Wand.', en: 'Location (Wo?) takes Dativ feminin: an der Wand.', de: 'Position an der Wand (Wo?) verlangt Dativ: an der Wand.' },
    { prompt: 'Ich hänge das Bild an ___ Wand. (die Wand - Wohin?)', options: ['die', 'der', 'den'], answer: 0, rule: 'Wohin? → Akkusativ feminin: an die Wand.', en: 'Movement (Wohin?) takes Akkusativ feminin: an die Wand.', de: 'Richtung (Wohin?) verlangt Akkusativ: an die Wand.' },
    { prompt: 'Die Katze schläft unter ___ Bett. (das Bett - Wo?)', options: ['das', 'dem', 'den'], answer: 1, rule: 'Wo? → Dativ neutral: unter dem Bett.', en: 'Location (Wo?) takes Dativ neutral: unter dem Bett.', de: 'Position (Wo?) verlangt Dativ neutral: unter dem Bett.' }
  ],
  adjectives: [
    { prompt: 'Das ist ein neu___ Computer. (der)', options: ['-er', '-es', '-e'], answer: 0, rule: 'Ein neuer (maskulin Nominativ unbestimmt).', en: 'Indefinite article masculine nominative takes -er.', de: 'Maskulin Nominativ nach unbestimmtem Artikel endet auf -er.' },
    { prompt: 'Hier ist das neu___ Auto. (das)', options: ['-e', '-es', '-en'], answer: 0, rule: 'Das neue (neutral Nominativ bestimmt).', en: 'Definite article neuter nominative takes -e.', de: 'Neutral Nominativ nach bestimmtem Artikel endet auf -e.' },
    { prompt: 'Ich trinke Tee mit frisch___ Milch. (die, Dativ)', options: ['-er', '-em', '-en'], answer: 0, rule: 'Frischer Milch (feminin Dativ ohne Artikel).', en: 'Feminine Dativ without article takes -er.', de: 'Feminin Dativ ohne Artikel übernimmt das Signal -er.' },
    { prompt: 'Er hat einen gut___ Job gefunden. (der, Akkusativ)', options: ['-en', '-er', '-es'], answer: 0, rule: 'Einen guten (maskulin Akkusativ).', en: 'Masculine Akkusativ always ends in -en.', de: 'Maskulin Akkusativ nach „einen“ endet immer auf -en.' },
    { prompt: 'Die nett___ Nachbarn helfen uns. (Plural)', options: ['-en', '-e', '-er'], answer: 0, rule: 'Die netten (Plural bestimmt).', en: 'Plural after definite article always takes -en.', de: 'Plural nach bestimmtem Artikel verlangt immer -en.' }
  ],
  wordOrder: [
    { prompt: 'Ich lerne Deutsch, ___ ich in Berlin lebe.', options: ['weil', 'denn', 'deshalb'], answer: 0, rule: '„weil“ schickt das konjugierte Verb ans Satzende.', en: '“weil” is a subordinating connector; conjugated verb goes to the end.', de: '„weil“ ist eine Subjunktion; das Verb steht am Satzende.' },
    { prompt: 'Ich bin müde, ___ gehe ich schlafen.', options: ['deshalb', 'denn', 'weil'], answer: 0, rule: '„deshalb“ steht auf Position 1, danach folgt das Verb.', en: '“deshalb” occupies position 1; verb follows immediately.', de: '„deshalb“ steht auf Position 1; das finite Verb folgt sofort.' },
    { prompt: 'Er kommt nicht, ___ er ist krank.', options: ['denn', 'weil', 'obwohl'], answer: 0, rule: '„denn“ steht auf Position 0; normale Satzstellung (Subjekt + Verb).', en: '“denn” occupies position 0; normal word order follows.', de: '„denn“ steht auf Position 0; normale Wortstellung folgt.' },
    { prompt: 'Wir wissen, ___ der Kurs um 9 Uhr beginnt.', options: ['dass', 'denn', 'deshalb'], answer: 0, rule: '„dass“ leitet einen Nebensatz ein (Verb am Ende).', en: '“dass” introduces a subordinate clause with verb at the end.', de: '„dass“ leitet einen Nebensatz ein (Verb am Ende).' },
    { prompt: 'Es regnet, ___ machen wir einen Spaziergang.', options: ['trotzdem', 'weil', 'obwohl'], answer: 0, rule: '„trotzdem“ steht auf Position 1; Verb an Position 2.', en: '“trotzdem” occupies position 1 followed by verb.', de: '„trotzdem“ steht auf Position 1; danach folgt das Verb.' }
  ],
  verben: [
    { prompt: 'Ich ___ jeden Tag Deutsch. (lernen)', options: ['lerne', 'lernst', 'lernt'], answer: 0, rule: 'ich → Stamm + e.', en: 'First person singular takes -e.', de: 'Ich-Form endet auf -e.' },
    { prompt: 'Du ___ sehr schnell. (sprechen)', options: ['sprichst', 'spreche', 'sprecht'], answer: 0, rule: 'du → Stammwechsel e→i + st.', en: '“sprechen” is irregular: du sprichst.', de: '„sprechen“ wechselt den Stamm: du sprichst.' },
    { prompt: 'Er ___ um 7 Uhr auf. (aufstehen, trennbar)', options: ['steht', 'stehen', 'stehe'], answer: 0, rule: 'Trennbares Verb: Er steht … auf.', en: 'Separable verb: prefix goes to the end.', de: 'Trennbares Verb: Präfix ans Ende.' },
    { prompt: 'Wir ___ am Wochenende. (arbeiten)', options: ['arbeiten', 'arbeitet', 'arbeite'], answer: 0, rule: 'wir → Infinitiv.', en: '“wir” uses the infinitive form.', de: '„wir“ nutzt den Infinitiv.' },
    { prompt: 'Ihr ___ heute später. (kommen)', options: ['kommt', 'komme', 'kommen'], answer: 0, rule: 'ihr → Stamm + t.', en: '“ihr” takes -t.', de: 'Ihr-Form endet auf -t.' }
  ],
  praeteritum: [
    { prompt: 'Als Kind ___ ich in Bonn. (wohnen)', options: ['wohnte', 'wohne', 'gewohnt'], answer: 0, rule: 'Regelmäßig: Stamm + te.', en: 'Regular Präteritum: stem + te.', de: 'Regelmäßiges Präteritum: Stamm + te.' },
    { prompt: 'Gestern ___ ich keine Zeit. (haben)', options: ['hatte', 'habe', 'habte'], answer: 0, rule: 'Unregelmäßig: hatte.', en: 'Irregular: hatte.', de: 'Unregelmäßig: hatte.' },
    { prompt: 'Wir ___ im Urlaub am Meer. (sein)', options: ['waren', 'seien', 'wären'], answer: 0, rule: 'sein → waren.', en: 'sein (wir) → waren.', de: 'sein (wir) → waren.' },
    { prompt: 'Der Zug pünktlich ___. (abfahren)', options: ['fuhr ab', 'fährt ab', 'abfuhr'], answer: 0, rule: 'Trennbar im Präteritum: fuhr … ab.', en: 'Separable verbs split in the past too.', de: 'Trennbare Verben trennen auch im Präteritum.' },
    { prompt: '___ du gestern im Kurs? (sein)', options: ['Warst', 'Wärst', 'Wirst'], answer: 0, rule: 'du → warst.', en: 'du form: warst.', de: 'Du-Form: warst.' }
  ],
  pronomen: [
    { prompt: 'Kennst du ___? (der Mann, Akkusativ)', options: ['ihn', 'er', 'ihm'], answer: 0, rule: 'Akkusativ maskulin: ihn.', en: 'Masculine accusative: ihn.', de: 'Maskulin Akkusativ: ihn.' },
    { prompt: 'Ich helfe ___. (die Frau, Dativ)', options: ['ihr', 'sie', 'euch'], answer: 0, rule: 'Dativ feminin: ihr.', en: 'Feminine dative: ihr.', de: 'Feminin Dativ: ihr.' },
    { prompt: 'Das Geschenk ist für ___. (das Kind, Akkusativ)', options: ['es', 'er', 'ihm'], answer: 0, rule: 'Neutral Akkusativ: es.', en: 'Neuter accusative: es.', de: 'Neutral Akkusativ: es.' },
    { prompt: 'Wir treffen ___ morgen. (ihr)', options: ['euch', 'uns', 'Sie'], answer: 0, rule: 'Akkusativ von „ihr“: euch.', en: 'Accusative of “ihr”: euch.', de: 'Akkusativ von „ihr“: euch.' },
    { prompt: 'Wie geht es ___? (Sie, Dativ)', options: ['Ihnen', 'Sie', 'Ihr'], answer: 0, rule: 'Dativ förmlich: Ihnen.', en: 'Formal dative: Ihnen.', de: 'Höfliches Dativ: Ihnen.' }
  ],
  adjektive: [
    { prompt: 'Berlin ist ___ als Bonn. (groß)', options: ['größer', 'großer', 'am größten'], answer: 0, rule: 'Umlaut + ß + er: größer.', en: 'Comparative: größer.', de: 'Komparativ: größer.' },
    { prompt: 'Das ist das ___ Gebäude der Stadt. (hoch)', options: ['höchste', 'höhere', 'hohe'], answer: 0, rule: 'Superlativ mit Artikel: (das) höchste.', en: 'Superlative with article: höchste.', de: 'Superlativ mit Artikel: höchste.' },
    { prompt: 'Mein Deutsch wird ___. (gut, Komparativ)', options: ['besser', 'guter', 'am besten'], answer: 0, rule: 'gut → besser → am besten.', en: 'gut → besser → am besten.', de: 'gut → besser → am besten.' },
    { prompt: 'Diese Wohnung ist ___ als meine. (billig)', options: ['billiger', 'billigste', 'billigerer'], answer: 0, rule: 'Regelmäßiger Komparativ: billiger.', en: 'Regular comparative: billiger.', de: 'Regelmäßiger Komparativ: billiger.' },
    { prompt: 'Er rennt ___. (schnell, Superlativ ohne Artikel)', options: ['am schnellsten', 'schnellste', 'schneller'], answer: 0, rule: 'Freier Superlativ: am … sten.', en: 'Predicate superlative: am schnellsten.', de: 'Prädikativer Superlativ: am schnellsten.' }
  ],
  konnektoren: [
    { prompt: '___ des Regens gehen wir spazieren.', options: ['Trotzdem', 'Weil', 'Deshalb'], answer: 0, rule: '„trotzdem“ drückt den Gegensatz aus (Position 1).', en: '“trotzdem” marks contrast and takes position 1.', de: '„trotzdem“ markiert Gegensatz und steht auf Position 1.' },
    { prompt: 'Ich komme nicht, ___ ich arbeiten muss.', options: ['weil', 'denn', 'deshalb'], answer: 0, rule: '„weil“ → Nebensatz, Verb ans Ende.', en: '“weil” creates a subordinate clause.', de: '„weil“ bildet einen Nebensatz.' },
    { prompt: 'Er ist krank, ___ arbeitet er weiter.', options: ['obwohl', 'weil', 'denn'], answer: 0, rule: '„obwohl“ → konzessiver Nebensatz.', en: '“obwohl” marks a concessive clause.', de: '„obwohl“ leitet einen konzessiven Nebensatz ein.' },
    { prompt: '___ der Prüfung lerne ich jeden Tag. (Ziel nennen)', options: ['Damit', 'Deshalb', 'Denn'], answer: 0, rule: '„damit“ drückt einen Zweck aus (Nebensatz).', en: '“damit” expresses purpose in a subordinate clause.', de: '„damit“ drückt einen Zweck im Nebensatz aus.' },
    { prompt: 'Ich spare, ___ ich im Urlaub ein Auto mieten kann.', options: ['damit', 'trotzdem', 'obwohl'], answer: 0, rule: '„damit“ + Modalverb im Nebensatz.', en: '“damit” with a modal verb at the end.', de: '„damit“ mit Modalverb am Satzende.' }
  ]
};
