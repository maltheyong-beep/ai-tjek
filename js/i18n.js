/* Sproglister og brugerrettede tekster er samlet, så nye sprog kan tilføjes ét sted. */
export const UI = {
  brand: 'AI-tjek', beta: '2.0', skip: 'Spring til tekstfeltet', local: 'Analyse på din enhed',
  navHelp: 'Sådan virker det', eyebrow: 'KLARERE SPROG. STADIG DIN TEKST.',
  heroTitle: 'Din tekst.\nMed din egen rytme.', heroDescription: 'Omskriv forsigtigt, se hver ændring, og behold selv kontrollen. På dansk, tysk og engelsk med AI eller lokale regler.',
  humanTab: 'Humanisér tekst', analysisTab: 'Analyse', editorTitle: 'Din tekst', example: 'Prøv et eksempel',
  inputLabel: 'Tekst, der skal analyseres eller omskrives', inputPlaceholder: 'Indsæt din tekst her …\n\nVi foreslår små, synlige ændringer. Du bestemmer, hvilke der skal blive.',
  language: 'Tekstens sprog', auto: 'Registrer automatisk', da: 'Dansk', de: 'Tysk', en: 'Engelsk',
  intensity: 'Hvor meget skal ændres?', light: 'Let', medium: 'Middel', strong: 'Kraftig',
  intensityHelp: 'Middel er et forsigtigt udgangspunkt. Kraftig giver større omskrivninger. Tonevalget bruges kun af AI-modellen.',
  protectedTitle: 'Beskyt dine fagudtryk', protectedLabel: 'Fagudtryk eller navne, der skal bevares præcist',
  protectedPlaceholder: 'Fx børnefattigdom, BNP, social mobilitet', protectedHelp: 'Adskil med komma eller ny linje. Citater, tal og oplagte navne skånes også automatisk.',
  primaryHuman: 'Humanisér', primaryAnalyze: 'Analysér', clear: 'Ryd', restoreClear: 'Fortryd ryd', clean: 'Fjern skjulte AI-tegn',
  privacy: 'Ved AI-omskrivning sendes teksten til Claude via din AI-proxy. AI-score beregnes lokalt. Kladden gemmes midlertidigt i denne browserfane.',
  draftSaved: 'Gemt i denne fane', draftEmpty: 'Ingen gemt kladde', draftRestored: 'Din kladde er gendannet. Den bliver i denne fane.',
  draftFailed: 'Browseren kunne ikke gemme kladden. Kopiér teksten, før du opdaterer siden.',
  humanTitle: 'Små ændringer. Fuld kontrol.', humanIntro: 'Claude omskriver via en sikker proxy, når den er tilsluttet. Ellers bruges lokale regler. Hver ændring kan gennemgås og fortrydes.',
  emptyHuman: 'Klar til et mere naturligt sprog?', emptyHumanBody: 'Indsæt din tekst, eller prøv eksemplet. Du får et forslag med synlige ændringer.',
  emptyAnalysis: 'Et ekstra blik på dine ord.', emptyAnalysisBody: 'Analysér teksten for at se sproglige mønstre og en forklarlig score.',
  resultHuman: 'Dit forslag', resultAnalysis: 'Dit resultat', changes: 'Ændringer', retained: 'Beholdt', protected: 'Beskyttede områder',
  original: 'Original', modified: 'Ændret', compare: 'Sammenlign', originalAria: 'Vis original tekst', modifiedAria: 'Vis ændret tekst',
  compareAria: 'Sammenlign original og ændret tekst', resultTitle: 'Din tekst, med ændringerne synlige',
  copy: 'Kopiér endelig tekst', copyInput: 'Kopiér tekst', undoAll: 'Fortryd alle', restoreAll: 'Gendan alle',
  reviewTitle: 'Gennemse ændringer', reviewHint: 'Klik på en markering, eller brug Tab. Du kan også fortryde herunder.',
  before: 'Før', after: 'Efter', why: 'Hvorfor', undo: 'Fortryd', restore: 'Gendan', removed: 'fjernet',
  typeFiller: 'Fyldvending', typeTransition: 'Overgang', typeSplit: 'Sætning delt', typeTypography: 'Typografi',
  scoreBefore: 'AI-score før', scoreAfter: 'AI-score efter', scoreTitle: 'Samme lokale måling før og efter',
  scoreNote: 'Scoren kan gå op, ned eller være uændret. Den er et skøn over sproglige mønstre, ikke et bevis.',
  protectionNote: 'Læs altid forslaget igennem. Vi kontrollerer fundne navne, tal, citater og fagudtryk, men kan ikke garantere alle nuancer.',
  noChanges: 'Ingen forsigtige ændringer fundet.', noChangesBody: 'Teksten er bevaret. Prøv en anden intensitet, eller redigér selv — der bliver ikke ændret noget for ændringens skyld.',
  allUndone: 'Alle ændringer er fortrudt. Originalteksten er tilbage.', stale: 'Teksten er ændret. Kør funktionen igen for at opdatere resultatet.',
  busyHuman: 'Omskriver …', busyAI: 'Claude arbejder …', busyDiff: 'Sammenligner ordene …', busyAnalysis: 'Analyserer lokalt …', busyClean: 'Renser tegn …', busyCopy: 'Kopierer …',
  errorGeneric: 'Det lykkedes ikke. Din tekst er bevaret. Prøv igen.', copied: 'Teksten er kopieret.', copyFailed: 'Browseren blokerede kopiering. Markér og kopiér teksten manuelt.',
  exampleLoaded: 'Eksemplet er indsat. Tryk på hovedknappen for at prøve det.', cleared: 'Tekst og gemt kladde er ryddet.', clearRestored: 'Teksten er gendannet.',
  humanDone: 'Forslaget er klar.', analysisDone: 'Analysen er klar.', changedByHand: 'Kør funktionen igen efter dine rettelser.',
  analysisLabel: 'Heuristisk AI-score', analysisDisclaimer: 'Et estimat. Ikke et bevis. Procenten er en vægtet mønsterscore, ikke en målt sandsynlighed.',
  low: 'Lav sandsynlighed', mediumScore: 'Middel sandsynlighed', high: 'Høj sandsynlighed',
  shortNote: 'Kort tekst: færre signaler kan vurderes. Resultatet er ekstra usikkert.', words: 'ord', sentences: 'sætninger', meanLength: 'ord pr. sætning',
  signalsTitle: 'Det påvirker scoren', calculation: 'Se alle signaler og beregningen', marksTitle: 'Se mønstrene i teksten',
  marksNote: 'Markeringer viser regelmatch, ikke påvist AI-indhold.', marksEmpty: 'Ingen mønstre blev markeret. Det udelukker ikke AI.',
  knowledgeTitle: 'Forstå forskellen på form og forfatter.',
  knowledgeOneTitle: 'Hvad bliver ændret?', knowledgeOne: 'AI-modellen instrueres i at bevare betydning, navne, tal, citater og fagudtryk. Svaret kontrolleres, og forskellene markeres ord for ord. Ved fejl bruges forsigtige lokale regler. Læs altid ændringerne igennem.',
  knowledgeTwoTitle: 'Hvad siger scoren?', knowledgeTwo: 'Vi måler bl.a. sætningsrytme, gentagelser og ordvariation. Det er ikke ægte perplexity eller en sikker test af, hvem der har skrevet teksten.',
  knowledgeThreeTitle: 'Hvor sendes teksten hen?', knowledgeThree: 'Med en tilsluttet proxy sendes teksten til Cloudflare og Claude til omskrivning. Worker-koden gemmer eller logger ikke teksten; Anthropics egne vilkår gælder. Den lokale fallback og AI-score sender ikke teksten. Kladden bliver midlertidigt i denne fane, til du rydder den.',
  languageNote: 'AI-detektion er generelt bedst undersøgt og trænet på engelsk og mere usikker på dansk og tysk. Denne apps nøjagtighed er ikke valideret på noget sprog.',
  methodTitle: 'Begrænsninger, privatliv og kilder',
  methodBody: 'AI-scoren er 24 grundpoint plus håndvægtede sproglige signaler, afgrænset til 0–100. Under 35 vises som lav, 35–64 som middel og fra 65 som høj. Kategorierne er ikke statistisk kalibrerede. Der er ingen fuld grammatikkontrol. En menneskeskrevet tekst kan få høj score, og en AI-tekst kan få lav score.',
  cleanNote: 'Usynlige tegn kommer også fra Word og kopiering. De tæller 0 point og er ikke statistiske AI-vandmærker. Rensning skåner citater, tal og beskyttede fagudtryk.',
  footer: 'Bygget til redigering med omtanke. Et estimat, ikke et bevis.', source: 'Kildekode på GitHub', research: 'Forskning om begrænsninger', multilingual: 'Flersproget AI-detektion',
  ready: 'Klar', pending: 'Arbejder …', tabHuman: 'Humanisér', tabAnalysis: 'Analyse',
  tone: 'Tone', neutral: 'Neutral', school: 'Skole', casual: 'Casual', cancel: 'Annullér', cancelled: 'Omskrivningen er annulleret. Din tekst er bevaret.',
  keep: 'Behold', closeSheet: 'Luk ændring', sheetTitle: 'Se ændringen', providerAI: 'Omskrevet med Claude', providerLocal: 'Omskrevet med lokale regler',
  localLoading: 'Teksten omskrives med lokale regler. Den sendes ingen steder.', aiLoading: 'Teksten omskrives hos AI-tjenesten. Du kan annullere når som helst.',
  fallbackSetup: 'AI-backend er ikke klar. Forslaget er lavet med lokale regler.',
  fallbackNetwork: 'AI-omskrivningen mislykkedes. Vi har i stedet brugt lokale regler. Tonevalget påvirker kun AI-omskrivning.',
  fallbackRate: 'Grænsen for AI-kald er nået. Vi har i stedet brugt lokale regler. Prøv AI igen senere.',
  fallbackInvalid: 'AI-svaret kunne ikke godkendes. Vi har brugt lokale regler for at skåne dit indhold.',
  fallbackTimeout: 'AI-tjenesten svarede ikke i tide. Vi har brugt lokale regler i stedet.',
  scoreNotLower: 'AI-scoren faldt ikke. Du kan prøve en kraftigere intensitet, men vælg først og fremmest den tekst, der bevarer din mening. Scoren er ikke et bevis.',
  ownTextNote: 'Brug kun værktøjet til at forbedre dine egne tekster, og følg reglerne på din skole eller arbejdsplads.',
  aiServerNotReady: 'AI-proxy kræver opsætning. Lokal fallback er klar.', aiServerConfigured: 'AI-proxy er angivet. Teksten sendes først, når du trykker Humanisér.',
  typeWording: 'Formulering', coarseDiff: 'En større omskrivning er samlet i ét område for at holde visningen hurtig.',
  navAria: 'Hovednavigation', modeAria: 'Vælg funktion', viewAria: 'Tekstvisning', legendAria: 'Farver for ændringstyper', documentAria: 'Omskrevet tekst med markerede ændringer'
};

