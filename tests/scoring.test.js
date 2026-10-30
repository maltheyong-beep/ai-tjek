// Kontrollerer reglernes grænser og forklarlighed; prøverne er ikke et kalibreringsdatasæt.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { analyzeText } from '../js/analyze.js';
import { combineSignals } from '../js/analysis-scoring.js';
import { getAnalysisWeights, validateWeights } from '../js/analysis-weights.js';
import { EXAMPLES } from '../js/i18n.js';

const weights = getAnalysisWeights();
const fixture = (id, points) => ({ id, points });
test('JSON er eneste vægtkilde og kan ikke ændres under analysen', async () => {
  assert.deepEqual(weights, JSON.parse(await readFile(new URL('../data/vaegte.json', import.meta.url), 'utf8')));
  assert.ok(Object.isFrozen(weights));
  assert.ok(Object.isFrozen(weights.signals));
  assert.throws(() => {
    weights.baseline = 80;
  }, TypeError);
});
test('Ugyldige eller skjult kalibrerede konfigurationer afvises', () => {
  for (const mutate of [
    (w) => (w.baseline = NaN),
    (w) => (w.signals.unicode.positive = 1),
    (w) => (w.signals.rhythm.positive = -1),
    (w) => (w.calibration.validated = true),
    (w) => (w.features.perplexity = true),
    (w) => (w.uncertainty.halfWidth.da = undefined),
  ]) {
    const data = structuredClone(weights);
    mutate(data);
    assert.throws(() => validateWeights(data));
  }
});
test('Beslægtede fraser tælles ikke som to uafhængige signalfamilier', () => {
  const r = combineSignals([fixture('transitions', 14), fixture('cliches', 18)]);
  assert.equal(
    r.signals.reduce((n, s) => n + s.points, 0),
    weights.familyCaps.phrases,
  );
  assert.equal(r.positiveFamilies, 1);
  assert.ok(r.signals.every((s) => s.capped));
});
test('Pæn grammatik, fravær af jeg-form og skjulte tegn øger ikke indekset', () => {
  const r = combineSignals([fixture('polish', 3), fixture('voice', 6), fixture('unicode', 100)]);
  assert.equal(r.score, weights.baseline);
  assert.ok(r.signals.every((s) => s.points === 0));
});
test('Høj score kræver flere signalfamilier', () => {
  const r = combineSignals([fixture('rhythm', 100), fixture('transitions', 100), fixture('cliches', 100)]);
  assert.ok(r.gated);
  assert.ok(r.score < weights.levels.high);
});
test('79 ord er for kort; 80 ord kan få et ukalibreret spænd', () => {
  const short = analyzeText('ord '.repeat(79), 'da'),
    long = analyzeText('ord '.repeat(80), 'da');
  assert.equal(short.short, true);
  assert.equal(short.interval.insufficient, true);
  assert.equal(long.short, false);
  assert.equal(long.interval.insufficient, false);
  assert.equal(long.interval.calibrated, false);
});
for (const language of ['da', 'de', 'en'])
  test(`${language}: interval, signaler og kildepositioner er konsistente`, () => {
    const original = EXAMPLES[language] + '\n\n' + EXAMPLES[language],
      r = analyzeText(original, language);
    assert.ok(r.interval.lower <= r.score && r.score <= r.interval.upper);
    assert.ok(r.interval.lower >= 0 && r.interval.upper <= 100);
    assert.equal(r.rawScore, weights.baseline + r.signals.reduce((n, s) => n + s.points, 0));
    assert.equal(r.paragraphScores.length, 4);
    assert.equal(r.sentenceScores.length, r.sentences.length);
    for (const unit of [...r.paragraphScores, ...r.sentenceScores]) {
      assert.equal(unit.text, original.slice(unit.start, unit.end));
      assert.equal(unit.language, language);
      assert.ok(unit.interval.lower <= unit.score && unit.score <= unit.interval.upper);
      assert.equal(unit.signals.find((s) => s.id === 'unicode').points, 0);
    }
  });
test('Afsnit følger blanklinjer, ikke linjeombrydning eller punktopstilling', () => {
  const r = analyzeText('Første linje.\nAnden linje.\n \t\nSidste afsnit.', 'da');
  assert.equal(r.paragraphScores.length, 2);
  assert.equal(r.paragraphScores[0].text, 'Første linje.\nAnden linje.');
});
for (const language of ['da', 'de'])
  test(`${language}: længere sammensætninger giver ikke lavere ordvariation eller højere indeks`, () => {
    const short = Array.from({ length: 100 }, (_, i) => 'ord' + i).join(' ') + '.';
    const long = Array.from({ length: 100 }, (_, i) => 'sammensætningsmulighedseksempel' + i).join(' ') + '.';
    const a = analyzeText(short, language),
      b = analyzeText(long, language);
    assert.equal(a.vocab.value, b.vocab.value);
    assert.equal(a.score, b.score);
  });
test('Formateringstegn ændrer ikke det samlede indeks eller interval', () => {
  const a = analyzeText(EXAMPLES.da, 'da'),
    b = analyzeText(EXAMPLES.da.replaceAll(' ', '\u200b '), 'da');
  assert.equal(a.score, b.score);
  assert.deepEqual(a.interval, b.interval);
});
test('Usikkert automatisk sprogvalg giver ikke et smallere spænd', () => {
  const text = 'ord '.repeat(100),
    a = analyzeText(text, 'da'),
    b = analyzeText(text, 'auto');
  assert.ok(b.interval.upper - b.interval.lower >= a.interval.upper - a.interval.lower);
});
test('5000 ord med mange sætninger kan analyseres uden rekursion eller forkerte grænser', () => {
  const r = analyzeText('Et ord. '.repeat(2500), 'da');
  assert.equal(r.words, 5000);
  assert.equal(r.sentenceScores.length, 2500);
  assert.ok(r.interval.lower >= 0 && r.interval.upper <= 100);
});

test('Dansk og tysk får mindst samme spændbredde som engelsk ved samme målinger', () => {
  const text = 'ord '.repeat(100);
  const ranges = ['da', 'de', 'en'].map((language) => analyzeText(text, language).interval);
  assert.ok(ranges[0].upper - ranges[0].lower >= ranges[2].upper - ranges[2].lower);
  assert.ok(ranges[1].upper - ranges[1].lower >= ranges[2].upper - ranges[2].lower);
});
