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
  const res = await fetch('/api/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: image.base64, mimeType: image.mimeType })
  });
  let body = {};
  try { body = await res.json(); } catch { /* not JSON */ }
  if (res.status === 404) throw new Error('Scan API not found. Run the site with "vercel dev", or add ?mock=1 to the URL for demo mode.');
  if (!res.ok) throw new Error(body.error || `Scan failed (${res.status}).`);
  return body.items || [];
}
