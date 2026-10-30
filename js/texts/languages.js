// Samler LANGUAGES til appens fælles sproglag.
import { da } from './language-da.js';
import { de } from './language-de.js';
import { en } from './language-en.js';
export const LANGUAGES = { da, de, en };

Object.values(LANGUAGES).forEach((c) => {
  c.stopSet = new Set(c.stopwords);
  c.personalSet = new Set(c.personal);
});
