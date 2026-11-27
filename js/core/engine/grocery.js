// Builds the grocery list: everything the uncooked meals in the plan need,
// minus what's already in stock, rounded up to buying amounts.
// Staples are skipped. Pure functions, no DOM.

import { recipeNeeds, roundUpToStep, round2 } from './costing.js';
import { buildStock, takeFromStock } from './stock.js';

const CATEGORY_ORDER = ['meat', 'seafood', 'egg', 'vegetable', 'fruit', 'grain', 'canned', 'condiment', 'dairy', 'frozen', 'drink', 'other'];

export function buildGroceryNeeds(plan, recipesById, catalog, settings, stockItems = []) {
  if (!plan) return [];
  const totals = new Map();
  for (const day of plan.days) {
    for (const meal of day.meals) {
      const r = recipesById[meal.recipeId];
      if (meal.cooked || !r) continue;
      for (const n of recipeNeeds(r, settings)) {
        if (settings.staples.includes(n.key) || !catalog[n.key]) continue;
        totals.set(n.key, (totals.get(n.key) || 0) + n.qty);
      }
    }
  }

  const stock = buildStock(stockItems, catalog);
  const items = [];
  for (const [key, qty] of totals) {
    const need = qty - takeFromStock(stock, key, qty);
    if (need <= 1e-9) continue;
    const ing = catalog[key];
    const buy = roundUpToStep(need, ing.step || 1);
    items.push({ key, name: ing.name, qty: buy, unit: ing.unit, category: ing.category, estCost: round2(buy * ing.price) });
  }
  return sortByCategory(items);
}

export function sortByCategory(items) {
  const rank = (c) => { const i = CATEGORY_ORDER.indexOf(c); return i === -1 ? 99 : i; };
  return [...items].sort((a, b) => rank(a.category) - rank(b.category) || a.name.localeCompare(b.name));
}

/** Budget numbers for the grocery list. */
export function groceryTotals(list, budget) {
  let estimated = 0, toBuy = 0, spent = 0;
  for (const i of list) {
    const est = Number(i.estCost) || 0;
    estimated += est;
    if (i.bought) spent += i.actualCost != null && i.actualCost !== '' ? Number(i.actualCost) : est;
    else toBuy += est;
  }
  return {
    estimated: round2(estimated),
    toBuy: round2(toBuy),
    spent: round2(spent),
    leftAfterShopping: round2(budget - spent - toBuy)
  };
}
