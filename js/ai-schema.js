// Understøtter tekstbehandling og visning uden eksterne biblioteker i browseren.
import { LANGUAGES, NEGATIONS } from './i18n.js';
import { validateText, getTokens, detectLanguage } from './utils.js';
import { findProtectedRanges } from './humanize-local.js';

export const AI_TYPES = ['filler', 'transition', 'split', 'wording', 'typography'];
export const RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    text: { type: 'string' },
    changes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          før: { type: 'string' },
          efter: { type: 'string' },
          type: { type: 'string', enum: AI_TYPES },
          forklaring: { type: 'string' },
        },
        required: ['før', 'efter', 'type', 'forklaring'],
      },
    },
  },
  required: ['text', 'changes'],
};
const invalid = () => {
  throw new Error('INVALID_OUTPUT');
};
function numberSignature(text) {
  return (text.match(/\p{N}+(?:[.,:/-]\p{N}+)*/gu) || []).join('|');
}
function negations(text, language) {
  return getTokens(text).filter((t) => NEGATIONS[language].includes(t.word)).length;
}

// Samme kontrol bruges på server og klient, så et fejlformet svar ikke bliver vist som et godkendt forslag.
export function validateAiResponse(data, input) {
  if (
    !data ||
    typeof data.text !== 'string' ||
    !Array.isArray(data.changes) ||
    data.changes.length > 400 ||
    data.text.length > 200000
  )
    invalid();
  try {
    validateText(data.text);
  } catch {
    invalid();
  }
  if (!LANGUAGES[input.language]) invalid();
  const protectedRanges = findProtectedRanges(input.text, input.language, input.protectedTerms);
  let position = 0;
  for (const range of protectedRanges) {
    const fragment = input.text.slice(range.start, range.end);
    const at = data.text.indexOf(fragment, position);
    if (at < 0) invalid();
    position = at + fragment.length;
  }
  if (
    numberSignature(input.text) !== numberSignature(data.text) ||
    negations(input.text, input.language) !== negations(data.text, input.language)
  )
    invalid();
  const detected = detectLanguage(data.text);
  if (detected.confident && detected.language !== input.language) invalid();
  for (const change of data.changes) {
    if (
      !change ||
      typeof change['før'] !== 'string' ||
      typeof change['efter'] !== 'string' ||
      typeof change.forklaring !== 'string' ||
      change.forklaring.length > 1000 ||
      !AI_TYPES.includes(change.type)
    )
      invalid();
    if (
      (change['før'] && !input.text.includes(change['før'])) ||
      (change['efter'] && !data.text.includes(change['efter']))
    )
      invalid();
  }
  if (data.text !== input.text && !data.changes.length) invalid();
  return { text: data.text, changes: data.changes };
}
