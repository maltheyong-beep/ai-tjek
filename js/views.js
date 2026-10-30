// Understøtter tekstbehandling og visning uden eksterne biblioteker i browseren.
import { UI, COPY, LANGUAGES } from './i18n.js';
import { getAnalysisWeights } from './analysis-weights.js';
import { renderUnitScores } from './analysis-unit-view.js';
import { number } from './utils.js';
import { analyzeText } from './analyze.js';
import { getFinalText } from './humanize-local.js';
import { el, TYPE_LABELS, renderHumanDocument, renderAnalysisDocument } from './annotations.js';

const gaugeFrames = new WeakMap();
const $ = (id) => document.getElementById(id);
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function animateGauge(node, result, instant = false) {
  const score = result.score,
    interval = result.interval;
  cancelAnimationFrame(gaugeFrames.get(node));
  const startValue = Number(node.dataset.currentScore) || 0,
    started = performance.now();
  node.dataset.level = score < 35 ? 'low' : score < 65 ? 'medium' : 'high';
  node.setAttribute('aria-label', COPY.intervalGauge(interval));
  node.classList.add('interval-gauge');
  node.dataset.insufficient = String(interval.insufficient);
  const oldLower = Number(node.dataset.lower) || 0,
    oldUpper = Number(node.dataset.upper) || 0;
  node.dataset.lower = String(interval.lower);
  node.dataset.upper = String(interval.upper);
  function draw(value, progress = 1) {
    node.dataset.currentScore = String(value);
    const text = node.querySelector('.gauge-number');
    if (interval.insufficient) text.replaceChildren(document.createTextNode('—'));
    else {
      const lower = Math.round(oldLower + (interval.lower - oldLower) * progress),
        upper = Math.round(oldUpper + (interval.upper - oldUpper) * progress);
      text.replaceChildren(document.createTextNode(`${lower}–${upper}`), el('span', '', '%'));
    }
    node.querySelector('.progress').style.strokeDashoffset = String(interval.insufficient ? 100 : 100 - value);
  }
  if (instant || interval.insufficient || reducedMotion()) {
    draw(score);
    return;
  }
  function frame(now) {
    const t = Math.min(1, (now - started) / 320),
      eased = 1 - (1 - t) ** 3;
    draw(startValue + (score - startValue) * eased, eased);
    if (t < 1) gaugeFrames.set(node, requestAnimationFrame(frame));
  }
  gaugeFrames.set(node, requestAnimationFrame(frame));
}

function chip(type, count) {
  const node = el('span', 'type-chip', `${TYPE_LABELS[type]}${count === undefined ? '' : ` · ${count}`}`);
  node.dataset.type = type;
  return node;
}
function renderChangeList(job) {
  const rows = job.changes.map((change, index) => {
    const row = el('li', 'change-row');
    row.id = `review-${change.id}`;
    const heading = el('div', 'change-row-heading');
    const undo = el('button', 'quiet-button', change.enabled ? UI.undo : UI.restore);
    undo.type = 'button';
    undo.dataset.toggleChange = change.id;
    undo.setAttribute('aria-label', `${change.enabled ? UI.undo : UI.restore} ${index + 1}`);
    heading.append(chip(change.type), undo);
    const pair = el('div', 'change-pair');
    pair.lang = job.language;
    for (const [label, text] of [
      [UI.before, change.before],
      [UI.after, change.after || UI.removed],
    ]) {
      const p = el('p');
      p.append(el('strong', '', label), document.createTextNode(text));
      pair.append(p);
    }
    const reason = el('p', 'hint', change.reason);
    reason.lang = job.language;
    row.append(heading, pair, reason);
    return row;
  });
  $('change-list').replaceChildren(...rows);
  $('review-count').textContent = String(rows.length);
}

