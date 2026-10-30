// Binder brugerhandlinger til appens eksisterende funktioner.

import { UI, COPY, EXAMPLES } from './i18n.js';

import { getFinalText, toggleAllChanges } from './humanize-local.js';
import { saveDraft, clearDraft } from './storage.js';

import { renderHuman } from './views.js';
const $ = (id) => document.getElementById(id);
export function installEvents({
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
}) {
  $('text-input').addEventListener('input', () => {
    state.text = $('text-input').value;
    session.clearedSnapshot = null;
    error();
    invalidate();
    persist();
  });
  $('text-input').addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      run();
    }
  });
  $('language').addEventListener('change', () => {
    state.language = $('language').value;
    error();
    invalidate();
    persist();
  });
  $('protected-terms').addEventListener('input', () => {
    state.protectedTerms = $('protected-terms').value;
    invalidate({ analysis: false });
    persist();
  });
  document.querySelectorAll('[name="intensity"]').forEach((input) =>
    input.addEventListener('change', () => {
      state.intensity = input.value;
      invalidate({ analysis: false });
      persist();
    }),
  );
  $('run-button').addEventListener('click', run);
  $('cancel-button').addEventListener('click', () => session.activeRequest?.abort());
  $('tone').addEventListener('change', () => {
    state.tone = $('tone').value;
    invalidate({ analysis: false });
    persist();
  });
  document
    .querySelectorAll('[data-mode]')
    .forEach((tab) => tab.addEventListener('click', () => changeMode(tab.dataset.mode)));
  document.querySelector('.mode-tabs').addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) || session.busy) return;
    event.preventDefault();
    const mode =
      event.key === 'Home' ? 'human' : event.key === 'End' ? 'analysis' : state.mode === 'human' ? 'analysis' : 'human';
    changeMode(mode);
    $(`tab-${mode}`).focus();
  });
  document
    .querySelectorAll('[data-view]')
    .forEach((button) => button.addEventListener('click', () => changeView(button.dataset.view)));
  $('example-button').addEventListener('click', () => {
    const language = state.language === 'auto' ? 'da' : state.language;
    state.text = EXAMPLES[language];
    session.clearedSnapshot = null;
    error();
    invalidate();
    persist();
    toast(UI.exampleLoaded);
    $('text-input').focus({ preventScroll: true });
  });
  $('clear-button').addEventListener('click', () => {
    session.clearedSnapshot = snapshot();
    state.text = '';
    state.job = null;
    state.analysis = null;
    tooltips.hide();
    session.storageOK = clearDraft();
    error();
    renderMode();
    $('draft-status').textContent = session.storageOK ? UI.draftEmpty : UI.draftFailed;
    toast(UI.cleared, true);
    $('text-input').focus({ preventScroll: true });
  });
  $('restore-clear').addEventListener('click', () => {
    if (!session.clearedSnapshot) return;
    const saved = session.clearedSnapshot;
    session.clearedSnapshot = null;
    restoreSnapshot(saved);
    persist();
    toast(UI.clearRestored, true);
  });
  $('change-list').addEventListener('click', (event) => {
    const button = event.target.closest('[data-toggle-change]');
    if (button) undoOne(button.dataset.toggleChange);
  });
  $('undo-all').addEventListener('click', () => {
    if (!state.job || session.busy) return;
    state.job = toggleAllChanges(state.job, !state.job.changes.some((c) => c.enabled));
    tooltips.hide();
    renderHuman(state.job, { view: state.view });
    persist();
    announce(COPY.kept(state.job.changes.filter((c) => c.enabled).length, state.job.changes.length));
  });
  $('clean-human').addEventListener('click', cleanHuman);
  $('clean-input').addEventListener('click', cleanInput);
  $('copy-human').addEventListener('click', () => {
    if (state.job) copyText(getFinalText(state.job), $('copy-human'));
  });
  $('copy-input').addEventListener('click', () => copyText(state.text, $('copy-input')));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') $('toast').hidden = true;
  });
  window.addEventListener('pagehide', () => {
    if (state.text) saveDraft(snapshot());
  });
}
