import { read, write } from './storage.js';
import { INGREDIENTS, DEFAULT_STAPLES } from '../data/ingredients.js';

export const DEFAULT_SETTINGS = {
  householdSize: 4,
  weeklyBudget: 2500,
  mealTypes: ['breakfast', 'lunch', 'dinner'],
  includeRice: true,
  riceKgPerPersonMeal: 0.1,   // ~1 cup cooked rice per person per meal
  staples: [...DEFAULT_STAPLES],
  priceOverrides: {}           // { ingredientKey: pricePHP }
};

const clamp = (n, lo, hi, fallback) => {
  const v = Number(n);
  return Number.isFinite(v) ? Math.min(Math.max(v, lo), hi) : fallback;
};

export function getSettings() {
  return { ...DEFAULT_SETTINGS, ...read('settings', {}) };
}

export function saveSettings(patch) {
  const s = { ...getSettings(), ...patch };
  s.householdSize = Math.round(clamp(s.householdSize, 1, 20, 4));
  s.weeklyBudget = clamp(s.weeklyBudget, 100, 100000, 2500);
  s.riceKgPerPersonMeal = clamp(s.riceKgPerPersonMeal, 0, 1, 0.1);
  if (!Array.isArray(s.mealTypes) || s.mealTypes.length === 0) s.mealTypes = ['lunch', 'dinner'];
  write('settings', s);
  return s;
}

/** Ingredient catalog with the user's price overrides applied. */
export function getCatalog(settings = getSettings()) {
  const out = {};
  for (const [key, v] of Object.entries(INGREDIENTS)) {
    const override = settings.priceOverrides?.[key];
    out[key] = { ...v, key, defaultPrice: v.price, price: override != null ? Number(override) : v.price };
  }
  return out;
}

export function setPrice(key, price) {
  const s = getSettings();
  const overrides = { ...s.priceOverrides };
  if (price === null || price === '' || Number(price) === INGREDIENTS[key]?.price) delete overrides[key];
  else overrides[key] = clamp(price, 0, 100000, INGREDIENTS[key]?.price ?? 0);
  return saveSettings({ priceOverrides: overrides });
}
