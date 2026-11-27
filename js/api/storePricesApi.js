// API #1 — PH Store Prices (Supabase REST-ready, with a built-in seed dataset).
import { fetchJson } from '../utils/format.js';

/**
 * To use Supabase: fill these in (anon key is safe in the browser when Row Level Security is on).
 * Table columns are listed in README.md → "Connecting Supabase".
 */
export const PRICES_API_CONFIG = {
  supabaseUrl: '', // e.g. 'https://abcdxyz.supabase.co'
  supabaseAnonKey: '',
  table: 'ingredient_prices',
  timeoutMs: 6000,
};

export const STORE_IDS = ['PALENGKE', 'PUREGOLD', 'SM', 'ROBINSONS'];

export const STORE_LABELS = {
  CHEAPEST: 'Cheapest Mix Across Stores',
  PALENGKE: 'Local Palengke',
  PUREGOLD: 'Puregold',
  SM: 'SM Supermarket',
  ROBINSONS: 'Robinsons',
};

export const STORE_SHORT = { PALENGKE: 'Palengke', PUREGOLD: 'Puregold', SM: 'SM', ROBINSONS: 'Robinsons' };

// price(palengke, puregold, sm, robinsons)
const p = (palengke, puregold, sm, robinsons) => ({ PALENGKE: palengke, PUREGOLD: puregold, SM: sm, ROBINSONS: robinsons });

/**
 * Seed dataset — realistic Metro Manila price ESTIMATES (PHP) for the demo, not live prices.
 * unit      = what you buy (kg, pc, bundle, pack, can, bottle); recipe quantities use the same unit
 * divisible = true when sold by weight (rounded up to 0.25 kg)
 * content   = metric size of one unit, used to show "2 tbsp" / "250 g" in recipes
 */
