// Comprehensive CEFR-graded practice and mock exam item bank for A1, A2, B1, B2, C1
// Every level has distinct, authentic German texts, audio transcripts, writing prompts, and speaking tasks.

export const LEVEL_EXERCISES = {
  a1: [], // Inherits or links to base A1 items from content.js
  a2: [
    // --- A2 LESEN (Reading) ---
    {
      id: 'a2-r1',
      level: 'a2',
      skill: 'lesen',
      part: 1,
      title: 'Terminabsage beim Einwohnermeldeamt',
      text: 'Sehr geehrte Damen und Herren,\nwegen einer dringenden Dienstreise kann ich meinen gebuchten Termin zur Ummeldung am Donnerstag, dem 14. Mai, um 10:15 Uhr im Bürgeramt Mitte leider nicht wahrnehmen. Ich habe bereits online versucht, den Termin zu stornieren, aber das System meldete einen Serverfehler. Bitte stornieren Sie den Termin für mich. Meine Vorgangsnummer lautet BU-88492.\nMit freundlichen Grüßen,\nMarc Becker',
      prompt: 'Herr Becker bittet das Bürgeramt, seinen Termin abzusagen.',
      options: ['Richtig', 'Falsch'],
      answer: 0,
      explanation: {
        en: 'Marc Becker explicitly asks the office to cancel his appointment ("Bitte stornieren Sie den Termin für mich").',
        de: 'Herr Becker bittet das Amt ausdrücklich: „Bitte stornieren Sie den Termin für mich.“'
      },
      type: 'choice'
    },
    {
      id: 'a2-r2',
      level: 'a2',
      skill: 'lesen',
      part: 1,
      title: 'Hausordnung: Ruhezeiten und Mülltrennung',
      text: 'Liebe Hausgemeinschaft,\nbitte beachten Sie, dass die Mittagsruhe von 13:00 bis 15:00 Uhr sowie die Nachtruhe ab 22:00 Uhr strikt eingehalten werden müssen. Laute Musik oder Bohrarbeiten sind in diesen Zeiten nicht gestattet. Zudem möchten wir daran erinnern, dass Altpapier zerkleinert in die blaue Tonne gehört und Plastikverpackungen in die gelbe Tonne. Biomüll darf nicht in Plastiktüten eingeworfen werden.\nIhre Hausverwaltung',
      prompt: 'Um 14 Uhr darf man in der Wohnung laute Musik hören.',
      options: ['Richtig', 'Falsch'],
      answer: 1,
      explanation: {
        en: '14:00 falls inside the quiet hours (Mittagsruhe 13:00–15:00), when loud music is forbidden.',
        de: '14:00 Uhr liegt in der Mittagsruhe (13:00 bis 15:00 Uhr), in der laute Musik verboten ist.'
      },
      type: 'choice'
    },
    {
      id: 'a2-r3',
      level: 'a2',
      skill: 'lesen',
      part: 2,
      title: 'Wohnungssuche in Hamburg',
      text: 'Anzeige A:\n2-Zimmer-Wohnung in Altona, 58 m², 850 € Kaltmiete + 180 € Nebenkosten. Ruhiger Hinterhof, Einbauküche vorhanden, keine Haustiere erlaubt. Frei ab 1. Juli.\n\nAnzeige B:\n3-Zimmer-Wohnung in Barmbek, 72 m², 920 € Warmmiete. Balkon, Aufzug, Haustiere nach Absprache willkommen. Sehr gute Anbindung an die S-Bahn. Sofort frei.',
      prompt: 'Sie haben eine Katze und suchen eine Wohnung mit Nebenkosten unter 1000 Euro Gesamtmiete. Welche Anzeige passt?',
      options: ['Anzeige A', 'Anzeige B'],
      answer: 1,
      explanation: {
        en: 'Apartment B allows pets by agreement and the total warm rent is 920 €, which is under 1000 €.',
        de: 'In Anzeige B sind Haustiere nach Absprache erlaubt und die Warmmiete liegt mit 920 € unter 1000 €.'
      },
      type: 'choice'
    },
    {
      id: 'a2-r4',
      level: 'a2',
      skill: 'lesen',
      part: 3,
      title: 'Aushang im Supermarkt',
      text: 'Kassenzettel bitte sorgfältig prüfen!\nReklamationen von fehlerhaften Kassenbons und Rückgaben von originalverpackten Non-Food-Artikeln sind nur innerhalb von 14 Tagen mit Kassenbon am Informationsschalter möglich.',
      prompt: 'Man kann Artikel auch ohne Kassenbon umtauschen.',
      options: ['Richtig', 'Falsch'],
      answer: 1,
      explanation: {
        en: 'Returns are only possible with the receipt ("nur innerhalb von 14 Tagen mit Kassenbon").',
        de: 'Rückgaben sind nur mit Kassenbon möglich („nur innerhalb von 14 Tagen mit Kassenbon“).'
      },
      type: 'choice'
    },
    // --- A2 HÖREN (Listening) ---
    {
      id: 'a2-h1',
      level: 'a2',
      skill: 'hoeren',
      part: 1,
      title: 'Beim Arzt am Empfang',
      transcript: 'Guten Tag, Herr Rossi. Sie haben um elf Uhr dreißig einen Termin bei Frau Doktor Weigel. Bitte nehmen Sie kurz im Wartezimmer eins Platz. Bringen Sie bitte noch Ihre elektronische Gesundheitskarte und den ausgefüllten Anamnesebogen nach vorne, bevor Sie ins Arztzimmer gerufen werden.',
      prompt: 'Was soll Herr Rossi vor dem Arztgespräch abgeben?',
      options: ['Ein Passfoto', 'Gesundheitskarte und Fragebogen', 'Nur ein Rezept'],
      answer: 1,
      explanation: {
        en: 'The receptionist asks for his health card and completed questionnaire.',
        de: 'Die Arzthelferin bittet um die Gesundheitskarte und den ausgefüllten Bogen.'
      },
      type: 'choice'
    },
    {
      id: 'a2-h2',
      level: 'a2',
      skill: 'hoeren',
      part: 2,
      title: 'Gleisänderung am Hauptbahnhof',
      transcript: 'Achtung an Gleis sieben: Intercity-Express 582 nach München Hauptbahnhof über Nürnberg, planmäßige Abfahrt um vierzehn Uhr zweiundvierzig, fährt heute ausnahmsweise von Gleis neun ein. Grund dafür ist eine Stellwerksstörung. Reisende nach München begeben sich bitte zu Gleis neun.',
      prompt: 'Der ICE nach München fährt heute von Gleis ... ab.',
      options: ['Gleis 7', 'Gleis 8', 'Gleis 9'],
      answer: 2,
      explanation: {
        en: 'The announcement states that the train departs exceptionally from platform 9 ("fährt heute ausnahmsweise von Gleis neun").',
        de: 'Die Durchsage meldet: Der Zug fährt heute ausnahmsweise von Gleis 9.'
      },
      type: 'choice'
    },
    {
      id: 'a2-h3',
      level: 'a2',
      skill: 'hoeren',
      part: 3,
      title: 'Nachricht vom Handwerker',
      transcript: 'Hallo Frau Sommer, hier spricht Klaus vom Sanitärdienst. Wegen eines Notfalls kann ich heute Nachmittag leider doch nicht wie vereinbart um fünfzehn Uhr bei Ihnen vorbeikommen. Ich könnte morgen früh bereits um acht Uhr dreißig oder am Nachmittag um sechzehn Uhr da sein. Rufen Sie mich bitte kurz unter null eins sieben eins zurück.',
      prompt: 'Wann wollte der Handwerker ursprünglich kommen?',
      options: ['Um 8.30 Uhr', 'Um 15.00 Uhr', 'Um 16.00 Uhr'],
      answer: 1,
      explanation: {
        en: 'He originally agreed on 15:00 ("nicht wie vereinbart um fünfzehn Uhr vorbeikommen").',
        de: 'Der ursprüngliche Termin war um 15:00 Uhr vereinbart.'
      },
      type: 'choice'
    },
    // --- A2 SCHREIBEN (Writing) ---
    {
      id: 'a2-w1',
      level: 'a2',
      skill: 'schreiben',
      part: 1,
      type: 'writing',
      title: 'Krankmeldung an den Arbeitgeber',
      prompt: 'Sie sind krank und können heute nicht zur Arbeit kommen. Schreiben Sie eine E-Mail an Ihre Vorgesetzte, Frau Schmidt (ca. 40–50 Wörter). Behandeln Sie alle drei Punkte:\n1. Grund für Ihr Fehlen mitteilen\n2. Voraussichtliche Krankheitsdauer und Attest erwähnen\n3. Anbieten, dringende E-Mails zu beantworten oder Kollege informieren.',
      points: ['Grund des Fehlens', 'Dauer und Attest vom Arzt', 'Erreichbarkeit / Übergabe'],
      model: 'Sehr geehrte Frau Schmidt,\nleider bin ich heute krank und kann nicht ins Büro kommen. Ich gehe gleich zum Arzt und werde Ihnen die Arbeitsunfähigkeitsbescheinigung per E-Mail zukommen lassen. Voraussichtlich falle ich bis Mittwoch aus. Bei sehr dringenden Fragen bin ich mobil erreichbar.\nMit freundlichen Grüßen,\nDaniel Varga',
      explanation: {
        en: 'Clear formal sick leave email with reason, expected doctor certificate, and contact availability.',
        de: 'Formelle Krankmeldung mit Angabe des Grundes, Attestankündigung und Erreichbarkeit.'
      }
    },
    // --- A2 SPRECHEN (Speaking) ---
    {
      id: 'a2-s1',
      level: 'a2',
      skill: 'sprechen',
      part: 1,
      type: 'speaking',
      title: 'Über den Alltag und Wochenendpläne sprechen',
      prompt: 'Erzählen Sie Ihrer Partnerin oder Ihrem Partner von Ihrem vergangenen Wochenende und Ihren Plänen für die nächste Woche.',
      points: ['Was haben Sie am Wochenende gemacht? (Perfekt verwenden)', 'Wie war das Wetter?', 'Was haben Sie nächste Woche vor?'],
      model: 'Am Wochenende habe ich mich mit Freunden getroffen. Wir haben im Park gegrillt und Musik gehört, weil das Wetter sehr sonnig und warm war. Am Sonntag bin ich zu Hause geblieben und habe Deutsch gelernt. Nächste Woche möchte ich nach der Arbeit ins Fitnessstudio gehen und ein Buch lesen.',
      explanation: {
        en: 'Demonstrate active use of past tense (Perfekt: habe getroffen, haben gegrillt) and future intentions.',
        de: 'Verwendung von Perfekt und Beschreibung von Vorhaben.'
      }
    }
  ],

  b1: [
    // --- B1 LESEN (Reading) ---
    {
      id: 'b1-r1',
      level: 'b1',
      skill: 'lesen',
      part: 1,
      title: 'Mietminderung wegen Heizungsausfall',
      text: 'Sehr geehrte Frau Dr. Lehmann,\nhiermit muss ich Ihnen mitteilen, dass seit dem 1. November in meiner Mietwohnung im 3. OG die Heizungsanlage im Wohnzimmer und Badezimmer vollständig ausgefallen ist. Trotz mehrmaliger telefonischer Meldung bei der Hausmeisterei wurde der Mangel bis heute nicht behoben. Bei Außentemperaturen um den Gefrierpunkt beträgt die Raumtemperatur lediglich 14 Grad Celsius.\nIch fordere Sie hiermit auf, den Mangel bis spätestens zum 12. November zu beseitigen. Sollte die Reparatur nicht fristgerecht erfolgen, behalte ich mir vor, die monatliche Bruttomiete um 20 % zu mindern und die ausstehenden Beträge einzubehalten.\nMit freundlichen Grüßen,\nStefan Gruber',
      prompt: 'Herr Gruber droht mit einer Mietkürzung, falls die Heizung nicht repariert wird.',
      options: ['Richtig', 'Falsch'],
      answer: 0,
      explanation: {
        en: 'The tenant explicitly states he reserves the right to reduce the rent by 20% if not repaired in time.',
        de: 'Herr Gruber schreibt ausdrücklich: „behalte ich mir vor, die monatliche Bruttomiete um 20 % zu mindern“.'
      },
      type: 'choice'
    },
    {
      id: 'b1-r2',
      level: 'b1',
      skill: 'lesen',
      part: 2,
      title: 'Artikel: Homeoffice und Arbeitsrecht in Deutschland',
      text: 'Immer mehr Beschäftigte in Deutschland wünschen sich dauerhaftes Arbeiten von zu Hause aus. Allerdings existiert im deutschen Arbeitsrecht bis heute kein genereller gesetzlicher Anspruch auf Homeoffice. Vereinbarungen müssen individuell im Arbeitsvertrag oder kollektiv durch eine Betriebsvereinbarung geregelt werden. Arbeitgeber müssen jedoch sicherstellen, dass die Vorgaben des Arbeitsschutzgesetzes auch am häuslichen Arbeitsplatz eingehalten werden.',
      prompt: 'Haben alle Angestellten in Deutschland laut Gesetz das Recht auf Homeoffice?',
      options: ['Ja, das Arbeitsrecht garantiert Homeoffice für alle.', 'Nein, es gibt keinen allgemeinen gesetzlichen Anspruch.', 'Nur Beschäftigte mit Kindern haben dieses Recht.'],
      answer: 1,
      explanation: {
        en: 'The article clarifies that there is no general legal claim to home office in German labour law.',
        de: 'Der Text stellt klar: „kein genereller gesetzlicher Anspruch auf Homeoffice“.'
      },
      type: 'choice'
    },
    // --- B1 HÖREN (Listening) ---
    {
      id: 'b1-h1',
      level: 'b1',
      skill: 'hoeren',
      part: 1,
      title: 'Beratungsgespräch bei der Agentur für Arbeit',
      transcript: 'Guten Tag, Herr Morales. Schön, dass Sie da sind. Wir haben Ihr Profil und Ihre im Ausland erworbenen Zeugnisse als Elektrotechniker geprüft. Um in Deutschland voll anerkannt zu werden, fehlen Ihnen noch sechzig Theorie-Stunden im Bereich der deutschen DIN-Vorschriften sowie ein Sprachzertifikat auf B2-Niveau. Die gute Nachricht: Die Bundesagentur für Arbeit kann die Kosten für den Anpassungslehrgang über einen Bildungsgutschein zu hundert Prozent übernehmen.',
      prompt: 'Was übernimmt die Bundesagentur für Arbeit für Herrn Morales?',
      options: ['Nur die Prüfungsgebühr', 'Den kompletten Anpassungslehrgang über einen Bildungsgutschein', 'Seine monatliche Miete'],
      answer: 1,
      explanation: {
        en: 'The advisor states the employment agency can cover 100% of the training costs via a Bildungsgutschein.',
        de: 'Die Beraterin bestätigt: Die Kosten für den Lehrgang können zu 100 % über einen Bildungsgutschein übernommen werden.'
      },
      type: 'choice'
    },
    {
      id: 'b1-h2',
      level: 'b1',
      skill: 'hoeren',
      part: 2,
      title: 'Radiointerview: Ehrenamt und Integration',
      transcript: 'Willkommen bei Radio Kultur. Bei uns im Studio ist Merve Kaya, Gründerin der Initiative „Sprachbrücke“. Frau Kaya, wie unterstützen Sie Neuzugewanderte? — Merve Kaya: Wir organisieren wöchentliche Sprachcafés, in denen Einheimische und Zugewanderte zwanglos bei Kaffee und Tee über alltägliche Themen sprechen. Es geht nicht um strenge Grammatik, sondern darum, die Sprechangst zu verlieren und echte Freundschaften zu schließen.',
      prompt: 'Was ist das Hauptziel des Sprachcafés?',
      options: ['Strenge Grammatikprüfungen durchführen', 'Sprechangst abbauen und Kontakte knüpfen', 'Kostenlose Deutschbücher verkaufen'],
      answer: 1,
      explanation: {
        en: 'The main goal is to lose speaking anxiety and make genuine connections.',
        de: 'Das Ziel ist es, die Sprechangst zu verlieren und Freundschaften zu schließen.'
      },
      type: 'choice'
    },
    // --- B1 SCHREIBEN (Writing) ---
    {
      id: 'b1-w1',
      level: 'b1',
      skill: 'schreiben',
      part: 1,
      type: 'writing',
      title: 'Beschwerdebrief an einen Online-Händler',
      prompt: 'Sie haben vor drei Wochen einen Laptop bestellt und sofort bezahlt. Das Gerät wurde mit beschädigtem Display geliefert. Der Kundenservice antwortet nicht auf Ihre Anrufe. Verfassen Sie eine förmliche Reklamation (ca. 80 Wörter).\nBehandeln Sie folgende Punkte:\n- Bestelldaten und Lieferdatum nennen\n- Zustand der Ware beschreiben\n- Frist zur Ersatzlieferung oder Rückerstattung setzen\n- Rechtliche Schritte ankündigen falls keine Reaktion erfolgt.',
      points: ['Bestellnummer & Datum', 'Mangel beschreiben', 'Frist setzen', 'Konsequenzen nennen'],
      model: 'Sehr geehrte Damen und Herren,\nam 12. Oktober habe ich bei Ihnen einen Laptop (Bestellnummer: DE-90412) für 799 Euro bestellt und direkt per PayPal bezahlt. Bei der Lieferung stellte ich fest, dass das Display gebrochen ist. Mehrmalige Anrufversuche bei Ihrem Kundenservice blieben leider erfolglos.\nIch fordere Sie hiermit auf, mir bis zum 15. November ein einwandfreies Ersatzgerät zu liefern oder den vollen Kaufbetrag auf mein Konto zu erstatten. Sollte ich bis dahin nichts von Ihnen hören, werde ich mich an die Verbraucherzentrale wenden.\nMit freundlichen Grüßen,\nSara Lindner',
      explanation: {
        en: 'Standard B1 formal complaint with clear chronology, assertiveness, and specific deadline.',
        de: 'Formelle B1-Beschwerde mit Bestellnummer, Fristsetzung und Konsequenzen.'
      }
    },
    // --- B1 SPRECHEN (Speaking) ---
    {
      id: 'b1-s1',
      level: 'b1',
      skill: 'sprechen',
      part: 1,
      type: 'speaking',
      title: 'Gemeinsam eine Abschiedsfeier planen',
      prompt: 'Ein Kollege verlässt Ihre Abteilung. Planen Sie zusammen mit Ihrer Partnerin oder Ihrem Partner ein Abschiedsgeschenk und eine kleine Überraschungsfeier im Büro.',
      points: ['Wann und wo feiern?', 'Welches Geschenk kaufen?', 'Wer besorgt Essen und Getränke?', 'Wie beteiligen sich die Kollegen an den Kosten?'],
      model: 'Könnten wir die Feier am Freitagnachmittag um fünfzehn Uhr in der Kaffeeküche veranstalten? Ich schlage vor, dass wir einen Gutschein für seinen Lieblingsbuchladen kaufen und eine große Karte unterschreiben lassen. Wenn jeder fünf Euro gibt, reicht das völlig aus. Ich könnte am Vormittag Brezeln und Saft besorgen, wenn du die Dekoration übernimmst.',
      explanation: {
        en: 'Use cooperative planning language with suggestions (Könnten wir..., Ich schlage vor..., Wenn du möchtest...).',
        de: 'Kooperative Planung mit Vorschlägen, Begründungen und Aufgabenverteilung.'
      }
    }
  ],

  b2: [
    // --- B2 LESEN (Reading) ---
    {
      id: 'b2-r1',
      level: 'b2',
      skill: 'lesen',
      part: 1,
      title: 'Datenschutzrichtlinie und Cloud-Nutzung am Arbeitsplatz',
      text: 'Gemäß der europäischen Datenschutz-Grundverordnung (DSGVO) und den internen Sicherheitsrichtlinien unseres Unternehmens ist die Übertragung personenbezogener Kundendaten auf private Endgeräte oder nicht freigegebene externe Cloud-Speicheranbieter strengstens untersagt. Sämtliche Arbeitsdateien müssen auf den verschlüsselten Netzlaufwerken des Unternehmens abgelegt werden. Zuwiderhandlungen stellen einen schwerwiegenden Verstoß gegen arbeitsvertragliche Treuepflichten dar und können abmahnungs- sowie kündigungsrelevante Konsequenzen nach sich ziehen.',
      prompt: 'Mitarbeiter dürfen Arbeitsdateien auf ihren privaten Cloud-Konten sichern, wenn es schnell gehen muss.',
      options: ['Richtig', 'Falsch'],
      answer: 1,
      explanation: {
        en: 'Transferring data to private devices or unapproved clouds is strictly forbidden ("strengstens untersagt").',
        de: 'Die Übertragung auf private Cloud-Speicher ist laut Richtlinie strengstens untersagt.'
      },
      type: 'choice'
    },
    {
      id: 'b2-r2',
      level: 'b2',
      skill: 'lesen',
      part: 2,
      title: 'Fachkräftesicherung und Onboarding im Mittelstand',
      text: 'Ein strukturiertes Onboarding-Konzept mindert die Fluktuationsrate in mittelständischen Unternehmen nachweislich um bis zu 40 Prozent. Ein erfolgreiches Programm umfasst neben der fachlichen Einarbeitung durch feste Mentoren auch eine transparente Kommunikation der Unternehmenskultur. Werden neue Beschäftigte in den ersten sechs Monaten nicht systematisch begleitet, kündigen laut Studien knapp 30 Prozent der Neuzugänge noch vor Ablauf der Probezeit.',
      prompt: 'Was bewirkt ein strukturiertes Onboarding laut dem Text?',
      options: ['Es verdoppelt das Einstiegsgehalt.', 'Es verringert die Personalfluktuation spürbar.', 'Es ersetzt die sechsmonatige Probezeit vollständig.'],
      answer: 1,
      explanation: {
        en: 'The text highlights that structured onboarding visibly reduces staff turnover by up to 40%.',
        de: 'Der Text belegt, dass strukturiertes Onboarding die Fluktuation um bis zu 40 % mindert.'
      },
      type: 'choice'
    },
    // --- B2 HÖREN (Listening) ---
    {
      id: 'b2-h1',
      level: 'b2',
      skill: 'hoeren',
      part: 1,
      title: 'Teamsitzung: Quartalsergebnisse und Projektpriorisierung',
      transcript: 'Guten Morgen zusammen. Wir blicken auf ein herausforderndes drittes Quartal zurück. Zwar konnten wir im Bereich der digitalen Dienstleistungen ein Umsatzwachstum von acht Prozent verzeichnen, jedoch hinken wir bei der Markteinführung unserer neuen Software zwei Monate hinter dem Zeitplan hinterher. Um das vierte Quartal stabil abzuschließen, schlage ich vor, alle nicht dringenden Nebenprojekte vorübergehend einzufrieren und das gesamte Entwicklerteam auf die Fehlerbehebung im Hauptprodukt zu fokussieren.',
      prompt: 'Welche strategische Maßnahme schlägt die Abteilungsleitung vor?',
      options: ['Neue Mitarbeiter im Vertrieb einstellen', 'Nebenprojekte stoppen und Kapazitäten auf das Hauptprodukt bündeln', 'Die Preise um acht Prozent senken'],
      answer: 1,
      explanation: {
        en: 'She proposes freezing non-urgent side projects and focusing all developer resources on fixing the core software.',
        de: 'Vorgeschlagen wird, Nebenprojekte einzufrieren und das Team auf das Hauptprodukt zu fokussieren.'
      },
      type: 'choice'
    },
    // --- B2 SCHREIBEN (Writing) ---
    {
      id: 'b2-w1',
      level: 'b2',
      skill: 'schreiben',
      part: 1,
      type: 'writing',
      title: 'Stellungnahme zum Thema: Vier-Tage-Woche im Unternehmen',
      prompt: 'In Ihrem Unternehmen wird die Einführung einer Vier-Tage-Woche bei gleichem Gehalt und angepasster Wochenarbeitszeit diskutiert. Schreiben Sie eine differenzierte Stellungnahme für das interne Mitarbeitermagazin (ca. 100–120 Wörter).\nGehen Sie auf folgende Aspekte ein:\n- Aktuelle Diskussion und Relevanz\n- Vorteile für Work-Life-Balance und Produktivität\n- Mögliche organisatorische Herausforderungen für den Kundenservice\n- Ihr persönliches Fazit oder Kompromissvorschlag.',
      points: ['Relevanz & Einleitung', 'Chancen & Vorteile', 'Risiken & Hürden', 'Schlussfolgerung'],
      model: 'Die Debatte über die Vier-Tage-Woche gewinnt auch in unserem Betrieb zunehmend an Bedeutung. Einerseits zeigen internationale Studien, dass ausgeruhte Mitarbeiter fokussierter arbeiten, seltener krankheitsbedingt ausfallen und die Attraktivität des Unternehmens als Arbeitgeber steigt. Andererseits darf die Erreichbarkeit für unsere Kunden unter keinen Umständen leiden. Eine starre Betriebsschließung am Freitag wäre unpraktikabel. Ich plädiere daher für ein rollierendes Schichtmodell, bei dem Teile der Belegschaft montags und andere freitags frei haben. So verbinden wir Mitarbeiterzufriedenheit mit verlässlicher Servicequalität.',
      explanation: {
        en: 'High-level B2 argumentative text balancing employee well-being with client obligations, culminating in a balanced compromise.',
        de: 'Differenzierte Stellungnahme mit Pro- und Contra-Argumenten sowie einem tragfähigen Kompromiss.'
      }
    },
    // --- B2 SPRECHEN (Speaking) ---
    {
      id: 'b2-s1',
      level: 'b2',
      skill: 'sprechen',
      part: 1,
      type: 'speaking',
      title: 'Kurzvortrag: Nachhaltigkeit und Ressourcenschonung am Arbeitsplatz',
      prompt: 'Halten Sie einen etwa dreiminütigen Vortrag über nachhaltige Maßnahmen im Berufsalltag. Strukturieren Sie Ihren Vortrag mit Einleitung, Beispielen aus der Praxis und einem Appell an die Kollegen.',
      points: ['Einleitung & Problemaufriss', 'Konkrete Maßnahmen (Papierlos, Energie, Pendeln)', 'Einbindung der Belegschaft', 'Ausblick'],
      model: 'Sehr geehrte Kolleginnen und Kollegen, heute möchte ich über ein Thema sprechen, das uns alle unmittelbar betrifft: ökologische Verantwortung im Büroalltag. Oft genügen bereits kleine Verhaltensänderungen, um spürbare Effekte zu erzielen. Erstens können wir durch die konsequente Digitalisierung von Akten und Formularen den Papierverbrauch um mehr als die Hälfte drosseln. Zweitens spart das vollständige Abschalten elektronischer Geräte statt des Standby-Modus jährlich erhebliche Energiemengen. Wenn wir zudem Anreize für das Deutschlandticket schaffen, reduzieren wir unseren CO2-Fußabdruck nachhaltig. Lassen Sie uns gemeinsam Vorreiter sein.',
      explanation: {
        en: 'Professional presentation with discourse markers (Erstens, Zweitens, Zudem) and rhetorical devices.',
        de: 'Strukturierter Fachvortrag mit Verknüpfungen und überzeugender Argumentation.'
      }
    }
  ],

  c1: [
    // --- C1 LESEN (Reading) ---
    {
      id: 'c1-r1',
      level: 'c1',
      skill: 'lesen',
      part: 1,
      title: 'Wissenschaftlicher Kommentar: Künstliche Intelligenz im Hochschulwesen',
      text: 'Der Einzug generativer Sprachmodelle in akademische Prüfungsformate erzwingt eine grundlegende Neukonzeption universitärer Leistungsbewertungen. Während herkömmliche Seminararbeiten, die primär auf deskriptiver Literaturreproduktion fußen, durch automatisierte Textgenerierung weitgehend obsolet werden, gewinnt die dialogische Verteidigung im Kolloquium sowie die kritische Reflexion von Primärquellen drastisch an Relevanz. Hochschuldidaktiker fordern mithin keinen apodiktischen Verbotskurs, sondern die gezielte Vermittlung von KI-Kompetenz im Sinne einer reflektierten Urteilskraft.',
      prompt: 'Welche Schlussfolgerung ziehen Hochschuldidaktiker bezüglich generativer KI?',
      options: ['KI-Tools sollten an Universitäten vollständig verboten werden.', 'Statt Verboten soll der kritisch-reflektierte Umgang gelehrt und Prüfungsformate angepasst werden.', 'Seminararbeiten sollen künftig von KI-Systemen bewertet werden.'],
      answer: 1,
      explanation: {
        en: 'The text rejects blanket bans ("keinen apodiktischen Verbotskurs") in favour of critical AI competence and adapted examination formats.',
        de: 'Hochschuldidaktiker fordern keinen Verbotskurs, sondern gezielte Vermittlung reflektierter Kompetenz.'
      },
      type: 'choice'
    },
    // --- C1 HÖREN (Listening) ---
    {
      id: 'c1-h1',
      level: 'c1',
      skill: 'hoeren',
      part: 1,
      title: 'Fachpodiumsdiskussion: Energiewende und Infrastrukturinvestitionen',
      transcript: 'Professor Weimann: „Die fiskalische Debatte verfehlt gegenwärtig den ökonomischen Kern. Wenn wir den Netzausbau und die Speicherkapazitäten nicht binnen der nächsten fünf Jahre massiv subventionieren, drohen den exportorientierten Industriezweigen strukturelle Standortnachteile, deren volkswirtschaftliche Folgekosten das vermeintliche Haushaltsdefizit um ein Vielfaches übersteigen werden. Schuldenbremse und Transformation schließen sich in Krisenzeiten keineswegs a priori aus, sofern die aufgenommenen Mittel strikt wertschöpfend investiert werden.“',
      prompt: 'Welche Kernaussage vertritt Professor Weimann?',
      options: ['Investitionen in Energieinfrastruktur sind unerlässlich, um langfristige Wohlstandseinbußen abzuwenden.', 'Die Schuldenbremse darf unter keinen Umständen angetastet werden.', 'Industriezweige sollten ins Ausland abwandern.'],
      answer: 0,
      explanation: {
        en: 'Prof. Weimann argues that massive investments in energy networks are essential to prevent devastating long-term structural disadvantages.',
        de: 'Prof. Weimann betont die Notwendigkeit massiver Investitionen zur Abwendung schwerer Standortnachteile.'
      },
      type: 'choice'
    },
    // --- C1 SCHREIBEN (Writing) ---
    {
      id: 'c1-w1',
      level: 'c1',
      skill: 'schreiben',
      part: 1,
      type: 'writing',
      title: 'Akademischer Aufsatz: Urbane Mobilität und Dekarbonisierung',
      prompt: 'Verfassen Sie einen wissenschaftlich fundierten Essay über die Zukunft des öffentlichen Nahverkehrs in europäischen Metropolen (ca. 140–160 Wörter). Behandeln Sie die Wechselwirkung zwischen Tarifgestaltung (z. B. Nulltarif vs. Qualitätsausbau), städtebaulicher Verdrängung des Individualverkehrs und sozialer Teilhabe.',
      points: ['Einführung in die Problemstellung', 'Tarifpolitik vs. Infrastrukturqualität', 'Verkehrsberuhigung & Lebensqualität', 'Wissenschaftliche Synthese'],
      model: 'Die Transformation urbaner Mobilitätssysteme erfordert eine ganzheitliche Betrachtung verkehrsökonomischer und soziokultureller Determinanten. Eine bloße Subventionierung von Pauschaltarifen erweist sich erfahrungsgemäß als insuffizient, sofern sie nicht mit einer bedarfsgerechten Taktverdichtung und einem Ausbau der Zubringerachsen im suburbanen Raum einhergeht. Vielmehr bedarf es einer synchronen Restriktionspolitik gegenüber dem motorisierten Individualverkehr – etwa durch Parkraumbewirtschaftung und City-Maut-Systeme –, deren Erlöse zweckgebunden in barrierefreie Hochkapazitätsnetze rückgeführt werden. Nur durch diese Kopplung aus Push- und Pull-Faktoren gelingt eine sozial gerechte Dekarbonisierung, die allen Gesellschaftsschichten verlässliche Mobilität garantiert.',
      explanation: {
        en: 'C1 register demonstrating academic vocabulary (Determinanten, insuffizient, zweckgebunden, Dekarbonisierung), syntactic complexity, and cohesive argumentation.',
        de: 'Präziser C1-Aufsatz mit Fachwortschatz, hypotaktischem Satzbau und schlüssiger Synthese.'
      }
    },
    // --- C1 SPRECHEN (Speaking) ---
    {
      id: 'c1-s1',
      level: 'c1',
      skill: 'sprechen',
      part: 1,
      type: 'speaking',
      title: 'Kolloquium: Ethische Dilemmata autonomer Systeme',
      prompt: 'Nehmen Sie im Rahmen einer universitären Debatte Stellung zu der Frage: Inwiefern lassen sich moralphilosophische Prinzipien wie das Trolley-Problem in Algorithmen autonomer Fahrzeuge codieren?',
      points: ['Problemaufriss & Tragweite', 'Deontologie vs. Utilitarismus im Programmiercode', 'Rechtliche Verantwortung des Herstellers', 'Schlussurteil'],
      model: 'Das Bestreben, deontologische oder utilitaristische Maximen in deterministische Algorithmen zu überführen, stößt an fundamentale rechtsphilosophische Grenzen. Zwar vermag ein mathematisches Modell rein rechnerisch Personenanzahlen zu gewichten, doch verbietet das bundesverfassungsgerichtliche Postulat der Menschenwürde jegliche Verrechnung von Menschenleben gegen Menschenleben. Eine Programmierung, die im unvermeidbaren Kollisionsfall Leben opfert, um ein anderes zu schonen, widerspräche den unveräußerlichen Grundrechten. Die juristische Haftung muss daher primär beim Hersteller und den Systemarchitekten verankert bleiben, anstatt die Maschine als autonom handelnden Akteur zu fingieren.',
      explanation: {
        en: 'Eloquent C1 presentation demonstrating nuanced philosophical discourse and sophisticated syntax.',
        de: 'Hochdifferenzierte Darlegung ethischer und juristischer Fragestellungen auf C1-Niveau.'
      }
    }
  ]
};

// Helper function to return exercises for a specific level ('a1' | 'a2' | 'b1' | 'b2' | 'c1')
export function getExercisesForLevel(level, baseA1List = []) {
  const lvl = String(level || 'a1').toLowerCase();
  if (lvl === 'a1') {
    return baseA1List.map(item => ({ ...item, level: 'a1' }));
  }
  return LEVEL_EXERCISES[lvl] || [];
}
