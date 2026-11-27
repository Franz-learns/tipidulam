// Calls the serverless scan API. Add ?mock=1 to any page URL to get sample
// results with no API call (offline demos, defense backup, UI testing).

export const isMockMode = () =>
  typeof location !== 'undefined' && new URLSearchParams(location.search).has('mock');

const MOCK_ITEMS = [
  { name: 'eggs', qty: 6, unit: 'pc', category: 'egg', confidence: 'high' },
  { name: 'eggplant', qty: 2, unit: 'pc', category: 'vegetable', confidence: 'high' },
  { name: 'tomato', qty: 3, unit: 'pc', category: 'vegetable', confidence: 'medium' },
  { name: 'kangkong', qty: 1, unit: 'bundle', category: 'vegetable', confidence: 'medium' },
  { name: 'chicken', qty: 1, unit: 'kg', category: 'meat', confidence: 'medium' },
  { name: 'hotdog', qty: 1, unit: 'pack', category: 'meat', confidence: 'high' },
  { name: 'garlic', qty: 1, unit: 'pc', category: 'vegetable', confidence: 'low' },
  { name: 'unknown container', qty: 1, unit: 'container', category: 'other', confidence: 'low' }
];

// Messages users see. Kept short and non-technical on purpose (good for demos).
// Add ?debug=1 to the page URL to also see the technical reason.
export const isDebugMode = () =>
  typeof location !== 'undefined' && new URLSearchParams(location.search).has('debug');

const MSG = {
  offline: "You're offline. Connect to the internet and try again.",
  slow: 'That took a little too long. Try again, or take a closer photo of one or two shelves.',
  big: 'That photo is too large. Please try a smaller one.',
  busy: 'Lots of scans right now. Please wait a moment and try again.',
  generic: "We couldn't scan that photo. Please try again, or add your items manually."
};

class ScanError extends Error {
  constructor(message, technical) {
    super(message);
    this.technical = technical || '';
    if (technical) console.warn('[TipidUlam scan]', technical);  // visible in DevTools only
  }
}

/** Friendly message, plus the technical reason when ?debug=1 is on. */
export function scanErrorText(err) {
  const base = err?.message || MSG.generic;
  return isDebugMode() && err?.technical ? `${base} (${err.technical})` : base;
}

/** @param {{base64: string, mimeType: string}} image */
export async function scanImage(image) {
  if (isMockMode()) {
    await new Promise((r) => setTimeout(r, 700));
    return structuredClone(MOCK_ITEMS);
  }
  const payload = JSON.stringify({ image: image.base64, mimeType: image.mimeType });
  let res;
  try {
    res = await postWithTimeout('/api/scan', payload, 75000);
  } catch (err) {
    // One quick retry for flaky mobile data.
    if (err.name !== 'AbortError') {
      try { res = await postWithTimeout('/api/scan', payload, 75000); } catch (err2) { err = err2; }
    }
    if (!res) {
      if (err?.name === 'AbortError') throw new ScanError(MSG.slow, 'Request timed out after 75 s');
      if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new ScanError(MSG.offline, 'navigator.onLine is false');
      throw new ScanError(MSG.generic, `Network error: ${err?.message || err}. ${setupHint()}`);
    }
  }

  let body = {};
  try { body = await res.json(); } catch { /* not JSON */ }
  if (res.ok) return body.items || [];

  const technical = `HTTP ${res.status}${body.detail ? `: ${body.detail}` : body.error ? `: ${body.error}` : ''}`;
  if (res.status === 404 || res.status === 405 || res.status === 501) throw new ScanError(MSG.generic, `${technical}. ${setupHint()}`);
  if (res.status === 400 && body.error) throw new ScanError(body.error, technical);
  if (res.status === 413) throw new ScanError(MSG.big, technical);
  if (res.status === 504 || body.code === 'timeout') throw new ScanError(MSG.slow, technical);
  if (res.status === 429 || body.code === 'busy') throw new ScanError(MSG.busy, technical);
  throw new ScanError(MSG.generic, technical);
}

async function postWithTimeout(url, body, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Developer hint (debug mode / console only): why the API may be unreachable.
function setupHint() {
  const host = location.hostname;
  if (location.protocol === 'file:') return 'Page opened as a file; serve it over http.';
  if (host.endsWith('github.io')) return 'GitHub Pages cannot run /api; use the Vercel link.';
  if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host) && location.port !== '3000') return 'Static dev server cannot run /api; use "vercel dev" or the Vercel link, or ?mock=1.';
  return 'Check /api/health?test=1.';
}
