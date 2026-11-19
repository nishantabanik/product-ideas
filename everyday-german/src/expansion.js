// Original Everyday German situations. Paired questions share a stimulus deliberately.
export const situations=[
 {
  "title": "Paket abholen",
  "text": "Ihr Paket liegt in der Postfiliale am Markt. Bitte kommen Sie bis Freitag und bringen Sie Ihren Ausweis mit. Am Samstag ist die Filiale geschlossen.",
  "prompt": "Wo liegt das Paket?",
  "options": [
   "In der Postfiliale",
   "Beim Nachbarn",
   "Im Supermarkt"
  ],
  "statement": "Das Paket kann man am Samstag abholen.",
  "truth": false,
  "model": "Guten Tag, ich möchte mein Paket am Donnerstag abholen. Ich bringe meinen Ausweis mit. Wie lange haben Sie am Donnerstag geöffnet? Vielen Dank für Ihre Hilfe."
 },
 {
  "title": "Kursausflug",
  "text": "Liebe Gruppe, am Mittwoch besuchen wir das Museum. Wir treffen uns um 9 Uhr vor der Schule. Der Eintritt kostet sechs Euro. Bitte bringen Sie kein Essen mit.",
  "prompt": "Wie viel kostet der Eintritt?",
  "options": [
   "Sechs Euro",
   "Neun Euro",
   "Kein Geld"
  ],
  "statement": "Die Gruppe trifft sich vor der Schule.",
  "truth": true,
  "model": "Liebe Frau Lang, ich komme am Mittwoch zum Ausflug mit. Ich bin um neun Uhr vor der Schule. Muss ich die sechs Euro passend mitbringen? Viele Grüße, Kim"
 },
 {
  "title": "Fahrrad verkaufen",
  "text": "Ich verkaufe mein blaues Fahrrad für 70 Euro. Es ist zwei Jahre alt. Sie können es heute ab 18 Uhr in der Gartenstraße ansehen. Bitte vorher anrufen.",
  "prompt": "Wann kann man das Fahrrad ansehen?",
  "options": [
   "Ab 18 Uhr",
   "Um 7 Uhr",
   "Nur morgen"
  ],
  "statement": "Das Fahrrad ist rot.",
  "truth": false,
  "model": "Guten Tag, ich interessiere mich für Ihr blaues Fahrrad. Ich kann heute um 18 Uhr kommen. Können Sie mir bitte die Hausnummer in der Gartenstraße nennen? Viele Grüße, Alex"
 },
 {
  "title": "Ein Tisch im Restaurant",
  "text": "Ihre Reservierung für vier Personen ist bestätigt: Freitag, 19 Uhr. Bitte kommen Sie pünktlich. Wenn Sie später kommen, rufen Sie uns an. Ihr Restaurant Lindenhof.",
  "prompt": "Für wie viele Personen ist der Tisch?",
  "options": [
   "Für vier",
   "Für zwei",
   "Für sechs"
  ],
  "statement": "Die Gäste sollen bei Verspätung anrufen.",
  "truth": true,
  "model": "Guten Tag, vielen Dank für die Reservierung. Wir kommen am Freitag zu viert. Wir sind vielleicht zehn Minuten später da. Ist das in Ordnung? Mit freundlichen Grüßen, Sam"
 },
 {
  "title": "Schlüssel vergessen",
  "text": "Hallo Rita, ich habe meinen Schlüssel zu Hause vergessen. Ich bin um 17 Uhr zurück. Bist du dann da? Bitte warte im Haus. Danke, Tom.",
  "prompt": "Was hat Tom vergessen?",
  "options": [
   "Seinen Schlüssel",
   "Sein Handy",
   "Seine Tasche"
  ],
  "statement": "Tom kommt um sieben Uhr morgens zurück.",
  "truth": false,
  "model": "Hallo Tom, ich bin heute bis 18 Uhr zu Hause. Ich warte auf dich und öffne dir die Tür. Kannst du bitte noch Milch mitbringen? Liebe Grüße, Rita"
 },
 {
  "title": "Sportkurs",
  "text": "Der neue Yogakurs beginnt am Dienstag um 18.30 Uhr. Eine Stunde kostet acht Euro. Bitte bringen Sie eine Matte und bequeme Kleidung mit. Schuhe brauchen Sie nicht.",
  "prompt": "Was sollen die Teilnehmer mitbringen?",
  "options": [
   "Eine Matte",
   "Einen Ball",
   "Neue Schuhe"
  ],
  "statement": "Eine Stunde kostet acht Euro.",
  "truth": true,
  "model": "Guten Tag, ich möchte am Dienstag zum Yogakurs kommen. Ich habe eine eigene Matte. Gibt es noch einen freien Platz für eine Anfängerin? Vielen Dank und freundliche Grüße, Lea"
 },
 {
  "title": "Im Waschraum",
  "text": "Bitte benutzen Sie die Waschmaschine nur zwischen 8 und 20 Uhr. Nehmen Sie Ihre Wäsche nach dem Waschen sofort heraus. Die Maschine rechts ist kaputt.",
  "prompt": "Welche Maschine ist kaputt?",
  "options": [
   "Die rechte",
   "Die linke",
   "Beide"
  ],
  "statement": "Nach 20 Uhr darf man hier waschen.",
  "truth": false,
  "model": "Liebe Nachbarn, die rechte Waschmaschine funktioniert nicht. Ich habe die Hausverwaltung angerufen. Bitte benutzen Sie heute nur die linke Maschine. Vielen Dank für Ihre Hilfe. Viele Grüße, Luca"
 },
 {
  "title": "Bibliotheksausweis",
  "text": "Einen Bibliotheksausweis bekommen Sie an der Information. Für Erwachsene kostet er jährlich zwölf Euro. Kinder zahlen nichts. Bitte bringen Sie einen Ausweis und Ihre Adresse mit.",
  "prompt": "Wo bekommt man den Bibliotheksausweis?",
  "options": [
   "An der Information",
   "Im Lesesaal",
   "Am Eingang zum Café"
  ],
  "statement": "Für Kinder ist der Ausweis kostenlos.",
  "truth": true,
  "model": "Guten Tag, ich möchte einen Bibliotheksausweis für mich und mein Kind. Mein Kind ist acht Jahre alt. Welche Unterlagen muss ich für mein Kind mitbringen? Mit freundlichen Grüßen, Noor"
 },
 {
  "title": "Urlaub am See",
  "text": "Hallo Paula, wir sind am See. Das Wetter ist warm, aber heute regnet es. Wir gehen deshalb ins Museum. Morgen wollen wir schwimmen. Liebe Grüße, Alina.",
  "prompt": "Wohin gehen die Personen heute?",
  "options": [
   "Ins Museum",
   "Ins Schwimmbad",
   "Zur Arbeit"
  ],
  "statement": "Heute gehen die Personen schwimmen.",
  "truth": false,
  "model": "Liebe Alina, danke für deine Nachricht. Hier regnet es auch. Ich hoffe, ihr könnt morgen schwimmen. Wann kommt ihr wieder nach Hause? Viel Spaß und liebe Grüße, Paula"
 },
 {
  "title": "Arzttermin verschieben",
  "text": "Guten Tag, Ihr Termin am 4. April muss leider ausfallen. Der neue Termin ist am 8. April um 11 Uhr. Bitte bestätigen Sie telefonisch. Praxis Grün.",
  "prompt": "Was soll die Person tun?",
  "options": [
   "Den Termin telefonisch bestätigen",
   "Sofort in die Praxis kommen",
   "Einen Brief schreiben"
  ],
  "statement": "Der neue Termin ist am 8. April.",
  "truth": true,
  "model": "Sehr geehrtes Praxisteam, vielen Dank für Ihre Nachricht. Am 8. April um elf Uhr kann ich kommen. Soll ich meine alten Unterlagen mitbringen? Mit freundlichen Grüßen, Jan Weber"
 },
 {
  "title": "An der Bushaltestelle",
  "text": "Wegen Bauarbeiten fährt die Linie 12 heute nicht über den Marktplatz. Bitte benutzen Sie die Haltestelle am Rathaus. Die Fahrzeiten bleiben gleich.",
  "prompt": "Welche Haltestelle soll man benutzen?",
  "options": [
   "Die Haltestelle am Rathaus",
   "Die Haltestelle am Markt",
   "Die Haltestelle am See"
  ],
  "statement": "Die Fahrzeiten ändern sich heute.",
  "truth": false,
  "model": "Hallo Sara, der Bus hält heute nicht am Marktplatz. Wir müssen zum Rathaus gehen. Ich warte dort um acht Uhr auf dich. Passt dir das? Liebe Grüße, Ben"
 },
 {
  "title": "Ein Geschenk",
  "text": "Hallo Daniel, wir kaufen für Nina ein Buch. Jeder gibt fünf Euro. Bring das Geld bitte morgen zum Kurs mit. Ich kaufe das Buch am Nachmittag. Gruß, Mira.",
  "prompt": "Was bekommt Nina?",
  "options": [
   "Ein Buch",
   "Einen Kuchen",
   "Ein Fahrrad"
  ],
  "statement": "Daniel soll fünf Euro mitbringen.",
  "truth": true,
  "model": "Hallo Mira, ich mache gern beim Geschenk mit. Ich bringe morgen fünf Euro zum Kurs mit. Brauchen wir auch eine Karte für Nina? Ich kann eine kaufen. Viele Grüße, Daniel"
 },
 {
  "title": "Im Hotel",
  "text": "Das Frühstück gibt es von 7 bis 10 Uhr im Erdgeschoss. Am Sonntag beginnt es erst um 8 Uhr. Bitte geben Sie Ihren Schlüssel bei der Abreise an der Rezeption ab.",
  "prompt": "Wann beginnt das Frühstück am Sonntag?",
  "options": [
   "Um 8 Uhr",
   "Um 7 Uhr",
   "Um 10 Uhr"
  ],
  "statement": "Das Frühstück ist im zweiten Stock.",
  "truth": false,
  "model": "Guten Tag, ich reise am Sonntag sehr früh ab. Kann ich schon um sieben Uhr ein kleines Frühstück bekommen? Meinen Schlüssel gebe ich an der Rezeption ab. Vielen Dank, Robin"
 },
 {
  "title": "Ein neues Zimmer",
  "text": "Zimmer frei in einer Wohngemeinschaft: 16 Quadratmeter, 420 Euro im Monat, Küche und Bad gemeinsam. Einzug ab 1. September. Keine Haustiere. Kontakt per E-Mail.",
  "prompt": "Wann kann man einziehen?",
  "options": [
   "Ab 1. September",
   "Ab 16. September",
   "Sofort im August"
  ],
  "statement": "Haustiere sind in der Wohnung erlaubt.",
  "truth": false,
  "model": "Guten Tag, ich suche ab September ein Zimmer. Ihr Angebot interessiert mich. Ich habe keine Haustiere. Wann kann ich das Zimmer ansehen? Vielen Dank und freundliche Grüße, Andrea"
 },
 {
  "title": "Abendessen mit Freunden",
  "text": "Hallo zusammen, ich koche am Samstag um 19 Uhr. Für das Essen habe ich alles. Bitte bringt nur Getränke mit. Wir essen im Garten, wenn es warm ist. Euer Kai.",
  "prompt": "Was sollen die Freunde mitbringen?",
  "options": [
   "Getränke",
   "Gemüse",
   "Brot"
  ],
  "statement": "Kai möchte am Samstag zusammen essen.",
  "truth": true,
  "model": "Hallo Kai, vielen Dank für die Einladung. Ich komme am Samstag gern zum Essen und bringe Saft mit. Kann ich meine Freundin mitbringen? Wir freuen uns. Liebe Grüße, Toni"
 },
 {
  "title": "Reparatur zu Hause",
  "text": "Am Donnerstag kommt der Handwerker zwischen 10 und 12 Uhr. Er repariert die Heizung. Bitte sorgen Sie dafür, dass jemand in der Wohnung ist. Hausverwaltung Berg.",
  "prompt": "Was wird repariert?",
  "options": [
   "Die Heizung",
   "Der Herd",
   "Das Fenster"
  ],
  "statement": "Der Handwerker kommt am Freitag.",
  "truth": false,
  "model": "Guten Tag, am Donnerstag arbeite ich bis elf Uhr. Meine Nachbarin kann den Handwerker hereinlassen. Ist das möglich? Bitte rufen Sie mich kurz an. Mit freundlichen Grüßen, Julia Winter"
 },
 {
  "title": "Musikschule",
  "text": "Gitarrenunterricht für Anfänger: jeden Montag um 17 Uhr. Der erste Termin ist kostenlos. Eine eigene Gitarre können Sie mitbringen; Instrumente zum Leihen sind auch da.",
  "prompt": "Wann ist der Unterricht?",
  "options": [
   "Am Montag",
   "Am Mittwoch",
   "Am Sonntag"
  ],
  "statement": "Man muss eine eigene Gitarre mitbringen.",
  "truth": false,
  "model": "Guten Tag, ich möchte Gitarre lernen. Am Montag habe ich um 17 Uhr Zeit. Ich habe noch keine Gitarre. Kann ich beim ersten Termin eine leihen? Mit freundlichen Grüßen, Pat"
 },
 {
  "title": "Ein Filmabend",
  "text": "Hallo Selma, der Film beginnt heute um 20.15 Uhr. Ich habe zwei Karten. Treffen wir uns um 20 Uhr vor dem Kino? Danach können wir noch etwas trinken. Gruß, Erik.",
  "prompt": "Wo möchte Erik sich treffen?",
  "options": [
   "Vor dem Kino",
   "Im Café",
   "Am Bahnhof"
  ],
  "statement": "Der Film beginnt um 20.15 Uhr.",
  "truth": true,
  "model": "Hallo Erik, danke für die Kinokarte. Ich komme um 20 Uhr zum Kino. Nach dem Film trinke ich gern noch etwas mit dir. Wie heißt das Kino? Viele Grüße, Selma"
 },
 {
  "title": "Fundsache",
  "text": "Gefunden: eine schwarze Tasche im Bus 5. Darin sind ein rotes Buch und ein grüner Schal. Bitte melden Sie sich im Fundbüro am Bahnhof. Öffnungszeiten: 9 bis 16 Uhr.",
  "prompt": "Welche Farbe hat der Schal?",
  "options": [
   "Grün",
   "Rot",
   "Schwarz"
  ],
  "statement": "Die Tasche wurde im Zug gefunden.",
  "truth": false,
  "model": "Guten Tag, ich habe gestern meine schwarze Tasche im Bus verloren. Darin sind ein Buch und ein Schal. Kann ich heute um 15 Uhr ins Fundbüro kommen? Vielen Dank, Mina"
 },
 {
  "title": "Ein Praktikum",
  "text": "Ihr Praktikum beginnt am Montag. Bitte kommen Sie um 8.45 Uhr zur Rezeption. Frau Adler holt Sie dort ab. Bringen Sie bitte einen Stift und Ihr Notizbuch mit.",
  "prompt": "Wer holt die Person ab?",
  "options": [
   "Frau Adler",
   "Herr Weber",
   "Niemand"
  ],
  "statement": "Die Person soll an der Rezeption warten.",
  "truth": true,
  "model": "Sehr geehrte Frau Adler, vielen Dank für die Informationen. Ich komme am Montag um 8.45 Uhr zur Rezeption. Soll ich auch meinen Ausweis mitbringen? Mit freundlichen Grüßen, Emil"
 },
 {
  "title": "Kleidung kaufen",
  "text": "Heute im Angebot: T-Shirts für neun Euro und Hosen für 25 Euro. Das Angebot gilt nur heute. Umtausch ist mit Kassenbon innerhalb von 14 Tagen möglich.",
  "prompt": "Wie viel kostet eine Hose?",
  "options": [
   "25 Euro",
   "14 Euro",
   "9 Euro"
  ],
  "statement": "Das Angebot gilt die ganze Woche.",
  "truth": false,
  "model": "Guten Tag, ich habe heute bei Ihnen eine Hose gekauft. Sie ist leider zu klein. Den Kassenbon habe ich noch. Kann ich die Hose morgen umtauschen? Mit freundlichen Grüßen, Alex"
 },
 {
  "title": "Kaffee mit der Nachbarin",
  "text": "Liebe Eva, ich habe am Donnerstag frei. Möchtest du um 15 Uhr zum Kaffee kommen? Ich backe einen Apfelkuchen. Du brauchst nichts mitzubringen. Liebe Grüße, Frida.",
  "prompt": "Wann lädt Frida Eva ein?",
  "options": [
   "Am Donnerstag um 15 Uhr",
   "Am Dienstag um 15 Uhr",
   "Am Donnerstag um 5 Uhr"
  ],
  "statement": "Eva soll einen Kuchen mitbringen.",
  "truth": false,
  "model": "Liebe Frida, danke für die Einladung. Am Donnerstag komme ich gern um 15 Uhr zum Kaffee. Ich freue mich auf deinen Apfelkuchen. Soll ich auch meinen Sohn mitbringen? Liebe Grüße, Eva"
 },
 {
  "title": "Im Bürgerzentrum",
  "text": "Der Computerkurs findet diese Woche in Raum 3 statt. Raum 7 wird renoviert. Bitte kommen Sie zehn Minuten früher, damit wir pünktlich um 14 Uhr anfangen können.",
  "prompt": "In welchem Raum ist der Kurs?",
  "options": [
   "In Raum 3",
   "In Raum 7",
   "In Raum 14"
  ],
  "statement": "Die Teilnehmer sollen etwas früher kommen.",
  "truth": true,
  "model": "Guten Tag, ich besuche Ihren Computerkurs. Diese Woche komme ich in Raum drei. Muss ich meinen eigenen Computer mitbringen? Vielen Dank für Ihre Hilfe. Mit freundlichen Grüßen, Max"
 },
 {
  "title": "Ein Zugticket",
  "text": "Guten Tag, ich möchte morgen nach Leipzig fahren. Einfach oder hin und zurück? Nur hin, bitte. Die Fahrt um neun Uhr kostet 24 Euro. Gut, diese Fahrkarte nehme ich.",
  "prompt": "Welche Fahrkarte kauft die Person?",
  "options": [
   "Eine einfache Fahrt",
   "Eine Rückfahrkarte",
   "Eine Monatskarte"
  ],
  "statement": "Die Fahrkarte kostet neun Euro.",
  "truth": false,
  "model": "Hallo Anne, ich fahre morgen um neun Uhr nach Leipzig. Die Fahrkarte habe ich schon gekauft. Kannst du mich bitte am Bahnhof abholen? Ich rufe dich später an. Liebe Grüße, Jo"
 },
 {
  "title": "Hund betreuen",
  "text": "Hallo Max, kannst du am Sonntag auf meinen Hund aufpassen? Ich bin von 10 bis 16 Uhr nicht zu Hause. Futter steht in der Küche. Vielen Dank, Nele.",
  "prompt": "Bis wann ist Nele weg?",
  "options": [
   "Bis 16 Uhr",
   "Bis 10 Uhr",
   "Bis 18 Uhr"
  ],
  "statement": "Das Hundefutter steht in der Küche.",
  "truth": true,
  "model": "Hallo Nele, am Sonntag kann ich gern auf deinen Hund aufpassen. Ich bin ab zehn Uhr da. Wann soll ich mit ihm spazieren gehen? Schreib mir bitte kurz. Liebe Grüße, Max"
 },
 {
  "title": "Im Sprachcafé",
  "text": "Deutsch sprechen im Sprachcafé: freitags von 16 bis 18 Uhr. Alle Niveaus sind willkommen. Die Teilnahme ist kostenlos. Getränke bezahlen Sie selbst. Eine Anmeldung ist nicht nötig.",
  "prompt": "Was ist kostenlos?",
  "options": [
   "Die Teilnahme",
   "Alle Getränke",
   "Das Abendessen"
  ],
  "statement": "Man muss sich vorher anmelden.",
  "truth": false,
  "model": "Guten Tag, ich möchte am Freitag Ihr Sprachcafé besuchen. Ich lerne erst seit zwei Monaten Deutsch. Kann ich meine Freundin mitbringen? Sie lernt auch Deutsch. Vielen Dank und viele Grüße, Lee"
 },
 {
  "title": "Geburtstag im Büro",
  "text": "Am Mittwoch wird unser Kollege Paul 40 Jahre alt. Wir treffen uns um 12 Uhr in der Küche. Bitte unterschreiben Sie heute die Karte. Sie liegt bei Frau Roth.",
  "prompt": "Wo liegt die Karte?",
  "options": [
   "Bei Frau Roth",
   "In der Küche",
   "Bei Paul"
  ],
  "statement": "Paul hat am Mittwoch Geburtstag.",
  "truth": true,
  "model": "Liebe Frau Roth, ich möchte die Karte für Paul gern unterschreiben. Heute bin ich leider nicht im Büro. Kann ich morgen früh zu Ihnen kommen? Vielen Dank und viele Grüße, Chris"
 },
 {
  "title": "Ein Besuch aus dem Ausland",
  "text": "Hallo Kira, mein Bruder kommt am Samstag aus Wien. Er bleibt drei Tage bei mir. Wir möchten am Sonntag die Stadt ansehen. Hast du Zeit mitzukommen? Grüße, Omar.",
  "prompt": "Woher kommt Omars Bruder?",
  "options": [
   "Aus Wien",
   "Aus Berlin",
   "Aus Köln"
  ],
  "statement": "Der Bruder bleibt eine Woche.",
  "truth": false,
  "model": "Hallo Omar, am Sonntag habe ich Zeit. Ich zeige deinem Bruder gern die Stadt. Treffen wir uns um elf Uhr am Rathaus? Ich freue mich auf euch. Liebe Grüße, Kira"
 },
 {
  "title": "Im Schwimmbad",
  "text": "Das Schwimmbad ist am Montag wegen Reinigung geschlossen. Ab Dienstag gelten wieder die normalen Öffnungszeiten. Der Schwimmkurs am Montag findet deshalb am Mittwoch um 17 Uhr statt.",
  "prompt": "Wann ist der Ersatztermin?",
  "options": [
   "Am Mittwoch um 17 Uhr",
   "Am Dienstag um 17 Uhr",
   "Am Montag um 7 Uhr"
  ],
  "statement": "Am Montag kann man im Schwimmbad schwimmen.",
  "truth": false,
  "model": "Guten Tag, ich besuche den Schwimmkurs am Montag. Am Mittwoch um 17 Uhr kann ich leider nicht kommen. Gibt es einen anderen Termin für mich? Vielen Dank und freundliche Grüße, Kim"
 },
 {
  "title": "Am Markt",
  "text": "Frische Äpfel: zwei Euro pro Kilo. Birnen: drei Euro pro Kilo. Heute schließen wir schon um 13 Uhr. Morgen sind wir wieder ab 8 Uhr für Sie da.",
  "prompt": "Was kostet ein Kilo Birnen?",
  "options": [
   "Drei Euro",
   "Zwei Euro",
   "Acht Euro"
  ],
  "statement": "Der Stand öffnet morgen um acht Uhr.",
  "truth": true,
  "model": "Hallo Luis, ich gehe morgen um acht Uhr zum Markt. Ich kaufe Äpfel und Birnen. Brauchst du auch etwas? Ruf mich bitte heute Abend an. Liebe Grüße, Mara"
 }
];