export function renderHuman(job, { animate = false, view = 'modified', instant = false } = {}) {
  const finalText = getFinalText(job),
    active = job.changes.filter((c) => c.enabled);
  const counts = active.reduce((acc, c) => ({ ...acc, [c.type]: (acc[c.type] || 0) + 1 }), {});
  $('human-empty').hidden = true;
  $('human-summary-result').hidden = false;
  $('change-total').textContent = String(active.length);
  $('retained-count').textContent = COPY.kept(active.length, job.changes.length);
  $('type-counts').replaceChildren(...Object.entries(counts).map(([type, count]) => chip(type, count)));
  $('protected-count').textContent = COPY.protected(job.protectedRanges.length);
  $('skipped-note').textContent = COPY.skipped(job.skipped);
  const before = analyzeText(job.original, job.language),
    after = analyzeText(finalText, job.language);
  animateGauge($('before-gauge'), before, instant);
  animateGauge($('after-gauge'), after, instant);
  const overlap =
    before.short ||
    after.short ||
    (before.interval.lower <= after.interval.upper && after.interval.lower <= before.interval.upper);
  $('score-not-lower').hidden = !overlap && after.score < before.score;
  $('score-not-lower').textContent = overlap ? UI.scoreOverlap : UI.scoreNotLower;
  $('coarse-note').hidden = !job.coarse;
  $('provider-pill').textContent = job.provider === 'claude' ? UI.providerAI : UI.providerLocal;
  const fallback = {
    NOT_CONFIGURED: UI.fallbackSetup,
    NETWORK: UI.fallbackNetwork,
    RATE_LIMIT: UI.fallbackRate,
    INVALID_OUTPUT: UI.fallbackInvalid,
    TIMEOUT: UI.fallbackTimeout,
  }[job.fallbackReason];
  $('fallback-note').hidden = !fallback;
  $('fallback-note').textContent = fallback || '';
  $('legend').replaceChildren(...Object.keys(TYPE_LABELS).map((type) => chip(type)));
  $('original-document').textContent = job.original;
  $('compare-original').textContent = job.original;
  $('original-document').lang = job.language;
  $('compare-original').lang = job.language;
  renderHumanDocument($('changed-document'), job, animate);
  renderHumanDocument($('compare-changed'), job, animate);
  $('no-changes').hidden = active.length > 0;
  $('no-changes').textContent = job.changes.length ? UI.allUndone : `${UI.noChanges} ${UI.noChangesBody}`;
  $('undo-all').textContent = active.length ? UI.undoAll : UI.restoreAll;
  $('undo-all').disabled = !job.changes.length;
  $('review-details').hidden = !job.changes.length;
  renderChangeList(job);
  setDocumentView(view);
}

export function setDocumentView(view) {
  for (const id of ['modified', 'original', 'compare']) {
    const node = $(`${id}-view`);
    const show = id === view;
    node.hidden = !show;
    document.querySelector(`[data-view="${id}"]`).setAttribute('aria-pressed', String(show));
    if (show) enter(node);
  }
}
function signalNode(signal) {
  const row = el('div', 'signal'),
    heading = el('div', 'signal-heading');
  heading.append(
    el('span', '', signal.title),
    el('span', `point ${signal.points > 0 ? 'up' : signal.points < 0 ? 'down' : ''}`, COPY.points(signal.points)),
  );
  row.append(heading, el('p', 'hint', signal.detail));
  return row;
}
export function renderAnalysis(result, instant = false) {
  $('analysis-empty').hidden = true;
  $('analysis-result').hidden = false;
  $('analysis-language').textContent = LANGUAGES[result.language].name;
  $('analysis-level').textContent = result.short
    ? UI.insufficient
    : { low: UI.low, medium: UI.mediumScore, high: UI.high }[result.level];
  $('analysis-description').textContent = COPY.description[result.level];
  $('stat-words').textContent = number(result.words);
  $('stat-sentences').textContent = number(result.sentences.length);
  $('stat-average').textContent = number(result.average);
  $('short-note').hidden = !result.short;
  const ranked = [...result.signals].sort((a, b) => Math.abs(b.points) - Math.abs(a.points));
  $('signals').replaceChildren(
    ...ranked
      .filter((s) => s.points)
      .slice(0, 4)
      .map(signalNode),
  );
  const list = el('ul');
  result.signals.forEach((s) => {
    const li = el('li');
    li.append(
      el('strong', '', `${s.title} (${COPY.points(s.points)}): `),
      document.createTextNode(`${s.detail} ${s.measurement} ${COPY.weighted(s)}`),
    );
    list.append(li);
  });
  $('calculation').replaceChildren(
    el(
      'p',
      '',
      COPY.calculationV2(getAnalysisWeights().baseline, result.rawScore, result.interval, result.weightsVersion),
    ),
    list,
  );
  renderAnalysisDocument($('analysis-document'), result);
  animateGauge($('analysis-gauge'), result, instant);
  renderUnitScores(result);
}
export function enter(node) {
  node.classList.remove('panel-enter');
  if (!reducedMotion()) {
    void node.offsetWidth;
    node.classList.add('panel-enter');
  }
}
export function installReveals() {
  if (!('IntersectionObserver' in window) || reducedMotion()) return;
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('pending');
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      }),
    { threshold: 0.05 },
  );
  document.querySelectorAll('.reveal').forEach((node) => {
    node.classList.add('pending');
    observer.observe(node);
  });
}
