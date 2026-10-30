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

AI-scoren er **et estimat, ikke bevis** eller en kalibreret sandsynlighed. 24 grundpoint plus håndvægtede signaler afgrænses til 0–100. Under 35 er lav, 35–64 middel og fra 65 høj. Ordvariation er ikke ægte perplexity; der er ingen fuld grammatikkontrol. Lavere score beviser ikke menneskeligt forfatterskab. Nøjagtighed er ikke valideret på noget sprog; AI-detektion er generelt bedst undersøgt på engelsk og mere usikker på dansk/tysk. Brug egne tekster og følg skolens/arbejdspladsens regler.

Manifestet giver hjemmeskærmsikon og standalone-visning, men der er ingen service worker eller garanteret offline-cache. Browserens mobilvisning er ikke en fysisk iPhone-/Android-test.

Baggrund: [AI-detektorers begrænsninger](https://aclanthology.org/2025.findings-naacl.271/) · [MULTITuDE](https://aclanthology.org/2023.emnlp-main.616/).
