// ponytail: Autocorrelation pitch tracker on AudioContext. Yin pitch tracker when polyphonic detection needed.
export const INTONATION_PROFILES = {
  statement: {
    type: 'statement',
    name: { en: 'Statement (Falling ↘)', de: 'Aussagesatz (Fallend ↘)' },
    rule: { en: 'German statements drop in pitch at the end of the sentence.', de: 'Im Aussagesatz sinkt die Stimme am Satzende deutlich ab.' },
    target: [140, 145, 140, 125, 110, 95]
  },
  wQuestion: {
    type: 'wQuestion',
    name: { en: 'W-Question (Falling ↘)', de: 'W-Frage (Fallend ↘)' },
    rule: { en: 'Questions starting with W (Wer, Wo, Wann) start high and fall.', de: 'W-Fragen beginnen mit höherem Ton und fallen am Satzende.' },
    target: [160, 150, 140, 130, 115, 100]
  },
  yesNoQuestion: {
    type: 'yesNoQuestion',
    name: { en: 'Yes/No Question (Rising ↗)', de: 'Ja/Nein-Frage (Steigend ↗)' },
    rule: { en: 'Questions answered with Yes or No rise clearly at the end.', de: 'Entscheidungsfragen (Ja/Nein) steigen am Satzende deutlich an.' },
    target: [110, 115, 120, 130, 150, 175]
  },
  politeRequest: {
    type: 'politeRequest',
    name: { en: 'Polite Request (Gentle Rise ↗)', de: 'Höfliche Bitte (Sanft steigend ↗)' },
    rule: { en: 'Polite requests with “Könnten/Können Sie bitte...” end with a soft rise.', de: 'Höfliche Bitten mit „Können Sie bitte...“ enden mit sanftem Anstieg.' },
    target: [130, 135, 125, 130, 145, 160]
  }
};

export function detectPitch(buffer, sampleRate) {
  // Autocorrelation within voice range (80 Hz - 400 Hz)
  const SIZE = buffer.length;
  let sumOfSquares = 0;
  for (let i = 0; i < SIZE; i++) sumOfSquares += buffer[i] * buffer[i];
  const rms = Math.sqrt(sumOfSquares / SIZE);
  if (rms < 0.015) return null; // Silence or background noise

  const minOffset = Math.floor(sampleRate / 400);
  const maxOffset = Math.floor(sampleRate / 80);
  let bestOffset = -1;
  let bestCorrelation = 0;

  for (let offset = minOffset; offset <= maxOffset; offset++) {
    let correlation = 0;
    for (let i = 0; i < SIZE - offset; i++) {
      correlation += buffer[i] * buffer[i + offset];
    }
    correlation = correlation / (SIZE - offset);
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
    }
  }

  if (bestCorrelation > 0.01 && bestOffset > 0) {
    return Math.round(sampleRate / bestOffset);
  }
  return null;
}

export function drawPitchCanvas(canvas, targetContour = [], userContour = []) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Background grid
  ctx.strokeStyle = '#e4e7eb';
  ctx.lineWidth = 1;
  for (let y = 30; y < h; y += 35) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Draw target curve (dashed line)
  if (targetContour && targetContour.length) {
    ctx.strokeStyle = '#306e99';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    const step = w / (targetContour.length - 1 || 1);
    targetContour.forEach((hz, i) => {
      // Map Hz (80 - 220) to y (h - 20 to 20)
      const y = h - ((hz - 80) / 140) * (h - 40) - 20;
      if (i === 0) ctx.moveTo(0, y);
      else ctx.lineTo(i * step, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Draw user contour (solid green/accent line)
  if (userContour && userContour.length > 1) {
    ctx.strokeStyle = '#2b7a4b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    const step = w / Math.max(targetContour.length || 10, userContour.length);
    userContour.forEach((hz, i) => {
      if (hz === null) return;
      const y = h - ((hz - 80) / 140) * (h - 40) - 20;
      if (i === 0) ctx.moveTo(i * step, y);
      else ctx.lineTo(i * step, y);
    });
    ctx.stroke();
  }
}
