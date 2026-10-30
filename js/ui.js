// Koordinerer editor, resultater og delmoduler uden globale variabler.
import { restoreSnapshot as restoreSavedDraft } from './ui-draft.js';
// Understøtter tekstbehandling og visning uden eksterne biblioteker i browseren.
import { installEvents } from './ui-events.js';
import { announce, haptic, toast, error, copyText } from './ui-feedback.js';
import { HUMANIZE_API_URL } from './config.js';
import { UI, COPY, LANGUAGES } from './i18n.js';
import { countWords, MAX_WORDS, validateText, detectLanguage, resolveLanguage } from './utils.js';
import { getAnalysisWeights } from './analysis-weights.js';
import { analyzeText } from './analyze.js';
import { getFinalText, toggleChange, addTypographyChanges, cleanTextSafely } from './humanize-local.js';
import { readDraft, saveDraft } from './storage.js';
import { installTooltips } from './annotations.js';
import { renderHuman, renderAnalysis, setDocumentView, enter, installReveals } from './views.js';

const $ = (id) => document.getElementById(id);
const state = {
  text: '',
  mode: 'human',
  language: 'auto',
  intensity: 'medium',
  tone: 'neutral',
  protectedTerms: '',
  view: 'modified',
  job: null,
  analysis: null,
};

const session = { activeRequest: null, busy: false, clearedSnapshot: null, storageOK: true };

function applyLabels() {
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    node.textContent = UI[node.dataset.i18n];
  });
  document.querySelectorAll('[data-placeholder]').forEach((node) => {
    node.placeholder = UI[node.dataset.placeholder];
  });
  document.querySelectorAll('[data-aria]').forEach((node) => {
    node.setAttribute('aria-label', UI[node.dataset.aria]);
  });
}

function snapshot() {
  return {
    text: state.text,
    mode: state.mode,
    language: state.language,
    intensity: state.intensity,
    tone: state.tone,
    protectedTerms: state.protectedTerms,
    view: state.view,
    job: state.job,
    analysisRequested: Boolean(state.analysis),
  };
}
function persist() {
  session.storageOK = saveDraft(snapshot());
  $('draft-status').textContent = !session.storageOK ? UI.draftFailed : state.text ? UI.draftSaved : UI.draftEmpty;
}
function updateEditor() {
  if ($('text-input').value !== state.text) $('text-input').value = state.text;
  const words = countWords(state.text),
    over = words > MAX_WORDS;
  $('word-count').textContent = COPY.count(words);
  $('word-count').classList.toggle('over-limit', over);
  $('text-input').setAttribute('aria-invalid', String(over));
  $('run-button').disabled = session.busy || !words || over;
  $('clear-button').disabled = session.busy || (!state.text && session.storageOK);
  $('restore-clear').hidden = !session.clearedSnapshot;
  $('human-options').hidden = state.mode !== 'human';
  $('run-label').textContent = session.busy
    ? state.mode === 'human'
      ? UI.busyHuman
      : UI.busyAnalysis
    : state.mode === 'human'
      ? UI.primaryHuman
      : UI.primaryAnalyze;
  if (words) {
    const detected = detectLanguage(state.text),
      language = resolveLanguage(state.text, state.language);
    $('language-status').textContent = COPY.language(
      LANGUAGES[language].name,
      state.language === 'auto',
      detected.confident,
    );
  } else $('language-status').textContent = UI.ready;
  if (over) error(COPY.limitError(words, words - MAX_WORDS));
}
function renderMode(animate = false) {
  document.querySelectorAll('[data-mode]').forEach((tab) => {
    const active = tab.dataset.mode === state.mode;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  $('work-panel').setAttribute('aria-labelledby', state.mode === 'human' ? 'tab-human' : 'tab-analysis');
  $('human-summary').hidden = state.mode !== 'human';
  $('analysis-summary').hidden = state.mode !== 'analysis';
  $('human-output').hidden = state.mode !== 'human' || !state.job;
  $('analysis-output').hidden = state.mode !== 'analysis' || !state.analysis;
  $('human-empty').hidden = Boolean(state.job);
  $('human-summary-result').hidden = !state.job;
  $('analysis-empty').hidden = Boolean(state.analysis);
  $('analysis-result').hidden = !state.analysis;
  updateEditor();
  if (animate) enter($('work-panel'));
}
function invalidate({ analysis = true } = {}) {
  const hadResult = state.job || state.analysis;
  state.job = null;
  if (analysis) state.analysis = null;
  if (hadResult) {
    $('human-empty').querySelector('p').textContent = UI.stale;
    $('analysis-empty').querySelector('p').textContent = UI.stale;
  }
  tooltips.hide();
  renderMode();
}
function setBusy(value, message, cancellable = false) {
  session.busy = value;
  $('run-button').setAttribute('aria-busy', String(value));
  $('work-panel').setAttribute('aria-busy', String(value));
  for (const node of document.querySelectorAll(
    '#text-input, #language, #tone, #protected-terms, [name="intensity"], [data-mode], #example-button, #clear-button',
  ))
    node.disabled = value;
  $('skeleton-message').textContent = HUMANIZE_API_URL ? UI.aiLoading : UI.localLoading;
  $('cancel-button').hidden = !value || !cancellable;
  $('ai-skeleton').hidden = !value || !cancellable;
  $('human-output').inert = value;
  $('analysis-output').inert = value;
  $('human-empty').hidden = Boolean(state.job) || (value && cancellable);
  updateEditor();
  if (message) {
    $('run-label').textContent = message;
    announce(message);
  }
}
// Browseren får mulighed for at vise arbejdsstatus, før den lokale beregning starter.
const nextPaint = () => new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));

