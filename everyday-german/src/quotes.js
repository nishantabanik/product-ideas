// Daily learning quotes. Picks one per calendar day so it changes daily
export const QUOTES = [
    {
        en: { text: 'Knowing is not enough; we must apply. Willing is not enough; we must do.', author: 'Johann Wolfgang von Goethe' },
        de: { text: 'Wissen ist nicht genug, wir müssen es anwenden. Wollen ist nicht genug, wir müssen es tun.', author: 'Johann Wolfgang von Goethe' }
    },
    {
        en: { text: 'The limits of my language mean the limits of my world.', author: 'Ludwig Wittgenstein' },
        de: { text: 'Die Grenzen meiner Sprache bedeuten die Grenzen meiner Welt.', author: 'Ludwig Wittgenstein' }
    },
    {
        en: { text: 'Language is the formative organ of thought.', author: 'Wilhelm von Humboldt' },
        de: { text: 'Die Sprache ist das bildende Organ des Gedanken.', author: 'Wilhelm von Humboldt' }
    },
    {
        en: { text: 'If you talk to a man in a language he understands, that goes to his head. If you talk to him in his own language, that goes to his heart.', author: 'Nelson Mandela' },
        de: { text: 'Wenn du mit jemandem in einer Sprache sprichst, die er versteht, erreicht das seinen Kopf. Wenn du mit ihm in seiner eigenen Sprache sprichst, erreicht das sein Herz.', author: 'Nelson Mandela' }
    },
    {
        en: { text: 'Whoever does not know foreign languages knows nothing of his own.', author: 'Johann Wolfgang von Goethe' },
        de: { text: 'Wer fremde Sprachen nicht kennt, weiß nichts von seiner eigenen.', author: 'Johann Wolfgang von Goethe' }
    },
    {
        en: { text: 'Anyone who has never made a mistake has never tried anything new.', author: 'Albert Einstein' },
        de: { text: 'Wer nie einen Fehler gemacht hat, hat nie etwas Neues ausprobiert.', author: 'Albert Einstein' }
    }
];

export function dayOfYear(date = new Date()) {
    const start = Date.UTC(date.getFullYear(), 0, 0);
    const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.floor((today - start) / 86400000);
}

export function dailyQuote(lang = 'en', date = new Date()) {
    const entry = QUOTES[dayOfYear(date) % QUOTES.length];
    return lang === 'de' ? entry.de : entry.en;
}
