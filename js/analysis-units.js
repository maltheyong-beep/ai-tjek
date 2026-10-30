// Delmålinger beholder kildepositioner og samme sprog; de genstarter ikke sproggættet for hver sætning.
import { estimateInterval } from './analysis-scoring.js';
import { getTokens, projectText } from './utils.js';

export function analyzeUnits(original, document, analyze) {
  const projection = projectText(original);
  const measure = (start, end, kind, index) => {
    const text = original.slice(start, end);
    const result = analyze(text, document.language, { includeUnits: false });
    return {
      kind,
      language: document.language,
      index: index + 1,
      start,
      end,
      text,
      words: result.words,
      score: result.score,
      interval: estimateInterval({
        ...result,
        automatic: document.automatic,
        detectionConfident: document.detectionConfident,
      }),
      short: result.short,
      signals: result.signals,
      burstiness: result.burstiness,
    };
  };
  const sentenceScores = document.sentences.map((s, i) => {
    const range = projection.range(s.start, s.end);
    return measure(range.start, range.end, 'sentence', i);
  });
  const paragraphs = [];
  for (const match of original.matchAll(/[^\n]+(?:\n(?![ \t]*\n)[^\n]+)*/gu)) {
    if (getTokens(projectText(match[0]).text).length)
      paragraphs.push({ start: match.index, end: match.index + match[0].length });
  }
  const paragraphScores = paragraphs.map((p, i) => measure(p.start, p.end, 'paragraph', i));
  return { sentenceScores, paragraphScores };
}
