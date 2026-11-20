// Original B2 practice material aligned to the published telc Deutsch B2 task structure.
// Lesen: Teil 1 headlines (5), Teil 2 article details (5), Teil 3 situations to ads (10).
// Sprachbausteine: Teil 1 grammar in a letter (10), Teil 2 word bank in a text (10).
// Hören: Teil 1 news (5), Teil 2 interview (10, shared audio), Teil 3 announcements (5). All played once.
// Schreiben: one letter task, choose between two options. Sprechen: presentation, discussion, planning.
const mc=(id,skill,part,title,text,prompt,options,answer,extra={})=>({id,level:'b2',skill,part,title,text,prompt,options,answer,type:'choice',...extra});
const rf=(id,part,title,transcript,prompt,answer,extra={})=>mc(id,'hoeren',part,title,undefined,prompt,['Richtig','Falsch'],answer?0:1,{transcript,plays:1,...extra});

// ---------- LESEN ----------
const headlines=[
 'Reparieren statt wegwerfen: Ehrenamtliche helfen bei kaputten Geräten',
 'Immer mehr Jugendliche machen eine Auszeit vor dem Studium',
 'Schlafwagen sind monatelang ausgebucht: Die Nachtzüge der Bahn boomen',
 'Lastenrad für Familien: Ein Verein verleiht sie kostenlos',
 'Mehrgenerationenhäuser: Jung und alt wohnen unter einem Dach',
 'Rente steigt deutlich: Mehr Geld für ältere Menschen ab Januar',
 'Deutsche schauen immer länger fern: Das Streaming boomt weiter',
 'E-Bikes verändern den Arbeitsweg: Immer mehr Menschen radeln zur Arbeit',
 'Zu wenige Kita-Plätze: Eltern in Großstädten klagen über lange Wartelisten',
 'Papst besucht Deutschland: Tausende Menschen empfangen ihn am Flughafen'
];
const news=[
 'In über 200 deutschen Städten gibt es inzwischen sogenannte Reparaturcafés. Freiwillige helfen Besuchern, kaputte Geräte, Kleidung und Fahrräder zu reparieren – oft gegen eine kleine Spende. Viele Menschen können sich neue Produkte nicht leisten oder wollen die Umwelt schonen.',
 'Immer mehr junge Menschen unterbrechen ihren Lebenslauf zwischen Schule und Studium. Ein freiwilliges soziales Jahr, ein Auslandsaufenthalt oder eine Ausbildung vor dem Studium werden zur Normalität. Die Universitäten berichten, dass sich die Bewerbungen nun gleichmäßiger über das Jahr verteilen.',
 'Die Deutsche Bahn meldet für das kommende Jahr einen deutlichen Anstieg der Buchungen für Nachtzüge. Viele Reisende möchten auf Flüge verzichten und trotzdem ausgeruht ankommen. Die neuen Liegewagen bieten Einzelabteile und Duschen. Auf der Strecke zwischen Berlin und Zürich sind die Plätze monatelang ausgebucht.',
 'In einer Kleinstadt in Bayern experimentiert ein Verein mit einem Lastenrad-Verleih. Familien können damit kostenlos Kinder, Einkaufstaschen und sogar Haustiere transportieren. Die Idee: weniger Autos vor der Kita, weniger Lärm und mehr Platz für Kinder zum Spielen.',
 'Ältere Menschen, die allein in großen Wohnungen leben, und junge Familien suchen oft gleichzeitig nach Kontakt. Mehrgenerationenhäuser bieten die Lösung: unter einem Dach leben Großeltern, Eltern und Kinder, teilen sich Küche und Garten, behalten aber eigene Räume. Der Verein „Wir wohnen zusammen" hat in drei Jahren 40 solcher Projekte initiiert.'
];
const newsTitles=['Nachrichtenmeldung 1','Nachrichtenmeldung 2','Nachrichtenmeldung 3','Nachrichtenmeldung 4','Nachrichtenmeldung 5'];
const article='Vor zehn Jahren war es noch eine Randnotiz in den Statistiken: Immer mehr junge Familien verließen die Großstädte und zogen in kleinere Orte. Heute ist die Entwicklung so stark, dass viele Kommunen nicht mehr von Abwanderung in die Städte sprechen, sondern von einer echten Renaissance des ländlichen Lebens.\n\nDie Gründe sind vielfältig. In den Ballungsräumen sind die Mieten in den letzten fünf Jahren um bis zu vierzig Prozent gestiegen, während kleine Städte und Dörfer deutlich bezahlbaren Wohnraum bieten. Gleichzeitig haben viele Unternehmen nach der Pandemie dauerhaft Homeoffice-Regelungen eingeführt. Wer seinen Job von überall erledigen kann, muss nicht mehr in der teuren City wohnen.\n\nAuch das Leben selbst spielt eine Rolle. In kleinen Orten gibt es kurze Wege zur Kita, freundliche Nachbarn und ein stärkeres Gemeinschaftsgefühl. Viele Eltern berichten, dass ihre Kinder draußen spielen können, ohne dass ständig ein Erwachsener aufpassen muss.\n\nAllerdings hat das Landleben auch seine Schattenseiten. Die nächste größere Stadt mit Theater, Kino und Einkaufszentrum liegt oft dreißig Kilometer entfernt. Wer abends noch eine Apotheke oder einen Supermarkt braucht, muss mit dem Auto fahren, weil die öffentlichen Verkehrsmittel dann nicht mehr fahren.\n\nTrotzdem bleiben die Umfragen eindeutig: Fast sechzig Prozent der Familien, die in eine Kleinstadt gezogen sind, wollen dort bleiben. Sie schätzen vor allem die Ruhe, den Kontakt zu den Nachbarn und die Möglichkeit, ihr Leben selbst zu gestalten.';
const articleQs=[
 ['Wie hat sich die Wohnungsmarktlage in den Großstädten entwickelt?',['Die Mieten sind stark gestiegen','Es gibt mehr Wohnungen als früher','Die Preise sind deutlich gefallen'],0],
 ['Warum können viele Berufstätige in kleine Städte ziehen?',['Weil es dort mehr Arbeitsplätze gibt','Weil sie von zu Hause arbeiten können','Weil die Gehälter dort höher sind'],1],
 ['Was schätzen Eltern am Leben auf dem Land?',['Die Kitas sind größer','Es gibt mehr Shopping-Möglichkeiten','Kinder können draußen spielen'],2],
 ['Was ist ein Nachteil des Lebens in Kleinstädten?',['Der Verkehr ist zu stark','Abends fehlen Einkaufsmöglichkeiten in der Nähe','Die Mieten sind zu hoch'],1],
 ['Was wollen die meisten Familien, die in eine Kleinstadt gezogen sind?',['Bald wieder in die Stadt ziehen','In ein größeres Haus umziehen','Dort bleiben'],2]
];
const adList=[
 'Sprachschule Aktiv: Abendkurse Deutsch B2 für Berufstätige, Kursbeginn im Oktober',
 'Yogastudio Balance: Kurs für Anfänger, dienstags und donnerstags ab 19 Uhr',
 'Seminar „Überzeugen": Präsentationstechniken für Fach- und Führungskräfte, zwei Tage',
 'Musikschule Klang: Klavier- und Gesangsunterricht für Erwachsene, Probestunde gratis',
 'Kochschule Genuss: Italienische Küche, Samstagskurs mit Weinprobe ab 18 Jahren',
 'IT-Akademie: Excel und PowerPoint für das Büro, Online oder vor Ort buchbar',
 'Second-Hand-Boutique: Gut erhaltene Babykleidung und -spielzeuge zu kleinen Preisen',
 'Wohnungsbörse Rhein: Aktuelle Wohnungsangebote in der ganzen Region',
 'Nachhilfe Mathe: Erfahrene Studierende helfen in Mathe und Physik vor Prüfungen',
 'Fahrschule Express: Theorie- und Praxiskurse mit Prüfungsvorbereitung',
 'Gartenverein Grün: Workshops zu Tomaten, Kräutern und Kompost',
 'Tanzschule Rhythmus: Latein- und Standardtänze für Paare und Singles'
];
const ads=adList.map((a,i)=>`${String.fromCharCode(97+i)}) ${a}`).join('\n');
const situations=[
 'Sie arbeiten im Büro und möchten Ihre Präsentation vor Kunden sicherer halten.',
 'Sie suchen günstige, sauber gewaschene Kleidung für Ihr Baby.',
 'Ihre Tochter braucht Unterstützung in Mathe vor der Prüfung.',
 'Sie möchten nach der Arbeit abends Deutsch lernen.',
 'Sie und Ihr Partner wollen zusammen etwas Neues lernen.',
 'Sie suchen eine bezahlbare Wohnung in Ihrer Region.',
 'Sie möchten als Erwachsener wieder Klavier spielen lernen.',
 'Sie möchten Ihre Excel-Kenntnisse für den Job auffrischen.',
 'Sie möchten den Führerschein machen und sich gut auf die Theorie vorbereiten.',
 'Sie suchen einen Zahnarzt, der samstags Notdienst hat.'
];
const adAnswers=[2,6,8,0,11,7,3,5,9,12]; // numeric option index; 12 = "Keine Anzeige passt" (x)

