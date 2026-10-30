const KEY = 'ai-tjek:draft:v2';

function session() {
  try { return globalThis.sessionStorage; } catch { return null; }
}
export function readDraft(storage = session()) {
  try {
    if (!storage) return { data: null, ok: false };
    const raw = storage.getItem(KEY);
    if (!raw) return { data: null, ok: true };
    const data = JSON.parse(raw);
    if (data.version !== 2 || typeof data.text !== 'string' || data.text.length > 2000000) return { data: null, ok: false };
    return { data, ok: true };
  } catch { return { data: null, ok: false }; }
}
export function saveDraft(data, storage = session()) {
  try {
    if (!storage) return false;
    if (!data.text) storage.removeItem(KEY);
    else storage.setItem(KEY, JSON.stringify({ ...data, version: 2 }));
    return true;
  } catch { return false; }
}
export function clearDraft(storage = session()) {
  try { storage?.removeItem(KEY); return Boolean(storage); } catch { return false; }
}
