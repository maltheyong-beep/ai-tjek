import { AI_REASONS } from './i18n.js';
import { findProtectedRanges, getFinalText } from './humanize-local.js';

function tokens(text) {
  return [...text.matchAll(/[\p{L}\p{M}\p{N}]+(?:['’\-][\p{L}\p{M}\p{N}]+)*|[^\s]/gu)].map(m => ({ value: m[0], start: m.index, end: m.index + m[0].length }));
}
// En grænse for søgningen beskytter telefonens hukommelse ved helt forskellige lange tekster.
function myers(a, b, offsetA, offsetB) {
  const limit = Math.min(a.length + b.length, 384), origin = limit + 1;
  let frontier = new Int32Array(limit * 2 + 3); frontier.fill(-1); frontier[origin + 1] = 0;
  const trace = [];
  for (let distance = 0; distance <= limit; distance++) {
    trace.push(frontier.slice());
    for (let k = -distance; k <= distance; k += 2) {
      const slot = origin + k;
      let x = k === -distance || k !== distance && frontier[slot - 1] < frontier[slot + 1] ? frontier[slot + 1] : frontier[slot - 1] + 1;
      let y = x - k;
      while (x < a.length && y < b.length && a[x].value === b[y].value) { x++; y++; }
      frontier[slot] = x;
      if (x < a.length || y < b.length) continue;
      const pairs = []; let px = a.length, py = b.length;
      for (let d = distance; d >= 0; d--) {
        const previous = trace[d], diagonal = px - py;
        const previousK = diagonal === -d || diagonal !== d && previous[origin + diagonal - 1] < previous[origin + diagonal + 1] ? diagonal + 1 : diagonal - 1;
        const previousX = previous[origin + previousK], previousY = previousX - previousK;
        while (px > previousX && py > previousY) { pairs.push([offsetA + --px, offsetB + --py]); }
        px = previousX; py = previousY;
      }
      return pairs.reverse();
    }
  }
  return null;
}
function anchors(a, b) {
  const map = list => {
    const found = new Map();
    for (let i = 0; i < list.length - 2; i++) {
      const key = JSON.stringify(list.slice(i, i + 3).map(t => t.value));
      found.set(key, found.has(key) ? -1 : i);
    }
    return found;
  };
  const aa = map(a), bb = map(b), candidates = [];
  for (const [key, at] of aa) if (at >= 0 && bb.get(key) >= 0) candidates.push([at, bb.get(key)]);
  candidates.sort((x, y) => x[0] - y[0]);
  const tails = [], links = [];
  candidates.forEach((pair, index) => {
    let low = 0, high = tails.length;
    while (low < high) { const mid = (low + high) >> 1; if (candidates[tails[mid]][1] < pair[1]) low = mid + 1; else high = mid; }
    links[index] = low ? tails[low - 1] : -1; tails[low] = index;
  });
  const result = []; let at = tails.at(-1);
  while (at !== undefined && at >= 0) { result.push(candidates[at]); at = links[at]; }
  return result.reverse().filter((pair, i, all) => !i || pair[0] >= all[i - 1][0] + 3 && pair[1] >= all[i - 1][1] + 3);
}
function align(a, b, offsetA = 0, offsetB = 0, depth = 0) {
  let prefix = 0, suffix = 0;
  while (prefix < Math.min(a.length, b.length) && a[prefix].value === b[prefix].value) prefix++;
  while (suffix < Math.min(a.length, b.length) - prefix && a[a.length - suffix - 1].value === b[b.length - suffix - 1].value) suffix++;
  const beginning = Array.from({ length: prefix }, (_, i) => [offsetA + i, offsetB + i]);
  const ending = Array.from({ length: suffix }, (_, i) => [offsetA + a.length - suffix + i, offsetB + b.length - suffix + i]);
  const left = a.slice(prefix, a.length - suffix), right = b.slice(prefix, b.length - suffix);
  if (!left.length || !right.length) return { pairs: [...beginning, ...ending], coarse: false };
  const direct = myers(left, right, offsetA + prefix, offsetB + prefix);
  if (direct) return { pairs: [...beginning, ...direct, ...ending], coarse: false };
  const points = depth < 6 ? anchors(left, right) : [];
  if (!points.length) return { pairs: [...beginning, ...ending], coarse: true };
  let cursorA = 0, cursorB = 0, coarse = false; const middle = [];
  for (const [x, y] of [...points, [left.length, right.length]]) {
    const part = align(left.slice(cursorA, x), right.slice(cursorB, y), offsetA + prefix + cursorA, offsetB + prefix + cursorB, depth + 1);
    middle.push(...part.pairs); coarse ||= part.coarse;
    if (x < left.length) for (let i = 0; i < 3; i++) middle.push([offsetA + prefix + x + i, offsetB + prefix + y + i]);
    cursorA = x + 3; cursorB = y + 3;
  }
  return { pairs: [...beginning, ...middle, ...ending], coarse };
}
function edit(original, replacement, start, end, outStart, outEnd) {
  let before = original.slice(start, end), after = replacement.slice(outStart, outEnd);
  const a = Array.from(before), b = Array.from(after); let prefix = 0, suffix = 0;
  while (prefix < Math.min(a.length, b.length) && a[prefix] === b[prefix]) prefix++;
  while (suffix < Math.min(a.length, b.length) - prefix && a[a.length - 1 - suffix] === b[b.length - 1 - suffix]) suffix++;
  start += a.slice(0, prefix).join('').length; end -= a.slice(a.length - suffix).join('').length;
  before = original.slice(start, end); after = b.slice(prefix, b.length - suffix).join('');
  return before === after ? null : { start, end, before, after };
}
function metadata(change, explanations, language) {
  const match = explanations.find(item => change.before.trim() && item['før'].includes(change.before.trim()) || change.after.trim() && item['efter'].includes(change.after.trim()));
  return { ...change, type: match?.type || 'wording', reason: match?.forklaring || AI_REASONS[language], enabled: true };
}
export function createDiffJob(original, replacement, { language = 'da', intensity = 'medium', tone = 'neutral', protectedTerms = '', explanations = [] } = {}) {
  const a = tokens(original), b = tokens(replacement), alignment = align(a, b); const changes = [];
  let cursorA = 0, cursorB = 0;
  for (const [x, y] of [...alignment.pairs, [a.length, b.length]]) {
    const nextA = a[x]?.start ?? original.length, nextB = b[y]?.start ?? replacement.length;
    const change = edit(original, replacement, cursorA, nextA, cursorB, nextB);
    if (change) changes.push(metadata(change, explanations, language));
    cursorA = a[x]?.end ?? original.length; cursorB = b[y]?.end ?? replacement.length;
  }
  const job = { version: 2, original, language, intensity, tone, protectedTerms, protectedRanges: findProtectedRanges(original, language, protectedTerms), changes: [], skipped: 0, provider: 'claude', coarse: alignment.coarse };
  job.changes = changes.map(c => ({ ...c, id: `${c.type}-${c.start}-${c.end}` }));
  // Vis altid den præcise modeltekst, også hvis en usædvanlig opdeling kræver én samlet ændring.
  if (getFinalText(job) !== replacement) {
    job.coarse = true; job.changes = [{ start: 0, end: original.length, before: original, after: replacement, type: 'wording', reason: AI_REASONS[language], enabled: true, id: `wording-0-${original.length}` }];
  }
  return job;
}
