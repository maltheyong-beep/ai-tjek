// Kombinerer afhængige signaler forsigtigt; intervallet er et følsomhedsspænd, ikke en målt sandsynlighed.
import { clamp } from './utils.js';
import { getAnalysisWeights } from './analysis-weights.js';

export function combineSignals(rawSignals) {
  const w = getAnalysisWeights();
  const signals = rawSignals.map((s) => {
    const rule = w.signals[s.id],
      factor = rule[s.points < 0 ? 'negative' : 'positive'];
    return { ...s, rawPoints: s.points, points: Math.round(s.points * factor), factor, family: rule.family };
  });
  for (const [family, cap] of Object.entries(w.familyCaps)) {
    const members = signals.filter((s) => s.family === family && s.points > 0);
    const total = members.reduce((n, s) => n + s.points, 0);
    if (total <= cap) continue;
    let remaining = cap;
    members.forEach((s, i) => {
      s.points = i === members.length - 1 ? remaining : Math.floor((s.points / total) * cap);
      remaining -= s.points;
      s.capped = true;
    });
  }
  const families = Object.create(null);
  signals.forEach((s) => {
    families[s.family] = (families[s.family] || 0) + s.points;
  });
  const positiveFamilies = Object.values(families).filter((n) => n >= w.highScoreGate.minimumFamilyPoints).length;
  const rawScore = w.baseline + signals.reduce((n, s) => n + s.points, 0);
  const maximum = positiveFamilies < w.highScoreGate.minimumPositiveFamilies ? w.levels.high - 1 : w.maximumScore;
  return {
    signals,
    rawScore,
    score: clamp(rawScore, 0, maximum),
    positiveFamilies,
    gated: maximum < w.maximumScore && rawScore > maximum,
    weightsVersion: w.version,
  };
}

export function estimateInterval(result, disagreement = 0) {
  const w = getAnalysisWeights();
  if (result.words < w.minimumWords) return { lower: 0, upper: 100, insufficient: true, calibrated: false };
  const u = w.uncertainty;
  let half = u.halfWidth[result.language];
  if (result.sentences.length < u.fewSentencesBelow) half += u.fewSentencesExtra;
  if (result.automatic && !result.detectionConfident) half += u.uncertainLanguageExtra;
  half = Math.min(u.maximumHalfWidth, half + disagreement * u.blockDisagreementFactor);
  const step = u.roundingStep;
  return {
    lower: Math.max(0, Math.floor((result.score - half) / step) * step),
    upper: Math.min(100, Math.ceil((result.score + half) / step) * step),
    insufficient: false,
    calibrated: false,
  };
}
