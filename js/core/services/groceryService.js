// Grocery list records:
// { id, key, name, qty, unit, category, estCost, actualCost, bought, inPantry, source: 'plan'|'manual' }
import { read, write, uid } from './storage.js';
import { getSettings, getCatalog } from './settingsService.js';
import { getPantry, addPantryItems } from './pantryService.js';
import { buildGroceryNeeds, groceryTotals, sortByCategory } from '../engine/grocery.js';
import { matchKey, norm } from '../engine/matcher.js';
import { round2 } from '../engine/costing.js';
import { RECIPES_BY_ID } from '../data/recipes.js';

export function getGrocery() {
  return read('grocery', []);
}
function save(list) { write('grocery', list); return list; }

/**
 * Rebuild the plan items from the current meal plan.
 * Keeps manual items and anything already bought; doesn't re-add what's
 * already bought or in the pantry.
 */
export function syncFromPlan() {
  const plan = read('plan', null);
  const settings = getSettings();
  const catalog = getCatalog(settings);
  const keep = getGrocery().filter((i) => i.bought || i.source === 'manual');
  const alreadyCovered = [
    ...getPantry(),
    ...keep.filter((i) => i.key && !i.inPantry).map((i) => ({ key: i.key, qty: i.qty, unit: i.unit }))
  ];
  const needs = buildGroceryNeeds(plan, RECIPES_BY_ID, catalog, settings, alreadyCovered);
  const fresh = needs.map((n) => ({ id: uid(), ...n, actualCost: null, bought: false, inPantry: false, source: 'plan' }));
  return save(sortByCategory([...keep, ...fresh]));
}

export function addManualItem({ name, qty = 1, unit = 'pc', estCost = 0 }) {
  const catalog = getCatalog();
  const n = norm(name);
  if (!n) return getGrocery();
  const key = matchKey(n, catalog);
  const item = {
    id: uid(), key, name: key ? catalog[key].name : n, qty: Number(qty) || 1, unit,
    category: key ? catalog[key].category : 'other', estCost: round2(Number(estCost) || 0),
    actualCost: null, bought: false, inPantry: false, source: 'manual'
  };
  return save(sortByCategory([...getGrocery(), item]));
}

export function updateGroceryItem(id, patch) {
  return save(getGrocery().map((i) => (i.id === id ? { ...i, ...patch } : i)));
}

export function removeGroceryItem(id) {
  return save(getGrocery().filter((i) => i.id !== id));
}

/** Put bought items into the pantry (once). Returns how many were moved. */
export function moveBoughtToPantry() {
  const list = getGrocery();
  const toMove = list.filter((i) => i.bought && !i.inPantry);
  if (toMove.length === 0) return 0;
  addPantryItems(toMove.map((i) => ({ name: i.name, key: i.key, qty: i.qty, unit: i.unit, category: i.category })));
  save(list.map((i) => (i.bought && !i.inPantry ? { ...i, inPantry: true } : i)));
  return toMove.length;
}

export function startNewWeek() {
  return save([]);
}

export function getTotals(list = getGrocery(), budget = getSettings().weeklyBudget) {
  return groceryTotals(list, budget);
}

export function listAsText(list = getGrocery()) {
  const lines = list.filter((i) => !i.bought).map((i) => `☐ ${i.name} — ${i.qty} ${i.unit}`);
  return ['TipidUlam grocery list', ...lines].join('\n');
}
