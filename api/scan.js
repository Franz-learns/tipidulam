// Vercel serverless function: POST /api/scan
// Body: { image: <base64 JPEG/PNG/WebP>, mimeType: "image/jpeg" }
// Returns: { items: [{ name, qty, unit, category, confidence }], provider, model }
// API keys stay here on the server — never in the browser.
// Provider setup and fallback order: see api/_lib/ai.js.

import { scanWithFallback, sanitizeItems } from './_lib/ai.js';

export { sanitizeItems };

const MAX_BASE64_CHARS = 4_000_000; // ~3 MB image; Vercel's request limit is 4.5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function friendly(err) {
  const all = err.errors || [];
  const msg = all.map((e) => e.message).join(' ').toLowerCase();
  if (err.provider === 'none') return err.message;
  if (all.some((e) => e.status === 429) || /quota|rate limit|resource.?exhausted/.test(msg)) {
    return 'The AI service is busy or your free quota ran out. Wait a minute and try again.';
  }
  if (all.some((e) => e.status === 401 || e.status === 403) || /api key|permission|unauthori[sz]ed|invalid.*key/.test(msg)) {
    return 'The AI API key was rejected. Check that the key in Vercel is correct and active, then redeploy.';
  }
  if (/billing|credit|insufficient/.test(msg)) return 'The AI account has no billing or credits set up.';
  if (/timed out/.test(msg)) return 'The AI took too long on this photo. Try again, or take a closer photo of one or two shelves.';
  return 'The photo could not be scanned. Please try again.';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image, mimeType } = req.body || {};
  if (typeof image !== 'string' || image.length === 0) return res.status(400).json({ error: 'No image received.' });
  if (!ALLOWED_TYPES.includes(mimeType)) return res.status(400).json({ error: 'Image must be JPEG, PNG, or WebP.' });
  if (image.length > MAX_BASE64_CHARS) return res.status(413).json({ error: 'Image is too large. Try a smaller photo.' });

  try {
    const { items, provider, model } = await scanWithFallback(image, mimeType);
    return res.status(200).json({ items, provider, model });
  } catch (err) {
    return res.status(err.status === 500 ? 500 : 502).json({
      error: friendly(err),
      // Shown under the message so you can see exactly what each provider said.
      detail: (err.errors || []).map((e) => `${e.label}${e.status ? ` (${e.status})` : ''}: ${e.message}`).join(' | ') || err.message
    });
  }
}
