// Status, kopiering og haptik deles uden at ændre de eksisterende brugerhandlinger.
import { UI } from './i18n.js';
import { el } from './annotations.js';
const $ = (id) => document.getElementById(id);
let toastTimer = 0;
const copyOriginals = new WeakMap(),
  copyTimers = new WeakMap();
export function announce(text) {
  $('live-status').textContent = text;
}
export function haptic() {
  try {
    navigator.vibrate?.(20);
  } catch {
    /* Nogle browsere understøtter ikke haptik. */
  }
}
export function successIcon() {
  return $('check-icon').content.firstElementChild.cloneNode(true);
}
export function toast(text, success = false) {
  clearTimeout(toastTimer);
  $('toast').replaceChildren(...(success ? [successIcon(), el('span', '', text)] : [el('span', '', text)]));
  $('toast').hidden = false;
  toastTimer = setTimeout(() => {
    $('toast').hidden = true;
  }, 3500);
}
export function error(message = '') {
  $('input-error').textContent = message;
  $('input-error').hidden = !message;
  if (message) announce(message);
}
export async function copyText(text, button) {
  if (button.disabled) return;
  if (!copyOriginals.has(button))
    copyOriginals.set(
      button,
      [...button.childNodes].map((n) => n.cloneNode(true)),
    );
  clearTimeout(copyTimers.get(button));
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  button.textContent = UI.busyCopy;
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
    else {
      const field = el('textarea', 'sr-only');
      field.value = text;
      document.body.append(field);
      field.select();
      const copied = document.execCommand('copy');
      field.remove();
      if (!copied) throw new Error(UI.copyFailed);
    }
    haptic();
    button.replaceChildren(successIcon(), el('span', '', UI.copied));
    button.classList.add('copied');
    toast(UI.copied, true);
  } catch {
    button.replaceChildren(...copyOriginals.get(button).map((n) => n.cloneNode(true)));
    toast(UI.copyFailed);
  } finally {
    button.disabled = false;
    button.setAttribute('aria-busy', 'false');
    copyTimers.set(
      button,
      setTimeout(() => {
        button.replaceChildren(...copyOriginals.get(button).map((n) => n.cloneNode(true)));
        button.classList.remove('copied');
      }, 1800),
    );
  }
}
