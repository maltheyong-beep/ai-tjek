import { HUMANIZE_API_URL } from './config.js';
import { UI, COPY, LANGUAGES, EXAMPLES } from './i18n.js';
import { countWords, MAX_WORDS, validateText, detectLanguage, resolveLanguage } from './utils.js';
import { analyzeText } from './analyze.js';
import { getFinalText, toggleChange, toggleAllChanges, addTypographyChanges, cleanTextSafely, restoreJob } from './humanize-local.js';
import { readDraft, saveDraft, clearDraft } from './storage.js';
import { el, installTooltips } from './annotations.js';
import { renderHuman, renderAnalysis, setDocumentView, enter, installReveals } from './views.js';

const $ = id => document.getElementById(id);
const state = { text: '', mode: 'human', language: 'auto', intensity: 'medium', tone: 'neutral', protectedTerms: '', view: 'modified', job: null, analysis: null };
let activeRequest = null;
let busy = false, clearedSnapshot = null, toastTimer = 0, storageOK = true;
const copyOriginals = new WeakMap(), copyTimers = new WeakMap();

function applyLabels() {
  document.querySelectorAll('[data-i18n]').forEach(node => { node.textContent = UI[node.dataset.i18n]; });
  document.querySelectorAll('[data-placeholder]').forEach(node => { node.placeholder = UI[node.dataset.placeholder]; });
  document.querySelectorAll('[data-aria]').forEach(node => { node.setAttribute('aria-label', UI[node.dataset.aria]); });
}
function announce(text) { $('live-status').textContent = text; }
function haptic() { try { navigator.vibrate?.(20); } catch { /* Nogle browsere understøtter ikke haptik. */ } }
function successIcon() { return $('check-icon').content.firstElementChild.cloneNode(true); }
function toast(text, success = false) {
  clearTimeout(toastTimer); $('toast').replaceChildren(...(success ? [successIcon(), el('span', '', text)] : [el('span', '', text)]));
  $('toast').hidden = false; toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3500);
}
function error(message = '') {
  $('input-error').textContent = message; $('input-error').hidden = !message;
  if (message) announce(message);
}
function snapshot() {
  return { text: state.text, mode: state.mode, language: state.language, intensity: state.intensity, tone: state.tone, protectedTerms: state.protectedTerms, view: state.view, job: state.job, analysisRequested: Boolean(state.analysis) };
}
function persist() {
  storageOK = saveDraft(snapshot());
  $('draft-status').textContent = !storageOK ? UI.draftFailed : state.text ? UI.draftSaved : UI.draftEmpty;
}
function updateEditor() {
  if ($('text-input').value !== state.text) $('text-input').value = state.text;
  const words = countWords(state.text), over = words > MAX_WORDS;
  $('word-count').textContent = COPY.count(words); $('word-count').classList.toggle('over-limit', over);
  $('text-input').setAttribute('aria-invalid', String(over));
  $('run-button').disabled = busy || !words || over;
  $('clear-button').disabled = busy || !state.text && storageOK;
  $('restore-clear').hidden = !clearedSnapshot;
  $('human-options').hidden = state.mode !== 'human';
  $('run-label').textContent = busy ? state.mode === 'human' ? UI.busyHuman : UI.busyAnalysis : state.mode === 'human' ? UI.primaryHuman : UI.primaryAnalyze;
  if (words) {
    const detected = detectLanguage(state.text), language = resolveLanguage(state.text, state.language);
    $('language-status').textContent = COPY.language(LANGUAGES[language].name, state.language === 'auto', detected.confident);
  } else $('language-status').textContent = UI.ready;
  if (over) error(COPY.limitError(words, words - MAX_WORDS));
}
function renderMode(animate = false) {
  document.querySelectorAll('[data-mode]').forEach(tab => {
    const active = tab.dataset.mode === state.mode; tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1;
  });
  $('work-panel').setAttribute('aria-labelledby', state.mode === 'human' ? 'tab-human' : 'tab-analysis');
  $('human-summary').hidden = state.mode !== 'human'; $('analysis-summary').hidden = state.mode !== 'analysis';
  $('human-output').hidden = state.mode !== 'human' || !state.job;
  $('analysis-output').hidden = state.mode !== 'analysis' || !state.analysis;
  $('human-empty').hidden = Boolean(state.job); $('human-summary-result').hidden = !state.job;
  $('analysis-empty').hidden = Boolean(state.analysis); $('analysis-result').hidden = !state.analysis;
  updateEditor(); if (animate) enter($('work-panel'));
}
function invalidate({ analysis = true } = {}) {
  const hadResult = state.job || state.analysis;
  state.job = null; if (analysis) state.analysis = null;
  if (hadResult) {
    $('human-empty').querySelector('p').textContent = UI.stale;
    $('analysis-empty').querySelector('p').textContent = UI.stale;
  }
  tooltips.hide(); renderMode();
}
function setBusy(value, message, cancellable = false) {
  busy = value; $('run-button').setAttribute('aria-busy', String(value)); $('work-panel').setAttribute('aria-busy', String(value));
  for (const node of document.querySelectorAll('#text-input, #language, #tone, #protected-terms, [name="intensity"], [data-mode], #example-button, #clear-button')) node.disabled = value;
  $('skeleton-message').textContent = HUMANIZE_API_URL ? UI.aiLoading : UI.localLoading;
  $('cancel-button').hidden = !value || !cancellable; $('ai-skeleton').hidden = !value || !cancellable;
  $('human-output').inert = value; $('analysis-output').inert = value;
  $('human-empty').hidden = Boolean(state.job) || value && cancellable;
  updateEditor(); if (message) { $('run-label').textContent = message; announce(message); }
}
// Browseren får mulighed for at vise arbejdsstatus, før den lokale beregning starter.
const nextPaint = () => new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));