// ---------- SPRACHBAUSTEINE ----------
const cloze1='Sehr geehrte Frau Hoffmann,\n\nvielen Dank für Ihre Anzeige. Ich interessiere mich sehr ___(1)___ ein Praktikum in Ihrem Unternehmen. Ich studiere Wirtschaftsinformatik im dritten Semester und habe bereits zwei Monate in einer ähnlichen Firma gearbeitet.\n\nIch würde gern ab dem 1. März bei Ihnen anfangen. ___(2)___ ich nur zwei Tage pro Woche kommen kann, bin ich auch nachmittags und am Wochenende flexibel. Falls das für Sie passt, würde ich mich schon jetzt ___(3)___ den ersten Arbeitstag freuen.\n\nKönnten Sie mir bitte mitteilen, ___(4)___ Unterlagen Sie für die Bewerbung benötigen? Ich habe meinen Lebenslauf und meine Zeugnisse bereits ___.(5)\n\nIch kann Ihnen auch Arbeitsproben ___(6)___, falls das hilfreich ist. ___(7)___ Sie mir eine Rückmeldung geben? Ich freue mich ___(8)___ Ihre Antwort. Über ein kurzes Gespräch ___(9)___ ich mich sehr freuen.\n\nSollten noch Fragen ___(10)___, erreichen Sie mich unter jonas.weber@mail.de.\n\nMit freundlichen Grüßen\nJonas Weber';
const c1opts=[
 ['an','für','auf'],   // 1 für
 ['Obwohl','Weil','Damit'], // 2 Obwohl
 ['auf','bei','für'], // 3 auf
 ['welches','welche','welcher'], // 4 welche
 ['geschickt','schickte','schicke'], // 5 geschickt
 ['zeigen','gezeigt','zeige'], // 6 zeigen
 ['Würden','Würdet','Würde'], // 7 Würden
 ['auf','über','für'], // 8 auf
 ['würde','wurde','wird'], // 9 würde
 ['bestehen','bestanden','besteht'] // 10 bestehen
];
const cloze2='Die Stadtwerke Nord haben ein neues Programm für ihre Kunden gestartet. Ab sofort können alle Haushalte ___(1)___ App nutzen. Die App zeigt auf einfache Weise, ___(2)___ viel Strom und Gas eine Wohnung im Durchschnitt verbraucht.\n\nWer sich anmeldet, erhält zusätzlich Tipps zum Energiesparen. Kunden, ___(3)___ besonders viel Strom verbrauchen, bekommen zudem eine persönliche Beratung.\n\nBesonders praktisch ist der Vergleichsrechner: Die App vergleicht den eigenen Verbrauch automatisch mit dem ___(4)___ ähnlicher Haushalte in der Region. Wer unter dem Durchschnitt liegt, erhält einen digitalen Ausweis, ___(5)___ bei vielen Partnergeschäften Rabatte gibt.\n\nAuch Unternehmen können das Programm nutzen. Sie müssen sich ___(6)___ eine Lizenz registrieren, die Kosten trägt der Arbeitgeber. Die Stadtwerke hoffen, ___(7)___ das Angebot viele Menschen zum Energiesparen motiviert.\n\nDie App ist ab sofort für iOS und Android verfügbar. ___(8)___ Fragen hat, kann die Kundenhotline anrufen oder eine E-Mail schreiben.\n\nIn den ersten zwei Wochen haben bereits über 10.000 Nutzer die App heruntergeladen. Die Stadtwerke sind sehr ___(9)___ mit dem Start. Nach der Pilotphase zeigen die ersten Zahlen, dass die Teilnehmer im Durchschnitt zwölf Prozent weniger Strom ___(10)___.';
const c2bank=['MIT','WIE','KOSTENLOS','OHNE','AUTOMATISCH','DER','DIE','DURCHSCHNITT','DASS','WER','ZUFRIEDEN','VERBRAUCHEN','EINE','FÜR','STROM'];
const c2answers=[12,1,6,7,5,13,8,9,10,11]; // gap 1–10 → bank index

