// Samler SIGNAL_COPY til appens fælles sproglag.
export const SIGNAL_COPY = {
  rhythm: (d) => ({
    title: 'Sætningernes rytme',
    detail:
      d.count < 6
        ? 'For få sætninger til at vurdere rytmen.'
        : `Længder fra ${d.min} til ${d.max} ord. ${d.points > 0 ? 'Ens længder trækker op i denne heuristik.' : d.points < 0 ? 'Skift mellem korte og lange sætninger trækker ned.' : 'Ingen tydelig yderlighed.'}`,
    measurement: `Spredning / gennemsnit: ${d.value.toFixed(2)}. Mindst 6 sætninger; −10 til +18 råpoint.`,
  }),
  starts: (d) => ({
    title: 'Gentagne sætningsstarter',
    detail: d.groups.length
      ? d.groups.map((g) => `“${g.phrase}”: ${g.matches.length} gange`).join('; ')
      : 'Ingen start på to ord gentages mindst tre gange.',
    measurement: 'Mindst tre sætninger med fem ord. Op til +12 råpoint.',
  }),
  transitions: (d) => ({
    title: 'Overgange',
    detail: `${d.hits.length} match${d.sample ? ': ' + d.sample : ''}. Vendingerne bruges også af mennesker.`,
    measurement: 'Mindst 3 match; tæthed pr. 100 ord; op til +14 råpoint.',
  }),
  cliches: (d) => ({
    title: 'Klichéer og fyldvendinger',
    detail: `${d.hits.length} match${d.sample ? ': ' + d.sample : ''}. Det er sprogmønstre, ikke forfatterbevis.`,
    measurement: '+4 point pr. match; højst +18.',
  }),
  voice: (d) => ({
    title: 'Stemme og konkrete holdepunkter',
    detail: `${d.personal} personlige stedord og ${d.concrete} eksempel-, tal- eller citatmarkører. Appen kontrollerer ikke, om eksemplerne er sande.`,
    measurement: 'Mindst 80 ord. Fra −14 til +6 råpoint. En fagtekst kan med god grund være upersonlig.',
  }),
  polish: (d) => ({
    title: 'Overfladisk korrekthed',
    detail: `${d.neat} af ${d.count} sætninger har stort begyndelsesbogstav og sluttegn. Ingen fuld stave- eller grammatikkontrol.`,
    measurement: 'Mindst 100 ord og 6 sætninger. Højst +3 råpoint.',
  }),
  style: (d) => ({
    title: 'Tegn og opremsninger',
    detail: `${d.dashes} lange tankestreger, ${d.colons} kolon, ${d.bullets} punktlinjer og ${d.triads} mulige treledsopremsninger.`,
    measurement: 'Mindst 80 ord og gentagen brug; højst +8 råpoint.',
  }),
  vocabulary: (d) => ({
    title: 'Ordvariation',
    detail: `${Math.round(d.value * 100)} % unikke betydningsord i vinduer på ${d.windowSize} ord. ${d.reliable ? 'En simpel proxy, ikke ægte perplexity.' : 'For få betydningsord: signalet giver 0 råpoint.'}${d.language === 'de' ? ' Sammensatte ord straffes ikke for længden.' : ''}`,
    measurement: 'Mindst 80 betydningsord. Sproggrænser: DA 57 %, DE 52 %, EN 60 %. Fra −6 til +10 råpoint.',
  }),
  unicode: (d) => ({
    title: 'Skjulte tegn og typografi',
    detail: `${d.hidden} usynlige tegn, ${d.spaces} specielle mellemrum, ${d.curly} krøllede og ${d.straight} rette citationstegn/apostroffer.`,
    measurement: 'Altid 0 råpoint. Kan stamme fra normal tekstbehandling.',
  }),
};
