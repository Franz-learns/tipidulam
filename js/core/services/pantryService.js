// Pantry (inventory) records: { id, name, key, qty, unit, category, expiry, addedOn }
import { read, write, uid } from './storage.js';
import { getCatalog, getSettings } from './settingsService.js';
import { matchKey, norm } from '../engine/matcher.js';
import { recipeNeeds, round2 } from '../engine/costing.js';
import { toISODate } from '../engine/planner.js';

export function getPantry() {
  return read('pantry', []);
}
function save(p) { write('pantry', p); return p; }

/** Add items (from a scan, manual entry or bought groceries). Same item + unit merges. */
export function addPantryItems(items, catalog = getCatalog()) {
  const pantry = getPantry();
  const today = toISODate(new Date());
  for (const it of items) {
    const name = norm(it.name);
    if (!name) continue;
    const key = it.key ?? matchKey(name, catalog);
    const unit = it.unit || 'pc';
    const qty = Math.max(Number(it.qty) || 1, 0);
    const existing = pantry.find((p) => p.unit === unit && (key ? p.key === key : p.name === name));
    if (existing) {
      existing.qty = round2(existing.qty + qty);
      if (it.expiry && (!existing.expiry || it.expiry < existing.expiry)) existing.expiry = it.expiry;
    } else {
      pantry.push({
        id: uid(), name: key ? catalog[key].name : name, key, qty: round2(qty), unit,
        category: it.category || (key ? catalog[key].category : 'other'), expiry: it.expiry || '', addedOn: today
      });
    }
  }
  return save(pantry);
}

export function updatePantryItem(id, patch) {
  return save(getPantry().map((p) => (p.id === id ? { ...p, ...patch } : p)));
}

export function consumePantryItem(id, amount = 1) {
  return save(getPantry()
    .map((p) => (p.id === id ? { ...p, qty: round2(p.qty - amount) } : p))
    .filter((p) => p.qty > 0.001));
}

export function removePantryItem(id) {
  return save(getPantry().filter((p) => p.id !== id));
}

/** Days until expiry (negative = expired, null = no date). */
export function daysLeft(item, now = new Date()) {
  if (!item.expiry) return null;
  return Math.floor((new Date(item.expiry + 'T23:59:59') - now) / 86_400_000);
}

export function expiringSoon(days = 3) {
  return getPantry().filter((p) => { const d = daysLeft(p); return d !== null && d <= days; });
}

/**
 * Deduct a recipe's ingredients after cooking. Uses soon-to-expire items first.
 * Matching units are deducted by amount; mismatched units (e.g. "2 pc" talong
 * vs kg in the recipe) are deducted by 1.  Returns names of items used.
 */
export function consumeForRecipe(recipe, settings = getSettings(), catalog = getCatalog(settings)) {
  let pantry = getPantry();
  const used = [];
  for (const n of recipeNeeds(recipe, settings)) {
    if (settings.staples.includes(n.key) || !catalog[n.key]) continue;
    let remaining = n.qty;
    const matches = pantry
      .filter((p) => p.key === n.key && p.qty > 0)
      .sort((a, b) => (a.expiry || '9999').localeCompare(b.expiry || '9999'));
    for (const p of matches) {
      if (remaining <= 0) break;
      if (p.unit === catalog[n.key].unit) {
        const take = Math.min(p.qty, remaining);
        p.qty = round2(p.qty - take);
        remaining -= take;
      } else {
        p.qty = round2(p.qty - 1);
        remaining = 0;
      }
      if (!used.includes(p.name)) used.push(p.name);
    }
  }
  pantry = pantry.filter((p) => p.qty > 0.001);
  save(pantry);
  return used;
}
