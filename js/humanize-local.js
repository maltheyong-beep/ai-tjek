import { LANGUAGES, HUMAN_RULES, HUMAN_REASONS, DEFAULT_PROTECTED, HIDDEN_NAMES, ODD_SPACE } from './i18n.js';
import { validateText, resolveLanguage, splitSentences, getTokens, findPhrases, intersectsAny, capitalize, escapeRegExp, isMeaningfulJoiner, countWords, MAX_WORDS } from './utils.js';

const LEVELS = { light: 1, medium: 2, strong: 3 };
const CHANGE_TYPES = new Set(['filler', 'transition', 'split', 'wording', 'typography']);

function patternRanges(text, pattern) {
  return [...text.matchAll(pattern)].map(m => ({ start: m.index, end: m.index + m[0].length }));
}
function termRanges(text, terms) {
  return terms.flatMap(term => {
    const pattern = new RegExp('(?<![\\p{L}\\p{N}])' + escapeRegExp(term) + '(?![\\p{L}\\p{N}])', 'giu');
    return patternRanges(text, pattern);
  });
}

export function findProtectedRanges(text, language, extraTerms = '') {
  const ranges = [
    ...patternRanges(text, /"[^"\n]*"|“[^”\n]*”|„[^“\n]*“|«[^»\n]*»|»[^«\n]*«|‘[^’\n]*’/gu),
    ...patternRanges(text, /(?<!\p{L})'[^'\n]+'(?!\p{L})/gu),
    ...patternRanges(text, /```[\s\S]*?```|`[^`\n]+`/gu),
    ...patternRanges(text, /https?:\/\/[^\s]+|[\w.+-]+@[\w.-]+\.[\p{L}]{2,}/gu),
    ...patternRanges(text, /\p{N}+(?:[.,:/-]\p{N}+)*(?:[ \u00a0]?(?:%|kr\.?|DKK|EUR|€|\$|£))?/gu)
  ];
  const terms = [...DEFAULT_PROTECTED[language], ...String(extraTerms).split(/[,\n]/u).map(t => t.trim()).filter(Boolean)];
  ranges.push(...termRanges(text, terms));
  const sentenceStarts = new Set(splitSentences(text, language).map(s => s.start + (s.words[0]?.start || 0)));
  const allowedFirstWords = new Set(HUMAN_RULES[language].map(rule => getTokens(rule[1])[0].word));
  for (const token of getTokens(text)) {
    const startsUpper = /^\p{Lu}/u.test(token.text), innerUpper = /\p{Lu}/u.test(token.text.slice(1));
    if (innerUpper || startsUpper && (!sentenceStarts.has(token.start) || !allowedFirstWords.has(token.word))) ranges.push({ start: token.start, end: token.end });
  }
  const merged = [];
  for (const range of ranges.sort((a, b) => a.start - b.start || a.end - b.end)) {
    const last = merged.at(-1);
    if (last && range.start <= last.end) last.end = Math.max(last.end, range.end);
    else merged.push({ ...range });
  }
  return merged;
}

function phraseCandidate(original, sentence, match, rule, protectedRanges, language) {
  const [ruleId, , replacement, type, , startOnly] = rule;
  const prefix = sentence.text.slice(0, match.start);
  if (startOnly && !/^[\s\-*•\d.)]*$/u.test(prefix)) return null;
  const start = sentence.start + match.start; let end = sentence.start + match.end;
  let after = /^\p{Lu}/u.test(match.text) ? capitalize(replacement) : replacement;
  if (!replacement) {
    while (end < sentence.end && /[ \t]/u.test(original[end])) end++;
    const next = getTokens(original.slice(end, sentence.end))[0];
    if (!next) return null;
    // Et efterfølgende navn eller fagord må ikke ændres blot for at få et stort begyndelsesbogstav.
    if (next && next.start === 0 && /^\p{Ll}/u.test(next.text) && !intersectsAny({ start: end, end: end + next.end }, protectedRanges)) {
      end += next.end; after = capitalize(next.text);
    }
  }
  const candidate = { start, end, before: original.slice(start, end), after, type, ruleId, reason: HUMAN_REASONS[language][type] };
  if (candidate.before === after) return null;
  return candidate;
}

function phraseCandidates(text, language, level, protectedRanges) {
  const candidates = []; let skipped = 0;
  for (const sentence of splitSentences(text, language)) {
    for (const rule of HUMAN_RULES[language].filter(rule => rule[4] <= level)) {
      for (const match of findPhrases(sentence.text, [rule[1]])) {
        const candidate = phraseCandidate(text, sentence, match, rule, protectedRanges, language);
        if (!candidate) continue;
        if (intersectsAny(candidate, protectedRanges)) skipped++;
        else candidates.push(candidate);
      }
    }
  }
  return { candidates, skipped };
}

function splitCandidates(text, language, level, protectedRanges) {
  if (level < 2) return [];
  const config = LANGUAGES[language], threshold = level === 3 ? 28 : 36;
  const candidates = [];
  const pattern = new RegExp(',([ \\t]+)(' + config.conjunction + ')([ \\t]+)(?=(' + config.splitPronouns + ')(?![\\p{L}\\p{N}]))', 'giu');
  for (const sentence of splitSentences(text, language).filter(s => s.words.length > threshold)) {
    for (const match of sentence.text.matchAll(pattern)) {
      if (getTokens(sentence.text.slice(0, match.index)).length < 8 || getTokens(sentence.text.slice(match.index + match[0].length)).length < 7) continue;
      const start = sentence.start + match.index, end = start + match[0].length;
      if (!intersectsAny({ start, end }, protectedRanges)) candidates.push({ start, end, before: text.slice(start, end), after: '. ' + capitalize(match[2]) + match[3], type: 'split', ruleId: 'clause-split', reason: HUMAN_REASONS[language].split });
    }
  }
  return candidates;
}

function chooseNonOverlapping(candidates) {
  const chosen = [];
  for (const candidate of candidates.sort((a, b) => a.start - b.start || b.end - a.end)) {
    if (!intersectsAny(candidate, chosen)) chosen.push(candidate);
  }
  return chosen.map(change => ({ ...change, id: `${change.type}-${change.start}-${change.end}`, enabled: true }));
}

export function getFinalText(job) {
  if (!job) return '';
  let cursor = 0, output = '';
  for (const change of job.changes) {
    output += job.original.slice(cursor, change.start) + (change.enabled ? change.after : change.before);
    cursor = change.end;
  }
  return output + job.original.slice(cursor);
}

export function humanizeText(original, { language = 'auto', intensity = 'medium', protectedTerms = '' } = {}) {
  original = String(original); validateText(original); language = resolveLanguage(original, language);
  const protectedRanges = findProtectedRanges(original, language, protectedTerms);
  const level = LEVELS[intensity] || 2;
  const phrases = phraseCandidates(original, language, level, protectedRanges);
  const changes = chooseNonOverlapping([...phrases.candidates, ...splitCandidates(original, language, level, protectedRanges)]);
  return { version: 2, original, language, intensity, protectedTerms, protectedRanges, skipped: phrases.skipped, changes };
}

function typographicReplacement(char, text, index) {
  if (HIDDEN_NAMES.has(char)) return isMeaningfulJoiner(char, text, index) ? null : '';
  if (ODD_SPACE.test(char)) return ' ';
  if (/[—―]/u.test(char)) return `${/\s/u.test(text[index - 1] || '') ? '' : ' '}-${/\s/u.test(text[index + 1] || '') ? '' : ' '}`;
  if (/[‐‑‒–]/u.test(char)) return '-';
  return null;
}

export function addTypographyChanges(job) {
  const core = job.changes.filter(c => job.provider === 'claude' || c.type !== 'typography').map(c => {
    if (job.provider !== 'claude' || !c.enabled || !c.after.trim()) return c;
    const cleaned = cleanTextSafely(c.after, { language: job.language, protectedTerms: job.protectedTerms });
    return { ...c, after: getFinalText(cleaned) };
  }); const candidates = []; let skippedTypography = 0;
  for (let i = 0; i < job.original.length;) {
    const char = String.fromCodePoint(job.original.codePointAt(i)); const after = typographicReplacement(char, job.original, i);
    const range = { start: i, end: i + char.length };
    if (after !== null && after !== char) {
      if (intersectsAny(range, job.protectedRanges)) skippedTypography++;
      else if (!intersectsAny(range, core)) candidates.push({ ...range, before: char, after, type: 'typography', ruleId: 'normalize', reason: HUMAN_REASONS[job.language].typography });
    }
    i += char.length;
  }
  return { ...job, skippedTypography, changes: [...core, ...chooseNonOverlapping(candidates)].sort((a, b) => a.start - b.start) };
}

export function cleanTextSafely(original, options = {}) {
  validateText(original); const language = resolveLanguage(original, options.language);
  const emptyJob = { version: 2, original, language, intensity: 'light', protectedTerms: options.protectedTerms || '', protectedRanges: findProtectedRanges(original, language, options.protectedTerms), skipped: 0, changes: [] };
  return addTypographyChanges(emptyJob);
}
export function toggleChange(job, id, enabled) {
  const updated = { ...job, changes: job.changes.map(change => change.id === id ? { ...change, enabled: enabled ?? !change.enabled } : change) };
  validateText(getFinalText(updated)); return updated;
}
export function toggleAllChanges(job, enabled) { return { ...job, changes: job.changes.map(change => ({ ...change, enabled })) }; }

// Gemte ændringer valideres, før de bruges som kildepositioner efter en opdatering.
export function restoreJob(value, text) {
  if (!value || value.version !== 2 || value.original !== text || !LANGUAGES[value.language] || !Array.isArray(value.changes) || value.changes.length > 5000) return null;
  let cursor = 0;
  for (const change of value.changes) {
    if (!Number.isInteger(change.start) || !Number.isInteger(change.end) || change.start < cursor || change.end < change.start || change.end === change.start && !change.after || change.end > text.length || change.before !== text.slice(change.start, change.end) || typeof change.after !== 'string' || change.after.length > 200000 || !CHANGE_TYPES.has(change.type) || typeof change.enabled !== 'boolean' || typeof change.reason !== 'string' || !/^(filler|transition|split|wording|typography)-\d+-\d+$/.test(change.id)) return null;
    cursor = change.end;
  }
  if (getFinalText(value).length > 200000 || countWords(getFinalText(value)) > MAX_WORDS) return null;
  return { ...value, protectedRanges: findProtectedRanges(text, value.language, value.protectedTerms) };
}
