import { HUMANIZE_API_URL } from './config.js';
import { UI } from './i18n.js';
import { validateText, resolveLanguage } from './utils.js';
import { humanizeText } from './humanize-local.js';
import { validateAiResponse } from './ai-schema.js';

const abortError = () => new DOMException('Aborted', 'AbortError');
function fallback(text, options, reason) {
  return { ...humanizeText(text, options), tone: options.tone, provider: 'local', fallbackReason: reason };
}
export async function humanizeWithFallback(text, options = {}, { endpoint = HUMANIZE_API_URL, fetchImpl = globalThis.fetch, timeoutMs = 60000 } = {}) {
  validateText(text); if (options.signal?.aborted) throw abortError();
  const input = { text, language: resolveLanguage(text, options.language), intensity: options.intensity || 'medium', tone: options.tone || 'neutral', protectedTerms: options.protectedTerms || '' };
  if (!endpoint) return fallback(text, input, 'NOT_CONFIGURED');
  const controller = new AbortController(); let timedOut = false;
  const cancel = () => controller.abort(); options.signal?.addEventListener('abort', cancel, { once: true });
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  try {
    const url = new URL(endpoint); if (url.protocol !== 'https:' || url.username || url.password) throw Error('NETWORK');
    options.onStatus?.(UI.busyAI);
    const response = await fetchImpl(url.href, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store', signal: controller.signal, body: JSON.stringify(input) });
    if (!response.ok) { await response.body?.cancel(); throw Error(response.status === 429 ? 'RATE_LIMIT' : response.status === 503 ? 'NOT_CONFIGURED' : 'NETWORK'); }
    const raw = await response.text(); if (raw.length > 1000000) throw Error('INVALID_OUTPUT');
    let output; try { output = validateAiResponse(JSON.parse(raw), input); } catch { throw Error('INVALID_OUTPUT'); }
    if (options.signal?.aborted) throw abortError();
    options.onStatus?.(UI.busyDiff);
    const { createDiffJob } = await import('./diff.js');
    return createDiffJob(text, output.text, { ...input, explanations: output.changes });
  } catch (failure) {
    if (options.signal?.aborted) throw abortError();
    return fallback(text, input, timedOut ? 'TIMEOUT' : ['RATE_LIMIT', 'NOT_CONFIGURED', 'INVALID_OUTPUT'].includes(failure.message) ? failure.message : 'NETWORK');
  } finally { clearTimeout(timeout); options.signal?.removeEventListener('abort', cancel); }
}