export const SEED_PRICES = [
  // Bigas & Noodles
  { id: 'bigas', name: 'Regular Milled Rice', localName: 'Bigas', category: 'Bigas & Noodles', unit: 'kg', packLabel: '1 kg', divisible: true, prices: p(45, 50, 52, 53) },
  { id: 'misua', name: 'Misua Noodles', localName: 'Misua', category: 'Bigas & Noodles', unit: 'pack', packLabel: '100 g pack', divisible: false, content: { amount: 100, measure: 'g' }, prices: p(20, 20, 22, 23) },
  { id: 'bihon', name: 'Rice Noodles', localName: 'Bihon', category: 'Bigas & Noodles', unit: 'pack', packLabel: '227 g pack', divisible: false, content: { amount: 227, measure: 'g' }, prices: p(35, 36, 38, 40) },
  { id: 'monggo', name: 'Mung Beans', localName: 'Monggo', category: 'Bigas & Noodles', unit: 'kg', packLabel: '1 kg', divisible: true, prices: p(110, 125, 130, 135) },

  // Karne & Manok
  { id: 'manok', name: 'Chicken Cut-ups', localName: 'Manok', category: 'Karne & Manok', unit: 'kg', packLabel: '1 kg', divisible: true, prices: p(190, 200, 210, 215) },
  { id: 'baboy', name: 'Pork Shoulder (Kasim)', localName: 'Baboy', category: 'Karne & Manok', unit: 'kg', packLabel: '1 kg', divisible: true, prices: p(300, 320, 330, 340) },
  { id: 'giniling', name: 'Ground Pork', localName: 'Giniling', category: 'Karne & Manok', unit: 'kg', packLabel: '1 kg', divisible: true, prices: p(280, 290, 300, 310) },

  // Isda
  { id: 'bangus', name: 'Milkfish', localName: 'Bangus', category: 'Isda', unit: 'kg', packLabel: '1 kg (2–3 pcs)', divisible: true, prices: p(180, 210, 220, 225) },
  { id: 'tilapia', name: 'Tilapia', localName: 'Tilapia', category: 'Isda', unit: 'kg', packLabel: '1 kg (3–4 pcs)', divisible: true, prices: p(130, 150, 160, 165) },
  { id: 'galunggong', name: 'Round Scad', localName: 'Galunggong', category: 'Isda', unit: 'kg', packLabel: '1 kg', divisible: true, prices: p(200, 230, 240, 245) },

  // Itlog & Gatas
  { id: 'itlog', name: 'Eggs (medium)', localName: 'Itlog', category: 'Itlog & Gatas', unit: 'pc', packLabel: '1 pc', divisible: false, prices: p(7.5, 8, 8.5, 8.75) },
  { id: 'evap', name: 'Evaporated Milk', localName: 'Evap', category: 'Itlog & Gatas', unit: 'can', packLabel: '370 ml can', divisible: false, content: { amount: 370, measure: 'ml' }, prices: p(38, 36, 38, 39) },
  { id: 'tokwa', name: 'Firm Tofu', localName: 'Tokwa', category: 'Itlog & Gatas', unit: 'pc', packLabel: '1 block', divisible: false, prices: p(12, 14, 15, 16) },

  // Gulay
  { id: 'sayote', name: 'Chayote', localName: 'Sayote', category: 'Gulay', unit: 'kg', packLabel: '1 kg', divisible: true, prices: p(40, 55, 60, 65) },
  { id: 'kangkong', name: 'Water Spinach', localName: 'Kangkong', category: 'Gulay', unit: 'bundle', packLabel: '1 tali', divisible: false, prices: p(15, 18, 20, 22) },
  { id: 'malunggay', name: 'Moringa Leaves', localName: 'Malunggay', category: 'Gulay', unit: 'bundle', packLabel: '1 tali', divisible: false, prices: p(10, 15, 15, 17) },
  { id: 'pechay', name: 'Bok Choy', localName: 'Pechay', category: 'Gulay', unit: 'bundle', packLabel: '1 tali', divisible: false, prices: p(20, 25, 28, 30) },
  { id: 'talong', name: 'Eggplant', localName: 'Talong', category: 'Gulay', unit: 'kg', packLabel: '1 kg', divisible: true, prices: p(70, 85, 90, 95) },
  { id: 'sitaw', name: 'String Beans', localName: 'Sitaw', category: 'Gulay', unit: 'bundle', packLabel: '1 tali', divisible: false, prices: p(20, 24, 25, 27) },
  { id: 'kamatis', name: 'Tomato', localName: 'Kamatis', category: 'Gulay', unit: 'kg', packLabel: '1 kg', divisible: true, prices: p(80, 95, 100, 105) },
  { id: 'sibuyas', name: 'Red Onion', localName: 'Sibuyas', category: 'Gulay', unit: 'kg', packLabel: '1 kg', divisible: true, prices: p(130, 150, 160, 165) },
  { id: 'bawang', name: 'Garlic', localName: 'Bawang', category: 'Gulay', unit: 'kg', packLabel: '1 kg', divisible: true, prices: p(130, 150, 160, 170) },
  { id: 'luya', name: 'Ginger', localName: 'Luya', category: 'Gulay', unit: 'kg', packLabel: '1 kg', divisible: true, prices: p(150, 170, 180, 185) },
  { id: 'labanos', name: 'Radish', localName: 'Labanos', category: 'Gulay', unit: 'kg', packLabel: '1 kg', divisible: true, prices: p(50, 65, 70, 75) },
  { id: 'gabi', name: 'Taro', localName: 'Gabi', category: 'Gulay', unit: 'kg', packLabel: '1 kg', divisible: true, prices: p(70, 85, 90, 95) },
  { id: 'patatas', name: 'Potato', localName: 'Patatas', category: 'Gulay', unit: 'kg', packLabel: '1 kg', divisible: true, prices: p(70, 85, 90, 95) },
  { id: 'carrots', name: 'Carrots', localName: 'Karot', category: 'Gulay', unit: 'kg', packLabel: '1 kg', divisible: true, prices: p(80, 100, 110, 115) },
  { id: 'repolyo', name: 'Cabbage', localName: 'Repolyo', category: 'Gulay', unit: 'kg', packLabel: '1 kg', divisible: true, prices: p(60, 75, 80, 85) },
  { id: 'sili', name: 'Long Green Chili', localName: 'Siling Haba', category: 'Gulay', unit: 'pack', packLabel: '100 g', divisible: false, content: { amount: 100, measure: 'g' }, prices: p(15, 24, 25, 26) },
  { id: 'calamansi', name: 'Calamansi', localName: 'Kalamansi', category: 'Gulay', unit: 'pack', packLabel: '250 g', divisible: false, content: { amount: 250, measure: 'g' }, prices: p(25, 32, 35, 36) },

  // De Lata
  { id: 'sardinas', name: 'Ligo Sardines in Tomato Sauce', localName: 'Sardinas', category: 'De Lata', unit: 'can', packLabel: '155 g can', divisible: false, prices: p(26, 25, 26, 27) },
  { id: 'corned-beef', name: 'Argentina Corned Beef', localName: 'Corned Beef', category: 'De Lata', unit: 'can', packLabel: '150 g can', divisible: false, prices: p(40, 36, 38, 39) },
  { id: 'tuna', name: 'Century Tuna Flakes in Oil', localName: 'Tuna', category: 'De Lata', unit: 'can', packLabel: '155 g can', divisible: false, prices: p(42, 38, 40, 41) },

  // Pampalasa
  { id: 'toyo', name: 'Datu Puti Soy Sauce', localName: 'Toyo', category: 'Pampalasa', unit: 'bottle', packLabel: '1 L bottle', divisible: false, content: { amount: 1000, measure: 'ml' }, prices: p(58, 55, 58, 60) },
  { id: 'suka', name: 'Datu Puti Cane Vinegar', localName: 'Suka', category: 'Pampalasa', unit: 'bottle', packLabel: '1 L bottle', divisible: false, content: { amount: 1000, measure: 'ml' }, prices: p(45, 43, 45, 47) },
  { id: 'patis', name: 'Rufina Fish Sauce', localName: 'Patis', category: 'Pampalasa', unit: 'bottle', packLabel: '350 ml bottle', divisible: false, content: { amount: 350, measure: 'ml' }, prices: p(30, 28, 30, 31) },
  { id: 'mantika', name: 'Palm Cooking Oil', localName: 'Mantika', category: 'Pampalasa', unit: 'bottle', packLabel: '1 L bottle', divisible: false, content: { amount: 1000, measure: 'ml' }, prices: p(95, 105, 110, 115) },
  { id: 'asin', name: 'Iodized Salt', localName: 'Asin', category: 'Pampalasa', unit: 'pack', packLabel: '500 g pack', divisible: false, content: { amount: 500, measure: 'g' }, prices: p(15, 17, 18, 19) },
  { id: 'paminta', name: 'Ground Black Pepper', localName: 'Paminta', category: 'Pampalasa', unit: 'pack', packLabel: '25 g pack', divisible: false, content: { amount: 25, measure: 'g' }, prices: p(15, 17, 18, 19) },
  { id: 'laurel', name: 'Bay Leaves', localName: 'Dahon ng Laurel', category: 'Pampalasa', unit: 'pack', packLabel: '10 g pack', divisible: false, content: { amount: 10, measure: 'g' }, prices: p(10, 10, 12, 13) },
  { id: 'sinigang-mix', name: 'Knorr Sinigang sa Sampalok Mix', localName: 'Sinigang Mix', category: 'Pampalasa', unit: 'pack', packLabel: '22 g pack', divisible: false, prices: p(22, 21, 22, 23) },
  { id: 'asukal', name: 'Brown Sugar', localName: 'Asukal', category: 'Pampalasa', unit: 'kg', packLabel: '1 kg', divisible: true, prices: p(75, 80, 85, 88) },
  { id: 'tablea', name: 'Cacao Tablea', localName: 'Tablea', category: 'Pampalasa', unit: 'pack', packLabel: '6 pcs pack', divisible: false, prices: p(50, 58, 60, 62) },
];

