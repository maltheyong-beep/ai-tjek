// Én JSON-kilde bruges i browseren og Node; ingen indsat tekst sendes med forespørgslen.
import { COPY } from './i18n.js';

function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
export function validateWeights(data) {
  const finite = (n, max = 100) => Number.isFinite(n) && n >= 0 && n <= max;
  const ids = ['rhythm', 'starts', 'transitions', 'cliches', 'voice', 'polish', 'style', 'vocabulary', 'unicode'];
  if (
    !data ||
    typeof data.version !== 'string' ||
    !finite(data.baseline) ||
    data.minimumWords !== 80 ||
    data.maximumScore !== 100 ||
    data.calibration?.validated !== false
  )
    throw Error(COPY.weightsUnavailable);
  if (!finite(data.levels?.medium) || !finite(data.levels?.high) || data.levels.medium >= data.levels.high)
    throw Error(COPY.weightsUnavailable);
  for (const id of ids) {
    const signal = data.signals?.[id];
    if (!signal || !finite(signal.positive, 1) || !finite(signal.negative, 1) || typeof signal.family !== 'string')
      throw Error(COPY.weightsUnavailable);
  }
  if (
    data.signals.unicode.positive ||
    data.signals.unicode.negative ||
    data.features?.perplexity !== false ||
    data.features?.compoundWordLengthPenalty !== false
  )
    throw Error(COPY.weightsUnavailable);
  const u = data.uncertainty,
    gate = data.highScoreGate;
  if (!u || !gate || !finite(gate.minimumPositiveFamilies, ids.length) || !finite(gate.minimumFamilyPoints))
    throw Error(COPY.weightsUnavailable);
  for (const language of ['da', 'de', 'en'])
    if (!finite(u.halfWidth?.[language]) || u.halfWidth[language] < 10) throw Error(COPY.weightsUnavailable);
  for (const key of [
    'fewSentencesBelow',
    'fewSentencesExtra',
    'uncertainLanguageExtra',
    'blockDisagreementFactor',
    'maximumHalfWidth',
    'roundingStep',
  ])
    if (!finite(u[key])) throw Error(COPY.weightsUnavailable);
  if (u.roundingStep < 1 || u.maximumHalfWidth < Math.max(...Object.values(u.halfWidth)))
    throw Error(COPY.weightsUnavailable);
  if (!data.familyCaps || !Object.values(data.familyCaps).every((n) => finite(n))) throw Error(COPY.weightsUnavailable);
  return freeze(data);
}

let weights = null;
try {
  const url = new URL('../data/vaegte.json', import.meta.url);
  let data;
  if (url.protocol === 'file:' && typeof process !== 'undefined' && process.versions?.node) {
    const { readFile } = await import('node:fs/promises');
    data = JSON.parse(await readFile(url, 'utf8'));
  } else {
    const controller = new AbortController(),
      timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(url, { signal: controller.signal, credentials: 'omit' });
      if (!response.ok) throw Error(COPY.weightsUnavailable);
      data = await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }
  weights = validateWeights(data);
} catch {
  /* En manglende fil må give en tydelig fejl ved analyse, aldrig tavse reservevægte. */
}

export function getAnalysisWeights() {
  if (!weights) throw Error(COPY.weightsUnavailable);
  return weights;
}