async function run() {
  if (busy) return;
  try {
    validateText(state.text); error(); if (state.mode === 'human') activeRequest = new AbortController(); setBusy(true, state.mode === 'human' ? UI.busyHuman : UI.busyAnalysis, state.mode === 'human'); await nextPaint();
    if (state.mode === 'human') {
      const { humanizeWithFallback } = await import('./humanize-ai.js');
      const job = await humanizeWithFallback(state.text, { language: state.language, intensity: state.intensity, tone: state.tone, protectedTerms: state.protectedTerms, signal: activeRequest.signal, onStatus: message => { $('run-label').textContent = message; announce(message); } });
      state.job = job;
      state.view = 'modified'; renderHuman(state.job, { animate: true, view: state.view });
    } else { state.analysis = analyzeText(state.text, state.language); renderAnalysis(state.analysis); }
    renderMode(); persist(); haptic(); announce(state.job && state.mode === 'human' ? COPY.kept(state.job.changes.length, state.job.changes.length) : UI.analysisDone); toast(state.mode === 'human' ? UI.humanDone : UI.analysisDone, true);
  } catch (failure) { if (failure.name === 'AbortError') { announce(UI.cancelled); toast(UI.cancelled); } else error(failure.message || UI.errorGeneric); }
  finally { activeRequest = null; setBusy(false); renderMode(); }
}

function changeMode(mode) {
  if (busy || mode === state.mode) return;
  state.mode = mode; tooltips.hide(); renderMode(true); persist();
}
function changeView(view) {
  state.view = view; tooltips.hide(); setDocumentView(view); persist();
}
function focusChange(id) {
  const node = [...document.querySelectorAll(`[data-change-id="${id}"], [data-toggle-change="${id}"]`)].find(n => n.getClientRects().length);
  node?.focus({ preventScroll: true });
}
function undoOne(id, enabled) {
  if (!state.job || busy) return;
  const index = state.job.changes.findIndex(change => change.id === id); if (index < 0) return;
  try { state.job = toggleChange(state.job, id, enabled); } catch { error(COPY.combinationError); toast(COPY.combinationError); return; }
  error(); tooltips.hide();
  renderHuman(state.job, { view: state.view }); persist(); focusChange(id);
  announce(COPY.toggled(index + 1, state.job.changes[index].enabled));
}

