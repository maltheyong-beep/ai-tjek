// Samler API_ERRORS til appens fælles sproglag.
export const API_ERRORS = {
  ORIGIN: 'Denne hjemmeside har ikke adgang til AI-proxyen.',
  METHOD: 'Brug POST til denne funktion.',
  PATH: 'Adressen findes ikke.',
  INPUT: 'Kontrollér tekst, sprog, intensitet og tone.',
  TOO_LARGE: 'Teksten er for stor. Brug højst 5.000 ord og en kort liste over fagudtryk.',
  NOT_CONFIGURED: 'AI-proxyen mangler opsætning.',
  RATE_LIMIT: 'Du har brugt 10 AI-kald inden for den seneste time. Prøv igen senere.',
  UPSTREAM: 'AI-tjenesten er ikke tilgængelig lige nu.',
  INVALID_OUTPUT: 'AI-svaret kunne ikke valideres efter to forsøg.',
  TIMEOUT: 'AI-tjenesten svarede ikke i tide.',
  INTERNAL: 'AI-proxyen kunne ikke behandle kaldet.',
};
