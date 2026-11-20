// Original learning takeaways, with the work that inspired each one.
const thoughts = [
  ['Aristotle · Nicomachean Ethics, II', 'Build the habit by doing the thing. Say one useful German sentence aloud today.', 'Üben Sie, indem Sie es tun. Sagen Sie heute einen nützlichen deutschen Satz laut.'],
  ['Epictetus · Enchiridion, 1', 'Focus on what you can do today. Spend five minutes on the words you keep forgetting.', 'Konzentrieren Sie sich auf das, was Sie heute tun können. Üben Sie fünf Minuten lang die Wörter, die Sie oft vergessen.'],
  ['Confucius · Analects, 2.11', 'Review something familiar and look for something new in it. Try an old phrase in a different situation.', 'Wiederholen Sie etwas Bekanntes und entdecken Sie darin etwas Neues. Verwenden Sie einen bekannten Satz in einer anderen Situation.'],
  ['Seneca · Letters to Lucilius, 7', 'Teach someone one thing you learned today. Explaining it will help you remember it.', 'Erklären Sie jemandem etwas, das Sie heute gelernt haben. So können Sie es sich besser merken.'],
  ['Marcus Aurelius · Meditations, 5.1', 'Start with the work in front of you. Open one exercise and give it your full attention.', 'Beginnen Sie mit der Aufgabe vor Ihnen. Öffnen Sie eine Übung und widmen Sie ihr Ihre ganze Aufmerksamkeit.'],
  ['Michel de Montaigne · Essays, I.26', 'Put a new idea into your own words. Take one example sentence and change it to fit your life.', 'Formulieren Sie eine neue Idee mit eigenen Worten. Machen Sie aus einem Beispielsatz einen Satz über Ihr eigenes Leben.'],
  ['René Descartes · Discourse on the Method, II', 'Split a hard task into small steps. Listen for the main idea first, then for details.', 'Teilen Sie eine schwierige Aufgabe in kleine Schritte. Hören Sie zuerst auf die Hauptaussage, dann auf die Einzelheiten.']
];

export function dailyThought(lang, now = new Date()){
  const day = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
  const [source, en, de] = thoughts[((day % thoughts.length) + thoughts.length) % thoughts.length];
  return {source, text: lang==='de'?de:en, title: lang==='de'?'Lernimpuls des Tages':'Thought for the day'};
}
