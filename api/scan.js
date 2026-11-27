// Vercel serverless function: POST /api/scan
// Body: { image: <base64 JPEG/PNG/WebP>, mimeType: "image/jpeg" }
// Returns: { items: [{ name, qty, unit, category, confidence }], provider, model }
// API keys stay here on the server — never in the browser.
// Provider setup and fallback order: see api/_lib/ai.js.

import { scanWithFallback, sanitizeItems } from './_lib/ai.js';

export { sanitizeItems };

const MAX_BASE64_CHARS = 4_000_000; // ~3 MB image; Vercel's request limit is 4.5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Short code the browser uses to pick a friendly message. Full reasons go to
// the Vercel logs (and to the response only when SCAN_DEBUG=1 is set).
function errorCode(err) {
  const all = err.errors || [];
  const msg = all.map((e) => e.message).join(' ').toLowerCase();
  if (err.provider === 'none') return 'not_configured';
  if (all.some((e) => e.status === 429) || /quota|rate limit|resource.?exhausted|overloaded/.test(msg)) return 'busy';
  if (/timed out/.test(msg)) return 'timeout';
  return 'failed';
}

const FRIENDLY = {
  not_configured: "Scanning isn't available right now. Please add your items manually.",
  busy: 'Lots of scans right now. Please wait a moment and try again.',
  timeout: 'That took a little too long. Try again, or take a closer photo of one or two shelves.',
  failed: "We couldn't scan that photo. Please try again, or add your items manually."
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image, mimeType } = req.body || {};
  if (typeof image !== 'string' || image.length === 0) return res.status(400).json({ error: 'Please choose a photo first.', code: 'no_image' });
  if (!ALLOWED_TYPES.includes(mimeType)) return res.status(400).json({ error: 'Please use a JPEG or PNG photo.', code: 'bad_type' });
  if (image.length > MAX_BASE64_CHARS) return res.status(413).json({ error: 'That photo is too large. Please try a smaller one.', code: 'too_large' });

  try {
    const { items, provider, model } = await scanWithFallback(image, mimeType);
    const out = { items };
    if (process.env.SCAN_DEBUG === '1') Object.assign(out, { provider, model });
    return res.status(200).json(out);
  } catch (err) {
    const code = errorCode(err);
    const detail = (err.errors || []).map((e) => `${e.label}${e.status ? ` (${e.status})` : ''}: ${e.message}`).join(' | ') || err.message;
    console.error('[scan] failed:', code, detail);
    const payload = { error: FRIENDLY[code], code };
    if (process.env.SCAN_DEBUG === '1') payload.detail = detail;
    return res.status(code === 'not_configured' ? 503 : 502).json(payload);
  }
}
