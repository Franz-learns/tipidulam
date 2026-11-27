// Shared AI vision code for /api/scan and /api/health.
// Files in folders starting with "_" are not exposed as API routes on Vercel.
//
// Supported providers (set one or more API keys in Vercel → Environment Variables):
//   gemini    GEMINI_API_KEY     (free tier: aistudio.google.com)
//   openai    OPENAI_API_KEY     (paid: platform.openai.com)
//   anthropic ANTHROPIC_API_KEY  (paid: console.anthropic.com)
// Optional:
//   AI_PROVIDER   which provider to try first (gemini | openai | anthropic)
//   GEMINI_MODEL / OPENAI_MODEL / ANTHROPIC_MODEL   override the default model
// If a provider fails, the next configured one is tried automatically.

export const UNITS = ['pc', 'pack', 'bottle', 'can', 'kg', 'g', 'L', 'bundle', 'tray', 'container'];
export const CATEGORIES = ['meat', 'seafood', 'vegetable', 'fruit', 'dairy', 'egg',
  'condiment', 'canned', 'drink', 'grain', 'frozen', 'other'];
const CONFIDENCE = ['high', 'medium', 'low'];

export const PROMPT = `You are looking at a photo of a refrigerator, freezer, or pantry in a Filipino household.
List every food item or ingredient you can clearly see.
Rules:
- Use common grocery names in lowercase, Filipino or English as Filipinos say them (e.g. "kangkong", "calamansi", "hotdog", "eggs", "kamatis", "pork", "chicken", "sardinas", "corned beef").
- qty: whole-number estimate of how many you see; if unsure, use 1.
- unit: one of ${UNITS.join(', ')}. Use "pc" for countable items like eggs, "bundle" for leafy vegetables, "pack" for packaged goods, "can" for canned goods.
- category: one of ${CATEGORIES.join(', ')}.
- confidence: high, medium, or low.
- Do not guess what is inside closed, opaque containers; list each as "unknown container" with category "other" and confidence "low".
- Do not list non-food items. If there is no food, return an empty list.
- List at most 40 items; group identical items into one row with a qty. Answer quickly.`;

// Standard JSON Schema (OpenAI, Anthropic)
const ITEM_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    qty: { type: 'integer' },
    unit: { type: 'string', enum: UNITS },
    category: { type: 'string', enum: CATEGORIES },
    confidence: { type: 'string', enum: CONFIDENCE }
  },
  required: ['name', 'qty', 'unit', 'category', 'confidence'],
  additionalProperties: false
};
const JSON_SCHEMA = {
  type: 'object',
  properties: { items: { type: 'array', items: ITEM_SCHEMA } },
  required: ['items'],
  additionalProperties: false
};

// Gemini's schema dialect
const GEMINI_SCHEMA = {
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

export class ProviderError extends Error {
  constructor(provider, message, status = 0) {
    super(message);
    this.provider = provider;
    this.status = status;
  }
}

/** Never trust model output blindly: clamp and whitelist every field. */
export function sanitizeItems(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 60).map((it) => ({
    name: String(it?.name ?? '').replace(/[<>]/g, '').trim().toLowerCase().slice(0, 60),
    qty: Math.min(Math.max(parseInt(it?.qty, 10) || 1, 1), 999),
    unit: UNITS.includes(it?.unit) ? it.unit : 'pc',
    category: CATEGORIES.includes(it?.category) ? it.category : 'other',
    confidence: CONFIDENCE.includes(it?.confidence) ? it.confidence : 'low'
  })).filter((it) => it.name.length > 0);
}

/** Parse JSON even if a model wrapped it in ```json fences or added text. */
export function parseJsonLoose(text) {
  const t = String(text || '').trim();
  try { return JSON.parse(t); } catch { /* fall through */ }
  const fenced = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) { try { return JSON.parse(fenced[1]); } catch { /* fall through */ } }
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start !== -1 && end > start) { try { return JSON.parse(t.slice(start, end + 1)); } catch { /* fall through */ } }
  return null;
}

