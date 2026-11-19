// Original Everyday German practice items in the current Start Deutsch 2 layout.
const rf=['Richtig','Falsch'];
const item=(id,part,title,text,prompt,options,answer,extra={})=>({id,level:'a2',skill:'lesen',part,title,text,prompt,options,answer,type:'choice',...extra});
const hnote=(id,title,transcript,prompt,answer)=>({id,level:'a2',skill:'hoeren',part:1,title,transcript,prompt,answer,type:'input',plays:2,telcForm:true,numericAnswer:/\d/.test(answer)});
const hmc=(id,title,transcript,prompt,options,answer)=>({id,level:'a2',skill:'hoeren',part:2,title,transcript,prompt,options,answer,type:'choice',plays:1});
const l1=[
 ['Sie brauchen ein Kinderbuch für ein achtjähriges Kind.','b','a'],
 ['Sie möchten einen Reiseführer kaufen.','b','c'],
 ['Sie haben Ihre Handschuhe im Kaufhaus verloren.','a','c'],
 ['Sie möchten Waschmittel kaufen.','a','c'],
 ['Sie suchen Sportschuhe.','c','b']
];
const directory='STADTHAUS KAUFHAUS\nErdgeschoss: Kosmetik · Waschmittel · Fundbüro · Information\n1. Stock: Schuhe · Kleidung · Küche · Elektrogeräte\n2. Stock: Kinderbücher · Spielwaren · Schreibwaren · Reiseführer\n3. Stock: Sport · Fahrräder · Foto · Café';
const story='Ein neues Leben in Leipzig\nVor einem Jahr zog die 29-jährige Sofia aus Madrid nach Leipzig. Sie arbeitet in einer Bäckerei und besucht zweimal pro Woche einen Deutschkurs. Am Anfang kannte sie niemanden. Eine Kollegin lud sie zu einem Kochabend ein. Dort lernte Sofia ihre Nachbarin Jana kennen. Jetzt gehen die beiden oft zusammen spazieren oder ins Kino. Sofia wohnt in einer kleinen Wohnung nahe dem Park. Am Wochenende telefoniert sie mit ihrer Familie in Spanien. Im Sommer möchte sie ihre Eltern nach Deutschland einladen.';
const article=[
 ['Sofia lebt seit einem Jahr in Leipzig.',true],['Sie arbeitet in einem Restaurant.',false],['Jana ist Sofias Nachbarin.',true],['Sofia telefoniert am Wochenende mit ihrer Familie.',true],['Ihre Eltern wohnen bereits in Deutschland.',false]
];
const ads=[
 ['Sie möchten in den Ferien in Deutschland arbeiten und studieren.','g'],
 ['Ein Freund sucht einen günstigen Mietwagen für eine Rundreise.','f'],
 ['Sie möchten zusammen mit anderen kochen lernen.','d'],
 ['Ihre Freundin will in Deutschland Urlaub machen und Deutsch lernen.','e'],
 ['Sie möchten am Wochenende einen Tanzkurs besuchen.','x']
];
const adText='a www.bahnzeit.de – Mit dem Zug quer durch Deutschland. Flexible Rundreisen und günstige Tickets.\nb www.ferienblick.de – Ferienhäuser am See, Hotels und Campingplätze.\nc www.jobstart.de – Ferienjobs in vielen Ländern, auch für Studierende.\nd www.genusswerk.de – Kochkurse für Anfänger. Gemeinsam kochen und neue Rezepte probieren.\ne www.sprachferien.de – Urlaub in Deutschland mit Deutschkurs und Freizeitprogramm.\nf www.mietmobil.de – Mietwagen vergleichen. Günstige Preise für Rundreisen.\ng www.studium-info.de – Studieren und arbeiten in Deutschland: Informationen für internationale Studierende.\nh www.kulturreisen.de – Museen und Konzerte in Deutschland entdecken.';
const formText='Mara Klein wohnt in der Lindenstraße 8 in Bremen. Sie wurde am 12.04.1997 in Oldenburg geboren. Mara ist ledig und arbeitet als Köchin. Sie spricht Deutsch und Englisch. Für einen Onlinekurs meldet sie sich heute an.';
const fields=[['Wohnort','Bremen'],['Geburtsdatum','12.04.1997'],['Geburtsort','Oldenburg'],['Familienstand','ledig'],['Fremdsprache','Englisch']];
const hears=[
 hnote('a2telc-h1','Telefonnotiz · Nachricht 1','Guten Morgen, hier ist die Praxis Dr. Sommer. Ihr Termin ist heute um zehn Uhr. Bitte rufen Sie uns unter 0421 638 17 20 zurück.','Welche Telefonnummer sollen Sie anrufen?','04216381720'),
 hnote('a2telc-h2','Telefonnotiz · Nachricht 2','Hallo Tim, dein Fahrrad ist fertig. Du kannst es heute ab 16 Uhr abholen. Die Reparatur kostet 38 Euro. Viele Grüße, Werkstatt König.','Wie viel kostet die Reparatur?','38 Euro'),
 hnote('a2telc-h3','Telefonnotiz · Nachricht 3','Hallo Frau Beck, hier ist Nina. Treffen wir uns morgen am Eingang vom Museum? Ich bin um halb zwölf dort.','Wo treffen Sie sich?','am Eingang'),
 hnote('a2telc-h4','Telefonnotiz · Nachricht 4','Guten Tag, Herr Wolf. Bitte rufen Sie Herrn Yilmaz zurück. Er ist heute bis 18 Uhr im Büro. Seine Nummer ist 030 785 44 91.','Bis wann ist Herr Yilmaz im Büro?','18 Uhr'),
 hnote('a2telc-h5','Telefonnotiz · Nachricht 5','Hallo Lea, ich kann am Mittwoch nicht kommen. Passt dir Donnerstagvormittag? Schreib mir bitte kurz. Viele Grüße, Paula.','Wann schlägt Paula das Treffen vor?','Donnerstagvormittag'),
 hmc('a2telc-h6','Radio · Information 1','Guten Morgen. Es ist kurz nach sieben. Um acht beginnt unser Kinderprogramm mit einer Geschichte aus dem Wald.','Was beginnt um acht Uhr?',['Eine Kindersendung','Die Nachrichten','Ein Konzert'],0),
 hmc('a2telc-h7','Radio · Wetter','Heute bleibt es am Vormittag trocken. Am Nachmittag regnet es im Norden. Im Süden scheint die Sonne. Morgen wird es überall kühler.','Wie wird das Wetter morgen?',['Warm und sonnig','Kühler','Es gibt ein Gewitter'],1),
 hmc('a2telc-h8','Radio · Verkehr','Achtung auf der B 7 bei Kassel: Eine Kuh läuft auf der Straße. Bitte fahren Sie langsam und beachten Sie die Polizei.','Was läuft auf der Straße?',['Ein Hund','Ein Kind','Eine Kuh'],2),
 hmc('a2telc-h9','Radio · Geburtstagsgruß','Heute wird Josef 18 Jahre alt. Seine Schwester Anna und seine Eltern wünschen ihm alles Gute.','Wer gratuliert Josef?',['Seine Freunde aus dem Radio','Seine Familie','Sein Chef'],1),
 hmc('a2telc-h10','Radio · Gewinnspiel','Unser heutiges Quiz: Wie heißt die Hauptstadt von Portugal? Rufen Sie uns an und gewinnen Sie zwei Karten für das Theater.','Was kann man gewinnen?',['Theaterkarten','Eine Reise','Ein Buch'],0)
];
const office='Frau Weber begrüßt den neuen Mitarbeiter Herrn Lang in der Firma. Sie erklärt, wo die Kolleginnen und Kollegen arbeiten. Die Abteilungsleiterin Frau Koch sitzt neben dem Besprechungsraum. Der Sohn des Chefs arbeitet am Empfang. Der Hausmeister ist heute in der Werkstatt. Die Praktikantin sitzt im Büro gegenüber der Küche. Die Sekretärin arbeitet im Schreibbüro.';
const locationCodes=['a','b','c','d','e','f','g','h','i'];
const locations=['im ersten Stock','neben dem Besprechungsraum','am Empfang','neben der Teeküche','im Kopierraum','in der Werkstatt','über dem Computerraum','im Keller','im Schreibbüro'];
const persons=[['Frau Koch','b'],['Sohn des Chefs','c'],['Hausmeister','f'],['Praktikantin','d'],['Sekretärin','i']];
const exercises=[...hears,
 ...l1.map((x,i)=>item(`a2telc-r${i+1}`,1,'Wegweiser im Kaufhaus',directory,x[0],['Erdgeschoss','2. Stock','anderes Stockwerk'],['a','b','c'].indexOf(x[1]),{options:['Erdgeschoss','2. Stock','anderes Stockwerk']})),
 ...article.map((x,i)=>item(`a2telc-r${i+6}`,2,'Ein neues Leben in Leipzig',story,x[0],rf,x[1]?0:1)),
 ...ads.map((x,i)=>item(`a2telc-r${i+11}`,3,'Anzeigen und Situationen',adText,x[0],['a','b','c','d','e','f','g','h','x'],['a','b','c','d','e','f','g','h','x'].indexOf(x[1]))),
 ...fields.map((x,i)=>({id:`a2telc-f${i+1}`,level:'a2',skill:'schreiben',part:1,type:'input',title:'Anmeldung zum Onlinekurs',text:formText,prompt:x[0],answer:x[1],telcForm:true,numericAnswer:/^[\d. /-]+$/.test(x[1])})),
 {id:'a2telc-w1',level:'a2',skill:'schreiben',part:2,type:'writing',title:'Eine Einladung beantworten',prompt:'Ihre Freundin Nina feiert nächsten Samstag ihren Geburtstag in Bremen. Schreiben Sie eine Nachricht (ca. 40 Wörter). Wählen Sie drei der vier Punkte und schreiben Sie zu jedem ein bis zwei Sätze. Vergessen Sie Anrede und Gruß nicht.',points:['Zu- oder absagen','Begleitung','Geschenk','Übernachtung'],model:'Liebe Nina, vielen Dank für deine Einladung. Ich komme sehr gern zu deiner Feier. Mein Bruder kommt auch mit. Was wünschst du dir zum Geburtstag? Kann ich bei dir übernachten? Liebe Grüße, Mara'},
 {id:'a2telc-s1',level:'a2',skill:'sprechen',part:1,type:'speaking',title:'Sich vorstellen',prompt:'Stellen Sie sich Ihrer Partnerin oder Ihrem Partner kurz vor. Sprechen Sie über die Stichwörter und stellen Sie danach auch Fragen.',points:['Name','Alter','Land','Wohnort','Sprachen','Beruf','Hobby'],model:'Ich heiße Alex. Ich bin 28 Jahre alt und komme aus Kanada. Jetzt wohne ich in Hamburg. Ich spreche Englisch und lerne Deutsch. Ich arbeite als Koch. In meiner Freizeit spiele ich gern Tennis. Und wie heißen Sie?'},
 {id:'a2telc-s2',level:'a2',skill:'sprechen',part:2,type:'speaking',title:'Ein Alltagsgespräch führen',prompt:'Führen Sie mit Ihrem Partner ein kurzes Gespräch. Thema: Tagesablauf. Ziehen Sie abwechselnd Stichwortkarten, stellen Sie eine Frage und beantworten Sie die Frage Ihres Partners.',points:['Was …?','Wo …?','Wann …?','Wohin …?','Wie oft …?','Wie lange …?'],cards:[{theme:'Tagesablauf',word:'Was …?'},{theme:'Tagesablauf',word:'Wo …?'},{theme:'Tagesablauf',word:'Wann …?'},{theme:'Tagesablauf',word:'Wohin …?'},{theme:'Tagesablauf',word:'Wie oft …?'},{theme:'Tagesablauf',word:'Wie lange …?'}],model:'Wann frühstücken Sie normalerweise? — Ich frühstücke um sieben Uhr.'},
 {id:'a2telc-s3',level:'a2',skill:'sprechen',part:3,type:'speaking',title:'Etwas aushandeln',prompt:'Sie möchten gemeinsam ein neues Hobby finden. Sprechen Sie miteinander und einigen Sie sich auf zwei Aktivitäten, einen passenden Termin und einen Treffpunkt. Fragen Sie nach Gründen und machen Sie eigene Vorschläge.',points:['Gemeinsames Ziel: ein neues Hobby finden','Vorschläge vergleichen','Wann und wo?','Warum passt es?','Einen eigenen Vorschlag machen'],cards:[{theme:'Person A',items:['Singen','Tanzen','Malen','Fußball spielen']},{theme:'Person B',items:['Musik machen','Fotografieren','Tischtennis spielen','Kochkurs machen']}],model:'Wie wäre es mit einem Kochkurs? Am Samstag habe ich Zeit. Das passt mir gut, weil ich gern neue Rezepte lerne. Wollen wir uns um zehn Uhr vor der Schule treffen?'}
];
// Add five answer rows for the single recorded dialogue; the player is shared and capped at two plays.
const shared=persons.map((p,i)=>({id:`a2telc-h${11+i}`,level:'a2',skill:'hoeren',part:3,title:'Gespräch in einer Firma',transcript:i===0?office:undefined,audioGroup:'a2telc-h3-shared',plays:2,type:'choice',prompt:`Wo arbeitet ${p[0]}?`,options:locations,answer:locationCodes.indexOf(p[1])}));
export const TELC_A2_EXERCISES=[...exercises,...shared];
export const TELC_A2_SECTIONS=[{skill:'hoeren',ids:TELC_A2_EXERCISES.filter(q=>q.skill==='hoeren').map(q=>q.id)},{skill:'lesen',ids:TELC_A2_EXERCISES.filter(q=>q.skill==='lesen').map(q=>q.id)},{skill:'schreiben',ids:TELC_A2_EXERCISES.filter(q=>q.skill==='schreiben').map(q=>q.id)},{skill:'sprechen',ids:TELC_A2_EXERCISES.filter(q=>q.skill==='sprechen').map(q=>q.id)}];