// ---------- HÖREN ----------
const newsAudio=[
 ['Guten Tag und hallo zur Mittagsnachricht. Die Stadt München hat beschlossen, ab nächstem Monat drei weitere Kilometer Radwege zu bauen. Die Bauarbeiten beginnen am Montagnachmittag und sollen bis zum Sommer fertig sein. Autofahrer müssen in dieser Zeit mit Baustellen und Umleitungen rechnen.','Die Bauarbeiten für die neuen Radwege beginnen erst im Sommer.',false],
 ['An der Universität Hamburg hat sich die Zahl der Erstsemester in diesem Jahr um acht Prozent erhöht. Besonders beliebt sind die Studiengänge Informatik und Psychologie. Die Universität investiert deshalb in neue Hörsäle und digitale Lernangebote.','Informatik und Psychologie sind bei den Studienanfängern besonders gefragt.',true],
 ['Achtung, Wetterwarnung: Der Deutsche Wetterdienst meldet für den Abend schwere Gewitter mit Starkregen und Hagel. In Bayern und Baden-Württemberg können wegen des starken Regens örtliche Überschwemmungen auftreten. Die Feuerwehr rät, Fenster und Türen geschlossen zu halten und bei Unwettern zu Hause zu bleiben.','In Bayern und Baden-Württemberg besteht die Gefahr von Überschwemmungen.',true],
 ['Der Lebensmittelkonzern BioFrisch ruft eine Charge seines veganen Brotaufstrichs zurück. In vereinzelten Packungen wurde eine nicht deklarierte Nuss nachgewiesen. Kunden können das Produkt im Geschäft zurückgeben und erhalten ihr Geld zurück.','Der Brotaufstrich enthält Nüsse, die nicht auf der Verpackung stehen.',true],
 ['Das neue Naturkundemuseum in Dresden hat nach sechs Monaten Bauzeit seine Türen geöffnet. Auf drei Etagen zeigen interaktive Ausstellungen die Tier- und Pflanzenwelt Sachsens. Der Eintritt ist für Kinder unter sechs Jahren kostenlos.','Kinder unter sechs Jahren müssen für den Eintritt bezahlen.',false]
];
const longAudio='Moderatorin: Herzlich willkommen zu „Alltag und Beruf". Heute sprechen wir mit Frau Dr. Lena Sommer, Arbeitspsychologin, über das Thema Homeoffice. Frau Sommer, zuerst die Frage: Wie viele Menschen in Deutschland arbeiten inzwischen regelmäßig von zu Hause?\nFrau Sommer: Nach aktuellen Zahlen ist es etwa jeder vierte Beschäftigte, also rund zwölf Millionen Menschen. Der Anteil ist seit der Pandemie stark gestiegen und hat sich seitdem auf einem hohen Niveau stabilisiert.\nModeratorin: Ist Homeoffice für die meisten ein Gewinn?\nFrau Sommer: Das hängt sehr von der Person und vom Job ab. Viele berichten, dass sie sich zu Hause besser konzentrieren können, weil sie weniger Lärm und Unterbrechungen haben. Gleichzeitig vermissen einige den direkten Austausch mit Kollegen.\nModeratorin: Gibt es auch Nachteile?\nFrau Sommer: Ja, vor allem für Berufseinsteiger. Sie lernen im Büro schneller, weil sie den erfahrenen Kollegen einfach zuhören oder Fragen stellen können. Zu Hause fehlt dieser spontane Kontakt oft.\nModeratorin: Wie sieht es mit der Arbeitszeit aus?\nFrau Sommer: Viele Homeoffice-Beschäftigte arbeiten länger, weil die Grenzen zwischen Büro und Privatleben verschwimmen. Es ist wichtig, feste Zeiten zu vereinbaren und den Laptop nach Feierabend wegzulegen.\nModeratorin: Was empfehlen Sie Unternehmen?\nFrau Sommer: Klare Regeln. Teams sollten feste Termine für gemeinsame Besprechungen festlegen, damit alle erreichbar sind. Außerdem brauchen Beschäftigte einen ruhigen Arbeitsplatz zu Hause.\nModeratorin: Und was ist mit der Teamkultur?\nFrau Sommer: Das ist die größte Herausforderung. Vertrauen ist wichtiger als Kontrolle. Wer zu Hause arbeitet, sollte nicht stündlich nachfragen müssen.\nModeratorin: Vielen Dank, Frau Dr. Sommer.';
const longQs=[
 ['Etwa jeder vierte Beschäftigte arbeitet regelmäßig von zu Hause.',true],
 ['Der Anteil der Homeoffice-Arbeiter ist seit der Pandemie gesunken.',false],
 ['Alle Beschäftigten können sich zu Hause besser konzentrieren.',false],
 ['Berufseinsteiger lernen zu Hause schneller als im Büro.',false],
 ['Im Büro können Berufseinsteiger von Kollegen lernen.',true],
 ['Zu Hause fehlt manchmal der spontane Kontakt zu Kollegen.',true],
 ['Homeoffice-Beschäftigte arbeiten nach Feierabend nie weiter.',false],
 ['Unternehmen sollten stündlich nachfragen, ob jemand arbeitet.',false],
 ['Klare Regeln und feste Termine helfen den Teams.',true],
 ['Frau Sommer hält Homeoffice insgesamt für eine schlechte Entwicklung.',false]
];
const announcements=[
 ['Achtung, eine Durchsage für Reisende nach München: Der ICE 792 fällt heute wegen eines technischen Defekts aus. Reisende steigen bitte in den IC 2092 um, der um 14.20 Uhr abfährt. Entschädigungen gibt es an der Information.','Der ICE 792 nach München fährt heute später ab.',false],
 ['Hier ist das Bürgerbüro Mitte. Das Bürgerbüro schließt heute schon um 16 Uhr. Morgen sind wir wieder wie gewohnt bis 18 Uhr für Sie da.','Das Bürgerbüro hat heute verlängerte Öffnungszeiten.',false],
 ['Liebe Kundinnen und Kunden, unser Supermarkt schließt in einer Stunde, um 19 Uhr. An der Kasse drei gibt es heute noch ein Angebot: zwei Pfund Äpfel für nur 99 Cent.','Äpfel sind heute im Angebot.',true],
 ['An alle Studierenden der Sprachschule: Der Kurs „Business German“ beginnt am kommenden Montag nicht wie geplant um 10, sondern um 11 Uhr. Der Raum bleibt unverändert, Raum 204.','Der Unterricht beginnt später als geplant.',true],
 ['Hier spricht die automatische Ansage des Krankenhauses St. Anna: Die Intensivstation nimmt ab sofort keine Besucher mehr an. Bitte wenden Sie sich mit Fragen an das Empfangsteam im Erdgeschoss.','Besucher dürfen weiterhin die Intensivstation besuchen.',false]
];

