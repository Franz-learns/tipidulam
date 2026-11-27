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
    // One quick retry for flaky mobile data, then explain what's wrong.
    if (err.name !== 'AbortError') {
      try { res = await postWithTimeout('/api/scan', payload, 75000); } catch (err2) { err = err2; }
    }
    if (!res) throw new Error(explainNetworkError(err));
  }

  let body = {};
  try { body = await res.json(); } catch { /* not JSON */ }
  if (res.status === 404 || res.status === 405 || res.status === 501) {
    throw new Error(`The scan API isn't running on this address (${location.host}). It only works on your Vercel link or with "vercel dev". Add ?mock=1 to the URL to use demo mode.`);
  }
  if (res.status === 413) throw new Error('The photo is too large. Try again with a smaller photo.');
  if (res.status === 504) throw new Error('The scan took too long. Please try again.');
  if (!res.ok) {
    const base = body.error || `Scan failed (error ${res.status}).`;
    throw new Error(body.detail ? `${base} Details: ${body.detail}` : `${base} Open /api/health?test=1 on your site to check the setup.`);
  }
  return body.items || [];
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

// Turns Safari's "Load failed" / Chrome's "Failed to fetch" into something actionable.
function explainNetworkError(err) {
  if (err?.name === 'AbortError') return 'The scan took too long (over 75 seconds). Check your internet connection and try again, or take a closer photo of fewer shelves.';
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'You appear to be offline. Connect to the internet and try again.';
  const host = location.hostname;
  if (location.protocol === 'file:') return 'Open the site through a web server, not by double-clicking the file. Use your Vercel link, or add ?mock=1 for demo mode.';
  if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host) && location.port !== '3000') {
    return `This address (${location.host}) can't run the AI scan; Live Server and similar tools only serve files. Use your Vercel link or "vercel dev" (localhost:3000), or add ?mock=1 for demo mode.`;
  }
  if (host.endsWith('github.io')) return 'GitHub Pages can\'t run the AI scan. Use your Vercel link instead, or add ?mock=1 for demo mode.';
  return 'Could not reach the scan service. Check your internet connection and try again. If it keeps happening, open /api/health on your site to check the setup.';
}