async function cleanHuman() {
  if (!state.job || busy) return;
  try {
    setBusy(true, UI.busyClean); await nextPaint();
    state.job = addTypographyChanges(state.job); renderHuman(state.job, { animate: true, view: state.view }); persist();
    toast(COPY.cleanDone(state.job.changes.filter(c => c.type === 'typography').length, state.job.skippedTypography), true);
  } catch (failure) { error(failure.message || UI.errorGeneric); }
  finally { setBusy(false); }
}
async function cleanInput() {
  if (busy) return;
  try {
    setBusy(true, UI.busyClean); await nextPaint();
    const job = cleanTextSafely(state.text, { language: state.language, protectedTerms: state.protectedTerms });
    clearedSnapshot = snapshot(); state.text = getFinalText(job); state.job = null;
    state.analysis = analyzeText(state.text, state.language); renderAnalysis(state.analysis); renderMode(); persist();
    toast(COPY.cleanDone(job.changes.length, job.skippedTypography), true);
  } catch (failure) { error(failure.message || UI.errorGeneric); }
  finally { setBusy(false); }
}

async function copyText(text, button) {
  if (button.disabled) return;
  if (!copyOriginals.has(button)) copyOriginals.set(button, [...button.childNodes].map(n => n.cloneNode(true)));
  clearTimeout(copyTimers.get(button)); button.disabled = true; button.setAttribute('aria-busy', 'true'); button.textContent = UI.busyCopy;
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
    else {
      const field = el('textarea', 'sr-only'); field.value = text; document.body.append(field); field.select();
      const copied = document.execCommand('copy'); field.remove(); if (!copied) throw new Error(UI.copyFailed);
    }
    haptic(); button.replaceChildren(successIcon(), el('span', '', UI.copied)); button.classList.add('copied'); toast(UI.copied, true);
  } catch { button.replaceChildren(...copyOriginals.get(button).map(n => n.cloneNode(true))); toast(UI.copyFailed); }
  finally {
    button.disabled = false; button.setAttribute('aria-busy', 'false');
    copyTimers.set(button, setTimeout(() => { button.replaceChildren(...copyOriginals.get(button).map(n => n.cloneNode(true))); button.classList.remove('copied'); }, 1800));
  }
}

function restoreSnapshot(data) {
  state.text = data.text; state.mode = data.mode === 'analysis' ? 'analysis' : 'human';
  state.language = ['da', 'de', 'en', 'auto'].includes(data.language) ? data.language : 'auto';
  state.intensity = ['light', 'medium', 'strong'].includes(data.intensity) ? data.intensity : 'medium';
  state.tone = ['neutral', 'school', 'casual'].includes(data.tone) ? data.tone : 'neutral'; $('tone').value = state.tone;
  state.protectedTerms = typeof data.protectedTerms === 'string' ? data.protectedTerms : '';
  state.view = ['modified', 'original', 'compare'].includes(data.view) ? data.view : 'modified';
  state.job = restoreJob(data.job, state.text); state.analysis = null;
  $('language').value = state.language; $('protected-terms').value = state.protectedTerms;
  document.querySelector(`[name="intensity"][value="${state.intensity}"]`).checked = true;
  if (state.text && countWords(state.text) <= MAX_WORDS) {
    if (data.analysisRequested) { state.analysis = analyzeText(state.text, state.language); renderAnalysis(state.analysis, true); }
    if (state.job) renderHuman(state.job, { view: state.view, instant: true });
  } else state.job = null;
  renderMode();
}