async function readError(r) {
  const text = await r.text().catch(() => '');
  try {
    const j = JSON.parse(text);
    return String(j?.error?.message || j?.message || j?.error || text).slice(0, 240);
  } catch {
    return text.slice(0, 240) || `HTTP ${r.status}`;
  }
}

// Per-request limit. Vercel allows the function 60 s (see vercel.json), so keep this under that.
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 50000;

async function fetchWithTimeout(url, opts, ms = AI_TIMEOUT_MS) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------- Gemini
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
let geminiResolvedModel = null; // cached after auto-discovery

async function discoverGeminiModel(key) {
  const r = await fetchWithTimeout(`${GEMINI_BASE}/models?pageSize=200`, { headers: { 'x-goog-api-key': key } }, 10000);
  if (!r.ok) throw new ProviderError('gemini', `Could not list models: ${await readError(r)}`, r.status);
  const { models = [] } = await r.json();
  const usable = models
    .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map((m) => m.name.replace(/^models\//, ''))
    .filter((n) => /flash/i.test(n) && !/(image|tts|live|audio|embedding|thinking|exp)/i.test(n));
  // Prefer non-lite, then the highest version number
  const ver = (n) => parseFloat((n.match(/gemini-(\d+(?:\.\d+)?)/) || [0, 0])[1]);
  usable.sort((a, b) => (/lite/.test(a) - /lite/.test(b)) || ver(b) - ver(a) || a.length - b.length);
  if (!usable.length) throw new ProviderError('gemini', 'No Gemini Flash model is available for this API key.');
  return usable[0];
}

// Newer Gemini models "think" before answering, which makes busy photos slow.
// Listing groceries doesn't need deep reasoning, so ask for minimal thinking.
// If a model rejects that setting, we remember and send requests without it.
let geminiThinkingSupported = true;

function geminiBody(image, mimeType, withThinking) {
  const generationConfig = { responseMimeType: 'application/json', responseSchema: GEMINI_SCHEMA, temperature: 0.2 };
  if (withThinking) generationConfig.thinkingConfig = { thinkingLevel: 'low' };
  return JSON.stringify({
    contents: [{ parts: [{ inline_data: { mime_type: mimeType, data: image } }, { text: PROMPT }] }],
    generationConfig
  });
}

async function geminiCall(key, model, image, mimeType) {
  const url = `${GEMINI_BASE}/models/${encodeURIComponent(model)}:generateContent`;
  const send = (withThinking) => fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: geminiBody(image, mimeType, withThinking)
  });
  if (!geminiThinkingSupported) return send(false);
  const r = await send(true);
  if (r.status === 400) {
    const text = await r.clone().text().catch(() => '');
    if (/thinking/i.test(text)) {
      geminiThinkingSupported = false;
      return send(false);
    }
  }
  return r;
}

async function scanGemini(image, mimeType) {
  const key = process.env.GEMINI_API_KEY;
  let model = process.env.GEMINI_MODEL || geminiResolvedModel || 'gemini-3.5-flash';
  let r = await geminiCall(key, model, image, mimeType);

  // Model name not found → look up an available Flash model and retry once.
  if (r.status === 404 || r.status === 400) {
    const firstError = await readError(r);
    if (r.status === 404 || /model|not found|not supported/i.test(firstError)) {
      model = await discoverGeminiModel(key);
      geminiResolvedModel = model;
      r = await geminiCall(key, model, image, mimeType);
    } else {
      throw new ProviderError('gemini', firstError, 400);
    }
  }
  if (!r.ok) throw new ProviderError('gemini', await readError(r), r.status);

  const data = await r.json();
  const cand = data?.candidates?.[0];
  if (!cand) {
    const reason = data?.promptFeedback?.blockReason;
    throw new ProviderError('gemini', reason ? `Photo was blocked (${reason}).` : 'Empty response.');
  }
  const parsed = parseJsonLoose((cand.content?.parts || []).map((p) => p.text || '').join(''));
  if (!parsed) throw new ProviderError('gemini', `Could not read the result (finish reason: ${cand.finishReason || 'unknown'}).`);
  return { items: sanitizeItems(parsed.items), model };
}