export const COPY = {
  emptyError: 'Indsæt en tekst med mindst ét ord.',
  limitError: (words, extra) => `Teksten indeholder ${words.toLocaleString('da-DK')} ord. Fjern ${extra.toLocaleString('da-DK')} ord for at komme ned på maks. 5.000.`,
  count: n => `${n.toLocaleString('da-DK')} / 5.000 ord`,
  language: (name, automatic, confident) => `${name}${automatic ? confident ? ' · automatisk' : ' · automatisk, usikkert' : ' · valgt'}`,
  kept: (active, total) => `${active} af ${total} ændringer beholdt`,
  protected: n => `${n} områder er beskyttet`,
  skipped: n => n ? `${n} mulige ændringer blev sprunget over for at skåne beskyttet tekst.` : '',
  cleanDone: (changes, skipped) => `${changes} typografiske ændringer foreslået.${skipped ? ` ${skipped} tegn i beskyttede områder er bevaret.` : ''}`,
  toggled: (id, enabled) => `Ændring ${id} er ${enabled ? 'gendannet' : 'fortrudt'}.`,
  changeLabel: (index, type) => `Ændring ${index}: ${type}. Vis før, efter og forklaring.`,
  points: n => `${n > 0 ? '+' : ''}${n} point`,
  gauge: n => `Heuristisk AI-score: ${n} procent. Ikke en målt sandsynlighed.`,
  calculation: (raw, score) => `24 grundpoint plus signalerne giver ${raw} point. Afgrænset til 0–100: ${score} %.`,
  description: { low: 'Få eller modstridende mønstre i de lokale regler.', medium: 'Flere signaler matcher reglerne. Genre og sprog påvirker resultatet.', high: 'Mange mønstre matcher reglerne. Et menneske kan skrive på samme måde.' },
  unknownRule: 'Ukendt ændringstype.', invalidDraft: 'Den gemte kladde kunne ikke gendannes fuldt. Kontrollér teksten før du fortsætter.',
  rhythmMark: 'Længden ligger tæt på de øvrige sætninger. Ens rytme er ikke i sig selv et AI-bevis.',
  phraseMark: phrase => `Fast vending: “${phrase}”. Undersøg, om den bidrager til indholdet.`,
  startMark: (phrase, count) => `“${phrase}” starter ${count} sætninger. Gentagelse kan også være et retorisk virkemiddel.`,
  styleMark: 'Gentaget brug af tegn eller opremsning. Det kan være et bevidst stilvalg.',
  vocabularyMark: (word, count) => `“${word}” bruges ${count} gange. Behold det, hvis det er en præcis fagterm.`,
  unicodeMark: name => `${name}. Et formateringstegn, ikke et sikkert AI-tegn.`,
  voiceMark: 'Et konkret eksempel kan være nyttigt her, hvis tekstens genre tillader det.'
};

