# AI-tjek 2.0

**[Åbn appen](https://maltheyong-beep.github.io/ai-tjek/)** · [Opsæt Claude-backend](backend/README.md)

Dansk webapp med lokal AI-mønsterscore og AI-omskrivning på dansk, tysk og engelsk. Frontenden er ren HTML/CSS/JavaScript med ES-moduler, ingen afhængigheder og intet build-step. En separat Cloudflare Worker beskytter Claude-nøglen.

**Status:** Frontenden virker med lokale regler, indtil din Worker er udgivet, secrets er sat, og dens offentlige URL er tilføjet i `js/config.js`. Der ligger ingen API-nøgle i repoet. Cloudflare har en gratisplan; Claude API-forbrug er separat betalt.

## Funktioner

- Humanisér / Analyse, maks. 5.000 ord, automatisk DA/DE/EN eller manuelt valg.
- Claude-omskrivning med intensitet og tone; automatisk lokal fallback ved manglende opsætning, netværksfejl, grænse, timeout eller ugyldigt svar. Annullering starter ingen fallback.
- Ord-diff med farver, Før/Efter/Hvorfor, bundpanel på mobil, tastaturbetjent dialog og individuel Behold/Fortryd.
- Original / Ændret / Sammenlign, lokal score før/efter, kopiering og skånsom rensning af formateringstegn. Unicode-tegn giver 0 AI-scorepoint.
- Fundne navne, tal, citater, kode, URL'er og angivne fagudtryk beskyttes. Gennemlæs altid resultatet.
- Sessionkladde med tekst, indstillinger og individuelle valg. **Ryd** fjerner appens kladde; **Fortryd ryd** gendanner i den aktuelle session.
- Mobil først: fast handling, mindst 44 px knapper, 16 px input, safe-area, tastaturtilpasning, stakket sammenligning og hjemmeskærmsmanifest. Korte animationer og reduceret bevægelse understøttes. Haptik bruges, hvor browseren tillader det.

## Mappestruktur

```text
index.html / manifest.json / icons/
css/
  base.css            # Farver, afstande, lys/mørk og typografi
  components.css      # Mobil, kort, dokumenter og bundpanel
  animations.css      # Gauge, stagger, skeleton og reduceret bevægelse
js/
  i18n.js             # UI, sproglister, regler og forklaringer
  utils.js            # Ordtæller, sprog, sætningsopdeling
  analyze.js          # Lokal heuristisk score
  humanize-local.js   # Forsigtig lokal omskrivning og beskyttelse
  humanize-ai.js      # AI-kald, timeout, annullering og fallback
  ai-schema.js        # Fælles kontrol af modeloutput
  diff.js             # Ord-diff med begrænset hukommelsesforbrug
  config.js           # Kun offentlig Worker-URL
  storage.js          # Midlertidig sessionkladde
  annotations.js      # Sikre tekstnoder, tooltip og bundpanel
  views.js / ui.js    # Resultater og brugerhandlinger
backend/
  worker.js           # CORS, validering, rate limit og Claude-proxy
  prompt.js           # Redigeringsprompt og JSON-skema
  wrangler.toml       # Worker og SQLite Durable Object
  README.md           # Trinvis opsætning af deploy og secrets
tests/                # Node-tests, ingen API-kald eller afhængigheder
```

## Kør, test og udgiv

Åbn via HTTP(S), fx GitHub Pages eller en almindelig statisk lokal server. `file://` kan ikke indlæse ES-moduler. GitHub Pages: **Settings → Pages → Deploy from a branch → main → /(root)**. Ingen `npm install` eller build er nødvendig for frontenden.

```sh
npm test
```

Node 22+ bruges kun til udvikling/test og valgfri Wrangler-deploy. Tests dækker DA/DE/EN, tom/kort/5.000/5.001 ord, beskyttelse, præcis diff, fortryd, kladde, CORS, input, samtidige rate limits, JSON-retry, netværksfejl, timeout og annullering. Modelsvar er simuleret; live Claude kræver din opsætning.

## Tilføj et sprog

1. Tilføj stopord, overgange, klichéer, forkortelser og pronomenlister i `LANGUAGES` i `js/i18n.js`.
2. Tilføj `HUMAN_RULES`, `HUMAN_REASONS`, `AI_REASONS`, `NEGATIONS`, `DEFAULT_PROTECTED` og `EXAMPLES`. En regel er `[id, frase, erstatning, type, minimumsniveau, kunSætningsstart]`.
3. Tilføj sproget til vælgeren, registreringen i `utils.js`, AI-klientens og Workerens tilladte sprog, promptens sprognavn samt kladdegendannelse i `ui.js`.
4. Test bøjninger, ordstilling, navne, citater, tal, negationer, fagudtryk og individuel fortryd. Sproglister alene validerer ikke detektorens nøjagtighed.

Alle ændringer refererer til den uændrede original. Derfor flytter en fortryd ikke de andre ændringers positioner. Gemte positioner og typer valideres ved gendannelse.

## Privatliv og begrænsninger

AI-omskrivning sender tekst og beskyttede fagudtryk til din Cloudflare Worker og Claude. Worker-koden gemmer eller logger ikke teksten; rate limit gemmer kortvarigt tidspunkter under et HMAC-afledt ID. Udbydernes egne vilkår gælder. Analyse, lokal fallback og kladde virker på enheden. Ingen tredjepartsscripts, cookies eller analytics. Indsat tekst og AI-svar vises som tekstnoder, aldrig som HTML. **Ryd** før en delt computer forlades; en genåbnet browsersession kan gendanne sessionkladden.

Betydning og fakta kan ikke garanteres af en prompt eller af fragmentkontrol. Tysk navneordsbeskyttelse er konservativ, og automatisk sprogvalg er usikkert for korte/blandede tekster. Store gennemgribende omskrivninger kan samles i større diff-områder for at holde telefonen hurtig. Tonevalg virker kun med AI, og lokal fallback omskriver mindre.

AI-scoren er **et estimat, ikke bevis** eller en kalibreret sandsynlighed. Vægte, grundindeks, fælles fraseloft og spændbredder ligger i `data/vaegte.json`. Et internt indeks vises som et afrundet spænd, ikke som én præcis procent. Spændet er et håndvalgt følsomhedsspænd og ikke et statistisk konfidensinterval. Under 80 ord vises “For kort til en sikker vurdering”. Ordvariation er ikke ægte perplexity; der er ingen fuld grammatikkontrol. Lavere score beviser ikke menneskeligt forfatterskab. Nøjagtighed er ikke valideret på noget sprog; AI-detektion er generelt bedst undersøgt på engelsk og mere usikker på dansk/tysk. Brug egne tekster og følg skolens/arbejdspladsens regler.

Manifestet giver hjemmeskærmsikon og standalone-visning, men der er ingen service worker eller garanteret offline-cache. Browserens mobilvisning er ikke en fysisk iPhone-/Android-test.

Baggrund: [AI-detektorers begrænsninger](https://aclanthology.org/2025.findings-naacl.271/) · [MULTITuDE](https://aclanthology.org/2023.emnlp-main.616/).

## Udvikling og oprydning

Se [PROGRESS.md](PROGRESS.md) før næste fase og [docs/OVERBLIK.md](docs/OVERBLIK.md) for flow og en “vil du ændre X → find Y”-oversigt. Sproglisterne ligger nu i `js/texts/`, UI-hændelser i `js/ui-events.js`, status/kopiering i `js/ui-feedback.js` og komponentstil i `css/components/`. De oprindelige indgange geneksporterer/indlæser delene.

```sh
npm ci
npm test
npm run lint
npm run format:check
```

Prettier og ESLint er kun til udvikling. Frontenden hostes stadig direkte på GitHub Pages uden build. Tilføj et sprog i `js/texts/language-*.js`, registrér det i `js/texts/languages.js` og følg sprogtjeklisten ovenfor. Nye genrer skal i næste godkendte fase have egne JSON-regler i `data/`, tests og eksplicit UI-tilkobling; de er ikke implementeret i oprydningen.

Faglig kilde til kommende genre-/taleværktøjer: [Indidansk](https://indidansk.dk/). Skriv egne regler og spørgsmål; kopier ikke sidens tekster, tabeller eller billeder.

## Detektorens fase 2

- `data/vaegte.json` er eneste kilde til den endelige vægtning. `js/analysis-weights.js` indlæser og validerer den; ingen hemmeligheder eller brugertext sendes med filforespørgslen. Hvis filen ikke kan læses, vises en fejl ved analyse i stedet for at bruge tavse reservevægte.
- `js/analyze.js` måler de lokale signaler. `js/analysis-scoring.js` vægter, begrænser korrelerede fraser og beregner et bredt spænd. Pæn tegnsætning, manglende jeg-form og usynlige tegn giver ingen positive AI-point. Ordets længde indgår ikke i scoren, heller ikke for danske/tyske sammensætninger.
- `js/analysis-units.js` beregner delmålinger på originalens sætninger og afsnit med samme valgte sprog. Afsnit følger blanklinjer. Korte deltekster markeres som usikre; de får ikke en præcis procentvisning. `js/analysis-unit-view.js` viser delmålingerne i portioner på 20 ved åbning.
- DA/DE får bredere spænd end EN som en forsigtig designregel, ikke som dokumenteret nøjagtighed. Få sætninger, usikkert sproggæt og uenighed mellem længere afsnit udvider spændet. Overlappende før/efter-spænd behandles ikke som en sikker forbedring.
- Ingen reel perplexity, serverlogprobs, betalte detektorer eller eksterne tekstkald til analyse. Designændringerne er begrænset til intervaltekst og et foldbart afsnit i samme eksisterende kort.
- Dette er **ikke empirisk kalibreret**. Prøverne i de automatiske tests er funktionelle eksempler, ikke et mærket korpus og ikke dokumentation for færre falske positive. Kalibrering kræver stadig dine egne tekster i den senere fase.