async function run() {
  if (session.busy) return;
  try {
    validateText(state.text);
    getAnalysisWeights();
    error();
    if (state.mode === 'human') session.activeRequest = new AbortController();
    setBusy(true, state.mode === 'human' ? UI.busyHuman : UI.busyAnalysis, state.mode === 'human');
    await nextPaint();
    if (state.mode === 'human') {
      const { humanizeWithFallback } = await import('./humanize-ai.js');
      const job = await humanizeWithFallback(state.text, {
        language: state.language,
        intensity: state.intensity,
        tone: state.tone,
        protectedTerms: state.protectedTerms,
        signal: session.activeRequest.signal,
        onStatus: (message) => {
          $('run-label').textContent = message;
          announce(message);
        },
      });
      state.job = job;
      state.view = 'modified';
      renderHuman(state.job, { animate: true, view: state.view });
    } else {
      state.analysis = analyzeText(state.text, state.language);
      renderAnalysis(state.analysis);
    }
    renderMode();
    persist();
    haptic();
    announce(
      state.job && state.mode === 'human'
        ? COPY.kept(state.job.changes.length, state.job.changes.length)
        : UI.analysisDone,
    );
    toast(state.mode === 'human' ? UI.humanDone : UI.analysisDone, true);
  } catch (failure) {
    if (failure.name === 'AbortError') {
      announce(UI.cancelled);
      toast(UI.cancelled);
    } else error(failure.message || UI.errorGeneric);
  } finally {
    session.activeRequest = null;
    setBusy(false);
    renderMode();
  }
}

function changeMode(mode) {
  if (session.busy || mode === state.mode) return;
  state.mode = mode;
  tooltips.hide();
  renderMode(true);
  persist();
}
function changeView(view) {
  state.view = view;
  tooltips.hide();
  setDocumentView(view);
  persist();
}
function focusChange(id) {
  const node = [...document.querySelectorAll(`[data-change-id="${id}"], [data-toggle-change="${id}"]`)].find(
    (n) => n.getClientRects().length,
  );
  node?.focus({ preventScroll: true });
}
function undoOne(id, enabled) {
  if (!state.job || session.busy) return;
  const index = state.job.changes.findIndex((change) => change.id === id);
  if (index < 0) return;
  try {
    state.job = toggleChange(state.job, id, enabled);
  } catch {
    error(COPY.combinationError);
    toast(COPY.combinationError);
    return;
  }
  error();
  tooltips.hide();
  renderHuman(state.job, { view: state.view });
  persist();
  focusChange(id);
  announce(COPY.toggled(index + 1, state.job.changes[index].enabled));
}

async function cleanHuman() {
  if (!state.job || session.busy) return;
  try {
    setBusy(true, UI.busyClean);
    await nextPaint();
    state.job = addTypographyChanges(state.job);
    renderHuman(state.job, { animate: true, view: state.view });
    persist();
    toast(
      COPY.cleanDone(state.job.changes.filter((c) => c.type === 'typography').length, state.job.skippedTypography),
      true,
    );
  } catch (failure) {
    error(failure.message || UI.errorGeneric);
  } finally {
    setBusy(false);
  }
}
async function cleanInput() {
  if (session.busy) return;
  try {
    setBusy(true, UI.busyClean);
    await nextPaint();
    const job = cleanTextSafely(state.text, { language: state.language, protectedTerms: state.protectedTerms });
    session.clearedSnapshot = snapshot();
    state.text = getFinalText(job);
    state.job = null;
    state.analysis = analyzeText(state.text, state.language);
    renderAnalysis(state.analysis);
    renderMode();
    persist();
    toast(COPY.cleanDone(job.changes.length, job.skippedTypography), true);
  } catch (failure) {
    error(failure.message || UI.errorGeneric);
  } finally {
    setBusy(false);
  }
}

const restoreSnapshot = (data) => restoreSavedDraft(data, { state, renderMode });

const primaryActions = $('primary-actions'),
  actionHome = primaryActions.parentElement,
  phoneLayout = matchMedia('(max-width: 699px)');
function placeActions() {
  (phoneLayout.matches ? document.body : actionHome).append(primaryActions);
}
phoneLayout.addEventListener('change', placeActions);
placeActions();
applyLabels();
$('server-note').textContent = HUMANIZE_API_URL ? UI.aiServerConfigured : UI.aiServerNotReady;
// VisualViewport holder bundknappen over tastaturet på browsere, der lægger tastaturet oven på siden.
function fitKeyboard() {
  const viewport = window.visualViewport;
  const inset = viewport ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop) : 0;
  document.documentElement.style.setProperty('--keyboard-inset', `${inset}px`);
}
window.visualViewport?.addEventListener('resize', fitKeyboard);
window.visualViewport?.addEventListener('scroll', fitKeyboard);
fitKeyboard();
const tooltips = installTooltips(document, undoOne);
installEvents({
  state,
  session,
  tooltips,
  run,
  changeMode,
  changeView,
  invalidate,
  persist,
  error,
  renderMode,
  snapshot,
  restoreSnapshot,
  toast,
  undoOne,
  announce,
  cleanHuman,
  cleanInput,
  copyText,
});
const saved = readDraft();
session.storageOK = saved.ok;
if (saved.data) {
  try {
    restoreSnapshot(saved.data);
    toast(UI.draftRestored, true);
  } catch {
    state.job = null;
    state.analysis = null;
    renderMode();
    error(COPY.invalidDraft);
  }
} else renderMode();
$('draft-status').textContent = !session.storageOK ? UI.draftFailed : state.text ? UI.draftSaved : UI.draftEmpty;
installReveals();

// En filfejl er en konfigurationsfejl, ikke en forkert kladde.
try {
  getAnalysisWeights();
} catch (failure) {
  error(failure.message);
}
