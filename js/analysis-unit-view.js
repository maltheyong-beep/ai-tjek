// Delresultater vises først ved åbning og i små portioner, så lange tekster ikke fylder telefonens DOM.
import { UI, COPY } from './i18n.js';
import { el } from './annotations.js';
const PAGE_SIZE = 20;

function section(title, units) {
  const panel = el('section', 'unit-section');
  panel.append(el('h3', 'small-heading', title));
  const list = el('ol', 'unit-list'),
    more = el('button', 'quiet-button', UI.moreUnits);
  more.type = 'button';
  let cursor = 0;
  function appendPage() {
    units.slice(cursor, cursor + PAGE_SIZE).forEach((unit) => {
      const row = el('li', 'unit-row');
      const label = COPY.unitHeading(unit.kind, unit.index);
      row.append(
        el('strong', '', label),
        el('span', 'unit-range', unit.short ? UI.insufficient : COPY.interval(unit.interval)),
      );
      const excerpt = el('p', 'hint', unit.text);
      excerpt.lang = unit.language;
      row.append(excerpt);
      list.append(row);
    });
    cursor += PAGE_SIZE;
    more.hidden = cursor >= units.length;
  }
  more.addEventListener('click', appendPage);
  appendPage();
  panel.append(list, more);
  return panel;
}
export function renderUnitScores(result) {
  const details = document.getElementById('unit-scores');
  details.open = false;
  const body = document.getElementById('unit-score-body');
  body.replaceChildren();
  details.ontoggle = () => {
    if (!details.open || body.childNodes.length) return;
    body.append(
      el('p', 'hint', UI.unitScoresHelp),
      section(UI.paragraphs, result.paragraphScores),
      section(UI.sentenceUnits, result.sentenceScores),
    );
  };
}
