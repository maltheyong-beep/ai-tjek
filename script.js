/* AI-tjek · selvstændig browserapp uden afhængigheder eller netværkskald. */
(function () {
  'use strict';

  const MAX_WORDS = 5000;
  const BASE_SCORE = 24;
  const LANGUAGES = {
    da: {
      name: 'Dansk', locale: 'da-DK', vocabularyThreshold: 0.57,
      stopwords: 'og i jeg det at en den til er som på de med han af for ikke der var mig sig men et har om vi min havde ham hun nu over da fra du ud sin dem os op man hans hvor eller hvad skal selv her alle vil blev kunne ind når være dog noget ville jo deres efter ned skulle denne end dette mit også under have dig anden hende mine alt meget sit sine vor mod disse hvis din nogle hos blive mange ad bliver hendes været thi jer sådan'.split(' '),
      transitions: ['derudover', 'desuden', 'endvidere', 'ydermere', 'sammenfattende', 'afslutningsvis', 'overordnet set', 'i denne sammenhæng', 'på den anden side', 'som følge heraf', 'ikke desto mindre'],
      cliches: ['det er vigtigt at bemærke', 'det er værd at bemærke', 'det er vigtigt at understrege', 'i en verden i konstant forandring', 'i dagens samfund', 'spiller en afgørende rolle', 'spiller en central rolle', 'en bred vifte af', 'i sidste ende', 'det kan konkluderes', 'sammenfattende kan det siges', 'på mange forskellige måder', 'i høj grad', 'med henblik på'],
      personal: ['jeg', 'mig', 'min', 'mit', 'mine', 'vi', 'os', 'vores'],
      examples: ['for eksempel', 'f.eks.', 'eksempelvis', 'jeg oplevede', 'jeg prøvede', 'i min klasse', 'på mit arbejde', 'sidste uge'],
      abbreviations: ['f.eks.', 'bl.a.', 'dvs.', 'osv.', 'm.m.', 'm.fl.', 'ca.', 'nr.', 'kl.', 'dr.', 'hr.', 'fru.', 'mio.', 'mia.'],
      conjunction: 'og', splitPronouns: 'jeg|vi|du|han|hun|de|det|den',
      rewrite: [
        ['det er vigtigt at bemærke, at', '', 'Fjern den indledende fyldvending, og begynd med selve pointen.'],
        ['det er værd at bemærke, at', '', 'Gå direkte til pointen.'],
        ['det er vigtigt at understrege, at', '', 'Gør indledningen kortere.'],
        ['sammenfattende kan det siges, at', '', 'Fjern den lange opsamling, og lad selve konklusionen stå.'],
        ['derudover', 'desuden', 'Prøv en kortere overgang, hvis den passer til sammenhængen.'],
        ['endvidere', 'desuden', 'Vælg en mere almindelig overgang.'],
        ['ydermere', 'desuden', 'Vælg en mere almindelig overgang.'],
        ['med henblik på at', 'for at', 'Erstat en formel formulering med naturligt dansk.'],
        ['i forbindelse med', 'ved', 'Gør formuleringen kortere, hvis betydningen passer.'],
        ['på nuværende tidspunkt', 'nu', 'Brug færre ord til den samme tidsangivelse.'],
        ['i dagens samfund', 'i dag', 'Gør tidsangivelsen mere enkel.']
      ],
      tipVariance: (a, b) => `Sætningerne er meget ens i længden (${a}–${b} ord). Prøv én kort hovedpointe og én længere forklaring.`,
      tipPhrase: p => `Se på “${p}”. Kan du skrive pointen direkte eller vælge en enklere formulering?`,
      tipPersonal: 'Tilføj et faktisk eksempel, en kilde eller en oplevelse, der passer til tekstens genre. Opfind ikke detaljer for at ændre scoren.',
      tipVocabulary: 'Flere betydningsord gentages. Fjern overflødige gentagelser, men behold fagord, hvor præcisionen kræver dem.',
      tipStyle: 'Overvej, om alle opremsninger, kolon og tankestreger hjælper læseren. Behold dem, der har en funktion.',
      tipDefault: 'Læs teksten højt, og ret de steder, hvor du selv ville sige det anderledes. Bevar præcise fagord og de eksempler, du kan forklare.',
      noRewrites: 'Ingen sikre regelbaserede omskrivninger fundet. Brug skriveforslagene som støtte, og redigér selv. Appen opfinder ikke personlige eksempler.',
      splitReason: 'Del en lang sætning ved en tydelig ny hovedsætning. Kontrollér, at sammenhængen er bevaret.',
      before: 'Før', after: 'Forslag', apply: 'Brug forslaget', applied: 'Forslaget er indsat. Analysér teksten igen.'
    },
    de: {
      name: 'Tysk', locale: 'de-DE', vocabularyThreshold: 0.52,
      stopwords: 'aber als am an auch auf aus bei bin bis bist da dadurch daher darum das dass dein deine dem den der des die dies diese diesem diesen dieser dieses doch dort du durch ein eine einem einen einer eines er es etwas für gegen gewesen hat hatte haben hier hin hinter ich im in ist ja jede jedem jeden jeder jedes jener jenes jetzt kann kein keine können könnte machen man mein meine mit muss nach nicht nichts noch nun nur ob oder ohne sehr sein seine selbst sich sie sind so solche solchem solchen solcher solches soll sollte sondern sonst über um und uns unsere unter viel vom von vor war waren warst was weg weil weiter welche welchem welchen welcher welches wenn werde werden wie wieder wir wird wo zu zum zur zwischen'.split(' '),
      transitions: ['darüber hinaus', 'des weiteren', 'außerdem', 'ferner', 'zudem', 'zusammenfassend', 'abschließend', 'in diesem zusammenhang', 'auf der anderen seite', 'infolgedessen', 'nichtsdestotrotz'],
      cliches: ['es ist wichtig zu beachten', 'es ist erwähnenswert', 'es ist wichtig zu betonen', 'in der heutigen gesellschaft', 'in einer sich ständig verändernden welt', 'spielt eine entscheidende rolle', 'spielt eine zentrale rolle', 'eine vielzahl von', 'von entscheidender bedeutung', 'zusammenfassend lässt sich sagen', 'abschließend lässt sich feststellen', 'im großen und ganzen', 'in vielerlei hinsicht'],
      personal: ['ich', 'mich', 'mir', 'mein', 'meine', 'meinem', 'meinen', 'wir', 'uns', 'unser', 'unsere'],
      examples: ['zum beispiel', 'z.b.', 'beispielsweise', 'ich habe erlebt', 'in meiner klasse', 'bei meiner arbeit', 'letzte woche'],
      abbreviations: ['z.B.', 'd.h.', 'u.a.', 'u.U.', 'bzw.', 'usw.', 'ca.', 'Dr.', 'Prof.', 'Nr.', 'Abs.', 'Mio.', 'Mrd.', 'ggf.'],
      conjunction: 'und', splitPronouns: 'ich|wir|du|er|sie|es|ihr',
      rewrite: [
        ['es ist wichtig zu beachten, dass', 'zu beachten ist, dass', 'Kürze die Einleitung und behalte den grammatischen Nebensatz bei.'],
        ['es ist wichtig zu betonen, dass', 'festzuhalten ist, dass', 'Formuliere die Einleitung knapper; prüfe, ob die Betonung noch passt.'],
        ['zusammenfassend lässt sich sagen, dass', 'insgesamt gilt, dass', 'Fasse die Einleitung kürzer, ohne die Wortstellung zu verändern.'],
        ['darüber hinaus', 'außerdem', 'Verwende einen einfacheren Übergang.'],
        ['des weiteren', 'außerdem', 'Verwende einen einfacheren Übergang.'],
        ['nichtsdestotrotz', 'trotzdem', 'Verwende eine kürzere, geläufige Formulierung.'],
        ['von entscheidender bedeutung', 'besonders wichtig', 'Ersetze eine formelle Wendung durch einfachere Wörter.'],
        ['in der heutigen gesellschaft', 'heute', 'Kürze die Zeitangabe, wenn das zum Inhalt passt.'],
        ['zum gegenwärtigen zeitpunkt', 'jetzt', 'Drücke die Zeitangabe direkter aus.']
      ],
      tipVariance: (a, b) => `Die Sätze sind ähnlich lang (${a}–${b} Wörter). Formuliere eine Kernaussage kurz und erkläre den nächsten Gedanken ausführlicher.`,
      tipPhrase: p => `Prüfe „${p}“. Kannst du den Gedanken direkter oder mit einer einfacheren Formulierung ausdrücken?`,
      tipPersonal: 'Ergänze ein tatsächliches Beispiel, eine Quelle oder eine eigene Erfahrung, sofern die Textsorte dazu passt. Erfinde keine Details, um den Wert zu ändern.',
      tipVocabulary: 'Mehrere Inhaltswörter wiederholen sich. Streiche unnötige Wiederholungen, aber behalte präzise Fachbegriffe und zusammengesetzte Wörter bei.',
      tipStyle: 'Prüfe, ob alle Aufzählungen, Doppelpunkte und Gedankenstriche dem Verständnis helfen. Behalte die sinnvollen bei.',
      tipDefault: 'Lies den Text laut und ändere Stellen, die du selbst anders formulieren würdest. Behalte präzise Fachbegriffe und nachvollziehbare Beispiele bei.',
      noRewrites: 'Keine passenden regelbasierten Umformulierungen gefunden. Nutze die Schreibhinweise und überarbeite den Text selbst. Die App erfindet keine persönlichen Beispiele.',
      splitReason: 'Teile einen langen Satz vor einem neuen Hauptsatz. Prüfe, ob der Zusammenhang erhalten bleibt.',
      before: 'Vorher', after: 'Vorschlag', apply: 'Vorschlag übernehmen', applied: 'Der Vorschlag wurde eingefügt. Analysiere den Text erneut.'
    },
    en: {
      name: 'Engelsk', locale: 'en-GB', vocabularyThreshold: 0.6,
      stopwords: 'a about above after again against all am an and any are as at be because been before being below between both but by can did do does doing down during each few for from further had has have having he her here hers herself him himself his how i if in into is it its itself just me more most my myself no nor not now of off on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours yourself yourselves'.split(' '),
      transitions: ['moreover', 'furthermore', 'in addition', 'additionally', 'in conclusion', 'to conclude', 'to summarize', 'to summarise', 'on the other hand', 'in this context', 'consequently', 'nevertheless', 'overall'],
      cliches: ['it is important to note', 'it is worth noting', 'it is important to emphasize', 'it is important to emphasise', 'in today’s world', "in today's world", 'in an ever-changing world', 'plays a crucial role', 'plays a pivotal role', 'a wide range of', 'a testament to', 'in the realm of', 'delve into', 'a rich tapestry', 'at the end of the day', 'in order to'],
      personal: ['i', 'me', 'my', 'mine', 'we', 'us', 'our', 'ours'],
      examples: ['for example', 'for instance', 'e.g.', 'i experienced', 'in my class', 'at my job', 'last week'],
      abbreviations: ['e.g.', 'i.e.', 'etc.', 'Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.', 'vs.', 'approx.', 'No.', 'U.S.', 'U.K.'],
      conjunction: 'and', splitPronouns: 'i|we|you|he|she|they|it',
      rewrite: [
        ['it is important to note that', '', 'Remove the introductory filler and lead with the point.'],
        ['it is worth noting that', '', 'Lead directly with the point.'],
        ['it is important to emphasize that', '', 'Use a shorter introduction.'],
        ['it is important to emphasise that', '', 'Use a shorter introduction.'],
        ['moreover', 'also', 'Try a more everyday transition.'],
        ['furthermore', 'also', 'Use a simpler transition.'],
        ['in order to', 'to', 'Use fewer words for the same purpose.'],
        ['a wide range of', 'many', 'Use a simpler expression; check that it fits the noun.'],
        ['at the present time', 'now', 'Make the time reference more direct.'],
        ["in today's world", 'today', 'Use a shorter time reference.'],
        ['in today’s world', 'today', 'Use a shorter time reference.']
      ],
      tipVariance: (a, b) => `Your sentences have similar lengths (${a}–${b} words). Make one key point briefly, then explain another in more detail.`,
      tipPhrase: p => `Look at “${p}”. Could you state the point directly or use a simpler expression?`,
      tipPersonal: 'Add an actual example, a source or a personal experience if the genre allows it. Do not invent details to change the score.',
      tipVocabulary: 'Several content words repeat. Remove unnecessary repetition, but keep technical terms where precision matters.',
      tipStyle: 'Consider whether every list, colon and dash helps the reader. Keep the ones that serve a purpose.',
      tipDefault: 'Read the text aloud and revise places where you would naturally say it differently. Keep precise terms and examples you can explain.',
      noRewrites: 'No suitable rule-based rewrites found. Use the writing suggestions and edit the text yourself. The app does not invent personal examples.',
      splitReason: 'Split a long sentence before a new main clause. Check that the connection still makes sense.',
      before: 'Before', after: 'Suggestion', apply: 'Use suggestion', applied: 'Suggestion inserted. Analyse the text again.'
    }
  };
  Object.values(LANGUAGES).forEach(c => { c.stopSet = new Set(c.stopwords); c.personalSet = new Set(c.personal); });

  const HIDDEN_NAMES = new Map([
    ['\u00ad', 'soft hyphen'], ['\u200b', 'zero-width space'], ['\u200c', 'zero-width non-joiner'], ['\u200d', 'zero-width joiner'],
    ['\ufeff', 'BOM / zero-width no-break space'], ['\u2060', 'word joiner'], ['\u200e', 'venstre-mod-højre-markør'],
    ['\u200f', 'højre-mod-venstre-markør'], ['\u061c', 'arabisk retningsmarkør'], ['\u202a', 'retningskontrol'],
    ['\u202b', 'retningskontrol'], ['\u202c', 'retningskontrol'], ['\u202d', 'retningskontrol'], ['\u202e', 'retningskontrol'],
    ['\u2066', 'retningskontrol'], ['\u2067', 'retningskontrol'], ['\u2068', 'retningskontrol'], ['\u2069', 'retningskontrol']
  ]);
  const ODD_SPACE = /[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]/u;
  const tokenRegex = () => /[\p{L}\p{M}\p{N}]+(?:['’\-‑][\p{L}\p{M}\p{N}]+)*/gu;
  const escapeRegExp = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const normalizeWord = s => s.normalize('NFC').toLocaleLowerCase().replace(/’/g, "'");
  const number = n => new Intl.NumberFormat('da-DK', { maximumFractionDigits: 1 }).format(n);
  const mean = a => a.length ? a.reduce((s, n) => s + n, 0) / a.length : 0;
  const unique = a => Array.from(new Set(a));

  function projectText(original) {
    let text = ''; const offsets = [];
    for (let i = 0; i < original.length;) {
      const char = String.fromCodePoint(original.codePointAt(i));
      if (!HIDDEN_NAMES.has(char)) {
        const replacement = ODD_SPACE.test(char) ? ' ' : char;
        text += replacement;
        for (let j = 0; j < replacement.length; j++) offsets.push(i + j);
      }
      i += char.length;
    }
    return { text, range: (start, end) => ({ start: offsets[start] ?? original.length, end: end > start ? (offsets[end - 1] ?? original.length - 1) + 1 : offsets[start] ?? original.length }) };
  }
  function getTokens(text) {
    return Array.from(text.matchAll(tokenRegex()), m => ({ text: m[0], word: normalizeWord(m[0]), start: m.index, end: m.index + m[0].length }));
  }
  function countWords(text) { return getTokens(projectText(String(text)).text).length; }

  function detectLanguage(text) {
    const tokens = getTokens(text); const scores = { da: 0, de: 0, en: 0 };
    for (const t of tokens) for (const [id, c] of Object.entries(LANGUAGES)) if (c.stopSet.has(t.word)) scores[id] += t.word.length > 2 ? 1.4 : 0.65;
    scores.da += (text.match(/[æøå]/giu) || []).length * 0.8;
    scores.de += (text.match(/[äöüß]/giu) || []).length * 0.8;
    const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const language = ranked[0][1] === 0 ? 'da' : ranked[0][0];
    return { language, confident: tokens.length >= 25 && ranked[0][1] >= 5 && ranked[0][1] - ranked[1][1] > Math.max(2, ranked[0][1] * 0.18), scores };
  }

  // Beskyt sprogets forkortelser, initialer, domæner og decimaltal mod falske sætningsbrud.
  function splitSentences(text, language) {
    const blocked = new Set(); const c = LANGUAGES[language];
    for (const abbreviation of c.abbreviations) {
      const re = new RegExp('(?<![\\p{L}\\p{N}])' + escapeRegExp(abbreviation), 'giu');
      for (const m of text.matchAll(re)) for (let j = 0; j < m[0].length; j++) if (m[0][j] === '.') blocked.add(m.index + j);
    }
    for (const m of text.matchAll(/\b\p{Lu}\.(?=\s*\p{Lu}[\p{L}-])/gu)) blocked.add(m.index + m[0].length - 1);
    const sentences = []; let start = 0;
    function add(end) {
      const raw = text.slice(start, end); const leading = raw.length - raw.trimStart().length;
      const body = raw.trim();
      if (body && getTokens(body).length) sentences.push({ text: body, start: start + leading, end: start + leading + body.length, words: getTokens(body) });
      start = end;
    }
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '\n') { add(i); start = i + 1; continue; }
      if (!/[.!?…]/u.test(text[i]) || blocked.has(i)) continue;
      if (text[i] === '.' && /[\p{L}\p{N}]/u.test(text[i - 1] || '') && /[\p{L}\p{N}]/u.test(text[i + 1] || '')) continue;
      while (i + 1 < text.length && /[.!?…"'”’»)]/u.test(text[i + 1])) i++;
      add(i + 1);
    }
    add(text.length);
    return sentences;
  }

  function findPhrases(text, phrases) {
    const hits = [];
    for (const phrase of phrases) {
      const re = new RegExp('(?<![\\p{L}\\p{N}])' + escapeRegExp(phrase).replace(/ /g, '\\s+') + '(?![\\p{L}\\p{N}])', 'giu');
      for (const m of text.matchAll(re)) hits.push({ phrase, text: m[0], start: m.index, end: m.index + m[0].length });
    }
    return hits.sort((a, b) => a.start - b.start || b.end - a.end);
  }

  function typography(text) {
    const hidden = [], spaces = [], curly = [], straight = [], emDashes = [];
    for (let i = 0; i < text.length;) {
      const char = String.fromCodePoint(text.codePointAt(i)); const hit = { start: i, end: i + char.length, char };
      if (HIDDEN_NAMES.has(char)) hidden.push({ ...hit, name: HIDDEN_NAMES.get(char), code: 'U+' + char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0') });
      if (ODD_SPACE.test(char)) spaces.push(hit);
      if (/[“”„‟‘’‚‛«»]/u.test(char)) curly.push(hit);
      if (/["']/u.test(char)) straight.push(hit);
      if (char === '—') emDashes.push(hit);
      i += char.length;
    }
    return { hidden, spaces, curly, straight, emDashes };
  }

  function vocabularyVariation(tokens, language) {
    const c = LANGUAGES[language];
    const content = tokens.filter(t => !c.stopSet.has(t.word) && /\p{L}/u.test(t.word)).map(t => t.word);
    const windowSize = Math.min(50, content.length); const ratios = [];
    if (windowSize) for (let i = 0; i <= content.length - windowSize; i += 5) ratios.push(new Set(content.slice(i, i + windowSize)).size / windowSize);
    return { value: mean(ratios), reliable: content.length >= 80, contentCount: content.length, windowSize, unique: new Set(content).size };
  }

  function analyzeText(original, requestedLanguage = 'auto') {
    original = String(original); const projection = projectText(original); const text = projection.text;
    const tokens = getTokens(text); const words = tokens.length;
    if (!words) throw new Error('Indsæt en tekst med mindst ét ord.');
    if (words > MAX_WORDS) throw new Error(`Teksten indeholder ${number(words)} ord. Fjern ${number(words - MAX_WORDS)} ord for at komme ned på maks. 5.000.`);
    const detected = detectLanguage(text);
    const language = Object.hasOwn(LANGUAGES, requestedLanguage) ? requestedLanguage : detected.language;
    const config = LANGUAGES[language]; const sentences = splitSentences(text, language);
    sentences.forEach(s => { const range = projection.range(s.start, s.end); s.originalStart = range.start; s.originalEnd = range.end; });
    const lengths = sentences.map(s => s.words.length); const average = mean(lengths);
    const deviation = Math.sqrt(mean(lengths.map(n => (n - average) ** 2)));
    const burstiness = average ? deviation / average : 0;
    const transitions = findPhrases(text, config.transitions), cliches = findPhrases(text, config.cliches);
    const examples = findPhrases(text, config.examples);
    const personalCount = tokens.filter(t => config.personalSet.has(t.word)).length;
    const numericHits = Array.from(text.matchAll(/\b\d+(?:[.,]\d+)?(?:\s*%|\s*(?:kr\.?|DKK|EUR|euro|dollars?|pounds?|kroner))?\b/giu));
    const quotePairs = (text.match(/[“„«][^”»\n]{5,}[”»]|"[^"\n]{5,}"/gu) || []).length;
    const concreteCount = examples.length + numericHits.length + quotePairs;
    const vocab = vocabularyVariation(tokens, language); const typographyData = typography(original);
    const signals = [], marks = [];
    function addSignal(id, title, points, detail, measurement) { signals.push({ id, title, points: Math.round(points), detail, measurement }); }
    function mark(range, reason, category) { if (marks.length < 1600 && range.end > range.start) marks.push({ ...projection.range(range.start, range.end), reason, category }); }

    let rhythmPoints = 0;
    if (sentences.length >= 6) rhythmPoints = burstiness < 0.2 ? 18 : burstiness < 0.35 ? 12 : burstiness < 0.45 ? 5 : burstiness > 0.75 ? -10 : burstiness > 0.55 ? -5 : 0;
    addSignal('rhythm', 'Sætningernes rytme', rhythmPoints,
      sentences.length < 6 ? 'For få sætninger til at vurdere rytmen. Signalet giver 0 point.' : rhythmPoints > 0 ? `Sætningerne ligger tæt i længde (${Math.min(...lengths)}–${Math.max(...lengths)} ord). Ens længder kan også være et bevidst stilvalg.` : rhythmPoints < 0 ? 'Korte og lange sætninger veksler. Den variation trækker ned i denne heuristik, men udelukker ikke AI.' : 'Sætningslængderne varierer uden et tydeligt yderpunkt.',
      `Spredning / gennemsnit: ${burstiness.toFixed(2)}. Kræver mindst 6 sætninger.`);
    if (rhythmPoints > 0) sentences.filter(s => Math.abs(s.words.length - average) <= Math.max(2, average * 0.2)).slice(0, 80).forEach(s => mark(s, 'Længden ligger tæt på tekstens øvrige sætninger. Lav variation i sætningslængde; ikke bevis for AI.', 'rhythm'));

    const startGroups = new Map();
    for (const s of sentences.filter(s => s.words.length >= 5)) {
      const key = s.words.slice(0, 2).map(t => t.word).join(' ');
      if (!startGroups.has(key)) startGroups.set(key, []); startGroups.get(key).push(s);
    }
    const repeatedStarts = Array.from(startGroups, ([phrase, matches]) => ({ phrase, matches })).filter(g => g.matches.length >= 3);
    const repeatedCount = repeatedStarts.reduce((n, g) => n + g.matches.length - 1, 0);
    const startPoints = Math.min(12, repeatedCount * 4);
    addSignal('starts', 'Gentagne sætningsstarter', startPoints,
      repeatedStarts.length ? repeatedStarts.map(g => `“${g.phrase}” starter ${g.matches.length} sætninger`).join('; ') + '. Gentagelser kan også bruges som et retorisk virkemiddel.' : 'Ingen sætningsstart på to ord gentages mindst tre gange.', `To indledende ord; mindst 3 gentagelser; op til +12 point.`);
    repeatedStarts.forEach(g => g.matches.forEach(s => mark({ start: s.start, end: s.start + s.words[1].end }, `Sætningsstarten “${g.phrase}” gentages ${g.matches.length} gange.`, 'starts')));

    const transitionDensity = transitions.length / words * 100;
    const transitionPoints = transitions.length >= 3 ? Math.round(clamp((transitionDensity - 0.8) * 5, 0, 14)) : 0;
    addSignal('transitions', 'Overgange og faste forbindelser', transitionPoints,
      transitions.length ? `${transitions.length} match: ${unique(transitions.map(h => `“${h.phrase}”`)).slice(0, 4).join(', ')}. Vendingerne bruges også af mennesker.` : 'Ingen match i det valgte sprogs liste over overgange.', `${number(transitionDensity)} match pr. 100 ord. Mindst 3 match; op til +14 point.`);
    transitions.forEach(h => mark(h, `Fast overgang: “${h.phrase}”. Mange af denne type vendinger kan give en skabelonpræget tekst.`, 'phrases'));

    const clichePoints = Math.min(18, cliches.length * 4);
    addSignal('cliches', 'Klichéer og formelle fyldvendinger', clichePoints,
      cliches.length ? `${cliches.length} match: ${unique(cliches.map(h => `“${h.phrase}”`)).slice(0, 3).join(', ')}. Det er sproglige mønstre, ikke sikre AI-kendetegn.` : 'Ingen match i sprogets liste over klichéer og fyldvendinger.', '4 point pr. fund; højst +18 point. Listerne er håndskrevne.');
    cliches.forEach(h => mark(h, `Kliché eller formel fyldvending: “${h.phrase}”. Undersøg, om den bidrager til indholdet.`, 'phrases'));

    const voicePoints = words < 80 ? 0 : personalCount >= 2 && concreteCount >= 1 ? -14 : concreteCount >= 2 ? -9 : personalCount >= 2 ? -6 : personalCount === 0 && concreteCount === 0 ? 6 : 0;
    addSignal('voice', 'Personlig stemme og konkrete holdepunkter', voicePoints,
      `${personalCount} personlige stedord og ${concreteCount} eksempel-, tal- eller citatmarkører. ${voicePoints > 0 ? 'Ingen af disse markører blev fundet. En upersonlig stil kan være helt rigtig i en fagtekst.' : voicePoints < 0 ? 'De konkrete holdepunkter trækker ned. Appen kan ikke kontrollere, om eksemplerne er sande.' : words < 80 ? 'Under 80 ord: signalet tæller ikke.' : 'Intet tydeligt yderpunkt i denne overfladiske måling.'}`,
      'Fra −14 til +6 point. Vurderer markører, ikke tekstens faktiske indhold.');
    if (voicePoints > 0) sentences.filter(s => s.words.length >= 14).slice(0, 3).forEach(s => mark(s, 'Her kan et faktisk eksempel eller en kilde gøre pointen mere konkret, hvis tekstens genre tillader det.', 'voice'));

    const neat = sentences.filter(s => /^[\s"“„«(]*\p{Lu}/u.test(s.text) && /[.!?…]["”’»)]*$/u.test(s.text)).length;
    const repeatedWordRe = /\b([\p{L}]{2,})\s+\1\b/giu;
    const repeatedWords = Array.from(text.matchAll(repeatedWordRe)).length;
    const punctuationNoise = (text.match(/[!?]{2,}|[,.!?][,.!?]{2,}/gu) || []).length;
    const polishPoints = words >= 100 && sentences.length >= 6 && neat === sentences.length && repeatedWords === 0 && punctuationNoise === 0 ? 3 : 0;
    addSignal('polish', 'Overfladisk korrekthed', polishPoints,
      `${neat} af ${sentences.length} sætninger har stort begyndelsesbogstav og sluttegn. Dette er ikke en grammatikkontrol og måler ikke “perfekt dansk”, tysk eller engelsk.`, 'Kun +3 point ved mindst 100 ord og 6 sætninger. Ingen staveordbog eller grammatikmodel.');

    const styleMatches = [];
    const colonMatches = Array.from(text.matchAll(/:(?!\/\/)/gu));
    const bulletMatches = Array.from(text.matchAll(/^[ \t]*(?:[-*•‣▪]|\d+[.)])\s+[^\n]+/gmu));
    const triadRe = new RegExp('[\\p{L}\\p{N}][^,.;:!?\\n]{0,45},\\s+[^,.;:!?\\n]{1,45}\\s+' + config.conjunction + '\\s+[^,.;:!?\\n]{1,45}', 'giu');
    const triads = Array.from(text.matchAll(triadRe)).filter(m => getTokens(m[0]).length <= 18);
    let stylePoints = 0;
    if (words >= 80) {
      if (typographyData.emDashes.length >= 3 && typographyData.emDashes.length / words * 100 >= 1) stylePoints += Math.min(4, typographyData.emDashes.length);
      if (colonMatches.length >= 3 && colonMatches.length / words * 100 >= 1) stylePoints += 2;
      if (bulletMatches.length >= 4) stylePoints += 2;
      if (triads.length >= 3) stylePoints += 3;
    }
    stylePoints = Math.min(8, stylePoints);
    addSignal('style', 'Tegn og opremsninger', stylePoints,
      `${typographyData.emDashes.length} lange tankestreger, ${colonMatches.length} kolon, ${bulletMatches.length} punktlinjer og ${triads.length} mulige treledsopremsninger. Almindelig tegnsætning er ikke i sig selv mistænkelig.`,
      'Tæller først ved 80 ord og gentagen brug; højst +8 point. Treledsreglen er en grov mønstermatch.');
    if (stylePoints > 0) {
      colonMatches.forEach(m => styleMatches.push({ start: m.index, end: m.index + 1, reason: 'Kolon bruges flere gange. Overvej, om opdelingen hjælper læseren.' }));
      bulletMatches.forEach(m => styleMatches.push({ start: m.index, end: m.index + m[0].length, reason: 'En af flere punktlinjer. Lister er almindelige i både menneske- og AI-tekst.' }));
      triads.forEach(m => styleMatches.push({ start: m.index, end: m.index + m[0].length, reason: 'Mulig treledsopremsning med komma og forbindelsesord. Reglen kan også ramme andre konstruktioner.' }));
      styleMatches.forEach(m => mark(m, m.reason, 'style'));
      typographyData.emDashes.forEach(m => { if (marks.length < 1600) marks.push({ ...m, reason: 'Lang tankestreg (em-dash). Flere ens tankestreger registreres som stil, ikke som forfatterbevis.', category: 'style' }); });
    }

    let vocabularyPoints = 0;
    if (vocab.reliable) vocabularyPoints = vocab.value < config.vocabularyThreshold ? Math.min(10, Math.round((config.vocabularyThreshold - vocab.value) * 35) + 3) : vocab.value > 0.86 ? -6 : 0;
    addSignal('vocabulary', 'Ordvariation · perplexity-proxy', vocabularyPoints,
      vocab.contentCount ? `${number(vocab.value * 100)} % unikke betydningsord i glidende vinduer på ${vocab.windowSize} ord. ${!vocab.reliable ? 'Under 80 betydningsord: signalet tæller ikke.' : vocabularyPoints > 0 ? 'Flere indholdsord gentages. Fagtekster kan naturligt gentage præcise termer.' : vocabularyPoints < 0 ? 'Høj ordvariation trækker lidt ned i denne heuristik.' : 'Ordvariationen giver ingen point.'}${language === 'de' ? ' Tyske sammensatte ord behandles som selvstændige ord; ordlængde straffes ikke.' : ''}` : 'For få betydningsord til at beregne variation.',
      `Proxy, ikke ægte perplexity. Sproggrænse: ${number(config.vocabularyThreshold * 100)} %. Fra −6 til +10 point.`);
    if (vocabularyPoints > 0) {
      const frequencies = new Map(); tokens.filter(t => !config.stopSet.has(t.word)).forEach(t => frequencies.set(t.word, (frequencies.get(t.word) || 0) + 1));
      const repeated = new Set(Array.from(frequencies).filter(([, n]) => n >= 5).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([w]) => w));
      tokens.filter(t => repeated.has(t.word)).slice(0, 120).forEach(t => mark(t, `Betydningsordet “${t.text}” gentages ${frequencies.get(t.word)} gange. Behold det, hvis det er en præcis fagterm.`, 'vocabulary'));
    }

    const typographyCount = typographyData.hidden.length + typographyData.spaces.length;
    addSignal('unicode', 'Usynlige tegn og typografi', 0,
      `${typographyData.hidden.length} usynlige tegn, ${typographyData.spaces.length} usædvanlige mellemrum, ${typographyData.curly.length} krøllede og ${typographyData.straight.length} rette citationstegn/apostroffer. De kan komme fra almindelig tekstbehandling og giver 0 point.`,
      'Information, altid 0 scorepoint. Ingen kontrol af statistiske AI-vandmærker.');
    for (const h of typographyData.hidden.slice(0, 120)) marks.push({ ...h, category: 'unicode', reason: `${h.name} (${h.code}). Et usynligt formateringstegn, ikke et sikkert AI-tegn. Emoji-sammenføjninger bevares ved rensning.` });
    for (const h of typographyData.spaces.slice(0, 100)) marks.push({ ...h, category: 'unicode', reason: `Usædvanligt mellemrum (U+${h.char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}). Kan stamme fra Word eller en hjemmeside.` });

    const rawScore = BASE_SCORE + signals.reduce((n, s) => n + s.points, 0);
    const score = clamp(Math.round(rawScore), 0, 100);
    const level = score < 35 ? 'low' : score < 65 ? 'medium' : 'high';
    return { original, text, language, automatic: requestedLanguage === 'auto', detectionConfident: detected.confident, words, sentences, average, lengths, burstiness, signals, marks, score, rawScore, level, transitions, cliches, repeatedStarts, personalCount, concreteCount, vocab, typography: typographyData, typographyCount, short: words < 100 || sentences.length < 6 };
  }

  function isMeaningfulJoiner(char, original, index) {
    if (char !== '\u200d' && char !== '\u200c') return false;
    const before = Array.from(original.slice(Math.max(0, index - 6), index)).pop() || '';
    const after = Array.from(original.slice(index + 1, index + 7))[0] || '';
    const emojiPart = /[\p{Extended_Pictographic}\p{Emoji_Modifier}\uFE0F]/u;
    const shapingScript = /[\p{Script=Arabic}\p{Script=Devanagari}\p{Script=Bengali}\p{Script=Tamil}]/u;
    return (emojiPart.test(before) && emojiPart.test(after)) || shapingScript.test(before + after);
  }
  function cleanText(original) {
    original = String(original); let text = '', removed = 0, normalized = 0, preserved = 0;
    for (let i = 0; i < original.length;) {
      const char = String.fromCodePoint(original.codePointAt(i));
      if (HIDDEN_NAMES.has(char)) {
        if (isMeaningfulJoiner(char, original, i)) { text += char; preserved++; } else removed++;
      } else if (ODD_SPACE.test(char)) { text += ' '; normalized++; }
      else if (/[“”„‟«»]/u.test(char)) { text += '"'; normalized++; }
      else if (/[‘’‚‛]/u.test(char)) { text += "'"; normalized++; }
      else if (/[—―]/u.test(char)) { text += ' - '; normalized++; }
      else if (/[‐‑‒–]/u.test(char)) { text += '-'; normalized++; }
      else text += char;
      i += char.length;
    }
    text = text.replace(/\r\n?/g, '\n').replace(/[^\S\n]* - [^\S\n]*/g, ' - ');
    return { text, removed, normalized, preserved };
  }

  function makeSuggestions(result) {
    const c = LANGUAGES[result.language]; const tips = [];
    if (result.signals.find(s => s.id === 'rhythm').points > 0) tips.push(c.tipVariance(Math.min(...result.lengths), Math.max(...result.lengths)));
    const phrase = result.cliches[0]?.text || result.transitions[0]?.text;
    if (phrase) tips.push(c.tipPhrase(phrase));
    if (!result.concreteCount || !result.personalCount) tips.push(c.tipPersonal);
    if (result.signals.find(s => s.id === 'vocabulary').points > 0) tips.push(c.tipVocabulary);
    if (result.signals.find(s => s.id === 'style').points > 0) tips.push(c.tipStyle);
    if (!tips.length) tips.push(c.tipDefault);
    return tips.slice(0, 5);
  }

  function capitalize(s) { return s.replace(/^([\s"'“„«(]*)(\p{L})/u, (_, pre, first) => pre + first.toLocaleUpperCase()); }
  function makeRewrites(result) {
    const c = LANGUAGES[result.language]; const rewrites = [];
    for (const sentence of result.sentences) {
      const before = sentence.text; let after = before; const reasons = [];
      for (const [phrase, replacement, reason] of c.rewrite) {
        const re = new RegExp('(?<![\\p{L}\\p{N}])' + escapeRegExp(phrase) + '(?![\\p{L}\\p{N}])', 'giu');
        if (re.test(after)) {
          re.lastIndex = 0;
          after = after.replace(re, match => /^\p{Lu}/u.test(match) ? capitalize(replacement) : replacement);
          reasons.push(reason);
        }
      }
      after = capitalize(after.replace(/^[\s,;:]+/u, '').replace(/ {2,}/g, ' '));
      if (sentence.words.length > 32) {
        const split = new RegExp(',\\s+' + c.conjunction + '\\s+(?=(' + c.splitPronouns + ')\\b)', 'iu');
        const m = split.exec(after);
        if (m && getTokens(after.slice(0, m.index)).length >= 9 && getTokens(after.slice(m.index + m[0].length)).length >= 7) {
          after = after.slice(0, m.index) + '. ' + capitalize(after.slice(m.index + m[0].length));
          reasons.push(c.splitReason);
        }
      }
      if (after && after !== before) rewrites.push({ before: result.original.slice(sentence.originalStart, sentence.originalEnd), after, start: sentence.originalStart, end: sentence.originalEnd, reason: unique(reasons).join(' ') });
      if (rewrites.length >= 8) break;
    }
    return rewrites;
  }

  const EXAMPLES = {
    da: 'I dagens samfund spiller teknologi en central rolle i vores hverdag. Det er vigtigt at bemærke, at digital udvikling påvirker mange forskellige områder. Derudover kan digitale løsninger bidrage til bedre samarbejde mellem mennesker og virksomheder. Desuden giver teknologien mulighed for at dele viden på mange forskellige måder. Derudover er det vigtigt at understrege, at udviklingen også medfører nye udfordringer. En bred vifte af digitale værktøjer kan styrke læring, samarbejde og kommunikation. Derudover kan virksomheder anvende disse løsninger med henblik på at forbedre deres arbejde. Sammenfattende kan det siges, at teknologien spiller en afgørende rolle i fremtidens samfund.\n\nEksemplet er bevidst skabelonpræget og indeholder flere faste vendinger. Det demonstrerer reglerne, men tester ikke detektorens nøjagtighed.',
    de: 'In der heutigen Gesellschaft spielt Technologie eine zentrale Rolle in unserem Alltag. Es ist wichtig zu beachten, dass die digitale Entwicklung viele unterschiedliche Bereiche beeinflusst. Darüber hinaus können digitale Lösungen die Zusammenarbeit zwischen Menschen und Unternehmen verbessern. Außerdem ermöglicht die Technologie einen einfachen und schnellen Austausch von Wissen. Darüber hinaus ist es wichtig zu betonen, dass die Entwicklung auch Herausforderungen mit sich bringt. Eine Vielzahl von digitalen Werkzeugen unterstützt Lernen, Zusammenarbeit und Kommunikation. Darüber hinaus können Unternehmen diese Lösungen für ihre tägliche Arbeit einsetzen. Zusammenfassend lässt sich sagen, dass die Technologie von entscheidender Bedeutung ist.\n\nDieses Beispiel verwendet bewusst viele feste Wendungen. Es zeigt die Regeln der App und ist kein Test ihrer Genauigkeit.',
    en: 'In today’s world, technology plays a crucial role in our daily lives. It is important to note that digital development affects many different areas. Moreover, digital solutions can improve collaboration between people and businesses in many ways. Furthermore, technology creates opportunities to share knowledge across a wide range of communities. Moreover, it is important to emphasize that these developments can also create challenges. A wide range of digital tools can support learning, collaboration and communication. Moreover, businesses can use these solutions in order to improve their everyday work. In conclusion, technology plays a pivotal role in the future of society.\n\nThis example deliberately uses several formulaic expressions. It demonstrates the app’s rules and does not test the detector’s accuracy.'
  };

  // Rene funktioner kan testes i Node uden DOM. Browseren bruger samme implementation.
  const core = { MAX_WORDS, BASE_SCORE, LANGUAGES, countWords, detectLanguage, splitSentences, analyzeText, cleanText, makeSuggestions, makeRewrites, EXAMPLES };
  if (typeof module !== 'undefined' && module.exports) module.exports = core;
  if (typeof document === 'undefined') return;

  const $ = id => document.getElementById(id);
  let currentResult = null, activeFilter = 'all', scoreFrame = 0, toastTimer = 0, cleanUndo = null;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const categories = { all: 'Alle mønstre', phrases: 'Vendinger', rhythm: 'Rytme', starts: 'Sætningsstarter', voice: 'Konkrete eksempler', style: 'Tegn & lister', vocabulary: 'Ordvariation', unicode: 'Skjulte tegn' };
  function element(tag, className, text) { const e = document.createElement(tag); if (className) e.className = className; if (text !== undefined) e.textContent = text; return e; }
  function announce(text) { $('analyse-status').textContent = text; }
  function toast(text) { clearTimeout(toastTimer); $('toast').textContent = text; $('toast').hidden = false; toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4000); }
  function invalidate(message) {
    currentResult = null; cancelAnimationFrame(scoreFrame);
    $('resultat').hidden = true; $('tomt-resultat').hidden = false; $('markering-sektion').hidden = true; $('omskrivninger').hidden = true;
    $('result-language').textContent = 'Lokal analyse'; $('humaniser').disabled = true;
    $('skriveforslag').replaceChildren(element('p', 'muted', 'Analysér en tekst for at få konkrete forslag til netop dine sætninger.'));
    if (message) $('empty-description').textContent = message;
    $('tooltip').hidden = true;
  }
  function updateInput({ invalidateResult = true } = {}) {
    const text = $('tekst').value, words = countWords(text), over = words > MAX_WORDS;
    $('ordtaeller').textContent = `${number(words)} / 5.000 ord`;
    $('ordtaeller').classList.toggle('over-limit', over);
    $('graense-fejl').hidden = !over;
    $('graense-fejl').textContent = over ? `Lidt for meget tekst: ${number(words)} ord. Fjern ${number(words - MAX_WORDS)} ord, så kan du analysere igen.` : '';
    $('tekst').setAttribute('aria-invalid', String(over));
    $('analyser').disabled = words === 0 || over;
    $('ryd').disabled = text.length === 0; $('rens').disabled = text.length === 0; $('kopier').disabled = text.length === 0;
    const choice = $('sprog').value;
    if (words) { const d = detectLanguage(projectText(text).text); const id = choice === 'auto' ? d.language : choice; $('sprog-status').textContent = `${LANGUAGES[id].name}${choice === 'auto' ? d.confident ? ' · automatisk' : ' · automatisk, usikkert' : ' · valgt'}`; }
    else $('sprog-status').textContent = 'Vælg et sprog, eller lad os registrere det.';
    if (invalidateResult && currentResult) invalidate('Teksten er ændret. Analysér igen for at opdatere resultatet.');
  }

  function animateScore(score, level) {
    cancelAnimationFrame(scoreFrame); const ring = $('score-ring'), value = $('score-value');
    $('score-gauge').dataset.level = level;
    $('score-gauge').setAttribute('aria-label', `Heuristisk AI-score: ${score} procent. Ikke en målt sandsynlighed.`);
    if (reducedMotion.matches) { ring.style.strokeDashoffset = String(100 - score); value.textContent = score; return; }
    const started = performance.now(), duration = 1000;
    const frame = now => { const t = Math.min(1, (now - started) / duration); const eased = 1 - (1 - t) ** 3; value.textContent = Math.round(score * eased); ring.style.strokeDashoffset = String(100 - score * eased); if (t < 1) scoreFrame = requestAnimationFrame(frame); };
    scoreFrame = requestAnimationFrame(frame);
  }

  function renderResult(result) {
    $('tomt-resultat').hidden = true; $('resultat').hidden = false;
    const labels = { low: 'Lav sandsynlighed', medium: 'Middel sandsynlighed', high: 'Høj sandsynlighed' };
    const descriptions = { low: 'Få eller modstridende signaler i de lokale regler. AI-brug kan stadig ikke udelukkes.', medium: 'Flere sproglige mønstre matcher reglerne. Resultatet er usikkert og afhænger af tekstens genre.', high: 'Mange mønstre matcher reglerne. En menneskeskrevet tekst kan få samme score.' };
    $('score-label').textContent = labels[result.level]; $('score-description').textContent = descriptions[result.level];
    $('certainty-label').textContent = result.short ? 'Kort tekst · ekstra usikkert' : 'Ikke statistisk valideret';
    $('result-language').textContent = `${LANGUAGES[result.language].name}${result.automatic ? ' · auto' : ''}`;
    $('stat-ord').textContent = number(result.words); $('stat-saetninger').textContent = number(result.sentences.length); $('stat-laengde').textContent = number(result.average);
    $('kort-note').hidden = !result.short;
    $('kort-note').textContent = 'Under 100 ord eller 6 sætninger: flere signaler mangler grundlag. Betragt resultatet som særligt usikkert.';
    const sorted = result.signals.filter(s => s.points !== 0).sort((a, b) => Math.abs(b.points) - Math.abs(a.points));
    const visible = sorted.length ? sorted.slice(0, 5) : result.signals.slice(0, 3);
    $('signaler').replaceChildren(...visible.map(s => {
      const node = element('div', 'signal'); const title = element('div', 'signal-title'); title.append(element('span', '', s.title), element('span', `points ${s.points > 0 ? 'up' : s.points < 0 ? 'down' : 'neutral'}`, `${s.points > 0 ? '+' : ''}${s.points} point`));
      node.append(title, element('p', '', s.detail)); return node;
    }));
    const calculation = element('div'); calculation.append(element('p', '', `24 grundpoint ${result.signals.map(s => `${s.points >= 0 ? '+' : '−'} ${Math.abs(s.points)}`).join(' ')} = ${result.rawScore}. Vist score afgrænses til 0–100: ${result.score} %.`));
    const ul = element('ul'); result.signals.forEach(s => { const li = element('li'); li.append(element('strong', '', `${s.title} (${s.points > 0 ? '+' : ''}${s.points}): `), document.createTextNode(`${s.detail} ${s.measurement}`)); ul.append(li); }); calculation.append(ul);
    const chartLabel = element('p', '', 'Ord pr. sætning (op til 40 sætninger):'); const chart = element('div', 'sentence-chart'); chart.setAttribute('aria-label', 'Diagram over sætningslængder');
    const maximum = Math.max(...result.lengths, 1); result.lengths.slice(0, 40).forEach((n, i) => { const bar = element('span'); bar.style.height = `${Math.max(3, n / maximum * 40)}px`; bar.title = `Sætning ${i + 1}: ${n} ord`; chart.append(bar); });
    calculation.append(chartLabel, chart); $('beregning').replaceChildren(calculation);
    animateScore(result.score, result.level); renderMarkedText(); renderSuggestions();
    $('humaniser').disabled = false;
    announce(`Analyse klar. ${result.score} procent heuristisk AI-score, ${labels[result.level].toLocaleLowerCase()}. Et estimat, ikke et bevis.`);
  }

  function renderMarkedText() {
    if (!currentResult) return;
    const r = currentResult; $('markering-sektion').hidden = false;
    const available = new Set(r.marks.map(m => m.category));
    const buttons = Object.entries(categories).filter(([id]) => id === 'all' || available.has(id)).map(([id, name]) => {
      const b = element('button', 'filter-button', name); b.type = 'button'; b.setAttribute('aria-pressed', String(activeFilter === id));
      b.addEventListener('click', () => { activeFilter = id; renderMarkedText(); $('markering-filtre').querySelector(`[data-filter="${id}"]`)?.focus(); }); b.dataset.filter = id; return b;
    }); $('markering-filtre').replaceChildren(...buttons);
    const chosen = r.marks.filter(m => activeFilter === 'all' || m.category === activeFilter);
    const edges = new Set([0, r.original.length]); chosen.forEach(m => { edges.add(m.start); edges.add(m.end); });
    const positions = Array.from(edges).sort((a, b) => a - b); const fragment = document.createDocumentFragment();
    for (let i = 0; i < positions.length - 1; i++) {
      const start = positions[i], end = positions[i + 1]; if (end <= start) continue;
      const matching = chosen.filter(m => m.start <= start && m.end >= end); const value = r.original.slice(start, end);
      if (!matching.length) fragment.append(document.createTextNode(value));
      else {
        const mark = element('mark', '', value); const reasons = unique(matching.map(m => m.reason)).join(' ');
        mark.dataset.reason = reasons; mark.dataset.category = matching.find(m => m.category === 'unicode')?.category || matching[0].category;
        mark.tabIndex = $('vis-markeringer').checked ? 0 : -1; mark.title = reasons; mark.setAttribute('aria-describedby', 'tooltip');
        mark.addEventListener('pointerenter', () => showTooltip(mark)); mark.addEventListener('focus', () => showTooltip(mark)); mark.addEventListener('click', () => showTooltip(mark));
        mark.addEventListener('pointerleave', () => { if (document.activeElement !== mark) $('tooltip').hidden = true; }); mark.addEventListener('blur', () => { $('tooltip').hidden = true; });
        fragment.append(mark);
      }
    }
    $('markeret-tekst').replaceChildren(fragment); $('markeret-tekst').lang = r.language; $('markeret-tekst').classList.toggle('no-marks', !$('vis-markeringer').checked);
    $('markering-note').textContent = !chosen.length ? 'Ingen match for dette filter. Det siger ikke i sig selv noget sikkert om forfatteren.' : `Markeringer viser regelmatch, ikke påvist AI-indhold.${r.marks.length >= 1600 ? ' Et udvalg af match vises for at holde siden hurtig.' : ''}`;
  }
  function showTooltip(mark) {
    if (!$('vis-markeringer').checked) return;
    const box = mark.getBoundingClientRect(); const tip = $('tooltip'); tip.textContent = mark.dataset.reason; tip.hidden = false;
    const size = tip.getBoundingClientRect(); tip.style.left = `${clamp(box.left + box.width / 2 - size.width / 2, 12, window.innerWidth - size.width - 12)}px`;
    tip.style.top = `${box.top >= size.height + 16 ? box.top - size.height - 8 : Math.min(window.innerHeight - size.height - 12, box.bottom + 8)}px`;
  }
  function renderSuggestions() {
    if (!currentResult) return; const list = element('ul'); list.lang = currentResult.language;
    makeSuggestions(currentResult).forEach(t => list.append(element('li', '', t))); $('skriveforslag').replaceChildren(list);
  }
  function runAnalysis() {
    updateInput({ invalidateResult: false }); if ($('analyser').disabled) return;
    try { const r = analyzeText($('tekst').value, $('sprog').value); currentResult = r; activeFilter = 'all'; $('omskrivninger').hidden = true; renderResult(r); }
    catch (e) { $('graense-fejl').hidden = false; $('graense-fejl').textContent = e.message; announce(e.message); }
  }

  $('tekst').addEventListener('input', () => { cleanUndo = null; $('fortryd-rens').hidden = true; $('rens-status').textContent = ''; updateInput(); });
  $('tekst').addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); runAnalysis(); } });
  $('sprog').addEventListener('change', () => updateInput());
  $('analyser').addEventListener('click', runAnalysis);
  $('ryd').addEventListener('click', () => { $('tekst').value = ''; cleanUndo = null; $('rens-status').textContent = ''; $('fortryd-rens').hidden = true; invalidate('Indsæt en tekst, og se hvilke sproglige træk der påvirker vurderingen.'); updateInput(); $('tekst').focus(); });
  $('eksempel').addEventListener('click', () => {
    const language = $('sprog').value === 'auto' ? 'da' : $('sprog').value;
    $('tekst').value = EXAMPLES[language]; cleanUndo = null; $('fortryd-rens').hidden = true; updateInput(); toast('Et skabelonpræget eksempel er indsat. Det demonstrerer reglerne, ikke nøjagtigheden.'); $('tekst').focus();
  });
  $('vis-markeringer').addEventListener('change', () => { renderMarkedText(); $('tooltip').hidden = true; });
  $('rens').addEventListener('click', () => {
    const oldText = $('tekst').value, cleaned = cleanText(oldText); cleanUndo = oldText;
    $('tekst').value = cleaned.text; updateInput(); $('fortryd-rens').hidden = oldText === cleaned.text;
    $('rens-status').textContent = `${cleaned.removed} usynlige tegn fjernet. ${cleaned.normalized} typografiske tegn normaliseret.${cleaned.preserved ? ` ${cleaned.preserved} meningsbærende sammenføjningstegn bevaret.` : ''} Teksten er opdateret i feltet.`;
    announce($('rens-status').textContent); if (currentResult) invalidate('Teksten er renset. Analysér igen for at se det opdaterede resultat.');
  });
  $('fortryd-rens').addEventListener('click', () => { if (cleanUndo === null) return; $('tekst').value = cleanUndo; cleanUndo = null; $('fortryd-rens').hidden = true; $('rens-status').textContent = 'Rensningen er fortrudt.'; updateInput(); announce('Rensningen er fortrudt.'); });
  $('kopier').addEventListener('click', async () => {
    const cleaned = cleanText($('tekst').value).text;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(cleaned); toast('Den rensede tekst er kopieret.');
    } catch (_) {
      const temporary = element('textarea'); temporary.value = cleaned; temporary.className = 'sr-only'; temporary.setAttribute('readonly', ''); document.body.append(temporary); temporary.select();
      const success = document.execCommand('copy'); temporary.remove();
      if (success) toast('Den rensede tekst er kopieret.'); else { $('tekst').focus(); $('tekst').select(); toast('Browseren blokerede kopiering. Klik “Fjern skjulte AI-tegn”, og kopiér derefter feltet manuelt.'); }
    }
  });
  $('humaniser').addEventListener('click', () => {
    if (!currentResult) return; const result = currentResult, c = LANGUAGES[result.language], rewrites = makeRewrites(result); const nodes = [];
    if (!rewrites.length) nodes.push(element('p', 'muted', c.noRewrites));
    rewrites.forEach(rewrite => {
      const item = element('article', 'rewrite'); const columns = element('div', 'rewrite-grid');
      for (const [label, text, after] of [[c.before, rewrite.before, false], [c.after, rewrite.after, true]]) { const column = element('div'); column.append(element('div', 'rewrite-label', label), element('p', `rewrite-text${after ? ' rewrite-after' : ''}`, text)); columns.append(column); }
      item.append(columns, element('p', 'rewrite-reason', rewrite.reason)); const actions = element('div', 'rewrite-actions'); const apply = element('button', 'secondary-button', c.apply); apply.type = 'button';
      apply.addEventListener('click', () => {
        const text = $('tekst').value;
        if (text.slice(rewrite.start, rewrite.end) !== rewrite.before) { toast('Teksten er ændret. Analysér igen, før du bruger forslaget.'); return; }
        $('tekst').value = text.slice(0, rewrite.start) + rewrite.after + text.slice(rewrite.end); updateInput(); cleanUndo = null; $('fortryd-rens').hidden = true; toast(c.applied); $('tekst').focus();
      }); actions.append(apply); item.append(actions); nodes.push(item);
    });
    $('omskrivning-liste').replaceChildren(...nodes); $('omskrivning-liste').lang = result.language; $('omskrivninger').hidden = false;
    $('omskrivninger').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' }); announce(`${rewrites.length} redigeringsforslag er klar.`);
  });
  $('luk-forslag').addEventListener('click', () => { $('omskrivninger').hidden = true; $('humaniser').focus(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { $('tooltip').hidden = true; $('toast').hidden = true; } });
  window.addEventListener('scroll', () => { $('tooltip').hidden = true; }, { passive: true });
  window.addEventListener('resize', () => { $('tooltip').hidden = true; });
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.remove('pending'); entry.target.classList.add('visible'); observer.unobserve(entry.target); } }), { threshold: 0.07 });
    document.querySelectorAll('.reveal').forEach(e => { e.classList.add('pending'); observer.observe(e); });
  }
  updateInput({ invalidateResult: false });
})();
