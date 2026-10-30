// Samler COPY til appens fælles sproglag.
export const COPY = {
  combinationError:
    'Denne kombination af ændringer giver en tom tekst eller mere end 5.000 ord. Brug Fortryd alle, eller vælg en anden ændring først.',
  emptyError: 'Indsæt en tekst med mindst ét ord.',
  limitError: (words, extra) =>
    `Teksten indeholder ${words.toLocaleString('da-DK')} ord. Fjern ${extra.toLocaleString('da-DK')} ord for at komme ned på maks. 5.000.`,
  count: (n) => `${n.toLocaleString('da-DK')} / 5.000 ord`,
  language: (name, automatic, confident) =>
    `${name}${automatic ? (confident ? ' · automatisk' : ' · automatisk, usikkert') : ' · valgt'}`,
  kept: (active, total) => `${active} af ${total} ændringer beholdt`,
  protected: (n) => `${n} områder er beskyttet`,
  skipped: (n) => (n ? `${n} mulige ændringer blev sprunget over for at skåne beskyttet tekst.` : ''),
  cleanDone: (changes, skipped) =>
    `${changes} typografiske ændringer foreslået.${skipped ? ` ${skipped} tegn i beskyttede områder er bevaret.` : ''}`,
  toggled: (id, enabled) => `Ændring ${id} er ${enabled ? 'gendannet' : 'fortrudt'}.`,
  changeLabel: (index, type) => `Ændring ${index}: ${type}. Vis før, efter og forklaring.`,
  points: (n) => `${n > 0 ? '+' : ''}${n} point`,
  gauge: (n) => `Heuristisk AI-score: ${n} procent. Ikke en målt sandsynlighed.`,
  calculation: (raw, score) => `24 grundpoint plus signalerne giver ${raw} point. Afgrænset til 0–100: ${score} %.`,
  description: {
    low: 'Få eller modstridende mønstre i de lokale regler.',
    medium: 'Flere signaler matcher reglerne. Genre og sprog påvirker resultatet.',
    high: 'Mange mønstre matcher reglerne. Et menneske kan skrive på samme måde.',
  },
  unknownRule: 'Ukendt ændringstype.',
  invalidDraft: 'Den gemte kladde kunne ikke gendannes fuldt. Kontrollér teksten før du fortsætter.',
  rhythmMark: 'Længden ligger tæt på de øvrige sætninger. Ens rytme er ikke i sig selv et AI-bevis.',
  phraseMark: (phrase) => `Fast vending: “${phrase}”. Undersøg, om den bidrager til indholdet.`,
  startMark: (phrase, count) =>
    `“${phrase}” starter ${count} sætninger. Gentagelse kan også være et retorisk virkemiddel.`,
  styleMark: 'Gentaget brug af tegn eller opremsning. Det kan være et bevidst stilvalg.',
  vocabularyMark: (word, count) => `“${word}” bruges ${count} gange. Behold det, hvis det er en præcis fagterm.`,
  unicodeMark: (name) => `${name}. Et formateringstegn, ikke et sikkert AI-tegn.`,
  voiceMark: 'Et konkret eksempel kan være nyttigt her, hvis tekstens genre tillader det.',
};
