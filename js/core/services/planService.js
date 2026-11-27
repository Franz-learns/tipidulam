import { read, write } from './storage.js';
import { getSettings, getCatalog } from './settingsService.js';
import { getPantry, consumeForRecipe } from './pantryService.js';
import { syncFromPlan } from './groceryService.js';
import { generatePlan, swapMeal, toISODate } from '../engine/planner.js';
import { buildGroceryNeeds } from '../engine/grocery.js';
import { RECIPES, RECIPES_BY_ID } from '../data/recipes.js';

export function getPlan() {
  return read('plan', null);
}

/** Generate a 7-day plan starting today, then refresh the grocery list. */
export function createPlan({ seed = Date.now() } = {}) {
  const settings = getSettings();
  const catalog = getCatalog(settings);
  const pantry = getPantry();
  const base = { recipes: RECIPES, catalog, settings, pantry, startDate: toISODate(new Date()), seed };

  // Generate, then check the real grocery cost (after rounding up to whole packs).
  // If it's over budget, regenerate aiming lower. Keep the cheapest attempt.
  let best = null;
  for (const budgetFactor of [0.92, 0.85, 0.78, 0.7, 0.6]) {
    const plan = generatePlan({ ...base, budgetFactor });
    const shopping = buildGroceryNeeds(plan, RECIPES_BY_ID, catalog, settings, pantry)
      .reduce((sum, i) => sum + i.estCost, 0);
    if (!best || shopping < best.shopping) best = { plan, shopping };
    if (shopping <= settings.weeklyBudget) break;
  }
  const plan = best.plan;
  write('plan', plan);
  syncFromPlan();
  return plan;
}

export function swapPlanMeal(dayIdx, mealIdx) {
  const plan = getPlan();
  if (!plan) return null;
  const settings = getSettings();
  const next = swapMeal(plan, dayIdx, mealIdx, { recipes: RECIPES, catalog: getCatalog(settings), settings });
  write('plan', next);
  syncFromPlan();
  return next;
}

/** Mark a meal as cooked and deduct its ingredients from the pantry. */
export function markCooked(dayIdx, mealIdx) {
  const plan = getPlan();
  const meal = plan?.days[dayIdx]?.meals[mealIdx];
  if (!meal || meal.cooked) return { plan, used: [] };
  const used = consumeForRecipe(RECIPES_BY_ID[meal.recipeId]);
  meal.cooked = true;
  write('plan', plan);
  syncFromPlan();
  return { plan, used };
}