// ---------- SCHREIBEN ----------
const writing={id:'b2telc-w1',level:'b2',skill:'schreiben',part:1,type:'writing',title:'Aufgabe A oder B: Formeller Brief',prompt:'Sie haben die Wahl zwischen zwei Aufgaben. Wählen Sie eine und schreiben Sie einen formellen Brief mit mindestens 150 Wörtern. Bearbeiten Sie drei der angegebenen Punkte oder zwei davon und einen eigenen Aspekt. Denken Sie an Betreff, Anrede und Schluss.\n\nAufgabe A – Beschwerde: Die Sprachschule warb mit 60 Einheiten, zwei Lehrkräften und wöchentlichem Sprechtraining. Sie haben an diesem Sprachkurs teilgenommen und sind mit der Organisation und dem Unterricht nicht zufrieden. Schreiben Sie eine Beschwerde an die Sprachschule. Gehen Sie auf Folgendes ein: Grund für Ihr Schreiben, Ihre Erwartungen nach der Anzeige, was genau nicht funktioniert hat und welche Lösung Sie erwarten.\n\nAufgabe B – Informationsanfrage: Ein Kursanbieter wirbt mit einem zweiwöchigen Ferienkurs in Österreich, kleinen Gruppen und Unterkünften bei Gastfamilien. Sie interessieren sich für das Angebot. Schreiben Sie eine Bitte um Informationen an den Kursanbieter. Gehen Sie auf Folgendes ein: welche Kurse angeboten werden, die Preise, die Unterkunft und die Anmeldefrist.',points:['Grund oder Anlass des Schreibens','Erwartungen oder gewünschte Informationen','Konkrete Kritik oder Fragen','Erwartete Lösung oder nächsten Schritt'],model:'Sehr geehrte Damen und Herren,\n\nich schreibe Ihnen wegen des B2-Intensivkurses, den ich im September bei Ihnen besucht habe. Nach der Anzeige sollte der Kurs sechzig Einheiten mit zwei nativen Lehrkräften umfassen. Tatsächlich fand der Unterricht jedoch nur mit einer Lehrkraft statt, und zwei geplante Sprechtrainingseinheiten wurden kurzfristig abgesagt.\n\nIch hatte mich für den Kurs angemeldet, weil ich mich beruflich auf eine Beförderung vorbereite. Die flexiblen Zeiten passten gut, aber ich habe in vier Wochen nur vierzig Einheiten erhalten. Deshalb meine ich, dass Sie mir einen Teil der Kursgebühr erstatten oder mir eine Gutschrift für einen Folgekurs geben sollten.\n\nIch bitte Sie um eine schriftliche Antwort bis zum Ende des Monats.\n\nMit freundlichen Grüßen\nMarta Kowalska'};

