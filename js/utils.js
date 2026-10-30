// Understøtter tekstbehandling og visning uden eksterne biblioteker i browseren.
import { LANGUAGES, HIDDEN_NAMES, ODD_SPACE, COPY } from './i18n.js';

import { MAX_WORDS, BASE_SCORE } from './constants.js';
export { MAX_WORDS, BASE_SCORE };
export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
export const mean = (values) => (values.length ? values.reduce((sum, n) => sum + n, 0) / values.length : 0);
export const unique = (values) => [...new Set(values)];
export const number = (n) => new Intl.NumberFormat('da-DK', { maximumFractionDigits: 1 }).format(n);
export const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const normalizeWord = (text) => text.normalize('NFC').toLocaleLowerCase().replace(/’/g, "'");
export const capitalize = (text) =>
  text.replace(/^(\s*)(\p{L})/u, (_, space, letter) => space + letter.toLocaleUpperCase());

export function projectText(original) {
  let text = '';
  const offsets = [];
  for (let i = 0; i < original.length;) {
    const char = String.fromCodePoint(original.codePointAt(i));
    if (!HIDDEN_NAMES.has(char)) {
      const replacement = ODD_SPACE.test(char) ? ' ' : char;
      text += replacement;
      for (let j = 0; j < replacement.length; j++) offsets.push(i + j);
    }
    i += char.length;
  }
  return {
    text,
    range: (start, end) => ({
      start: offsets[start] ?? original.length,
      end: end > start ? (offsets[end - 1] ?? original.length - 1) + 1 : (offsets[start] ?? original.length),
    }),
  };
}

export function getTokens(text) {
  return [...text.matchAll(/[\p{L}\p{M}\p{N}]+(?:['’\-‑][\p{L}\p{M}\p{N}]+)*/gu)].map((m) => ({
    text: m[0],
    word: normalizeWord(m[0]),
    start: m.index,
    end: m.index + m[0].length,
  }));
}
export function countWords(text) {
  return getTokens(projectText(String(text)).text).length;
}
export function validateText(text) {
  const words = countWords(text);
  if (!words) throw new Error(COPY.emptyError);
  if (words > MAX_WORDS) throw new Error(COPY.limitError(words, words - MAX_WORDS));
  return words;
}

export function detectLanguage(text) {
  const tokens = getTokens(projectText(text).text);
  const scores = { da: 0, de: 0, en: 0 };
  for (const token of tokens)
    for (const [id, config] of Object.entries(LANGUAGES))
      if (config.stopSet.has(token.word)) scores[id] += token.word.length > 2 ? 1.4 : 0.65;
  scores.da += (text.match(/[æøå]/giu) || []).length * 0.8;
  scores.de += (text.match(/[äöüß]/giu) || []).length * 0.8;
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return {
    language: ranked[0][1] ? ranked[0][0] : 'da',
    confident:
      tokens.length >= 25 && ranked[0][1] >= 5 && ranked[0][1] - ranked[1][1] > Math.max(2, ranked[0][1] * 0.18),
  };
}
export function resolveLanguage(text, requested) {
  return LANGUAGES[requested] ? requested : detectLanguage(text).language;
}

// Forkortelser beskyttes før opdeling, så reglerne ikke omskriver halve sætninger.
export function splitSentences(text, language) {
  const blocked = new Set();
  for (const abbreviation of LANGUAGES[language].abbreviations) {
    const re = new RegExp('(?<![\\p{L}\\p{N}])' + escapeRegExp(abbreviation), 'giu');
    for (const m of text.matchAll(re))
      for (let j = 0; j < m[0].length; j++) if (m[0][j] === '.') blocked.add(m.index + j);
  }
  for (const m of text.matchAll(/\b\p{Lu}\.(?=\s*\p{Lu}[\p{L}-])/gu)) blocked.add(m.index + m[0].length - 1);
  const sentences = [];
  let start = 0;
  function append(end) {
    const raw = text.slice(start, end);
    const leading = raw.length - raw.trimStart().length;
    const body = raw.trim();
    if (body && getTokens(body).length)
      sentences.push({
        text: body,
        start: start + leading,
        end: start + leading + body.length,
        words: getTokens(body),
      });
    start = end;
  }
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') {
      append(i);
      start = i + 1;
      continue;
    }
    if (!/[.!?…]/u.test(text[i]) || blocked.has(i)) continue;
    if (text[i] === '.' && /[\p{L}\p{N}]/u.test(text[i - 1] || '') && /[\p{L}\p{N}]/u.test(text[i + 1] || '')) continue;
    while (i + 1 < text.length && /[.!?…"'”’»)]/u.test(text[i + 1])) i++;
    append(i + 1);
  }
  append(text.length);
  return sentences;
}

export function findPhrases(text, phrases) {
  return phrases
    .flatMap((phrase) => {
      const re = new RegExp(
        '(?<![\\p{L}\\p{N}])' + escapeRegExp(phrase).replace(/ /g, '[ \\t]+') + '(?![\\p{L}\\p{N}])',
        'giu',
      );
      return [...text.matchAll(re)].map((m) => ({ phrase, text: m[0], start: m.index, end: m.index + m[0].length }));
    })
    .sort((a, b) => a.start - b.start || b.end - a.end);
}
export const overlaps = (a, b) => a.start < b.end && a.end > b.start;
export const intersectsAny = (range, ranges) => ranges.some((other) => overlaps(range, other));

export function isMeaningfulJoiner(char, text, index) {
  if (char !== '\u200d' && char !== '\u200c') return false;
  const before = Array.from(text.slice(Math.max(0, index - 6), index)).pop() || '';
  const after = Array.from(text.slice(index + 1, index + 7))[0] || '';
  const emoji = /[\p{Extended_Pictographic}\p{Emoji_Modifier}\uFE0F]/u;
  const shaping = /[\p{Script=Arabic}\p{Script=Devanagari}\p{Script=Bengali}\p{Script=Tamil}]/u;
  return (emoji.test(before) && emoji.test(after)) || shaping.test(before + after);
}

export function typography(text) {
  const data = { hidden: [], spaces: [], curly: [], straight: [], emDashes: [] };
  for (let i = 0; i < text.length;) {
    const char = String.fromCodePoint(text.codePointAt(i));
    const hit = { start: i, end: i + char.length, char };
    if (HIDDEN_NAMES.has(char))
      data.hidden.push({
        ...hit,
        name: HIDDEN_NAMES.get(char),
        code: 'U+' + char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'),
      });
    if (ODD_SPACE.test(char)) data.spaces.push(hit);
    if (/[“”„‟‘’‚‛«»]/u.test(char)) data.curly.push(hit);
    if (/["']/u.test(char)) data.straight.push(hit);
    if (char === '—') data.emDashes.push(hit);
    i += char.length;
  }
  return data;
}
