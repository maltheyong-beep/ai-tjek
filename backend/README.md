# AI-tjek: Cloudflare Worker til Claude

Frontenden kan bruges nu med lokal fallback. Rigtig AI-omskrivning kræver, at du udgiver denne Worker og tilføjer dens **offentlige URL** i `js/config.js`. Nøglen skal kun ind i Cloudflare Secrets.

## 1. Konti og forudsætninger

- Opret en Cloudflare-konto med Workers Free. SQLite Durable Objects bruges til IP-grænsen og understøttes på gratisplanen.
- Opret en Claude API-nøgle i [Anthropic Console](https://console.anthropic.com/). Claude API-forbrug betales separat; en Claude-chatkonto er ikke en API-nøgle. Indstil et passende forbrugsloft hos udbyderen.
- Installer Node.js 22 LTS eller nyere og hent dette repo på din computer. Frontenden kræver hverken Node eller et build.

## 2. Udgiv Workeren

Kør i repoets `backend/`-mappe:

```sh
npx wrangler login
npx wrangler deploy
```

Wrangler bruger `wrangler.toml`, pakker også de delte moduler i `../js/` og opretter den SQLite-baserede Durable Object via migrationen. Før secrets er sat, returnerer API'et en pæn 503-fejl; der sendes ingen tekst videre til Claude.

## 3. Tilføj secrets sikkert

```sh
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put RATE_LIMIT_SALT
```

Indsæt Claude-nøglen i den første skjulte terminalprompt. Brug en tilfældig, lang værdi til den anden (mindst 32 tilfældige bytes). Den bruges til at aflede IP-tællerens ID med HMAC. Indsæt værdierne i prompten, aldrig i kommandoen, kildekoden, en GitHub-issue eller frontend-konfigurationen. Del heller ikke nøglen i chatten.

Secrets kan også tilføjes som **Secret** i Cloudflare Dashboard → Workers & Pages → ai-tjek-proxy → Settings → Variables and Secrets. Behold samme stavning af navnene. Nøglen må aldrig være en almindelig offentlig `vars`-værdi.

## 4. Forbind frontenden

Wrangler viser din faktiske `https://…workers.dev`-adresse. Tilføj `/humanize` og ret **kun** den offentlige adresse i `js/config.js`:

```js
export const HUMANIZE_API_URL = 'https://DIN-WORKER.DIT-SUBDOMÆNE.workers.dev/humanize';
```

Eksemplet er en pladsholder. Brug adressen fra din egen deploy. Commit og push ændringen til GitHub; Pages udgiver automatisk fra `main` og repoets rod.

CSP i `index.html` tillader kun appens egen origin og HTTPS `*.workers.dev` til netværkskald. Et eget API-domæne skal tilføjes eksplicit til `connect-src`, før det bruges. API-nøglen skal stadig kun være et Worker-secret.

## 5. Kontrollér den færdige forbindelse

Åbn [GitHub Pages](https://maltheyong-beep.github.io/ai-tjek/), indsæt en ufølsom prøvetekst, og tryk **Humanisér**. Et godkendt svar viser **Omskrevet med Claude**. Ved manglende opsætning, netværksfejl, 429, timeout eller afvist JSON bruges lokale regler med en tydelig forklaring.

Prøv også DA/DE/EN, Let/Middel/Kraftig, tone, individuel fortryd og annullering. Kontrollér med browserens netværkspanel, at anmodningen kun går til din Worker, og at ingen nøgle findes i kildekode eller anmodningen fra browseren. Et annulleret kald kan allerede have nået Claude og kan stadig tælle som forbrug.

## API og sikkerhed

- Kun `POST /humanize` og CORS-preflight fra præcis `https://maltheyong-beep.github.io` accepteres. GitHub Pages-stien er ikke en del af en origin. Andre origins får 403 uden tilladende CORS-header.
- JSON: `text`, `language` (`da/de/en`), `intensity` (`light/medium/strong`), `tone` (`neutral/school/casual`), `protectedTerms` (streng). Ukendte inputfelter afvises.
- Maks. 5.000 ord og 192 KiB JSON pr. kald. Backend har desuden timeout på 55 sekunder.
- Højst 10 anmodninger pr. IP i et glidende vindue på én time. Validerede forsøg tæller også ved model-fejl. Durable Objects gør grænsen konsistent på tværs af instanser; 429 indeholder `Retry-After`.
- `CF-Connecting-IP` læses kun på serveren og omdannes med hemmelig HMAC-salt til et ID. Tælleren gemmer kun op til ti tidspunkter, som udløber efter en time. Ingen brugertext eller rå IP gemmes i appens lager.
- Ingen `console.log`, analyseværktøjer eller tekstlogging. Worker Observability og invocation logs er slået fra i konfigurationen. Slå ikke ekstra payload-logging til i Dashboard eller via debugging. Cloudflare og Anthropic kan stadig behandle driftsdata efter deres egne vilkår; dette er ikke et løfte om udbydernes sletning.
- Systemprompten behandler input som data. Struktureret JSON valideres sammen med navnefragmenter, tal, fundne citater, negationer og brugerens fagudtryk. Ugyldigt modeloutput forsøges én gang igen, derefter fejl/fallback. Det er ikke en fuld semantisk garanti.
- CORS er en browserbeskyttelse, ikke brugerautentifikation. En ekstern klient kan efterligne Origin og bruge flere IP'er. Den offentlige proxy bør derfor have et forbrugsloft hos Anthropic; større offentlig trafik kan kræve yderligere misbrugsbeskyttelse og en anden plan. Delt skole-/mobilnet deler IP-kvote.

## Model og vedligeholdelse

`CLAUDE_MODEL` er en offentlig modelidentifikator i `wrangler.toml` (`claude-haiku-5-5`). Hvis modellen ikke er tilgængelig for kontoen, vælg en understøttet model med Messages API og strukturerede JSON-svar og deploy igen. API-kaldet sender nøglen til `https://api.anthropic.com/v1/messages`, aldrig til frontenden.

Test fra repoets rod med `npm test`. Backendtestene bruger fiktive secrets og simulerede modelsvar; de foretager ingen betalte API-kald. En rigtig Cloudflare-deploy og et rigtigt Claude-svar skal verificeres efter konto- og nøgleopsætning.

Dokumentation: [Worker-secrets](https://developers.cloudflare.com/workers/configuration/secrets/) · [Durable Objects-grænser](https://developers.cloudflare.com/durable-objects/platform/limits/) · [Claude strukturerede svar](https://platform.claude.com/docs/en/build-with-claude/structured-outputs).
