// Kontrollerer eksisterende adfærd med lokale prøver og simulerede kald.
import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeText } from '../js/analyze.js';
import {
  humanizeText,
  getFinalText,
  toggleChange,
  toggleAllChanges,
  addTypographyChanges,
  cleanTextSafely,
  restoreJob,
} from '../js/humanize-local.js';
import { countWords, splitSentences, overlaps } from '../js/utils.js';
import { EXAMPLES } from '../js/i18n.js';
import { saveDraft, readDraft, clearDraft } from '../js/storage.js';

for (const language of ['da', 'de', 'en']) {
  test(`${language}: sprog, analyse og synlige omskrivninger`, () => {
    const job = humanizeText(EXAMPLES[language]);
    const output = getFinalText(job);
    assert.equal(job.language, language);
    assert.ok(job.changes.length > 0);
    assert.notEqual(output, job.original);
    assert.equal(analyzeText(output, language).language, language);
    for (const c of job.changes) assert.equal(c.before, job.original.slice(c.start, c.end));
  });
  test(`${language}: alle ændringer kan fortrydes præcist`, () => {
    const job = humanizeText(EXAMPLES[language], { language });
    assert.equal(getFinalText(toggleAllChanges(job, false)), job.original);
    const undone = toggleChange(job, job.changes[0].id, false);
    assert.equal(undone.changes.filter((c) => c.enabled).length, job.changes.length - 1);
    assert.equal(getFinalText(toggleChange(undone, job.changes[0].id, true)), getFinalText(job));
  });
  test(`${language}: beskyttede områder ændres aldrig`, () => {
    const job = humanizeText(EXAMPLES[language], { language, intensity: 'strong' });
    for (const change of job.changes)
      assert.equal(
        job.protectedRanges.some((p) => overlaps(p, change)),
        false,
      );
    const output = getFinalText(job);
    for (const range of job.protectedRanges) assert.ok(output.includes(job.original.slice(range.start, range.end)));
  });
}

