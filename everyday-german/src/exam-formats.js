const goethe = 'https://www.goethe.de/en/spr/prf/ueb/';
const telc = 'https://www.telc.net/en/language-examinations/certificate-exams/german/';

// Adult Goethe certificates and general-language telc certificates.
// Each row describes the parts in the order used in the provider's sample.
export const examFormats = {
  'goethe-a1': {
    name: 'Goethe-Zertifikat A1 · Start Deutsch 1', source: goethe+'pa1.html', online: 'https://bfu.goethe.de/a1_sd1/',
    rows: [
      ['Hören', '20', ['6 kurze Gespräche (A–C)', '4 Durchsagen (Richtig/Falsch)', '5 telefonische Mitteilungen (A–C)']],
      ['Lesen', '25', ['5 Aussagen zu kurzen Mitteilungen (Richtig/Falsch)', '5 Situationen mit je zwei Anzeigen (A/B)', '5 Hinweise oder Schilder (Richtig/Falsch)']],
      ['Schreiben', '20', ['5 Formularfelder ergänzen', 'Kurze Nachricht mit drei Leitpunkten (ca. 30 Wörter)']],
      ['Sprechen', '15', ['Sich vorstellen, buchstabieren und eine Nummer nennen', 'Informationen erfragen und geben', 'Bitten formulieren und darauf reagieren']]
    ]
  },
  'goethe-a2': {
    name: 'Goethe-Zertifikat A2', source: goethe+'pa2.html', online: 'https://bfu.goethe.de/a2_mod_2MX5/',
    rows: [
      ['Lesen', '30', ['Zeitungsartikel (5 × A–C)', 'Informationsübersicht (5 × A–C)', 'E-Mail (5 × A–C)', 'Anzeigen sechs Personen zuordnen, einschließlich Beispiel (5 bewertete Aufgaben, ggf. X)']],
      ['Hören', '30', ['Kurze Hörtexte (5 × A–C)', 'Ein Gespräch: Informationen fünf Bildern zuordnen', 'Fünf kurze Dialoge mit Bildauswahl (A–C)', 'Interview (5 × Ja/Nein)']],
      ['Schreiben', '30', ['Persönliche SMS mit drei Punkten (20–30 Wörter)', 'Halbformelle E-Mail mit drei Punkten (30–40 Wörter)']],
      ['Sprechen', '15', ['Persönliche Fragen stellen und beantworten', 'Über das eigene Leben sprechen und eine Rückfrage beantworten', 'Zusammen eine Unternehmung planen']]
    ]
  },
  'goethe-b1': {
    name: 'Goethe-Zertifikat B1', source: goethe+'pb1.html', online: 'https://bfu.goethe.de/b1_mod/index.php',
    rows: [
      ['Lesen', '65', ['Blogbeitrag (6 × Richtig/Falsch)', 'Zwei Pressetexte (6 × A–C)', 'Anzeigen zu Situationen (7 Zuordnungen, ggf. 0)', 'Meinungen zu einer Streitfrage (7 × Ja/Nein)', 'Schriftliche Anweisungen (4 × A–C)']],
      ['Hören', '40', ['Fünf kurze Texte (je Richtig/Falsch und A–C)', 'Vortrag oder Führung (5 × A–C)', 'Gespräch (7 × Richtig/Falsch)', 'Diskussion: Aussagen den Sprechenden zuordnen (8)']],
      ['Schreiben', '60', ['Persönliche E-Mail (ca. 80 Wörter)', 'Meinungsbeitrag (ca. 80 Wörter)', 'Kurze formelle E-Mail (ca. 40 Wörter)']],
      ['Sprechen', '15 + 15', ['Gemeinsam planen', 'Thema anhand von fünf Folien präsentieren', 'Rückmeldung geben und Fragen stellen bzw. beantworten']]
    ]
  },
  'goethe-b2': {
    name: 'Goethe-Zertifikat B2', source: goethe+'pb2.html', online: 'https://bfu.goethe.de/b2_mod_2MX6/index.php',
    rows: [
      ['Lesen', '65', ['Aussagen vier Personen zuordnen (9)', 'Fehlende Sätze einsetzen (6)', 'Artikel (6 × A–C)', 'Meinungsäußerungen Überschriften zuordnen (6)', 'Regelwerk: Überschriften Abschnitten zuordnen (3)']],
      ['Hören', '40', ['Fünf kurze Hörtexte (je Richtig/Falsch und A–C)', 'Interview (6 × A–C)', 'Diskussion: Aussagen Sprechenden zuordnen (6)', 'Vortrag (8 × A–C)']],
      ['Schreiben', '75', ['Forumsbeitrag (ca. 150 Wörter)', 'Adressatengerechte Nachricht (ca. 100 Wörter)']],
      ['Sprechen', '15 + 15', ['Kurzvortrag zu einem von zwei Themen mit Nachfragen', 'Kontroverse Frage im Paar diskutieren']]
    ]
  },
  'goethe-c1': {
    name: 'Goethe-Zertifikat C1 · modular', source: goethe+'pc1.html', online: 'https://bfu.goethe.de/c1mod/',
    rows: [
      ['Lesen', '65', ['Wortlücken im Artikel (8 × A–D)', 'Zeitschriftenartikel (7 × A–C)', 'Fehlende Sätze einsetzen (8)', 'Aussagen wissenschaftlichen Textabschnitten zuordnen (7)']],
      ['Hören', '40', ['Podcast: Aussagen Rezensionen zuordnen (6; einmal)', 'Fachinterview (9 × A–C; zweimal)', 'Diskussion in vier Abschnitten (8 × A–C; je einmal)', 'Vortrag (7 × A–C; zweimal)']],
      ['Schreiben', '75', ['Forumsbeitrag (ca. 230 Wörter)', 'Halbformelle oder formelle E-Mail (ca. 120 Wörter)']],
      ['Sprechen', '20 + 20', ['Vortrag zu einem von zwei Themen mit Nachfragen', 'Kontroverse Diskussion anhand eines kurzen Impulses']]
    ]
  },
  'telc-a1': {
    source: telc+'start-german1-telc-german-a1/', native: true,
    rows: [
      ['Hören', '20', ['6 Gespräche (A–C; zweimal)', '4 Durchsagen (Richtig/Falsch; einmal)', '5 telefonische Mitteilungen (A–C; zweimal)']],
      ['Lesen', '45*', ['5 Aussagen zu zwei kurzen Texten', '5 Situationen mit zwei Auswahlmöglichkeiten (A/B)', '5 Aussagen zu Schildern und Hinweisen']],
      ['Schreiben', '45*', ['5 Formularfelder', 'Nachricht mit drei Leitpunkten (ca. 30 Wörter)']],
      ['Sprechen', '15', ['Sich vorstellen, buchstabieren und eine Nummer nennen', 'Fragen und Antworten mit Wortkarten', 'Bitten und Reaktionen mit Bildkarten']]
    ]
  },
  'telc-a2': {
    source: telc+'start-german-2-telc-german-a2/', native: true,
    rows: [
      ['Hören', '20', ['5 Telefonnotizen ergänzen (zweimal)', '5 Radiomeldungen (A–C; einmal)', '5 Zuordnungen in einem Gespräch (zweimal)']],
      ['Lesen', '50*', ['5 Aufgaben zu einem Wegweiser (A–C)', '5 Aussagen zu einem Artikel (Richtig/Falsch)', '5 Situationen passenden Anzeigen zuordnen (ggf. X)']],
      ['Schreiben', '50*', ['5 Formularfelder', 'Nachricht mit drei von vier Leitpunkten (ca. 40 Wörter)']],
      ['Sprechen', '15', ['Sich vorstellen und Zusatzfragen beantworten', 'Ein Alltagsgespräch mit Stichwortkarten führen', 'Gemeinsam etwas aushandeln']]
    ]
  },
  'telc-b1': {
    source: telc+'certificate-german-telc-german-b1/', native: true,
    rows: [
      ['Lesen', '90*', ['5 Texte passenden Überschriften zuordnen', '5 Detailfragen zum Artikel (A–C)', '10 Situationen passenden Anzeigen zuordnen (ggf. X)']],
      ['Sprachbausteine', '90*', ['10 Grammatiklücken (A–C)', '10 Wortschatzlücken mit Wortbank']],
      ['Hören', '30', ['5 Stellungnahmen (Richtig/Falsch; einmal)', '10 Aussagen zu einem Interview (Richtig/Falsch; zweimal)', '5 kurze Ansagen (Richtig/Falsch; zweimal)']],
      ['Schreiben', '30', ['Persönliche oder halbformelle E-Mail mit vier Leitpunkten']],
      ['Sprechen', '15 + 20', ['Einander kennenlernen', 'Über ein Thema sprechen und Erfahrungen austauschen', 'Gemeinsam etwas planen']]
    ]
  },
  'telc-b2': {
    source: 'https://www.telc.net/sprachpruefungen/zertifikatspruefung/deutsch/telc-deutsch-b2/', native: true,
    rows: [
      ['Lesen', '90*', ['5 Texte passenden Überschriften zuordnen', '5 Detailfragen zum Artikel (A–C)', '10 Situationen passenden Anzeigen zuordnen (ggf. X)']],
      ['Sprachbausteine', '90*', ['10 Grammatiklücken (A–C)', '10 Wortschatzlücken mit Wortbank']],
      ['Hören', '20', ['5 Aussagen zu einer Nachrichtensendung', '10 Aussagen zu einem Interview', '5 Aussagen zu kurzen Ansagen (jeweils Richtig/Falsch; einmal)']],
      ['Schreiben', '30', ['Ein formelles Schreiben (mindestens 150 Wörter): Informationsanfrage oder Beschwerde']],
      ['Sprechen', '15 + 20', ['Über Erfahrungen sprechen und Fragen beantworten', 'Einen Text als Ausgangspunkt für eine Diskussion nutzen', 'Gemeinsam etwas planen']]
    ]
  },
  'telc-c1': {
    name: 'telc Deutsch C1 · Allgemeinsprache', source: 'https://www.telc.net/sprachpruefungen/zertifikatspruefung/deutsch/telc-deutsch-c1/',
    download: 'https://www.telc.net/fileadmin/user_upload/mock_exams/Deutsch/telc_deutsch_c1.zip',
    rows: [
      ['Lesen', '90*', ['6 fehlende Sätze einsetzen', '6 Aussagen Textabschnitten zuordnen', '11 Aussagen (Richtig/Falsch/Nicht im Text) und eine Aufgabe zur Gesamtaussage']],
      ['Sprachbausteine', '90*', ['22 Lücken zu Grammatik und Wortschatz (A–D)']],
      ['Hören', '40', ['8 Meinungen Aussagen zuordnen', '10 Fragen zu einer Radiosendung (A–C)', '10 Informationen aus einem Vortrag auf Handzetteln ergänzen (jeweils einmal hören)']],
      ['Schreiben', '70', ['Eines von zwei Themen argumentativ bearbeiten (ca. 350 Wörter)']],
      ['Sprechen', '16 + 20', ['Präsentation; anschließend den Beitrag des Gegenübers zusammenfassen und nachfragen', 'Gemeinsam über eine Aussage diskutieren']]
    ],
    breakMinutes: 20
  }
};