export const SIGNAL_COPY = {
  rhythm: d => ({ title: 'Sætningernes rytme', detail: d.count < 6 ? 'For få sætninger til at vurdere rytmen.' : `Længder fra ${d.min} til ${d.max} ord. ${d.points > 0 ? 'Ens længder trækker op i denne heuristik.' : d.points < 0 ? 'Skift mellem korte og lange sætninger trækker ned.' : 'Ingen tydelig yderlighed.'}`, measurement: `Spredning / gennemsnit: ${d.value.toFixed(2)}. Mindst 6 sætninger; −10 til +18 point.` }),
  starts: d => ({ title: 'Gentagne sætningsstarter', detail: d.groups.length ? d.groups.map(g => `“${g.phrase}”: ${g.matches.length} gange`).join('; ') : 'Ingen start på to ord gentages mindst tre gange.', measurement: 'Mindst tre sætninger med fem ord. Op til +12 point.' }),
  transitions: d => ({ title: 'Overgange', detail: `${d.hits.length} match${d.sample ? ': ' + d.sample : ''}. Vendingerne bruges også af mennesker.`, measurement: 'Mindst 3 match; tæthed pr. 100 ord; op til +14 point.' }),
  cliches: d => ({ title: 'Klichéer og fyldvendinger', detail: `${d.hits.length} match${d.sample ? ': ' + d.sample : ''}. Det er sprogmønstre, ikke forfatterbevis.`, measurement: '+4 point pr. match; højst +18.' }),
  voice: d => ({ title: 'Stemme og konkrete holdepunkter', detail: `${d.personal} personlige stedord og ${d.concrete} eksempel-, tal- eller citatmarkører. Appen kontrollerer ikke, om eksemplerne er sande.`, measurement: 'Mindst 80 ord. Fra −14 til +6 point. En fagtekst kan med god grund være upersonlig.' }),
  polish: d => ({ title: 'Overfladisk korrekthed', detail: `${d.neat} af ${d.count} sætninger har stort begyndelsesbogstav og sluttegn. Ingen fuld stave- eller grammatikkontrol.`, measurement: 'Mindst 100 ord og 6 sætninger. Højst +3 point.' }),
  style: d => ({ title: 'Tegn og opremsninger', detail: `${d.dashes} lange tankestreger, ${d.colons} kolon, ${d.bullets} punktlinjer og ${d.triads} mulige treledsopremsninger.`, measurement: 'Mindst 80 ord og gentagen brug; højst +8 point.' }),
  vocabulary: d => ({ title: 'Ordvariation', detail: `${Math.round(d.value * 100)} % unikke betydningsord i vinduer på ${d.windowSize} ord. ${d.reliable ? 'En simpel proxy, ikke ægte perplexity.' : 'For få betydningsord: signalet giver 0 point.'}${d.language === 'de' ? ' Sammensatte ord straffes ikke for længden.' : ''}`, measurement: 'Mindst 80 betydningsord. Sproggrænser: DA 57 %, DE 52 %, EN 60 %. Fra −6 til +10 point.' }),
  unicode: d => ({ title: 'Skjulte tegn og typografi', detail: `${d.hidden} usynlige tegn, ${d.spaces} specielle mellemrum, ${d.curly} krøllede og ${d.straight} rette citationstegn/apostroffer.`, measurement: 'Altid 0 point. Kan stamme fra normal tekstbehandling.' })
};