test('Tomme og tegnbaserede tekster afvises af begge funktioner', () => {
  for (const value of ['', '   ', '—…?!']) {
    assert.throws(() => humanizeText(value));
    assert.throws(() => analyzeText(value));
  }
});
test('Et kort ord bevares uden opdigtede ændringer', () => {
  const job = humanizeText('Hej', { language: 'da' });
  assert.equal(getFinalText(job), 'Hej');
  assert.equal(job.changes.length, 0);
  assert.equal(analyzeText('Hej').short, true);
});
test('En isoleret indledningsfrase må ikke blive til tom tekst', () => {
  const text = 'Det er vigtigt at bemærke, at';
  assert.equal(getFinalText(humanizeText(text, { language: 'da' })), text);
});
test('5000 ord accepteres, 5001 afvises på alle hovedveje', () => {
  const valid = 'tekst '.repeat(5000),
    over = valid + 'tekst';
  assert.equal(countWords(getFinalText(humanizeText(valid))), 5000);
  assert.equal(analyzeText(valid).words, 5000);
  for (const f of [humanizeText, analyzeText, cleanTextSafely]) assert.throws(() => f(over), /5.000/);
});
test('Intensiteten aktiverer flere regelgrupper', () => {
  const text =
    'Det er vigtigt at bemærke, at testen virker. Derudover kan vi fortsætte. Det er vigtigt at understrege, at vi bevarer indholdet.';
  const counts = ['light', 'medium', 'strong'].map(
    (intensity) => humanizeText(text, { language: 'da', intensity }).changes.length,
  );
  assert.ok(counts[0] < counts[1] && counts[1] < counts[2]);
});
test('Navne, tal, citater, valuta og fagudtryk bevares', () => {
  const text =
    'Det er vigtigt at bemærke, at Malthe Meldgaard målte BNP til 12,5 %. “Derudover kostede bilen 500 kr.” Derudover bruger Novo Nordisk social mobilitet som fagudtryk.';
  const job = humanizeText(text, { language: 'da', intensity: 'strong', protectedTerms: 'social mobilitet, BNP' });
  const out = getFinalText(job);
  for (const item of [
    'Malthe Meldgaard',
    'BNP',
    '12,5 %',
    '“Derudover kostede bilen 500 kr.”',
    'Novo Nordisk',
    'social mobilitet',
  ])
    assert.ok(out.includes(item));
  assert.ok(out.startsWith('Malthe Meldgaard'));
});
test('Brugerens fagudtryk beskytter også en ellers kendt regel', () => {
  const text = 'Derudover kan vi teste.';
  assert.equal(getFinalText(humanizeText(text, { language: 'da', protectedTerms: 'Derudover' })), text);
});
test('Tyske dass-ledsætninger beholder ordstillingen', () => {
  const text = 'Es ist wichtig zu beachten, dass der Datenschutz wichtig ist.';
  assert.equal(
    getFinalText(humanizeText(text, { language: 'de' })),
    'Zu beachten ist, dass der Datenschutz wichtig ist.',
  );
});
test('Sætningsdeling bevarer forbindelsesord, navne og negation', () => {
  const text =
    'Jeg har undersøgt flere forskellige forhold i den første del af opgaven sammen med Malthe og set på mange forskellige kilder, og vi har ikke ændret tallene fordi vores metode kræver at alle resultater behandles på samme måde.';
  const job = humanizeText(text, { language: 'da', intensity: 'strong' });
  assert.ok(job.changes.some((c) => c.type === 'split'));
  assert.ok(getFinalText(job).includes('. Og vi har ikke ændret tallene'));
});
test('Ingen ændringer foretages inde i citater, kode, URL eller e-mail', () => {
  const text = '“Derudover kan vi teste.” `in order to` https://example.com/Moreover mail@example.com';
  const job = humanizeText(text, { language: 'en', intensity: 'strong' });
  assert.equal(getFinalText(job), text);
});
test('Typografi kan renses og fortrydes uden at ændre citater eller emoji', () => {
  const text = 'Hej\u200b — verden. “Citat\u200b — 500 kr.” 👨‍👩‍👧‍👦';
  const job = addTypographyChanges(humanizeText(text, { language: 'da' }));
  const out = getFinalText(job);
  assert.ok(out.startsWith('Hej - verden.'));
  assert.ok(out.includes('“Citat\u200b — 500 kr.”'));
  assert.ok(out.includes('👨‍👩‍👧‍👦'));
  assert.equal(getFinalText(toggleAllChanges(job, false)), text);
  assert.equal(addTypographyChanges(job).changes.length, job.changes.length);
});
test('Gentagne identiske sætninger får uafhængig fortryd', () => {
  const text = 'Derudover kan vi teste. Derudover kan vi teste.';
  const job = humanizeText(text, { language: 'da' });
  const out = getFinalText(toggleChange(job, job.changes[0].id, false));
  assert.equal(out, 'Derudover kan vi teste. Desuden kan vi teste.');
});
test('Unicode-formattering giver ikke AI-scorepoint', () => {
  const plain = EXAMPLES.da,
    hidden = plain.replaceAll('teknologi', 'tek\u200bnologi');
  assert.equal(analyzeText(plain, 'da').score, analyzeText(hidden, 'da').score);
  assert.equal(analyzeText(hidden).signals.find((s) => s.id === 'unicode').points, 0);
});
test('Tyske lange sammensætninger straffes ikke for længden', () => {
  const suffix = (i) => String.fromCharCode(97 + Math.floor(i / 26)) + String.fromCharCode(97 + (i % 26));
  const short = Array.from({ length: 90 }, (_, i) => 'Wort' + suffix(i)).join(' ') + '.';
  const long = Array.from({ length: 90 }, (_, i) => 'Arbeitszeitversicherungsregelung' + suffix(i)).join(' ') + '.';
  assert.equal(analyzeText(short, 'de').vocab.value, analyzeText(long, 'de').vocab.value);
});
test('Forkortelser og decimaltal giver ikke falske sætningsbrud', () => {
  for (const [lang, text] of [
    ['da', 'Vi prøver f.eks. 12.5 på example.com. Det virker.'],
    ['de', 'Wir arbeiten z.B. in Berlin. Das funktioniert.'],
    ['en', 'Dr. Smith tried e.g. a model. It works.'],
  ])
    assert.equal(splitSentences(text, lang).length, 2);
});
test('Gemte ændringer og individuelle valg kan gendannes', () => {
  const job = humanizeText(EXAMPLES.da);
  const modified = toggleChange(job, job.changes[0].id, false);
  const restored = restoreJob(JSON.parse(JSON.stringify(modified)), job.original);
  assert.equal(getFinalText(restored), getFinalText(modified));
});
test('Ugyldige kladdepositioner og selector-id’er afvises', () => {
  const job = humanizeText(EXAMPLES.da);
  const changed = structuredClone(job);
  changed.changes[0].start = -1;
  assert.equal(restoreJob(changed, job.original), null);
  const badId = structuredClone(job);
  badId.changes[0].id = '"]';
  assert.equal(restoreJob(badId, job.original), null);
});
test('Sessionkladden gemmer, læser og rydder kun appens egen nøgle', () => {
  const entries = new Map([['andet', 'bevar']]);
  const store = {
    getItem: (k) => entries.get(k) ?? null,
    setItem: (k, v) => entries.set(k, v),
    removeItem: (k) => entries.delete(k),
  };
  assert.equal(saveDraft({ text: EXAMPLES.da }, store), true);
  assert.equal(readDraft(store).data.text, EXAMPLES.da);
  assert.equal(clearDraft(store), true);
  assert.equal(readDraft(store).data, null);
  assert.equal(entries.get('andet'), 'bevar');
});
test('Blokeret eller fuld sessionStorage giver kontrolleret fejl', () => {
  const store = {
    getItem: () => {
      throw Error();
    },
    setItem: () => {
      throw Error();
    },
    removeItem: () => {
      throw Error();
    },
  };
  assert.equal(saveDraft({ text: 'Hej' }, store), false);
  assert.equal(readDraft(store).ok, false);
  assert.equal(clearDraft(store), false);
});
