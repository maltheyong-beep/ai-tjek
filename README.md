# AI-tjek

En dansk webapp, der undersøger sproglige mønstre i tekst på dansk, tysk og engelsk. Ren HTML, CSS og JavaScript: ingen installation, backend, API-nøgle, pakker eller build-step.

**Et estimat, ikke et bevis.** AI-scoren er en forklarlig, håndlavet heuristik, ikke en statistisk kalibreret sandsynlighed. Appen er ikke valideret som forfatterdetektor og må ikke alene bruges til at konkludere, at nogen har snydt.

## Kom i gang

Åbn `index.html` i en moderne browser. Alle funktioner kører også uden en webserver. På en HTTPS-side bruges browserens Clipboard API; ved lokal åbning forsøges en kopieringsfallback.

De fire filer skal ligge i samme mappe:

```text
index.html
style.css
script.js
README.md
```

## Funktioner

- Tekstfelt med live ordtæller og grænse på 5.000 ord. 5.001 ord eller mere blokerer analysen, også i analysefunktionen selv.
- Automatisk sproggenkendelse eller manuelt valg af dansk, tysk og engelsk. Korte/uklare tekster markeres som usikre; vælg sproget manuelt ved behov.
- Animeret AI-score på 0–100, opdelt i lav, middel og høj. Alle pointbidrag kan foldes ud.
- Forklaringer, konkrete regelmatch, filtrerbare tekstmarkeringer og tooltips med tastatur- og touchadgang.
- Måling af sætningslængder, gentagne starter, overgangsord, klichéer, eksempelmarkører, typografi og ordvariation.
- Tekstspecifikke skriveråd og regelbaserede før/efter-forslag på den analyserede teksts sprog. Forslag indsættes kun ved et aktivt klik og ændrer ikke teksten automatisk.
- Rensning af usynlige formateringstegn, specielle mellemrum og typografisk tegnsætning. Rensningen kan fortrydes, og den rensede tekst kan kopieres.
- Automatisk lys/mørk tilstand, mobilvisning, reduceret animation ved `prefers-reduced-motion`, fokusmarkeringer og statusbeskeder til skærmlæsere.
- Ingen eksterne skrifttyper, scripts, netværkskald, cookies, telemetri eller lagring af indsat tekst.

## Gratis hosting på GitHub Pages

1. Opret et offentligt GitHub-repository, fx `ai-tjek`.
2. Læg de fire filer direkte i repositoryets rod på `main`.
3. Åbn **Settings → Pages**.
4. Vælg **Deploy from a branch**, derefter **main** og **/(root)**.
5. Klik **Save**. GitHub viser sidens adresse, når udgivelsen er klar.

