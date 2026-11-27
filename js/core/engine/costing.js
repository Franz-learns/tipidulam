// Recipe scaling and cost estimates. Pure functions, no DOM.

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/** Ingredient amounts for the household (plus rice if the dish is served with rice). */
export function recipeNeeds(recipe, settings) {
  const factor = settings.householdSize / recipe.servings;
  const needs = recipe.ingredients.map((i) => ({ key: i.key, qty: i.qty * factor }));
  if (settings.includeRice && recipe.withRice) {
    needs.push({ key: 'rice', qty: settings.riceKgPerPersonMeal * settings.householdSize });
  }
  return needs;
}

/** Cost lines for a list of needs. Staples cost 0 (assumed already at home). */
export function costOfNeeds(needs, catalog, staples = []) {
  let total = 0;
  const lines = needs.map((n) => {
    const ing = catalog[n.key];
    if (!ing) return { ...n, name: n.key, unit: '', cost: 0, isStaple: false, unknown: true };
    const isStaple = staples.includes(n.key);
    const cost = isStaple ? 0 : n.qty * ing.price;
    total += cost;
    return { ...n, name: ing.name, unit: ing.unit, cost, isStaple };
  });
  return { total: round2(total), lines };
}

export function recipeCost(recipe, catalog, settings) {
  return costOfNeeds(recipeNeeds(recipe, settings), catalog, settings.staples);
}

/** Round up to the buying step: 0.6 kg with step 0.25 → 0.75 kg. */
export function roundUpToStep(qty, step = 1) {
  return round2(Math.ceil(qty / step - 1e-9) * step);
}
