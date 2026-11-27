// Shared helpers — no DOM access, safe to port to Angular/Ionic.

const pesoFormatter = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

/** formatPeso(1500) → "₱1,500.00" */
export const formatPeso = (value) => pesoFormatter.format(Number.isFinite(value) ? value : 0);

export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Rounds a needed quantity up to what you can actually buy (0.25 kg steps, or whole units). */
export const toPurchaseQty = (qty, divisible) =>
  divisible ? Math.ceil(qty / 0.25 - 1e-9) * 0.25 : Math.ceil(qty - 1e-9);

const UNIT_WORDS = {
  kg: ['kg', 'kg'],
  pc: ['pc', 'pcs'],
  bundle: ['tali', 'tali'],
  pack: ['pack', 'packs'],
  can: ['can', 'cans'],
  bottle: ['bottle', 'bottles'],
};

const trimNum = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''));

/** Shopping-list quantity: "1.5 kg", "2 bottles". */
export const formatPurchaseQty = (qty, unit) => {
  const [one, many] = UNIT_WORDS[unit] ?? [unit, unit];
  return `${trimNum(qty)} ${qty === 1 ? one : many}`;
};

/**
 * Cooking quantity, friendlier for beginners:
 *  0.25 kg → "250 g", 0.03 bottle of 1000 ml → "2 tbsp", 4 pc → "4 pcs".
 */
export const formatCookingQty = (qty, item) => {
  if (item.unit === 'kg') {
    if (qty >= 1) return `${trimNum(Math.round(qty * 100) / 100)} kg`;
    const g = qty * 1000;
    return `${g >= 50 ? Math.round(g / 5) * 5 : Math.max(Math.round(g), 1)} g`;
  }
  const fractional = !Number.isInteger(Math.round(qty * 100) / 100);
  if (fractional && item.content) {
    const amount = qty * item.content.amount;
    if (item.content.measure === 'ml') {
      if (amount <= 60) {
        const tbsp = Math.max(Math.round(amount / 15 * 2) / 2, 0.5);
        return `${trimNum(tbsp)} tbsp`;
      }
      return `${Math.round(amount / 10) * 10} ml`;
    }
    return `${Math.max(Math.round(amount), 1)} g`;
  }
  if (fractional) {
    const rounded = Math.round(qty * 4) / 4 || 0.25;
    const [one, many] = UNIT_WORDS[item.unit] ?? [item.unit, item.unit];
    return `${quarterText(rounded)} ${rounded <= 1 ? one : many}`;
  }
  return formatPurchaseQty(Math.round(qty), item.unit);
};

/** 0.75 → "¾", 1.5 → "1 ½" */
const quarterText = (n) => {
  const whole = Math.floor(n);
  const frac = { 0: '', 0.25: '¼', 0.5: '½', 0.75: '¾' }[Math.round((n - whole) * 4) / 4] ?? '';
  return [whole || '', frac].filter(Boolean).join(' ');
};

/** Great-circle distance in km between two lat/lon points (Haversine). */
export const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

export const normalize = (s) =>
  String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').trim();

/** Escapes text before inserting it into innerHTML (API data is untrusted). */
export const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** fetch() with a timeout; throws on non-2xx so callers can fall back. */
export async function fetchJson(url, { timeoutMs = 8000, ...options } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}
