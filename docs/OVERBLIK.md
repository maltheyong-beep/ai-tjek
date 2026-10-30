# Find rundt i AI-tjek

Tekst ind → lokal analyse → humanisering (lokale regler eller konfigureret Worker) → ord-diff → brugerens Behold/Fortryd → resultat og kopiering.

| Vil du ændre                               | Find her                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------ |
| Analyse og nuværende score                 | `js/analyze.js`                                                                |
| Lokal humanisering, beskyttelse og fortryd | `js/humanize-local.js`                                                         |
| AI-kald, fejl og fallback                  | `js/humanize-ai.js`                                                            |
| Ord-diff                                   | `js/diff.js`                                                                   |
| Faner og koordinering                      | `js/ui.js`                                                                     |
| Klik og tastatur                           | `js/ui-events.js`                                                              |
| Status, kopi og haptik                     | `js/ui-feedback.js`                                                            |
| UI-tekster og sprog                        | `js/i18n.js` → `js/texts/`                                                     |
| CSS                                        | `css/base.css`, `css/components.css` → `css/components/`, `css/animations.css` |
| Worker og deploy                           | `backend/README.md`                                                            |
| Næste fase og begrænsninger                | `PROGRESS.md`                                                                  |

Vægtdata er tilføjet i detektorens fase 2. Genre- og tale-data oprettes i deres egne godkendte faser. `data/` er reserveret til de fremtidige JSON-regler; ingen ubrugte dummyregler tilføjes nu.

Faglig kilde til kommende genrer/analyse: https://indidansk.dk/ . Ingen tekster, tabeller eller billeder er kopieret. Analysehjulets billede undersøges først i analysefasen; dets indhold er endnu ikke verificeret.