export const HUMAN_RULES = {
  da: [
    ['note', 'det er vigtigt at bemærke, at', '', 'filler', 1, true],
    ['worth', 'det er værd at bemærke, at', '', 'filler', 1, true],
    ['purpose', 'med henblik på at', 'for at', 'filler', 1, false],
    ['currently', 'på nuværende tidspunkt', 'nu', 'filler', 1, false],
    ['moreover', 'derudover', 'desuden', 'transition', 2, false],
    ['furthermore', 'endvidere', 'desuden', 'transition', 2, false],
    ['additionally', 'ydermere', 'desuden', 'transition', 2, false],
    ['conclusion', 'sammenfattende kan det siges, at', '', 'filler', 2, true],
    ['emphasis', 'det er vigtigt at understrege, at', '', 'filler', 3, true],
    ['purpose-long', 'med det formål at', 'for at', 'filler', 3, false]
  ],
  de: [
    ['note', 'es ist wichtig zu beachten, dass', 'zu beachten ist, dass', 'filler', 1, true],
    ['currently', 'zum gegenwärtigen zeitpunkt', 'derzeit', 'filler', 1, false],
    ['moreover', 'darüber hinaus', 'außerdem', 'transition', 2, false],
    ['furthermore', 'des weiteren', 'außerdem', 'transition', 2, false],
    ['conclusion', 'zusammenfassend lässt sich sagen, dass', 'insgesamt gilt, dass', 'filler', 2, true],
    ['nevertheless', 'nichtsdestotrotz', 'trotzdem', 'transition', 3, false],
    ['emphasis', 'es ist wichtig zu betonen, dass', 'festzuhalten ist, dass', 'filler', 3, true]
  ],
  en: [
    ['note', 'it is important to note that', '', 'filler', 1, true],
    ['worth', 'it is worth noting that', '', 'filler', 1, true],
    ['purpose', 'in order to', 'to', 'filler', 1, false],
    ['currently', 'at the present time', 'currently', 'filler', 1, false],
    ['moreover', 'moreover', 'also', 'transition', 2, false],
    ['furthermore', 'furthermore', 'also', 'transition', 2, false],
    ['additional', 'additionally', 'also', 'transition', 2, false],
    ['emphasis-us', 'it is important to emphasize that', '', 'filler', 3, true],
    ['emphasis-uk', 'it is important to emphasise that', '', 'filler', 3, true],
    ['purpose-long', 'for the purpose of', 'for', 'filler', 3, false]
  ]
};