// ---------- SPRECHEN ----------
const speak1={id:'b2telc-s1',level:'b2',skill:'sprechen',part:1,type:'speaking',title:'Über Erfahrungen sprechen',prompt:'Berichten Sie etwa anderthalb Minuten lang von einer eigenen Erfahrung zu einem der Themen. Beantworten Sie danach Fragen Ihrer Partnerin oder Ihres Partners und stellen Sie selbst Fragen.',points:['Ein Buch, das Sie gelesen haben','Einen Film oder eine Serie, die Sie gesehen haben','Eine Reise, die Sie unternommen haben','Eine Musikveranstaltung, die Sie besucht haben','Ein Sportereignis, das Sie besucht haben','Eine Person, die für Sie wichtig war','Eine wichtige Erfahrung aus Ihrem Leben','Beschreiben, was Sie erlebt haben','Ihre Meinung begründen','Eine Rückfrage stellen'],model:'Ich möchte ein Buch vorstellen: „Der Vorleser" von Bernhard Schlink. Ich habe den Roman letztes Jahr gelesen und fand ihn sehr beeindruckend. Es geht um einen jungen Mann, der als Teenager eine ältere Frau kennenlernt und später erfährt, dass sie während des Krieges in einem Konzentrationslager gearbeitet hat. Mir hat besonders gefallen, wie der Autor Liebe und Schuld auf eine einfache, aber sehr kraftvolle Weise beschreibt. Ich kann das Buch jedem empfehlen, der sich für deutsche Geschichte und ethische Fragen interessiert. Was lesen Sie gern?'};
const speak2={id:'b2telc-s2',level:'b2',skill:'sprechen',part:2,type:'speaking',title:'Diskussion',prompt:'Lesen Sie den Impuls. Fassen Sie die wichtigsten Argumente mit eigenen Worten zusammen, nennen Sie Ihre eigene Meinung und stellen Sie Ihrem Partner Fragen.',text:'Sollte Homeoffice für alle Beschäftigten ein Recht werden? Dafür spricht: kürzere Arbeitswege, mehr Flexibilität und eine bessere Vereinbarkeit von Familie und Beruf. Dagegen spricht: manche Teams arbeiten kreativer, wenn alle im Büro sind, und nicht jede Wohnung ist für konzentriertes Arbeiten geeignet.',points:['Argumente des Textes zusammenfassen','Eigene Erfahrung ergänzen','Vor- und Nachteile abwägen','Eigene Position begründen','Rückfrage an den Partner stellen'],model:'Der Text fragt, ob Homeoffice ein Recht für alle werden sollte. Die Befürworter nennen Flexibilität und weniger Pendelzeit, die Gegner vermissen den direkten Austausch im Team. Ich arbeite selbst zwei Tage pro Woche von zu Hause und finde die Flexibilität sehr praktisch, aber für neue Projekte brauche ich das Büro. Was meinen Sie dazu?'};
const speak3={id:'b2telc-s3',level:'b2',skill:'sprechen',part:3,type:'speaking',title:'Gemeinsam etwas planen',prompt:'Ihre Deutschkurs-Gruppe möchte nach dem Kurs einen gemeinsamen Ausflug organisieren. Besprechen Sie mit Ihrer Partnerin oder Ihrem Partner Ziel und Termin, Transport, Kosten und die Aufgabenverteilung, und einigen Sie sich auf einen Plan.',points:['Ziel und Termin vorschlagen','Transportmittel besprechen','Kosten kalkulieren','Aufgaben verteilen','Einwände berücksichtigen','Kompromiss finden'],model:'Wie wäre es mit einer Wanderung im Schwarzwald am ersten Wochenende nach dem Kurs? Wir könnten mit dem Zug fahren und dort in einer Jugendherberge übernachten. Die Kosten liegen bei etwa 120 Euro pro Person. Ich übernehme die Organisation des Transports, Sie könnten die Unterkunft buchen. Was meinen Sie?'};

