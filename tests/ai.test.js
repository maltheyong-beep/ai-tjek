// Kontrollerer eksisterende adfærd med lokale prøver og simulerede kald.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createDiffJob } from '../js/diff.js';
import { getFinalText, toggleAllChanges, toggleChange, restoreJob } from '../js/humanize-local.js';
import { humanizeWithFallback } from '../js/humanize-ai.js';
import { validateAiResponse } from '../js/ai-schema.js';
import { EXAMPLES } from '../js/i18n.js';

const endpoint = 'https://ai-tjek-test.workers.dev/humanize';
for (const [before, after] of [
  ['jeg skriver her.', 'jeg skriver lidt her.'],
  ['jeg skriver lidt her.', 'jeg skriver her.'],
  ['one two three', 'one, two. three!'],
  ['one\ntwo  three', 'one two\nthree'],
  ['same same same', 'same new same same'],
  ['hej 👩‍💻 ven', 'hej 👩‍💻 gode ven'],
  ['abc', 'xyz'],
  ['text', 'text '],
  ['text ', 'text'],
  ['a b', 'a  b'],
  ['one two one two one two', 'one two new one two one two'],
])
  test(`Præcis diff og fortryd: ${JSON.stringify(before)}`, () => {
    const job = createDiffJob(before, after, { language: 'en' });
    assert.equal(getFinalText(job), after);
    assert.equal(getFinalText(toggleAllChanges(job, false)), before);
    assert.ok(restoreJob(job, before));
    job.changes.forEach((c) => assert.equal(getFinalText(toggleChange(job, c.id, false)).includes('\ud800'), false));
  });
test('Diff rekonstruerer 200 varierede redigeringer', () => {
  let seed = 123;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 200; i++) {
    const words = Array.from({ length: 30 }, () => ['a', 'b', 'c', 'dog', 'cat'][Math.floor(random() * 5)]);
    const before = words.join(' ');
    words.splice(Math.floor(random() * 30), Math.floor(random() * 5), 'new', 'word');
    const after = words.join(' ');
    const job = createDiffJob(before, after, { language: 'en' });
    assert.equal(getFinalText(job), after);
    assert.equal(getFinalText(toggleAllChanges(job, false)), before);
  }
});
test('5000 helt forskellige ord får en begrænset og reversibel diff', () => {
  const before = Array.from({ length: 5000 }, (_, i) => `original${i}`).join(' '),
    after = Array.from({ length: 5000 }, (_, i) => `new${i}`).join(' ');
  const job = createDiffJob(before, after, { language: 'en' });
  assert.equal(getFinalText(job), after);
  assert.ok(job.coarse);
  assert.equal(getFinalText(toggleAllChanges(job, false)), before);
});
for (const language of ['da', 'de', 'en'])
  test(`${language}: manglende backend bruger lokal fallback`, async () => {
    const job = await humanizeWithFallback(
      EXAMPLES[language],
      { language },
      { endpoint: '', fetchImpl: () => assert.fail('Ingen netværkskald') },
    );
    assert.equal(job.provider, 'local');
    assert.equal(job.fallbackReason, 'NOT_CONFIGURED');
    assert.equal(job.language, language);
  });
for (const [status, reason] of [
  [429, 'RATE_LIMIT'],
  [503, 'NOT_CONFIGURED'],
  [502, 'NETWORK'],
])
  test(`HTTP ${status} giver sikker fallback`, async () => {
    const job = await humanizeWithFallback(
      'jeg skriver min tekst.',
      { language: 'da' },
      { endpoint, fetchImpl: async () => new Response('', { status }) },
    );
    assert.equal(job.fallbackReason, reason);
  });
test('Netværksfejl og ugyldig JSON giver lokal fallback', async () => {
  for (const fetchImpl of [
    async () => {
      throw Error('offline');
    },
    async () => new Response('{bad'),
  ]) {
    const job = await humanizeWithFallback('jeg skriver min tekst.', { language: 'da' }, { endpoint, fetchImpl });
    assert.equal(job.provider, 'local');
  }
});
test('Gyldigt AI-svar bliver til diff med samme sprog', async () => {
  const text = 'jeg skriver på nuværende tidspunkt min tekst.',
    output = 'jeg skriver nu min tekst.';
  const fetchImpl = async (_, options) => {
    assert.equal(JSON.parse(options.body).tone, 'school');
    assert.equal(options.credentials, 'omit');
    return Response.json({
      text: output,
      changes: [
        { før: 'på nuværende tidspunkt', efter: 'nu', type: 'filler', forklaring: 'Fyldvending gjort kortere.' },
      ],
    });
  };
  const job = await humanizeWithFallback(text, { language: 'da', tone: 'school' }, { endpoint, fetchImpl });
  assert.equal(job.provider, 'claude');
  assert.equal(getFinalText(job), output);
  assert.equal(job.changes[0].type, 'filler');
});
test('Annullering starter aldrig fallback', async () => {
  const controller = new AbortController();
  const promise = humanizeWithFallback(
    'jeg skriver tekst.',
    { signal: controller.signal },
    {
      endpoint,
      fetchImpl: (_, options) =>
        new Promise((_, reject) =>
          options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))),
        ),
    },
  );
  controller.abort();
  await assert.rejects(promise, { name: 'AbortError' });
});
test('Timeout bliver til lokal fallback', async () => {
  const job = await humanizeWithFallback(
    'jeg skriver tekst.',
    {},
    {
      endpoint,
      timeoutMs: 5,
      fetchImpl: (_, options) =>
        new Promise((_, reject) => options.signal.addEventListener('abort', () => reject(Error('timeout')))),
    },
  );
  assert.equal(job.fallbackReason, 'TIMEOUT');
});
test('AI-validering afviser ændrede navne, tal, citater og negationer', () => {
  const input = { text: 'Anna skriver ikke 42 ord og siger "hej".', language: 'da', protectedTerms: '' };
  for (const text of [
    'Anne skriver ikke 42 ord og siger "hej".',
    'Anna skriver ikke 43 ord og siger "hej".',
    'Anna skriver 42 ord og siger "hej".',
    'Anna skriver ikke 42 ord og siger "farvel".',
  ])
    assert.throws(() => validateAiResponse({ text, changes: [] }, input), /INVALID_OUTPUT/);
});

test('Individuel fortryd må ikke give en tekst over ordgrænsen', () => {
  const original = 'ord '.repeat(5000).trim();
  const changes = [
    { id: 'wording-0-0', start: 0, end: 0, before: '', after: 'nyt ', type: 'wording', reason: 'Test', enabled: true },
    {
      id: 'wording-4-8',
      start: 4,
      end: 8,
      before: original.slice(4, 8),
      after: '',
      type: 'wording',
      reason: 'Test',
      enabled: true,
    },
  ];
  const job = { original, changes };
  assert.throws(() => toggleChange(job, changes[1].id, false), /5.000/);
  assert.equal(getFinalText(job).split(/\s+/).length, 5000);
});
