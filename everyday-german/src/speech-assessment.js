// ponytail: Browser SpeechRecognition with token-overlap grading. Cloud phoneme analysis when micro-grading needed.
const cleanWord = w => String(w || '').toLowerCase().replace(/[^a-zäöüß0-9]/gi, '');

export function hasSpeechRecognition() {
  return typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function evaluateSpeech(spokenText, expectedText) {
  const spokenClean = String(spokenText || '').trim();
  const spokenTokens = spokenClean.split(/\s+/).map(cleanWord).filter(Boolean);
  const spokenSet = new Set(spokenTokens);

  const targetTokens = String(expectedText || '').split(/\s+/).map(cleanWord).filter(Boolean);
  if (!targetTokens.length) {
    return { score: spokenTokens.length ? 100 : 0, tokens: [], matchedCount: 0, totalCount: 0, transcript: spokenClean };
  }

  // Identify meaningful keywords (filter out very short words unless essential)
  const tokens = targetTokens.map(word => {
    const matched = spokenSet.has(word);
    return { word, matched };
  });

  const matchedCount = tokens.filter(t => t.matched).length;
  const score = Math.round((matchedCount / targetTokens.length) * 100);

  return {
    score,
    transcript: spokenClean,
    tokens,
    matchedCount,
    totalCount: targetTokens.length,
    missing: tokens.filter(t => !t.matched).map(t => t.word)
  };
}

export function startSpeechRecognition({ onResult, onError, onEnd, lang = 'de-DE' }) {
  if (!hasSpeechRecognition()) {
    if (onError) onError(new Error('Speech recognition not supported in this browser.'));
    return null;
  }
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognizer = new Recognition();
  recognizer.lang = lang;
  recognizer.continuous = false;
  recognizer.interimResults = false;
  recognizer.maxAlternatives = 1;

  recognizer.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript || '';
    if (onResult) onResult(transcript);
  };
  recognizer.onerror = (event) => {
    if (onError) onError(event.error || event);
  };
  recognizer.onend = () => {
    if (onEnd) onEnd();
  };

  try {
    recognizer.start();
    return recognizer;
  } catch (err) {
    if (onError) onError(err);
    return null;
  }
}