// ---------------------------------------------------------------- OpenAI
async function scanOpenAI(image, mimeType) {
  const model = process.env.OPENAI_MODEL || 'gpt-5.4-mini';
  const r = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: PROMPT },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${image}`, detail: 'auto' } }
        ]
      }],
      response_format: { type: 'json_schema', json_schema: { name: 'pantry_items', strict: true, schema: JSON_SCHEMA } }
    })
  });
  if (!r.ok) throw new ProviderError('openai', await readError(r), r.status);
  const data = await r.json();
  const msg = data?.choices?.[0]?.message;
  if (msg?.refusal) throw new ProviderError('openai', `Refused: ${msg.refusal}`);
  const parsed = parseJsonLoose(msg?.content);
  if (!parsed) throw new ProviderError('openai', 'Could not read the result.');
  return { items: sanitizeItems(parsed.items), model };
}

// ---------------------------------------------------------------- Anthropic (Claude)
async function scanAnthropic(image, mimeType) {
  const model = process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5';
  const r = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      tools: [{ name: 'record_pantry_items', description: 'Record the food items seen in the photo.', input_schema: JSON_SCHEMA }],
      tool_choice: { type: 'tool', name: 'record_pantry_items' },
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: image } },
          { type: 'text', text: PROMPT }
        ]
      }]
    })
  });
  if (!r.ok) throw new ProviderError('anthropic', await readError(r), r.status);
  const data = await r.json();
  const block = (data?.content || []).find((b) => b.type === 'tool_use');
  const parsed = block?.input || parseJsonLoose((data?.content || []).map((b) => b.text || '').join(''));
  if (!parsed) throw new ProviderError('anthropic', 'Could not read the result.');
  return { items: sanitizeItems(parsed.items), model };
}

// ---------------------------------------------------------------- Routing
const PROVIDERS = {
  gemini: { envKey: 'GEMINI_API_KEY', run: scanGemini, label: 'Gemini', defaultModel: () => process.env.GEMINI_MODEL || geminiResolvedModel || 'gemini-3.5-flash (auto-detects if unavailable)' },
  openai: { envKey: 'OPENAI_API_KEY', run: scanOpenAI, label: 'OpenAI', defaultModel: () => process.env.OPENAI_MODEL || 'gpt-5.4-mini' },
  anthropic: { envKey: 'ANTHROPIC_API_KEY', run: scanAnthropic, label: 'Claude', defaultModel: () => process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5' }
};

/** Configured providers in the order they'll be tried. */
export function providerOrder() {
  const configured = Object.keys(PROVIDERS).filter((p) => Boolean(process.env[PROVIDERS[p].envKey]));
  const preferred = String(process.env.AI_PROVIDER || '').toLowerCase();
  if (configured.includes(preferred)) return [preferred, ...configured.filter((p) => p !== preferred)];
  return configured;
}

export function providerStatus() {
  return Object.fromEntries(Object.entries(PROVIDERS).map(([id, p]) => [id, {
    configured: Boolean(process.env[p.envKey]),
    model: process.env[p.envKey] ? p.defaultModel() : null
  }]));
}

/** Try each configured provider until one works. */
export async function scanWithFallback(image, mimeType, { only } = {}) {
  const order = only ? [only] : providerOrder();
  if (order.length === 0) {
    throw new ProviderError('none', 'No AI API key is set. Add GEMINI_API_KEY (free), OPENAI_API_KEY or ANTHROPIC_API_KEY in Vercel, then redeploy.', 500);
  }
  const errors = [];
  for (const id of order) {
    try {
      const result = await PROVIDERS[id].run(image, mimeType);
      return { ...result, provider: id, errors };
    } catch (err) {
      const message = err.name === 'AbortError' ? `Timed out after ${Math.round(AI_TIMEOUT_MS / 1000)} s.` : err.message;
      console.error(`[scan] ${id} failed`, err.status || '', message);
      errors.push({ provider: id, label: PROVIDERS[id].label, status: err.status || 0, message });
    }
  }
  const e = new ProviderError('all', errors.map((x) => `${x.label}: ${x.message}`).join(' | '), 502);
  e.errors = errors;
  throw e;
}

export const PROVIDER_LABELS = Object.fromEntries(Object.entries(PROVIDERS).map(([k, v]) => [k, v.label]));
