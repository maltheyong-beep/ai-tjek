# Fremdrift — læs denne fil før næste opgave

## Aftale

Kun én fase ad gangen. Stop efter hver fase og vent på **næste**. Brugeren har valgt: først bedre AI-score (detektor fase 2), derefter genregenkendelse (genre fase 2). De to ønskede projekter føres separat nedenfor. Ingen genre-, tale- eller scorefunktioner implementeres i oprydningen.

## Oprydning, fase 1

- Status: gennemført kodeoprydning; 61 tests består efter hvert oprydningstrin; ESLint og Prettier består. Før/efter er kontrolleret i browseren ved faktiske bredder 360, 390, 768 og 1280 px. Fase 1 er afsluttet og flettet til main i commit b7ac3c3. Stop her og vent på næste.
- Udgangspunkt: offentlig version 82640cc. Udseende, score og handlinger bevares.
- Fjernet: ubrugte `makeSuggestions` og dets 18 tipfelter, farven `--purple` i to temaer, et ubrugt test-import og en gentaget `min-width`-regel. `pinned`-tilstanden var altid falsk og er forenklet væk.
- Flyttet: sproglag til `js/texts/` med `js/i18n.js` som fælles indgang; CSS til `css/components/` i præcis samme rækkefølge; UI-hændelser og feedback til egne moduler; fælles grænser til `js/constants.js`.
- Prettier, ESLint og EditorConfig er kun udviklingsværktøjer. Ingen build-step eller runtime-afhængigheder er tilføjet.
- Beholdt ved tvivl: SVG-ikon (dokumenteret ikonmappe), alle tests og eksempler, Worker-filer, `.nojekyll`, manifest og sprogdata. Intet genre-/tale-stubmodul er oprettet: de ville være ubrugt kode før fase 2/4.
- Størrelse: næsten alle moduler er under ca. 300 linjer. Den statiske HTML-indgang er længere; den bevares samlet for at undgå ny runtime-rendering. UI-koordinatoren er ca. 320 linjer; låsefilen er automatisk genereret og deles ikke op.
- CSS-afstande er fortsat overvejende eksisterende variabler. Breakpoints og enkelte geometrimål er beholdt for ikke at indføre bred ændring af styling i denne fase.

## Detektor, fase 1 — vurdering (8 linjer)

1. Den lille Workers AI-models officielle schema dokumenterer tekst, usage og tool_calls, men ikke input-token-logprobs.
2. Ingen fungerende Worker-adresse eller brugerens Cloudflare-adgang er tilsluttet i repoet; ingen live forespørgsel er foretaget.
3. Logprobs for genererede outputtokens, som visse andre modeller dokumenterer, scorer ikke automatisk brugerens inputtekst.
4. Der er derfor ikke grundlag for reel input-perplexity eller server-burstiness af perplexity her; ingen serverfunktion tilføjes.
5. Engelsk: lokale signaler kan beskrive stil, men ikke bevise forfatterskab; kalibrering kræver brugerens mærkede tekster.
6. Dansk: korte/faglige tekster og sammensætninger kræver ekstra forsigtighed og sprogspecifikke regler.
7. Tysk: sammensætninger og store substantiver skal behandles særskilt; ordlængde må ikke straffes.
8. Næste detektorfase kan forbedre lokale signaler og vise usikkerhed, men ingen målt nøjagtighed loves uden data.

Kilder undersøgt 30. oktober 2026:

- https://developers.cloudflare.com/workers-ai/models/llama-3.2-1b-instruct/
- https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/
- https://developers.cloudflare.com/workers-ai/models/deepseek-v4-pro-0813/ (kun output-logprobs; betalt model vælges ikke)

## Tidligere arbejde, ikke udgivet i denne fase

Det tidligere ønske om gratis Workers AI, dagskvote og 1.500 ord pr. AI-kald ligger bevaret i den separate lokale arbejdsmappe `../ai-tjek`. Det er ikke blandet ind i denne oprydning, fordi det ændrer funktionalitet. Den offentlige app er fortsat lokal fallback, indtil en backend sættes op. Der er ingen aktiv betalt tjeneste eller nøgle i frontenden.

## Sikkerhedskontrol

Kildetekst i alle lokalt hentede git-revisioner er scannet for kendte API-nøgle- og private-key-mønstre uden fund. Testene bruger tydeligt fiktive secrets. Det beviser ikke fravær af alle mulige hemmeligheder. GitHubs eksisterende historik indeholder almindelige forfatter-/committermetadata, herunder en forfattermail; de er ikke omskrevet eller slettet.

## Detektor, fase 2 — bedre lokal score

- Vægte, signalfamilier, fraseloft, høj-score-port og intervalbredder er samlet i `data/vaegte.json`, indlæst og valideret fra samme kilde i browser og Node.
- Overgange og klichéer deler et loft. Højt internt indeks kræver flere positive signalfamilier. Pæn tegnsætning, manglende personlig stemme og usynlige tegn øger ikke scoren.
- Samlet visning og humaniseringens før/efter viser afrundede spænd. De er bevidst ukalibrerede følsomhedsspænd, **ikke statistiske konfidensintervaller** eller målte sandsynligheder.
- Under 80 ord vises “For kort til en sikker vurdering” og ingen præcis procent i cirklen. Korte deltekster markeres tilsvarende.
- Sætninger og afsnit beregnes med originale positioner og dokumentets valgte sprog. Afsnit følger blanklinjer. Foldbar delvisning er pagineret i portioner på 20.
- DA/DE får forsigtigt bredere spænd end EN; ordlængde og sammensatte ord straffes ikke. Det er en designregel, ikke en påstand om målt sprognøjagtighed.
- Mere usikkert sprogvalg, få sætninger og uenige længere afsnit udvider spændet. Overlappende før/efter-spænd udlægges ikke som en sikker forbedring.
- Ingen reel perplexity, serveranalyse, betalt API, fremmede nøgler eller scraping af detektorer. Testtekster er kun funktionstest, ikke et opfundet kalibreringskorpus.
- Kontrol: 77 automatiske tests samt ESLint og Prettier består. Browserprøver af korte tekster, delmålinger, humanisering/fortryd og manglende vægtfil er gennemført. Ved 360/390/768/1280 px er der ingen vandret overfyldning eller knapper under 44 px i de kontrollerede visninger. Publicering: separat fasegren, slutstatus opdateres efter kontrol.

## Næste opgave — kræver næste

Genregenkendelse (genreprojektets fase 2) er næste opgave efter brugerens valgte rækkefølge. Den startes først efter afsluttet AI-scorefase og et nyt **næste**. Genrelister/regler og manuel overstyring er endnu ikke implementeret.

Detektorens kalibrering (fase 3) er fortsat blokeret, til brugeren leverer mindst 20 menneske- og 20 AI-tekster pr. sprog. Ingen tekster må opfindes eller hentes på nettet til det datasæt. Der er endnu ingen empiriske tal for nøjagtighed, falske positive eller falske negative.
