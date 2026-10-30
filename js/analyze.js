// Understøtter tekstbehandling og visning uden eksterne biblioteker i browseren.
import { LANGUAGES, COPY, SIGNAL_COPY } from './i18n.js';
import {
  BASE_SCORE,
  clamp,
  mean,
  unique,
  projectText,
  getTokens,
  validateText,
  detectLanguage,
  resolveLanguage,
  splitSentences,
  findPhrases,
  typography,
} from './utils.js';

function addSignal(context, id, points, data) {
  context.signals.push({ id, points: Math.round(points), ...SIGNAL_COPY[id]({ ...data, points }) });
}
function annotate(context, range, reason, category) {
  if (context.marks.length < 1600 && range.end > range.start)
    context.marks.push({ ...context.projection.range(range.start, range.end), reason, category });
}
function measureRhythm(c) {
  const value = c.burstiness;
  const points =
    c.sentences.length < 6
      ? 0
      : value < 0.2
        ? 18
        : value < 0.35
          ? 12
          : value < 0.45
            ? 5
            : value > 0.75
              ? -10
              : value > 0.55
                ? -5
                : 0;
  addSignal(c, 'rhythm', points, {
    count: c.sentences.length,
    min: Math.min(...c.lengths),
    max: Math.max(...c.lengths),
    value,
  });
  if (points > 0)
    c.sentences
      .filter((s) => Math.abs(s.words.length - c.average) <= Math.max(2, c.average * 0.2))
      .slice(0, 80)
      .forEach((s) => annotate(c, s, COPY.rhythmMark, 'rhythm'));
}
function measureStarts(c) {
  const groups = new Map();
  for (const sentence of c.sentences.filter((s) => s.words.length >= 5)) {
    const phrase = sentence.words
      .slice(0, 2)
      .map((t) => t.word)
      .join(' ');
    if (!groups.has(phrase)) groups.set(phrase, []);
    groups.get(phrase).push(sentence);
  }
  c.repeatedStarts = [...groups].map(([phrase, matches]) => ({ phrase, matches })).filter((g) => g.matches.length >= 3);
  const repetitions = c.repeatedStarts.reduce((n, group) => n + group.matches.length - 1, 0);
  addSignal(c, 'starts', Math.min(12, repetitions * 4), { groups: c.repeatedStarts });
  c.repeatedStarts.forEach((g) =>
    g.matches.forEach((s) =>
      annotate(
        c,
        { start: s.start, end: s.start + s.words[1].end },
        COPY.startMark(g.phrase, g.matches.length),
        'starts',
      ),
    ),
  );
}
function measurePhrases(c) {
  for (const id of ['transitions', 'cliches']) {
    const hits = findPhrases(c.text, c.config[id]);
    c[id] = hits;
    const points =
      id === 'cliches'
        ? Math.min(18, hits.length * 4)
        : hits.length >= 3
          ? Math.round(clamp(((hits.length / c.words) * 100 - 0.8) * 5, 0, 14))
          : 0;
    addSignal(c, id, points, {
      hits,
      sample: unique(hits.map((h) => `“${h.phrase}”`))
        .slice(0, 3)
        .join(', '),
    });
    hits.forEach((hit) => annotate(c, hit, COPY.phraseMark(hit.phrase), 'phrases'));
  }
}
function measureVoice(c) {
  c.personalCount = c.tokens.filter((t) => c.config.personalSet.has(t.word)).length;
  const examples = findPhrases(c.text, c.config.examples).length;
  const numbers = [...c.text.matchAll(/\b\d+(?:[.,]\d+)?\b/gu)].length;
  const quotes = (c.text.match(/[“„«][^”»\n]{5,}[”»]|"[^"\n]{5,}"/gu) || []).length;
  c.concreteCount = examples + numbers + quotes;
  const points =
    c.words < 80
      ? 0
      : c.personalCount >= 2 && c.concreteCount >= 1
        ? -14
        : c.concreteCount >= 2
          ? -9
          : c.personalCount >= 2
            ? -6
            : !c.personalCount && !c.concreteCount
              ? 6
              : 0;
  addSignal(c, 'voice', points, { personal: c.personalCount, concrete: c.concreteCount });
  if (points > 0)
    c.sentences
      .filter((s) => s.words.length >= 14)
      .slice(0, 3)
      .forEach((s) => annotate(c, s, COPY.voiceMark, 'voice'));
}
function measurePolish(c) {
  const neat = c.sentences.filter((s) => /^[\s"“„«(]*\p{Lu}/u.test(s.text) && /[.!?…]["”’»)]*$/u.test(s.text)).length;
  const repetition = /(?<!\p{L})([\p{L}]{2,})\s+\1(?!\p{L})/iu.test(c.text);
  const noisy = /[!?]{2,}|[,.!?][,.!?]{2,}/u.test(c.text);
  const points =
    c.words >= 100 && c.sentences.length >= 6 && neat === c.sentences.length && !repetition && !noisy ? 3 : 0;
  addSignal(c, 'polish', points, { neat, count: c.sentences.length });
}
function measureStyle(c) {
  const colons = [...c.text.matchAll(/:(?!\/\/)/gu)];
  const bullets = [...c.text.matchAll(/^[ \t]*(?:[-*•‣▪]|\d+[.)])\s+[^\n]+/gmu)];
  const pattern = new RegExp(
    '[\\p{L}\\p{N}][^,.;:!?\\n]{0,45},\\s+[^,.;:!?\\n]{1,45}\\s+' + c.config.conjunction + '\\s+[^,.;:!?\\n]{1,45}',
    'giu',
  );
  const triads = [...c.text.matchAll(pattern)].filter((m) => getTokens(m[0]).length <= 18);
  const dashes = c.typography.emDashes.length;
  let points = 0;
  if (c.words >= 80) {
    if (dashes >= 3 && (dashes / c.words) * 100 >= 1) points += Math.min(4, dashes);
    if (colons.length >= 3 && (colons.length / c.words) * 100 >= 1) points += 2;
    if (bullets.length >= 4) points += 2;
    if (triads.length >= 3) points += 3;
  }
  addSignal(c, 'style', Math.min(8, points), {
    dashes,
    colons: colons.length,
    bullets: bullets.length,
    triads: triads.length,
  });
  if (points) {
    [...colons, ...bullets, ...triads].forEach((m) =>
      annotate(c, { start: m.index, end: m.index + m[0].length }, COPY.styleMark, 'style'),
    );
    c.typography.emDashes.forEach((m) => {
      if (c.marks.length < 1600) c.marks.push({ ...m, reason: COPY.styleMark, category: 'style' });
    });
  }
}
function measureVocabulary(c) {
  const content = c.tokens.filter((t) => !c.config.stopSet.has(t.word) && /\p{L}/u.test(t.word)).map((t) => t.word);
  const windowSize = Math.min(50, content.length),
    ratios = [];
  if (windowSize)
    for (let i = 0; i <= content.length - windowSize; i += 5)
      ratios.push(new Set(content.slice(i, i + windowSize)).size / windowSize);
  c.vocab = { value: mean(ratios), reliable: content.length >= 80, contentCount: content.length, windowSize };
  let points = 0;
  if (c.vocab.reliable)
    points =
      c.vocab.value < c.config.vocabularyThreshold
        ? Math.min(10, Math.round((c.config.vocabularyThreshold - c.vocab.value) * 35) + 3)
        : c.vocab.value > 0.86
          ? -6
          : 0;
  addSignal(c, 'vocabulary', points, { ...c.vocab, language: c.language });
  if (points > 0) {
    const frequencies = new Map();
    content.forEach((word) => frequencies.set(word, (frequencies.get(word) || 0) + 1));
    const repeated = new Set(
      [...frequencies]
        .filter(([, n]) => n >= 5)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word]) => word),
    );
    c.tokens
      .filter((t) => repeated.has(t.word))
      .slice(0, 120)
      .forEach((t) => annotate(c, t, COPY.vocabularyMark(t.text, frequencies.get(t.word)), 'vocabulary'));
  }
}
function measureTypography(c) {
  const t = c.typography;
  addSignal(c, 'unicode', 0, {
    hidden: t.hidden.length,
    spaces: t.spaces.length,
    curly: t.curly.length,
    straight: t.straight.length,
  });
  [...t.hidden.slice(0, 120), ...t.spaces.slice(0, 100)].forEach((h) =>
    c.marks.push({
      ...h,
      category: 'unicode',
      reason: COPY.unicodeMark(h.name || 'U+' + h.char.codePointAt(0).toString(16).toUpperCase()),
    }),
  );
}

