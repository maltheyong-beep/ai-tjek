// Understøtter Workerens validering og sikre modelkald.
import { API_ERRORS, LANGUAGES } from '../js/i18n.js';
import { validateText, countWords, MAX_WORDS } from '../js/utils.js';
import { validateAiResponse } from '../js/ai-schema.js';
import { modelRequest } from './prompt.js';

export const ALLOWED_ORIGIN = 'https://maltheyong-beep.github.io';
const HOUR = 60 * 60 * 1000,
  LIMIT = 10,
  MAX_BYTES = 192 * 1024;

function cors(origin) {
  return {
    ...(origin === ALLOWED_ORIGIN ? { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN } : {}),
    Vary: 'Origin',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  };
}
function json(data, status, origin, extra = {}) {
  return Response.json(data, { status, headers: { ...cors(origin), ...extra } });
}
function failure(code, status, origin, extra) {
  return json({ error: { code, message: API_ERRORS[code] } }, status, origin, extra);
}

async function readInput(request) {
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) throw Error('INPUT');
  if (Number(request.headers.get('Content-Length')) > MAX_BYTES) throw Error('TOO_LARGE');
  const reader = request.body?.getReader();
  if (!reader) throw Error('INPUT');
  const parts = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BYTES) {
      await reader.cancel();
      throw Error('TOO_LARGE');
    }
    parts.push(value);
  }
  const buffer = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    buffer.set(part, offset);
    offset += part.byteLength;
  }
  let input;
  try {
    input = JSON.parse(new TextDecoder().decode(buffer));
  } catch {
    throw Error('INPUT');
  }
  if (
    !input ||
    typeof input.text !== 'string' ||
    !LANGUAGES[input.language] ||
    !['light', 'medium', 'strong'].includes(input.intensity) ||
    !['neutral', 'school', 'casual'].includes(input.tone) ||
    typeof input.protectedTerms !== 'string' ||
    input.protectedTerms.length > 2000
  )
    throw Error('INPUT');
  if (Object.keys(input).some((key) => !['text', 'language', 'intensity', 'tone', 'protectedTerms'].includes(key)))
    throw Error('INPUT');
  try {
    validateText(input.text);
  } catch {
    throw Error(countWords(input.text) > MAX_WORDS ? 'TOO_LARGE' : 'INPUT');
  }
  return input;
}

async function ipKey(ip, salt) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(salt), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
  ]);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(ip));
  return [...new Uint8Array(signature)].map((n) => n.toString(16).padStart(2, '0')).join('');
}

// Tælleren er globalt konsistent og indeholder kun tidspunkter, aldrig tekst eller en rå IP-adresse.
export async function consumeLimit(storage, now) {
  const result = await storage.transaction(async (transaction) => {
    const calls = ((await transaction.get('calls')) || []).filter((time) => time > now - HOUR);
    if (calls.length >= LIMIT)
      return { allowed: false, retryAfter: Math.max(1, Math.ceil((calls[0] + HOUR - now) / 1000)), first: calls[0] };
    calls.push(now);
    await transaction.put('calls', calls);
    return { allowed: true, remaining: LIMIT - calls.length, first: calls[0] };
  });
  await storage.setAlarm(result.first + HOUR + 1000);
  return result;
}
export class RateLimiter {
  constructor(state) {
    this.state = state;
  }
  async fetch() {
    return Response.json(await consumeLimit(this.state.storage, Date.now()));
  }
  async alarm() {
    const remaining = await this.state.storage.transaction(async (transaction) => {
      const calls = ((await transaction.get('calls')) || []).filter((time) => time > Date.now() - HOUR);
      if (calls.length) await transaction.put('calls', calls);
      else await transaction.delete('calls');
      return calls;
    });
    if (remaining.length) await this.state.storage.setAlarm(remaining[0] + HOUR + 1000);
  }
}

async function askClaude(input, env, signal, fetchImpl) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetchImpl('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(modelRequest(input, env.CLAUDE_MODEL || 'claude-haiku-5-5', attempt === 1)),
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw Error('UPSTREAM');
    }
    try {
      const message = await response.json();
      if (message.stop_reason !== 'end_turn') throw Error('INVALID_OUTPUT');
      const content = message.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('');
      return validateAiResponse(JSON.parse(content), input);
    } catch {
      if (attempt === 1) throw Error('INVALID_OUTPUT');
    }
  }
}

export function createHandler({ fetchImpl = globalThis.fetch } = {}) {
  return async function handle(request, env) {
    const origin = request.headers.get('Origin');
    if (origin !== ALLOWED_ORIGIN) return failure('ORIGIN', 403, origin);
    if (new URL(request.url).pathname !== '/humanize') return failure('PATH', 404, origin);
    if (request.method === 'OPTIONS')
      return new Response(null, {
        status: 204,
        headers: {
          ...cors(origin),
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    if (request.method !== 'POST') return failure('METHOD', 405, origin, { Allow: 'POST, OPTIONS' });
    let input;
    try {
      input = await readInput(request);
    } catch (error) {
      return failure(
        error.message === 'TOO_LARGE' ? 'TOO_LARGE' : 'INPUT',
        error.message === 'TOO_LARGE' ? 413 : 400,
        origin,
      );
    }
    if (!env.ANTHROPIC_API_KEY || !env.RATE_LIMIT_SALT || !env.RATE_LIMITER)
      return failure('NOT_CONFIGURED', 503, origin);
    const ip = request.headers.get('CF-Connecting-IP');
    if (!ip) return failure('INPUT', 400, origin);
    const controller = new AbortController();
    const abort = () => controller.abort();
    request.signal.addEventListener('abort', abort, { once: true });
    const timeout = setTimeout(abort, 55000);
    try {
      const hash = await ipKey(ip, env.RATE_LIMIT_SALT);
      const stub = env.RATE_LIMITER.get(env.RATE_LIMITER.idFromName(hash));
      const limit = await (await stub.fetch('https://limit.internal/consume', { method: 'POST' })).json();
      if (!limit.allowed) return failure('RATE_LIMIT', 429, origin, { 'Retry-After': String(limit.retryAfter) });
      const output = await askClaude(input, env, controller.signal, fetchImpl);
      return json({ version: 2, provider: 'claude', language: input.language, ...output }, 200, origin);
    } catch (error) {
      const code = controller.signal.aborted
        ? 'TIMEOUT'
        : ['UPSTREAM', 'INVALID_OUTPUT'].includes(error.message)
          ? error.message
          : 'INTERNAL';
      return failure(code, code === 'TIMEOUT' ? 504 : 502, origin);
    } finally {
      clearTimeout(timeout);
      request.signal.removeEventListener('abort', abort);
    }
  };
}
const handler = createHandler();
export default { fetch: (request, env) => handler(request, env) };