const replies=["Guten Tag, vielen Dank für Ihre Nachricht. Am Donnerstag ist unsere Filiale von neun bis achtzehn Uhr geöffnet. Bitte bringen Sie Ihren Ausweis und die Paketkarte mit. Mit freundlichen Grüßen, Ihr Postteam", "Liebe Kim, danke für deine Nachricht. Ja, bring bitte sechs Euro passend mit. Wir treffen uns am Mittwoch um neun Uhr vor der Schule. Ich freue mich auf den Ausflug. Viele Grüße, Frau Lang", "Hallo Alex, danke für Ihr Interesse. Meine Adresse ist Gartenstraße 22. Sie können das Fahrrad heute um 18 Uhr ansehen. Bitte klingeln Sie bei Sommer. Viele Grüße, Robin Sommer", "Guten Tag, vielen Dank für Ihren Anruf. Zehn Minuten später ist in Ordnung. Wir halten Ihren Tisch bis 19.30 Uhr frei. Wir freuen uns auf Ihren Besuch. Ihr Restaurant Lindenhof", "Liebe Rita, danke, dass du auf mich wartest. Ich bringe gern einen Liter Milch mit. Um 17 Uhr bin ich wieder zu Hause. Brauchst du auch Brot? Liebe Grüße, Tom", "Guten Tag Lea, vielen Dank für Ihre Nachricht. Im Yogakurs ist noch ein Platz frei. Kommen Sie bitte am Dienstag um 18.15 Uhr. Eine eigene Matte ist sehr gut. Freundliche Grüße, Anna", "Hallo Luca, vielen Dank für die Information. Ich benutze heute nur die linke Waschmaschine. Bitte sag uns Bescheid, wenn die rechte Maschine wieder funktioniert. Einen schönen Abend! Viele Grüße, Sara", "Guten Tag Noor, vielen Dank für Ihre Frage. Bitte bringen Sie Ihren Ausweis und den Ausweis Ihres Kindes mit. Für Ihr Kind ist die Karte kostenlos. Wir helfen Ihnen gern. Ihre Bibliothek", "Liebe Paula, danke für deine Nachricht. Wir kommen am Montagabend wieder nach Hause. Morgen soll die Sonne scheinen. Dann gehen wir endlich schwimmen. Bis bald und liebe Grüße, Alina", "Guten Tag Herr Weber, vielen Dank für die Bestätigung. Bitte bringen Sie Ihre alten Unterlagen und Ihre Versichertenkarte mit. Wir sehen uns am 8. April um elf Uhr. Ihre Praxis Grün", "Hallo Ben, danke für die Information. Acht Uhr am Rathaus passt mir gut. Ich komme ein paar Minuten früher. Dann können wir zusammen mit dem Bus zur Schule fahren. Liebe Grüße, Sara", "Hallo Daniel, danke, dass du beim Geschenk mitmachst. Eine Karte wäre sehr schön. Kannst du bitte eine mitbringen? Ich kaufe dann heute das Buch für Nina. Viele Grüße, Mira", "Guten Tag Robin, danke für Ihre Nachricht. Wir können Ihnen am Sonntag um sieben Uhr ein Frühstückspaket geben. Bitte sagen Sie uns am Samstag Bescheid. Wir wünschen eine gute Reise. Ihr Hotelteam", "Guten Tag Andrea, vielen Dank für Ihr Interesse. Sie können das Zimmer am Freitag um 17 Uhr ansehen. Bitte bestätigen Sie den Termin per E-Mail. Wir freuen uns. Freundliche Grüße, Alex", "Hallo Toni, deine Freundin ist natürlich auch willkommen. Danke, dass ihr Saft mitbringt. Kommt bitte am Samstag um 19 Uhr. Ich freue mich auf einen schönen Abend mit euch. Liebe Grüße, Kai", "Guten Tag Frau Winter, vielen Dank für Ihre Nachricht. Ihre Nachbarin kann dem Handwerker gern die Tür öffnen. Bitte geben Sie ihr den Schlüssel. Wir rufen Sie morgen an. Ihre Hausverwaltung", "Hallo Pat, vielen Dank für Ihre Nachricht. Sie können am Montag gern eine Gitarre leihen. Kommen Sie bitte um 16.45 Uhr, dann suchen wir ein Instrument aus. Viele Grüße, Ihre Musikschule", "Hallo Selma, das Kino heißt Stadtlicht. Es ist direkt neben der Post am Markt. Wir treffen uns um 20 Uhr vor dem Eingang. Ich freue mich auf den Abend. Viele Grüße, Erik", "Guten Tag Mina, vielen Dank für Ihre Nachricht. Kommen Sie gern heute um 15 Uhr ins Fundbüro. Bringen Sie bitte Ihren Ausweis mit. Wir prüfen dann die Tasche zusammen. Ihr Fundbüro", "Guten Tag Emil, vielen Dank für Ihre Nachricht. Bitte bringen Sie Ihren Ausweis mit. Ich hole Sie am Montag um 8.45 Uhr an der Rezeption ab. Bis Montag! Freundliche Grüße, Frau Adler", "Guten Tag Alex, danke für Ihre Nachricht. Sie können die Hose morgen mit dem Kassenbon umtauschen. Unser Geschäft ist von neun bis achtzehn Uhr geöffnet. Mit freundlichen Grüßen, Ihr Verkaufsteam", "Liebe Eva, dein Sohn kann natürlich mitkommen. Ich freue mich auf euch beide. Wir sehen uns am Donnerstag um 15 Uhr bei mir. Der Apfelkuchen ist dann fertig. Liebe Grüße, Frida", "Guten Tag Max, vielen Dank für Ihre Frage. Sie brauchen keinen eigenen Computer. In Raum drei gibt es Computer für alle Teilnehmer. Bitte bringen Sie nur Ihr Notizbuch mit. Freundliche Grüße, Frau Kern", "Hallo Jo, ich hole dich gern am Bahnhof in Leipzig ab. Sag mir bitte noch, wann dein Zug ankommt. Wir treffen uns vor dem Haupteingang. Ich freue mich auf dich. Liebe Grüße, Anne", "Hallo Max, vielen Dank für deine Hilfe. Geh bitte um zwölf Uhr mit dem Hund spazieren. Sein Futter steht in der Küche. Um 16 Uhr bin ich zurück. Liebe Grüße, Nele", "Hallo Lee, danke für Ihre Nachricht. Ihre Freundin ist auch herzlich willkommen. Sie brauchen sich beide nicht anzumelden. Kommen Sie einfach am Freitag ab 16 Uhr vorbei. Viele Grüße, Ihr Sprachcafé", "Hallo Chris, vielen Dank für deine Nachricht. Morgen früh bin ich ab acht Uhr im Büro. Komm einfach zu mir und unterschreibe die Karte. Bis morgen! Viele Grüße, Frau Roth", "Hallo Kira, elf Uhr am Rathaus passt uns sehr gut. Vielen Dank, dass du uns die Stadt zeigen möchtest. Mein Bruder freut sich schon. Wir sehen uns am Sonntag. Liebe Grüße, Omar", "Guten Tag Kim, danke für Ihre Nachricht. Sie können diese Woche am Freitag um 18 Uhr zum Schwimmkurs kommen. Bitte bestätigen Sie den Termin kurz. Freundliche Grüße, Ihr Schwimmbadteam", "Hallo Mara, danke für deine Nachricht. Kannst du mir bitte ein Kilo Äpfel mitbringen? Birnen brauche ich nicht. Ich rufe dich heute Abend an. Vielen Dank für deine Hilfe. Liebe Grüße, Luis"];
export function expandExercises(base){
 const extra=[];
 situations.forEach((s,i)=>{
  const make=(skill,j,prompt,options,answer)=>({id:`${skill==='lesen'?'r':'h'}${16+i*2+j}`,skill,part:1+i%3,type:'choice',title:s.title+(j?' · Detail':' · Information'),prompt,options,answer,explanation:{en:`The relevant information is in this passage: “${s.text}” Compare the question with the complete message, including any changes or exceptions.`,de:`Die passende Information steht im Text: „${s.text}“ Beachten Sie auch Änderungen und Ausnahmen.`},...(skill==='lesen'?{text:s.text}:{transcript:s.text})});
  for(const skill of ['lesen','hoeren']){
   extra.push(make(skill,0,s.prompt,s.options,0));
   extra.push(make(skill,1,s.statement,['Richtig','Falsch'],s.truth?0:1));
  }
  const points=['Nennen Sie den Anlass.','Schreiben Sie eine passende Information.','Stellen Sie eine Frage.'];
  extra.push({id:`write-${i}-request`,skill:'schreiben',part:2,type:'writing',title:s.title+' · Nachricht',text:s.text,prompt:'Schreiben Sie als Antwort eine Nachricht mit etwa 30 Wörtern.',points,model:s.model,explanation:{en:'Use the original message to choose a suitable greeting. Include the reason, relevant information and a question. The model is one possible answer.',de:'Wählen Sie eine passende Anrede. Schreiben Sie den Anlass, eine passende Information und eine Frage. Der Mustertext ist eine mögliche Lösung.'}});
  extra.push({id:`write-${i}-reply`,skill:'schreiben',part:2,type:'writing',title:s.title+' · Antworten',text:s.model,prompt:'Sie erhalten diese Nachricht. Antworten Sie mit etwa 30 Wörtern. Sie dürfen passende Angaben erfinden.',points:['Bedanken Sie sich für die Nachricht.','Beantworten Sie die Frage.','Schreiben Sie einen passenden Schluss.'],model:replies[i],explanation:{en:'Choose details that fit the incoming message. Notice how the model answers the specific question in the incoming message. Check that you actually answer the question.',de:'Wählen Sie Angaben, die zur Nachricht passen. Der Mustertext beantwortet die konkrete Frage in der Nachricht. Prüfen Sie, ob Sie die Frage wirklich beantworten.'}});
  extra.push({id:`situation-${i}`,skill:'sprechen',part:2,type:'speaking',title:s.title+' · Fragen',text:s.text,prompt:'Sprechen Sie über diese Situation. Stellen Sie eine Frage und beantworten Sie die Frage.',points:[s.title,s.prompt],model:`Frage: ${s.prompt}\nAntwort: ${s.options[0]}.`,explanation:{en:'Ask the question aloud, then answer in a full sentence. Swap roles with a partner. Do not read the answer on your second attempt.',de:'Stellen Sie die Frage laut. Antworten Sie danach in einem ganzen Satz. Tauschen Sie mit einem Partner die Rollen.'}});
  extra.push({id:`role-${i}`,skill:'sprechen',part:3,type:'speaking',title:s.title+' · Rollenspiel',text:s.text,prompt:'Spielen Sie die Situation zu zweit. Formulieren Sie eine höfliche Bitte und reagieren Sie darauf.',points:['Um eine Information bitten','Die Information geben','Sich bedanken'],model:`Können Sie mir bitte helfen? ${s.prompt} — ${s.options[0]}. — Vielen Dank! — Gern.`,explanation:{en:'Use the scenario’s information, speak clearly and give your partner time to respond. Try both roles.',de:'Benutzen Sie die Angaben aus der Situation. Sprechen Sie deutlich und lassen Sie Ihren Partner antworten. Üben Sie beide Rollen.'}});
 });
 const forms=[['Nachname','Navarro'],['Vorname','Pablo'],['Wohnort','Mainz'],['Straße','Parkstraße'],['Hausnummer','18'],['Postleitzahl','55116'],['Beruf','Koch']];
 forms.forEach(([prompt,answer],i)=>extra.push({id:`form-extra-${i}`,skill:'schreiben',part:1,type:'input',title:'Anmeldung im Sportverein',text:'Pablo Navarro ist Koch. Er wohnt in der Parkstraße 18 in 55116 Mainz. Er möchte im Sportverein Fußball spielen.',prompt,answer,explanation:{en:'Find the exact requested field in Pablo’s profile. Do not confuse the postcode and house number.',de:'Suchen Sie die passende Angabe in Pablos Beschreibung. Verwechseln Sie Postleitzahl und Hausnummer nicht.'}}));
 const requests=[['einen Stift','Können Sie mir bitte einen Stift geben?'],['die Tür','Können Sie bitte die Tür schließen?'],['ein Foto','Können Sie bitte ein Foto machen?'],['den Weg','Können Sie mir bitte den Weg zeigen?'],['die Uhrzeit','Können Sie mir bitte die Uhrzeit sagen?'],['ein Glas','Können Sie mir bitte ein Glas geben?'],['langsamer sprechen','Können Sie bitte langsamer sprechen?'],['einen Platz','Ist dieser Platz bitte noch frei?'],['die Rechnung','Kann ich bitte die Rechnung haben?']];
 requests.forEach(([title,question],i)=>extra.push({id:`request-${i}`,skill:'sprechen',part:3,type:'speaking',title:'Höflich bitten: '+title,prompt:'Formulieren Sie eine passende Bitte. Reagieren Sie danach freundlich auf eine Bitte.',points:[title,'Eine Antwort geben'],model:question+' — Ja, gern.',explanation:{en:'A polite request often begins with “Können Sie bitte …?” Say it aloud with a calm, friendly tone.',de:'Eine höfliche Bitte beginnt oft mit „Können Sie bitte …?“. Sprechen Sie ruhig und freundlich.'}}));
 for(const [i,q] of extra.entries()){if(q.type==='choice'&&q.options.length===3){const shift=i%3;q.options=[...q.options.slice(shift),...q.options.slice(0,shift)];q.answer=(3-shift)%3;}}
 return [...base,...extra];
}