export function analyzeText(original, requestedLanguage = 'auto') {
  original = String(original);
  const words = validateText(original);
  const projection = projectText(original);
  const detected = detectLanguage(original),
    language = resolveLanguage(original, requestedLanguage);
  const sentences = splitSentences(projection.text, language);
  const lengths = sentences.map((s) => s.words.length),
    average = mean(lengths);
  const c = {
    original,
    text: projection.text,
    projection,
    words,
    language,
    config: LANGUAGES[language],
    tokens: getTokens(projection.text),
    sentences,
    lengths,
    average,
    signals: [],
    marks: [],
    typography: typography(original),
  };
  c.burstiness = average ? Math.sqrt(mean(lengths.map((n) => (n - average) ** 2))) / average : 0;
  [
    measureRhythm,
    measureStarts,
    measurePhrases,
    measureVoice,
    measurePolish,
    measureStyle,
    measureVocabulary,
    measureTypography,
  ].forEach((measure) => measure(c));
  const rawScore = BASE_SCORE + c.signals.reduce((n, s) => n + s.points, 0),
    score = clamp(Math.round(rawScore), 0, 100);
  const { config, projection: internalProjection, tokens, ...result } = c;
  return {
    ...result,
    automatic: requestedLanguage === 'auto',
    detectionConfident: detected.confident,
    rawScore,
    score,
    level: score < 35 ? 'low' : score < 65 ? 'medium' : 'high',
    short: words < 100 || sentences.length < 6,
  };
}
