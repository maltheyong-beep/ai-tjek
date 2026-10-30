// Gendanner en valideret kladde uden at blande brugerhændelser ind.
// Understøtter tekstbehandling og visning uden eksterne biblioteker i browseren.

import { countWords, MAX_WORDS } from './utils.js';
import { analyzeText } from './analyze.js';
import { restoreJob } from './humanize-local.js';

import { renderHuman, renderAnalysis } from './views.js';

const $ = (id) => document.getElementById(id);
export function restoreSnapshot(data, { state, renderMode }) {
  state.text = data.text;
  state.mode = data.mode === 'analysis' ? 'analysis' : 'human';
  state.language = ['da', 'de', 'en', 'auto'].includes(data.language) ? data.language : 'auto';
  state.intensity = ['light', 'medium', 'strong'].includes(data.intensity) ? data.intensity : 'medium';
  state.tone = ['neutral', 'school', 'casual'].includes(data.tone) ? data.tone : 'neutral';
  $('tone').value = state.tone;
  state.protectedTerms = typeof data.protectedTerms === 'string' ? data.protectedTerms : '';
  state.view = ['modified', 'original', 'compare'].includes(data.view) ? data.view : 'modified';
  state.job = restoreJob(data.job, state.text);
  state.analysis = null;
  $('language').value = state.language;
  $('protected-terms').value = state.protectedTerms;
  document.querySelector(`[name="intensity"][value="${state.intensity}"]`).checked = true;
  if (state.text && countWords(state.text) <= MAX_WORDS) {
    if (data.analysisRequested) {
      state.analysis = analyzeText(state.text, state.language);
      renderAnalysis(state.analysis, true);
    }
    if (state.job) renderHuman(state.job, { view: state.view, instant: true });
  } else state.job = null;
  renderMode();
}