// ---------- ASSEMBLE ----------
const exercises=[];
for(let i=0;i<5;i++)exercises.push(mc(`b2telc-r${i+1}`,'lesen',1,newsTitles[i],news[i],'Welche Überschrift passt am besten?',headlines,i,{optionLabels:['a','b','c','d','e','f','g','h','i','j']}));
for(let i=0;i<5;i++)exercises.push(mc(`b2telc-r${i+6}`,'lesen',2,'Renaissance des Landlebens',article,articleQs[i][0],articleQs[i][1],articleQs[i][2],{optionLabels:['A','B','C']}));
for(let i=0;i<10;i++){
  exercises.push(mc(`b2telc-r${i+11}`,'lesen',3,'Anzeigen und Situationen',ads,situations[i],adList.concat('Keine Anzeige passt'),adAnswers[i],{optionLabels:['a','b','c','d','e','f','g','h','i','j','k','l','x']}));
}
const c1answers=[1,0,0,1,0,0,0,0,0,0]; // answer index per gap number (1–10)
for(let i=0;i<10;i++)exercises.push(mc(`b2telc-g${i+1}`,'sprachbausteine',1,'Bewerbung um ein Praktikum',cloze1,`Lücke ${i+1}`,c1opts[i],c1answers[i],{optionLabels:['a','b','c']}));
for(let i=0;i<10;i++)exercises.push(mc(`b2telc-g${i+11}`,'sprachbausteine',2,'Ein neues Energieprogramm',cloze2,`Lücke ${i+1}`,c2bank.map(w=>w),c2answers[i],{optionLabels:['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O']}));
const newsBroadcast=newsAudio.map(([script])=>script).join('\n\n');
for(const [index,[,prompt,truth]] of newsAudio.entries()){
  exercises.push(rf(`b2telc-h${index+1}`,1,'Nachrichtensendung',index===0?newsBroadcast:undefined,prompt,truth,{audioGroup:'b2telc-h1'}));
}
for(let i=0;i<10;i++)exercises.push(rf(`b2telc-h${6+i}`,2,'Radiointerview · Homeoffice',i===0?longAudio:undefined,longQs[i][0],longQs[i][1],{audioGroup:'b2telc-h-long',plays:1}));
for(let i=0;i<5;i++)exercises.push(rf(`b2telc-h${16+i}`,3,'Kurze Durchsagen',announcements[i][0],announcements[i][1],announcements[i][2],{plays:1}));
exercises.push(writing,speak1,speak2,speak3);
export const TELC_B2_EXERCISES=exercises;
export const TELC_B2_SECTIONS=[
 {skill:'lesen',ids:exercises.filter(q=>q.skill==='lesen').map(q=>q.id)},
 {skill:'sprachbausteine',ids:exercises.filter(q=>q.skill==='sprachbausteine').map(q=>q.id)},
 {skill:'hoeren',ids:exercises.filter(q=>q.skill==='hoeren').map(q=>q.id)},
 {skill:'schreiben',ids:exercises.filter(q=>q.skill==='schreiben').map(q=>q.id)},
 {skill:'sprechen',ids:exercises.filter(q=>q.skill==='sprechen').map(q=>q.id)}
];
