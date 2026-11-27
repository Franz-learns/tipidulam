// API #3 — Open Food Facts: packaged goods nutrition (Nutri-Score, kcal, allergens).
import { fetchJson } from '../utils/format.js';

export const OFF_BASE = 'https://world.openfoodfacts.org';

const FIELDS = 'code,product_name,brands,quantity,nutriscore_grade,nutriments,allergens_tags,ingredients_text,image_front_small_url';

/** Offline samples shown only if Open Food Facts can't be reached. Values are typical, not label-exact. */
export const SAMPLE_PRODUCTS = [
  { barcode: '', name: 'Century Tuna Flakes in Oil', brand: 'Century', quantity: '155 g', nutriScore: 'c', kcal: 190, protein: 16, allergens: ['fish'], image: '', isSample: true },
  { barcode: '', name: 'Lucky Me Pancit Canton Original', brand: 'Lucky Me', quantity: '60 g', nutriScore: 'e', kcal: 470, protein: 9, allergens: ['gluten', 'soybeans'], image: '', isSample: true },
  { barcode: '', name: 'Argentina Corned Beef', brand: 'Argentina', quantity: '150 g', nutriScore: 'd', kcal: 210, protein: 14, allergens: [], image: '', isSample: true },
  { barcode: '', name: 'Datu Puti Soy Sauce', brand: 'Datu Puti', quantity: '1 L', nutriScore: 'e', kcal: 60, protein: 5, allergens: ['soybeans', 'gluten'], image: '', isSample: true },
];

const toProduct = (p) => {
  const n = p.nutriments ?? {};
  const num = (k) => (n[k] === undefined || n[k] === '' ? null : Math.round(Number(n[k]) * 10) / 10);
  const grade = String(p.nutriscore_grade ?? '').toLowerCase();
  return {
    barcode: p.code ?? '',
    name: p.product_name || 'Unnamed product',
    brand: (p.brands ?? '').split(',')[0].trim(),
    quantity: p.quantity ?? '',
    nutriScore: ['a', 'b', 'c', 'd', 'e'].includes(grade) ? grade : 'unknown',
    kcal: num('energy-kcal_100g'),
    protein: num('proteins_100g'),
    allergens: (p.allergens_tags ?? []).map((t) => t.replace(/^\w{2}:/, '').replace(/-/g, ' ')),
    ingredients: p.ingredients_text ?? '',
    image: p.image_front_small_url ?? '',
    isSample: false,
  };
};

export const isBarcode = (q) => /^\d{8,14}$/.test(String(q).trim());

/** Barcode lookup via API v2. Returns a product or null. */
export async function getProductByBarcode(barcode) {
  try {
    const data = await fetchJson(`${OFF_BASE}/api/v2/product/${encodeURIComponent(barcode)}.json?fields=${FIELDS}`, { timeoutMs: 8000 });
    return data.status === 1 && data.product ? toProduct(data.product) : null;
  } catch (err) {
    console.warn('[openFoodFactsApi] barcode lookup failed:', err.message);
    return null;
  }
}

/**
 * Keyword search (full-text search endpoint), preferring products sold in the Philippines.
 * @returns {Promise<{products: object[], isFallback: boolean}>}
 */
export async function searchProducts(term, pageSize = 12) {
  const q = String(term).trim();
  if (!q) return { products: [], isFallback: false };

  if (isBarcode(q)) {
    const p = await getProductByBarcode(q);
    return { products: p ? [p] : [], isFallback: false };
  }

  const params = new URLSearchParams({
    search_terms: q,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: String(pageSize),
    tagtype_0: 'countries',
    tag_contains_0: 'contains',
    tag_0: 'philippines',
    fields: FIELDS,
  });
  try {
    const data = await fetchJson(`${OFF_BASE}/cgi/search.pl?${params}`, { timeoutMs: 10000 });
    const products = (data.products ?? []).filter((p) => p.product_name).map(toProduct);
    return { products, isFallback: false };
  } catch (err) {
    console.warn('[openFoodFactsApi] search failed, using samples:', err.message);
    const t = q.toLowerCase();
    const hits = SAMPLE_PRODUCTS.filter((s) => `${s.name} ${s.brand}`.toLowerCase().includes(t));
    return { products: hits.length ? hits : SAMPLE_PRODUCTS, isFallback: true };
  }
}
