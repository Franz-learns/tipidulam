// Vercel serverless function: POST /api/scan
// Receives a compressed photo from the browser, asks Gemini what food items
// are in it, and returns a clean JSON list. The API key stays on the server.

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.7-flash';
const MAX_BASE64_CHARS = 4_000_000; // ~3 MB image; Vercel's body limit is 4.5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const UNITS = ['pc', 'pack', 'bottle', 'can', 'kg', 'g', 'bundle', 'tray', 'container'];
const CATEGORIES = ['meat', 'seafood', 'vegetable', 'fruit', 'dairy', 'egg',
  'condiment', 'drink', 'grain', 'frozen', 'other'];
const CONFIDENCE = ['high', 'medium', 'low'];

const PROMPT = `You are looking at a photo of a refrigerator, freezer, or pantry in a Filipino household.
List every food item or ingredient you can clearly see.
Rules:
- Use common Filipino grocery names in lowercase (e.g. "kangkong", "calamansi", "hotdog", "eggs", "tomato", "pork", "chicken").
- qty: whole number estimate; if unsure, use 1.
- unit: one of ${UNITS.join(', ')}.
- category: one of ${CATEGORIES.join(', ')}.
- confidence: high, medium, or low.
- Do not guess what is inside closed, opaque containers; list them as "unknown container" with category "other" and confidence "low".
- Do not list non-food items.`;

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          qty: { type: 'INTEGER' },
          unit: { type: 'STRING', enum: UNITS },
          category: { type: 'STRING', enum: CATEGORIES },
          confidence: { type: 'STRING', enum: CONFIDENCE }
        },
        required: ['name', 'qty', 'unit', 'category', 'confidence']
      }
    }
  },
  required: ['items']
};

// Never trust model output blindly: clamp and whitelist every field.
export function sanitizeItems(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 60).map((it) => ({
    name: String(it?.name ?? '').trim().toLowerCase().slice(0, 60),
    qty: Math.min(Math.max(parseInt(it?.qty, 10) || 1, 1), 999),
    unit: UNITS.includes(it?.unit) ? it.unit : 'pc',
    category: CATEGORIES.includes(it?.category) ? it.category : 'other',
    confidence: CONFIDENCE.includes(it?.confidence) ? it.confidence : 'low'
  })).filter((it) => it.name.length > 0);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'Server is missing GEMINI_API_KEY.' });

  const { image, mimeType } = req.body || {};
  if (typeof image !== 'string' || image.length === 0) {
    return res.status(400).json({ error: 'No image received.' });
  }
  if (!ALLOWED_TYPES.includes(mimeType)) {
    return res.status(400).json({ error: 'Image must be JPEG, PNG, or WebP.' });
  }
  if (image.length > MAX_BASE64_CHARS) {
    return res.status(413).json({ error: 'Image is too large. Try again with a smaller photo.' });
  }

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: mimeType, data: image } },
              { text: PROMPT }
            ]
          }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: SCHEMA,
            temperature: 0.2
          }
        })
      }
    );

    if (!r.ok) {
      console.error('Gemini error', r.status, await r.text());
      const msg = r.status === 429
        ? 'Too many scans right now. Please wait a minute and try again.'
        : 'Image scan failed. Please try again.';
      return res.status(502).json({ error: msg });
    }

    const data = await r.json();
    const text = (data?.candidates?.[0]?.content?.parts || [])
      .map((p) => p.text || '').join('');

    let parsed;
    try { parsed = JSON.parse(text); } catch {
      return res.status(502).json({ error: 'Could not read the scan result. Try another photo.' });
    }

    return res.status(200).json({ items: sanitizeItems(parsed.items) });
  } catch (err) {
    console.error('Scan handler error', err);
    return res.status(500).json({ error: 'Something went wrong while scanning.' });
  }
}