const rowToItem = (r) => ({
  id: r.id,
  name: r.name,
  localName: r.local_name,
  category: r.category,
  unit: r.unit,
  packLabel: r.pack_label,
  divisible: Boolean(r.divisible),
  content: r.content_amount ? { amount: Number(r.content_amount), measure: r.content_measure } : undefined,
  prices: {
    PALENGKE: Number(r.price_palengke),
    PUREGOLD: Number(r.price_puregold),
    SM: Number(r.price_sm),
    ROBINSONS: Number(r.price_robinsons),
  },
});

const toCatalog = (items, isFallback) => ({
  items,
  byId: Object.fromEntries(items.map((i) => [i.id, i])),
  isFallback,
});

/**
 * Loads ingredient prices.
 * Supabase configured → GET {url}/rest/v1/ingredient_prices; otherwise (or on any error) → SEED_PRICES.
 * @returns {Promise<{items: object[], byId: Record<string, object>, isFallback: boolean}>}
 */
export async function fetchIngredientPrices(config = PRICES_API_CONFIG) {
  if (!config.supabaseUrl) return toCatalog(SEED_PRICES, true);
  try {
    const rows = await fetchJson(`${config.supabaseUrl}/rest/v1/${config.table}?select=*`, {
      timeoutMs: config.timeoutMs,
      headers: { apikey: config.supabaseAnonKey, Authorization: `Bearer ${config.supabaseAnonKey}` },
    });
    if (!Array.isArray(rows) || rows.length === 0) throw new Error('Empty price table');
    return toCatalog(rows.map(rowToItem), false);
  } catch (err) {
    console.warn('[storePricesApi] Using seed prices:', err.message);
    return toCatalog(SEED_PRICES, true);
  }
}

/** Store with the lowest price for one item. */
export const cheapestStore = (item) =>
  STORE_IDS.reduce((best, s) => (item.prices[s] < item.prices[best] ? s : best), STORE_IDS[0]);

/** Unit price given a store preference ('CHEAPEST' or a store ID). */
export const priceAt = (item, store) => (store === 'CHEAPEST' ? item.prices[cheapestStore(item)] : item.prices[store]);