export const HUMAN_REASONS = {
  da: { filler: 'En indledende fyldvending er fjernet eller gjort kortere. Selve påstanden bevares.', transition: 'En formel overgang er erstattet af en kortere, almindelig overgang.', split: 'En lang sætning er delt foran en ny hovedsætning. Forbindelsesordet bevares.', typography: 'Et usynligt formateringstegn eller en tankestreg er normaliseret uden for beskyttet tekst.' },
  de: { filler: 'Eine einleitende Wendung wurde gekürzt. Die eigentliche Aussage bleibt erhalten.', transition: 'Ein formeller Übergang wurde durch einen kürzeren, geläufigen Übergang ersetzt.', split: 'Ein langer Satz wurde vor einem neuen Hauptsatz geteilt. Die Konjunktion bleibt erhalten.', typography: 'Ein unsichtbares Formatierungszeichen oder Gedankenstrich wurde außerhalb geschützter Textstellen normalisiert.' },
  en: { filler: 'An introductory or wordy expression was shortened. The underlying statement is retained.', transition: 'A formal transition was replaced with a shorter, everyday transition.', split: 'A long sentence was split before a new main clause. The conjunction is retained.', typography: 'An invisible formatting character or dash was normalized outside protected text.' }
};
export const AI_REASONS = {
  da: 'Formuleringen er omskrevet. Læs før og efter, og behold kun ændringen, hvis betydningen er den samme.',
  de: 'Die Formulierung wurde überarbeitet. Vergleiche beide Fassungen und behalte die Änderung nur, wenn die Bedeutung gleich bleibt.',
  en: 'The wording was revised. Compare both versions and keep the change only if the meaning remains the same.'
};
export const NEGATIONS = {
  da: ['ikke', 'aldrig', 'ingen', 'intet', 'uden'],
  de: ['nicht', 'nie', 'niemals', 'kein', 'keine', 'keinen', 'keinem', 'keiner', 'keines', 'ohne'],
  en: ['not', 'never', 'no', 'without', 'neither', "don't", "doesn't", "didn't", "isn't", "aren't", "wasn't", "weren't", "can't", "cannot", "won't"]
};
export const API_ERRORS = {
  ORIGIN: 'Denne hjemmeside har ikke adgang til AI-proxyen.', METHOD: 'Brug POST til denne funktion.', PATH: 'Adressen findes ikke.',
  INPUT: 'Kontrollér tekst, sprog, intensitet og tone.', TOO_LARGE: 'Teksten er for stor. Brug højst 5.000 ord og en kort liste over fagudtryk.',
  NOT_CONFIGURED: 'AI-proxyen mangler opsætning.', RATE_LIMIT: 'Du har brugt 10 AI-kald inden for den seneste time. Prøv igen senere.',
  UPSTREAM: 'AI-tjenesten er ikke tilgængelig lige nu.', INVALID_OUTPUT: 'AI-svaret kunne ikke valideres efter to forsøg.', TIMEOUT: 'AI-tjenesten svarede ikke i tide.', INTERNAL: 'AI-proxyen kunne ikke behandle kaldet.'
};
export const DEFAULT_PROTECTED = {
  da: ['perplexity', 'burstiness', 'bruttonationalprodukt', 'børnefattigdom', 'social mobilitet', 'international økonomi'],
  de: ['Perplexity', 'Burstiness', 'Bruttoinlandsprodukt', 'Kinderarmut', 'Chancengleichheit', 'Datenschutz'],
  en: ['perplexity', 'burstiness', 'gross domestic product', 'child poverty', 'social mobility', 'machine learning']
};
export const LANGUAGES = {
  da: {
    name: "Dansk",
    locale: "da-DK",
    vocabularyThreshold: 0.57,
    stopwords: ["og","i","jeg","det","at","en","den","til","er","som","på","de","med","han","af","for","ikke","der","var","mig","sig","men","et","har","om","vi","min","havde","ham","hun","nu","over","da","fra","du","ud","sin","dem","os","op","man","hans","hvor","eller","hvad","skal","selv","her","alle","vil","blev","kunne","ind","når","være","dog","noget","ville","jo","deres","efter","ned","skulle","denne","end","dette","mit","også","under","have","dig","anden","hende","mine","alt","meget","sit","sine","vor","mod","disse","hvis","din","nogle","hos","blive","mange","ad","bliver","hendes","været","thi","jer","sådan"],
    transitions: ["derudover","desuden","endvidere","ydermere","sammenfattende","afslutningsvis","overordnet set","i denne sammenhæng","på den anden side","som følge heraf","ikke desto mindre"],
    cliches: ["det er vigtigt at bemærke","det er værd at bemærke","det er vigtigt at understrege","i en verden i konstant forandring","i dagens samfund","spiller en afgørende rolle","spiller en central rolle","en bred vifte af","i sidste ende","det kan konkluderes","sammenfattende kan det siges","på mange forskellige måder","i høj grad","med henblik på"],
    personal: ["jeg","mig","min","mit","mine","vi","os","vores"],
    examples: ["for eksempel","f.eks.","eksempelvis","jeg oplevede","jeg prøvede","i min klasse","på mit arbejde","sidste uge"],
    abbreviations: ["f.eks.","bl.a.","dvs.","osv.","m.m.","m.fl.","ca.","nr.","kl.","dr.","hr.","fru.","mio.","mia."],
    conjunction: "og",
    splitPronouns: "jeg|vi|du|han|hun|de|det|den",
    tipVariance: (a, b) => `Sætningerne er meget ens i længden (${a}–${b} ord). Prøv én kort hovedpointe og én længere forklaring.`,
    tipPhrase: p => `Se på “${p}”. Kan du skrive pointen direkte eller vælge en enklere formulering?`,
    tipPersonal: "Tilføj et faktisk eksempel, en kilde eller en oplevelse, der passer til tekstens genre. Opfind ikke detaljer for at ændre scoren.",
    tipVocabulary: "Flere betydningsord gentages. Fjern overflødige gentagelser, men behold fagord, hvor præcisionen kræver dem.",
    tipStyle: "Overvej, om alle opremsninger, kolon og tankestreger hjælper læseren. Behold dem, der har en funktion.",
    tipDefault: "Læs teksten højt, og ret de steder, hvor du selv ville sige det anderledes. Bevar præcise fagord og de eksempler, du kan forklare.",
    noRewrites: "Ingen sikre regelbaserede omskrivninger fundet. Brug skriveforslagene som støtte, og redigér selv. Appen opfinder ikke personlige eksempler.",
    splitReason: "Del en lang sætning ved en tydelig ny hovedsætning. Kontrollér, at sammenhængen er bevaret.",
    before: "Før",
    after: "Forslag",
    apply: "Brug forslaget",
    applied: "Forslaget er indsat. Analysér teksten igen."
  },
  de: {
    name: "Tysk",
    locale: "de-DE",
    vocabularyThreshold: 0.52,
    stopwords: ["aber","als","am","an","auch","auf","aus","bei","bin","bis","bist","da","dadurch","daher","darum","das","dass","dein","deine","dem","den","der","des","die","dies","diese","diesem","diesen","dieser","dieses","doch","dort","du","durch","ein","eine","einem","einen","einer","eines","er","es","etwas","für","gegen","gewesen","hat","hatte","haben","hier","hin","hinter","ich","im","in","ist","ja","jede","jedem","jeden","jeder","jedes","jener","jenes","jetzt","kann","kein","keine","können","könnte","machen","man","mein","meine","mit","muss","nach","nicht","nichts","noch","nun","nur","ob","oder","ohne","sehr","sein","seine","selbst","sich","sie","sind","so","solche","solchem","solchen","solcher","solches","soll","sollte","sondern","sonst","über","um","und","uns","unsere","unter","viel","vom","von","vor","war","waren","warst","was","weg","weil","weiter","welche","welchem","welchen","welcher","welches","wenn","werde","werden","wie","wieder","wir","wird","wo","zu","zum","zur","zwischen"],
    transitions: ["darüber hinaus","des weiteren","außerdem","ferner","zudem","zusammenfassend","abschließend","in diesem zusammenhang","auf der anderen seite","infolgedessen","nichtsdestotrotz"],
    cliches: ["es ist wichtig zu beachten","es ist erwähnenswert","es ist wichtig zu betonen","in der heutigen gesellschaft","in einer sich ständig verändernden welt","spielt eine entscheidende rolle","spielt eine zentrale rolle","eine vielzahl von","von entscheidender bedeutung","zusammenfassend lässt sich sagen","abschließend lässt sich feststellen","im großen und ganzen","in vielerlei hinsicht"],
    personal: ["ich","mich","mir","mein","meine","meinem","meinen","wir","uns","unser","unsere"],
    examples: ["zum beispiel","z.b.","beispielsweise","ich habe erlebt","in meiner klasse","bei meiner arbeit","letzte woche"],
    abbreviations: ["z.B.","d.h.","u.a.","u.U.","bzw.","usw.","ca.","Dr.","Prof.","Nr.","Abs.","Mio.","Mrd.","ggf."],
    conjunction: "und",
    splitPronouns: "ich|wir|du|er|sie|es|ihr",
    tipVariance: (a, b) => `Die Sätze sind ähnlich lang (${a}–${b} Wörter). Formuliere eine Kernaussage kurz und erkläre den nächsten Gedanken ausführlicher.`,
    tipPhrase: p => `Prüfe „${p}“. Kannst du den Gedanken direkter oder mit einer einfacheren Formulierung ausdrücken?`,
    tipPersonal: "Ergänze ein tatsächliches Beispiel, eine Quelle oder eine eigene Erfahrung, sofern die Textsorte dazu passt. Erfinde keine Details, um den Wert zu ändern.",
    tipVocabulary: "Mehrere Inhaltswörter wiederholen sich. Streiche unnötige Wiederholungen, aber behalte präzise Fachbegriffe und zusammengesetzte Wörter bei.",
    tipStyle: "Prüfe, ob alle Aufzählungen, Doppelpunkte und Gedankenstriche dem Verständnis helfen. Behalte die sinnvollen bei.",
    tipDefault: "Lies den Text laut und ändere Stellen, die du selbst anders formulieren würdest. Behalte präzise Fachbegriffe und nachvollziehbare Beispiele bei.",
    noRewrites: "Keine passenden regelbasierten Umformulierungen gefunden. Nutze die Schreibhinweise und überarbeite den Text selbst. Die App erfindet keine persönlichen Beispiele.",
    splitReason: "Teile einen langen Satz vor einem neuen Hauptsatz. Prüfe, ob der Zusammenhang erhalten bleibt.",
    before: "Vorher",
    after: "Vorschlag",
    apply: "Vorschlag übernehmen",
    applied: "Der Vorschlag wurde eingefügt. Analysiere den Text erneut."
  },
  en: {
    name: "Engelsk",
    locale: "en-GB",
    vocabularyThreshold: 0.6,
    stopwords: ["a","about","above","after","again","against","all","am","an","and","any","are","as","at","be","because","been","before","being","below","between","both","but","by","can","did","do","does","doing","down","during","each","few","for","from","further","had","has","have","having","he","her","here","hers","herself","him","himself","his","how","i","if","in","into","is","it","its","itself","just","me","more","most","my","myself","no","nor","not","now","of","off","on","once","only","or","other","our","ours","ourselves","out","over","own","same","she","should","so","some","such","than","that","the","their","theirs","them","themselves","then","there","these","they","this","those","through","to","too","under","until","up","very","was","we","were","what","when","where","which","while","who","whom","why","will","with","would","you","your","yours","yourself","yourselves"],
    transitions: ["moreover","furthermore","in addition","additionally","in conclusion","to conclude","to summarize","to summarise","on the other hand","in this context","consequently","nevertheless","overall"],
    cliches: ["it is important to note","it is worth noting","it is important to emphasize","it is important to emphasise","in today’s world","in today's world","in an ever-changing world","plays a crucial role","plays a pivotal role","a wide range of","a testament to","in the realm of","delve into","a rich tapestry","at the end of the day","in order to"],
    personal: ["i","me","my","mine","we","us","our","ours"],
    examples: ["for example","for instance","e.g.","i experienced","in my class","at my job","last week"],
    abbreviations: ["e.g.","i.e.","etc.","Mr.","Mrs.","Ms.","Dr.","Prof.","vs.","approx.","No.","U.S.","U.K."],
    conjunction: "and",
    splitPronouns: "i|we|you|he|she|they|it",
    tipVariance: (a, b) => `Your sentences have similar lengths (${a}–${b} words). Make one key point briefly, then explain another in more detail.`,
    tipPhrase: p => `Look at “${p}”. Could you state the point directly or use a simpler expression?`,
    tipPersonal: "Add an actual example, a source or a personal experience if the genre allows it. Do not invent details to change the score.",
    tipVocabulary: "Several content words repeat. Remove unnecessary repetition, but keep technical terms where precision matters.",
    tipStyle: "Consider whether every list, colon and dash helps the reader. Keep the ones that serve a purpose.",
    tipDefault: "Read the text aloud and revise places where you would naturally say it differently. Keep precise terms and examples you can explain.",
    noRewrites: "No suitable rule-based rewrites found. Use the writing suggestions and edit the text yourself. The app does not invent personal examples.",
    splitReason: "Split a long sentence before a new main clause. Check that the connection still makes sense.",
    before: "Before",
    after: "Suggestion",
    apply: "Use suggestion",
    applied: "Suggestion inserted. Analyse the text again."
  },
};
Object.values(LANGUAGES).forEach(c => { c.stopSet = new Set(c.stopwords); c.personalSet = new Set(c.personal); });
export const EXAMPLES = {
  "da": "I dagens samfund spiller teknologi en central rolle i vores hverdag. Det er vigtigt at bemærke, at digital udvikling påvirker mange forskellige områder. Derudover kan digitale løsninger bidrage til bedre samarbejde mellem mennesker og virksomheder. Desuden giver teknologien mulighed for at dele viden på mange forskellige måder. Derudover er det vigtigt at understrege, at udviklingen også medfører nye udfordringer. En bred vifte af digitale værktøjer kan styrke læring, samarbejde og kommunikation. Derudover kan virksomheder anvende disse løsninger med henblik på at forbedre deres arbejde. Sammenfattende kan det siges, at teknologien spiller en afgørende rolle i fremtidens samfund.\n\nEksemplet er bevidst skabelonpræget og indeholder flere faste vendinger. Det demonstrerer reglerne, men tester ikke detektorens nøjagtighed.",
  "de": "In der heutigen Gesellschaft spielt Technologie eine zentrale Rolle in unserem Alltag. Es ist wichtig zu beachten, dass die digitale Entwicklung viele unterschiedliche Bereiche beeinflusst. Darüber hinaus können digitale Lösungen die Zusammenarbeit zwischen Menschen und Unternehmen verbessern. Außerdem ermöglicht die Technologie einen einfachen und schnellen Austausch von Wissen. Darüber hinaus ist es wichtig zu betonen, dass die Entwicklung auch Herausforderungen mit sich bringt. Eine Vielzahl von digitalen Werkzeugen unterstützt Lernen, Zusammenarbeit und Kommunikation. Darüber hinaus können Unternehmen diese Lösungen für ihre tägliche Arbeit einsetzen. Zusammenfassend lässt sich sagen, dass die Technologie von entscheidender Bedeutung ist.\n\nDieses Beispiel verwendet bewusst viele feste Wendungen. Es zeigt die Regeln der App und ist kein Test ihrer Genauigkeit.",
  "en": "In today’s world, technology plays a crucial role in our daily lives. It is important to note that digital development affects many different areas. Moreover, digital solutions can improve collaboration between people and businesses in many ways. Furthermore, technology creates opportunities to share knowledge across a wide range of communities. Moreover, it is important to emphasize that these developments can also create challenges. A wide range of digital tools can support learning, collaboration and communication. Moreover, businesses can use these solutions in order to improve their everyday work. In conclusion, technology plays a pivotal role in the future of society.\n\nThis example deliberately uses several formulaic expressions. It demonstrates the app’s rules and does not test the detector’s accuracy."
};
  export const HIDDEN_NAMES = new Map([
    ['\u00ad', 'soft hyphen'], ['\u200b', 'zero-width space'], ['\u200c', 'zero-width non-joiner'], ['\u200d', 'zero-width joiner'],
    ['\ufeff', 'BOM / zero-width no-break space'], ['\u2060', 'word joiner'], ['\u200e', 'venstre-mod-højre-markør'],
    ['\u200f', 'højre-mod-venstre-markør'], ['\u061c', 'arabisk retningsmarkør'], ['\u202a', 'retningskontrol'],
    ['\u202b', 'retningskontrol'], ['\u202c', 'retningskontrol'], ['\u202d', 'retningskontrol'], ['\u202e', 'retningskontrol'],
    ['\u2066', 'retningskontrol'], ['\u2067', 'retningskontrol'], ['\u2068', 'retningskontrol'], ['\u2069', 'retningskontrol']
  ]);
  export const ODD_SPACE = /[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]/u;
