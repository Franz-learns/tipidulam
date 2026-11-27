// Storage layer. Everything is saved in the browser's localStorage for now.
// To move to a real backend (PHP/MySQL, Firebase, Supabase…), replace
// read()/write() here — services and pages don't touch localStorage directly.

const PREFIX = 'tipidulam.v1.';
export const KEYS = ['settings', 'pantry', 'plan', 'grocery'];

export function read(key, fallback) {
  try {
    const v = localStorage.getItem(PREFIX + key);
    return v === null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}

export function write(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function uid() {
  return (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`);
}

export function exportAll() {
  const data = {};
  for (const k of KEYS) data[k] = read(k, null);
  return { app: 'TipidUlam', version: 1, exportedAt: new Date().toISOString(), data };
}

export function importAll(obj) {
  if (!obj || obj.app !== 'TipidUlam' || typeof obj.data !== 'object') {
    throw new Error('This is not a TipidUlam backup file.');
  }
  for (const k of KEYS) {
    if (obj.data[k] !== undefined && obj.data[k] !== null) write(k, obj.data[k]);
  }
}

export function clearAll() {
  try { for (const k of KEYS) localStorage.removeItem(PREFIX + k); } catch { /* ignore */ }
}