Der er ikke behov for en brugerdefineret Actions-workflow eller lokal kompilering. GitHub håndterer selve Pages-udgivelsen. Offentlige repositories kan bruge Pages med GitHub Free. Se [GitHubs officielle vejledning](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Sådan beregnes scoren

`score = min(100, max(0, 24 + summen af signalpoint))`

Visningskategorierne er **lav: 0–34**, **middel: 35–64** og **høj: 65–100**. En score på 80 betyder ikke, at AI-forfatterskab er dokumenteret med 80 % sandsynlighed. Grundscore, grænser og vægte er produktregler og er ikke tilpasset et valideringssæt.

| Signal | Regel | Point |
| --- | --- | --- |
| Rytme / burstiness | Standardafvigelse i sætningslængde divideret med gennemsnittet; mindst 6 sætninger. Under 0,20: +18; under 0,35: +12; under 0,45: +5; over 0,75: −10; over 0,55: −5. | −10 til +18 |
| Gentagne sætningsstarter | De første to ord gentages i mindst tre sætninger med mindst fem ord. 4 point pr. gentagelse ud over den første. | 0 til +12 |
| Overgange | Match i sprogets egen liste; mindst 3 match. `afrund((match pr. 100 ord − 0,8) × 5)`, afgrænset til 0–14. | 0 til +14 |
| Klichéer / fyldvendinger | Match i sprogets egen liste; 4 point pr. match. | 0 til +18 |
| Stemme / konkrete holdepunkter | Mindst 80 ord. Mindst 2 personlige stedord og 1 konkret markør: −14. Mindst 2 konkrete markører: −9. Mindst 2 personlige stedord: −6. Ingen af delene: +6. | −14 til +6 |
| Overfladisk korrekthed | Mindst 100 ord og 6 sætninger; alle begynder med stort bogstav og slutter med tegn; ingen simple ordgentagelser eller gentagne sluttegn. | 0 eller +3 |
| Tegn og opremsninger | Mindst 80 ord. Mindst 3 em-dashes og mindst 1 pr. 100 ord: op til +4. Mindst 3 kolon og 1 pr. 100 ord: +2. Mindst 4 punktlinjer: +2. Mindst 3 mulige treledsopremsninger: +3. Samlet loft: +8. | 0 til +8 |
| Ordvariation | Glidende type/token-forhold i vinduer på 50 betydningsord, målt for hvert femte ord. Kræver mindst 80 betydningsord. Under sproggrænsen: `min(10, afrund((grænse − variation) × 35) + 3)`. Over 86 %: −6. Grænser: DA 57 %, DE 52 %, EN 60 %. | −6 til +10 |
| Usynlige tegn / typografi | Diagnose og rensning; tæller aldrig som dokumentation for AI-forfatterskab. | Altid 0 |

Kort tekst får en tydelig usikkerhedsnote, og signaler med for lidt grundlag giver 0 point. Regler kan overlappe: pointene er ikke statistisk uafhængige evidensbidrag.

### Sprog

`LANGUAGES` i `script.js` indeholder separate stopord, personlige stedord, overgange, klichéer, forkortelser, eksempelmarkører, forbindelsesord, omskrivningsregler og skriveråd for hvert sprog. Sætningsopdelingen beskytter sprogspecifikke forkortelser som `f.eks.`, `z.B.` og `e.g.` samt tal, domæner og initialer.

Tyske sammensatte ord tæller som selvstændige ord. De bliver ikke splittet eller slået sammen med andre ord ved en aggressiv stemmer. Ordlængde bruges ikke som mål for lavt ordforråd. Den lavere tyske grænse er en konservativ regel, ikke et dokumenteret kalibreringsresultat.

Sproggenkendelsen sammenligner lokale stopord og bogstavmønstre. Blandede sprog og korte uddrag kan blive fejlregistreret. Den manuelle sprogvælger er derfor altid tilgængelig.

AI-detektion er langt mere undersøgt på engelsk, og engelsktrænede detektorer kan klare sig dårligere på andre sprog. **Denne app er ikke trænet på et datasæt og har ingen dokumenteret nøjagtighed på dansk, tysk eller engelsk.** UI'et lover derfor ikke en bestemt nøjagtighed eller en sikker rangorden mellem appens tre sprog.

### Perplexity, grammatik og indhold

- Ægte perplexity kræver en bestemt sprogmodels sandsynligheder. Denne app bruger alene ordvariation som en proxy.
- Overfladisk korrekthed er ikke en stave- eller grammatikkontrol. Korrekt tegnsætning er et svagt signal.
- Personlige stedord, tal, citater og eksempelmarkører er kun sproglige overfladetræk. Appen kontrollerer ikke, om indholdet er sandt, originalt eller personligt.
- Gentagelser, ens sætningslængder og en upersonlig stil er almindelige i mange faglige genrer. Mennesker kan derfor få høj score, og AI kan få lav score.

## Rensning og omskrivning

Rensning fjerner bl.a. zero-width spaces, soft hyphens, BOM, word joiners og retningskontroltegn. Usædvanlige mellemrum bliver til almindelige mellemrum, krøllede citationstegn normaliseres, og tankestreger ensrettes. Danske og tyske bogstaver bevares.

Zero-width joiners/non-joiners bevares ved emoji og i visse skriftsystemer, hvor de påvirker betydning eller visning. Rensning ændrer formatering og kan ændre ønsket typografi. Brug fortryd-funktionen, hvis det ikke var hensigten.

**Usynlige Unicode-tegn er ikke statistiske AI-vandmærker.** Knappen med navnet “Fjern skjulte AI-tegn” er en typografisk rensefunktion; den kan ikke fjerne eller teste statistiske modelvandmærker.

Omskrivninger består af sprogspecifikke erstatninger og forsigtig deling af lange sætninger ved en ny hovedsætning. Tyske `dass`-ledsætninger bevares ved de indledende erstatninger. Reglerne kan stadig ramme forkert; læs og vurder altid forslaget. Der opfindes ikke personlige oplevelser, kilder eller eksempler.

## Privatliv og sikkerhed

- Al tekstbehandling foregår i browseren. Ingen `fetch`, XHR, WebSocket eller eksterne modeller.
- Indsat tekst sættes ind med `textContent` og tekstnoder, aldrig som HTML. Tekst med HTML- eller scriptkode bliver vist som tekst.
- En Content Security Policy blokerer netværksforbindelser og eksterne scripts. CSS og JavaScript indlæses fra samme mappe.
- Ingen localStorage, sessionStorage, cookies, service workers eller automatisk kladdelagring. En genindlæsning kan derfor fjerne teksten.
- Clipboard bruges kun ved klik på kopieringsknappen. Intet læses fra clipboard.
- Webhosten modtager almindelige sideforespørgsler, som ved enhver hjemmeside; feltets indhold sendes ikke med.

## Teknisk kontrol

JavaScript kan syntakstjekkes med `node --check script.js`. De rene analysefunktioner eksporteres ved `require('./script.js')` i Node, så samme logik kan testes uden en browser. Node er ikke nødvendigt for at bruge eller hoste appen.

## Kilder til baggrundsviden

- [Tufts, Zhao & Li (2025): A Practical Examination of AI-Generated Text Detectors for Large Language Models](https://aclanthology.org/2025.findings-naacl.271/).
- [Macko m.fl. (2023): MULTITuDE — Large-Scale Multilingual Machine-Generated Text Detection Benchmark](https://aclanthology.org/2023.emnlp-main.616/).

Forskningsartiklerne understøtter baggrundsafsnittets forbehold. De validerer ikke denne apps håndskrevne regler eller score.
