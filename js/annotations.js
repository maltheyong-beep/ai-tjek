import { UI, COPY, HIDDEN_NAMES } from './i18n.js';
import { clamp, unique } from './utils.js';

export function el(tag, className = '', text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
export const TYPE_LABELS = { filler: UI.typeFiller, transition: UI.typeTransition, split: UI.typeSplit, wording: UI.typeWording, typography: UI.typeTypography };

export function renderHumanDocument(host, job, animate = false) {
  const fragment = document.createDocumentFragment(); let cursor = 0;
  job.changes.forEach((change, index) => {
    fragment.append(document.createTextNode(job.original.slice(cursor, change.start)));
    const shown = change.enabled ? change.after : change.before;
    const button = el('button', `change-mark annotated${!change.enabled ? ' is-undone' : ''}${animate ? ' new-change' : ''}`, shown || '⋯');
    button.type = 'button'; button.dataset.type = change.type; button.dataset.changeId = change.id;
    button.dataset.before = change.before; button.dataset.after = change.after; button.dataset.reason = change.reason; button.dataset.kind = 'change'; button.dataset.enabled = String(change.enabled);
    button.setAttribute('aria-label', COPY.changeLabel(index + 1, TYPE_LABELS[change.type]));
    button.setAttribute('aria-describedby', 'tooltip'); button.style.setProperty('--stagger', `${Math.min(index * 25, 100)}ms`);
    fragment.append(button); cursor = change.end;
  });
  fragment.append(document.createTextNode(job.original.slice(cursor))); host.replaceChildren(fragment); host.lang = job.language;
}

export function renderAnalysisDocument(host, result) {
  const edges = [...new Set([0, result.original.length, ...result.marks.flatMap(m => [m.start, m.end])])].sort((a, b) => a - b);
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < edges.length - 1; i++) {
    const start = edges[i], end = edges[i + 1];
    const reasons = unique(result.marks.filter(m => m.start <= start && m.end >= end).map(m => m.reason));
    const text = result.original.slice(start, end);
    if (!reasons.length) fragment.append(document.createTextNode(text));
    else {
      const button = el('button', 'analysis-mark annotated', text || '⋯'); button.type = 'button';
      button.dataset.kind = 'analysis'; button.dataset.reason = reasons.join(' '); button.setAttribute('aria-describedby', 'tooltip');
      fragment.append(button);
    }
  }
  host.replaceChildren(fragment); host.lang = result.language;
}

function showHidden(text) {
  if (!text) return UI.removed;
  let output = '';
  for (const char of text) output += HIDDEN_NAMES.has(char) ? `[U+${char.codePointAt(0).toString(16).toUpperCase()}]` : char;
  return output.trim() ? output : '␠';
}
function tooltipParagraph(label, text) {
  const p = el('p'); if (label) p.append(el('strong', '', label)); p.append(document.createTextNode(text)); return p;
}

export function installTooltips(host, onToggle) {
  const tip = document.getElementById('tooltip'), sheet = document.getElementById('change-sheet');
  let anchor = null, sheetAnchor = null, pinned = false;
  const mobile = () => matchMedia('(max-width: 699px), (hover: none)').matches;
  function hideTip() { tip.hidden = true; anchor = null; pinned = false; }
  function hide() { hideTip(); if (sheet.open) sheet.close(); }
  function parts(node) {
    return node.dataset.kind === 'change' ? [tooltipParagraph(UI.before, showHidden(node.dataset.before)), tooltipParagraph(UI.after, showHidden(node.dataset.after)), tooltipParagraph(UI.why, node.dataset.reason)] : [tooltipParagraph('', node.dataset.reason)];
  }
  function show(node, pin = false) {
    if (mobile() || sheet.open) return;
    anchor = node; pinned = pin; tip.replaceChildren(...parts(node)); tip.lang = node.closest('[lang]')?.lang || 'da'; tip.hidden = false;
    const box = node.getBoundingClientRect(), size = tip.getBoundingClientRect();
    tip.style.left = `${clamp(box.left + box.width / 2 - size.width / 2, 12, innerWidth - size.width - 12)}px`;
    tip.style.top = `${box.top > size.height + 12 ? box.top - size.height - 8 : clamp(box.bottom + 8, 8, innerHeight - size.height - 8)}px`;
  }
  function openSheet(node) {
    hideTip(); sheetAnchor = node;
    document.getElementById('sheet-content').replaceChildren(...parts(node));
    document.getElementById('sheet-content').lang = node.closest('[lang]')?.lang || 'da';
    document.getElementById('sheet-actions').hidden = node.dataset.kind !== 'change';
    document.getElementById('sheet-undo').disabled = node.dataset.enabled === 'false';
    document.getElementById('sheet-keep').disabled = false;
    sheet.showModal(); document.getElementById('sheet-close').focus({ preventScroll: true });
  }
  function choose(enabled) {
    const id = sheetAnchor?.dataset.changeId; sheet.close(); if (id) onToggle?.(id, enabled);
  }
  document.getElementById('sheet-keep').addEventListener('click', () => choose(true));
  document.getElementById('sheet-undo').addEventListener('click', () => choose(false));
  document.getElementById('sheet-close').addEventListener('click', () => sheet.close());
  sheet.addEventListener('click', event => { if (event.target === sheet) { const r = sheet.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) sheet.close(); } });
  host.addEventListener('pointerover', event => { const node = event.target.closest('.annotated'); if (node && !pinned) show(node); });
  host.addEventListener('pointerout', event => { if (!pinned && !event.relatedTarget?.closest?.('.annotated') && document.activeElement !== anchor) hideTip(); });
  host.addEventListener('focusin', event => { const node = event.target.closest('.annotated'); if (node) show(node); });
  host.addEventListener('focusout', event => { if (event.target.closest('.annotated') && !pinned) hideTip(); });
  host.addEventListener('click', event => {
    if (event.target.closest('#change-sheet')) return;
    const node = event.target.closest('.annotated');
    if (node) openSheet(node); else hideTip();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); });
  window.addEventListener('scroll', hideTip, { passive: true, capture: true });
  window.addEventListener('resize', hideTip);
  return { hide };
}