function installEvents() {
  $('text-input').addEventListener('input', () => { state.text = $('text-input').value; clearedSnapshot = null; error(); invalidate(); persist(); });
  $('text-input').addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); run(); } });
  $('language').addEventListener('change', () => { state.language = $('language').value; error(); invalidate(); persist(); });
  $('protected-terms').addEventListener('input', () => { state.protectedTerms = $('protected-terms').value; invalidate({ analysis: false }); persist(); });
  document.querySelectorAll('[name="intensity"]').forEach(input => input.addEventListener('change', () => { state.intensity = input.value; invalidate({ analysis: false }); persist(); }));
  $('run-button').addEventListener('click', run);
  $('cancel-button').addEventListener('click', () => activeRequest?.abort());
  $('tone').addEventListener('change', () => { state.tone = $('tone').value; invalidate({ analysis: false }); persist(); });
  document.querySelectorAll('[data-mode]').forEach(tab => tab.addEventListener('click', () => changeMode(tab.dataset.mode)));
  document.querySelector('.mode-tabs').addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) || busy) return;
    event.preventDefault(); const mode = event.key === 'Home' ? 'human' : event.key === 'End' ? 'analysis' : state.mode === 'human' ? 'analysis' : 'human';
    changeMode(mode); $(`tab-${mode}`).focus();
  });
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => changeView(button.dataset.view)));
  $('example-button').addEventListener('click', () => {
    const language = state.language === 'auto' ? 'da' : state.language; state.text = EXAMPLES[language]; clearedSnapshot = null;
    error(); invalidate(); persist(); toast(UI.exampleLoaded); $('text-input').focus({ preventScroll: true });
  });
  $('clear-button').addEventListener('click', () => {
    clearedSnapshot = snapshot(); state.text = ''; state.job = null; state.analysis = null; tooltips.hide();
    storageOK = clearDraft(); error(); renderMode(); $('draft-status').textContent = storageOK ? UI.draftEmpty : UI.draftFailed;
    toast(UI.cleared, true); $('text-input').focus({ preventScroll: true });
  });
  $('restore-clear').addEventListener('click', () => { if (!clearedSnapshot) return; const saved = clearedSnapshot; clearedSnapshot = null; restoreSnapshot(saved); persist(); toast(UI.clearRestored, true); });
  $('change-list').addEventListener('click', event => { const button = event.target.closest('[data-toggle-change]'); if (button) undoOne(button.dataset.toggleChange); });
  $('undo-all').addEventListener('click', () => {
    if (!state.job || busy) return; state.job = toggleAllChanges(state.job, !state.job.changes.some(c => c.enabled));
    tooltips.hide(); renderHuman(state.job, { view: state.view }); persist(); announce(COPY.kept(state.job.changes.filter(c => c.enabled).length, state.job.changes.length));
  });
  $('clean-human').addEventListener('click', cleanHuman); $('clean-input').addEventListener('click', cleanInput);
  $('copy-human').addEventListener('click', () => { if (state.job) copyText(getFinalText(state.job), $('copy-human')); });
  $('copy-input').addEventListener('click', () => copyText(state.text, $('copy-input')));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') $('toast').hidden = true; });
  window.addEventListener('pagehide', () => { if (state.text) saveDraft(snapshot()); });
}

const primaryActions = $('primary-actions'), actionHome = primaryActions.parentElement, phoneLayout = matchMedia('(max-width: 699px)');
function placeActions() { (phoneLayout.matches ? document.body : actionHome).append(primaryActions); }
phoneLayout.addEventListener('change', placeActions); placeActions();
applyLabels(); $('server-note').textContent = HUMANIZE_API_URL ? UI.aiServerConfigured : UI.aiServerNotReady;
// VisualViewport holder bundknappen over tastaturet på browsere, der lægger tastaturet oven på siden.
function fitKeyboard() { const viewport = window.visualViewport; const inset = viewport ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop) : 0; document.documentElement.style.setProperty('--keyboard-inset', `${inset}px`); }
window.visualViewport?.addEventListener('resize', fitKeyboard); window.visualViewport?.addEventListener('scroll', fitKeyboard); fitKeyboard();
const tooltips = installTooltips(document, undoOne); installEvents();
const saved = readDraft(); storageOK = saved.ok;
if (saved.data) {
  try { restoreSnapshot(saved.data); toast(UI.draftRestored, true); } catch { state.job = null; state.analysis = null; renderMode(); error(COPY.invalidDraft); }
}
else renderMode();
$('draft-status').textContent = !storageOK ? UI.draftFailed : state.text ? UI.draftSaved : UI.draftEmpty;
installReveals();
