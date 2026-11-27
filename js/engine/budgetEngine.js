// Budget engine — pure functions, no DOM. Port directly into an Angular service later.
import { STORE_IDS, STORE_LABELS, cheapestStore, priceAt } from '../api/storePricesApi.js';
import { MEAL_TYPES } from '../api/recipesApi.js';
import { formatCookingQty, formatPurchaseQty, round2, toPurchaseQty } from '../utils/format.js';

const WARNING_RATIO = 0.9; // ≥90% of budget → amber
const MAX_REPAIR_STEPS = 60;

const sum = (arr) => arr.reduce((a, b) => a + b, 0);

/** targetPerMeal = totalBudget / (days × 3) */
export const targetPerMeal = (totalBudget, days) => (days > 0 ? round2(totalBudget / (days * 3)) : 0);

/** dailyBudget = totalBudget / days */
export const dailyBudget = (totalBudget, days) => (days > 0 ? round2(totalBudget / days) : 0);

export const perPersonPerDay = (totalBudget, days, people) =>
  days > 0 && people > 0 ? round2(totalBudget / (days * people)) : 0;

/** Budget status from a cost/budget ratio: 'under' | 'warning' | 'over'. */
export const statusFor = (cost, budget) => {
  const r = budget > 0 ? cost / budget : Infinity;
  return r > 1 ? 'over' : r >= WARNING_RATIO ? 'warning' : 'under';
};

/**
 * Scales a recipe (base servings = 4) to `people` and prices it.
 * Returns per-ingredient lines (for the How to Cook modal) and costs per store.
 */
export function costRecipe(recipe, people, store, priceIndex) {
  const scale = people / (recipe.servings || 4);
  const costByStore = Object.fromEntries(STORE_IDS.map((s) => [s, 0]));

  const lines = recipe.ingredients.map((ing) => {
    const item = priceIndex[ing.id];
    const qty = ing.qty * scale;
    STORE_IDS.forEach((s) => (costByStore[s] += qty * item.prices[s]));
    const best = cheapestStore(item);
    return {
      id: ing.id,
      item,
      prep: ing.prep ?? '',
      qty,
      displayQty: formatCookingQty(qty, item),
      cost: round2(qty * priceAt(item, store)),
      cheapestStore: best,
      cheapestCost: round2(qty * item.prices[best]),
    };
  });

  STORE_IDS.forEach((s) => (costByStore[s] = round2(costByStore[s])));
  const cost = round2(sum(lines.map((l) => l.cost)));
  return { recipe, people, scale, cost, costPerServing: round2(cost / people), costByStore, lines };
}

/** Scores a candidate meal; lower is better. Favors variety and meals near 80% of the allowance. */
function penalty(c, usage, usedToday, yesterdayId, allowance) {
  const id = c.recipe.id;
  return (
    (usage.get(id) ?? 0) * 10 +
    (usedToday.has(id) ? 50 : 0) +
    (id === yesterdayId ? 20 : 0) +
    Math.abs(c.cost - allowance * 0.8) / Math.max(allowance, 1)
  );
}

const withDayTotal = (day) => ({ ...day, dayTotal: round2(sum(MEAL_TYPES.map((mt) => day.meals[mt].costed.cost))) });

/**
 * Greedy planner: each slot's allowance = remaining budget / meals left,
 * so cheap meals early leave money for nicer ones later.
 */
function greedyPlan(config, catalog) {
  const usage = new Map();
  let remaining = config.totalBudget;
  let mealsLeft = config.days * 3;
  const days = [];

  for (let d = 0; d < config.days; d++) {
    const usedToday = new Set();
    const meals = {};

    for (const mt of MEAL_TYPES) {
      const allowance = remaining / mealsLeft;
      const options = catalog.filter((c) => c.recipe.mealTypes.includes(mt));
      const yesterdayId = days[d - 1]?.meals[mt]?.costed.recipe.id;

      let pool = options.filter((c) => c.cost <= allowance);
      if (!pool.length) pool = [...options].sort((a, b) => a.cost - b.cost).slice(0, 1);

      const pick = [...pool].sort(
        (a, b) => penalty(a, usage, usedToday, yesterdayId, allowance) - penalty(b, usage, usedToday, yesterdayId, allowance),
      )[0];

      meals[mt] = { mealType: mt, costed: pick, withinTarget: pick.cost <= allowance };
      usage.set(pick.recipe.id, (usage.get(pick.recipe.id) ?? 0) + 1);
      usedToday.add(pick.recipe.id);
      remaining -= pick.cost;
      mealsLeft--;
    }
    days.push(withDayTotal({ day: d + 1, label: `Day ${d + 1}`, meals, dayTotal: 0 }));
  }
  return days;
}

/**
 * Merges identical ingredients across the plan and rounds up to purchasable amounts
 * (whole bottles/cans/packs, 0.25 kg steps for items sold by weight).
 */
export function buildShoppingList(config, days, priceIndex) {
  const needs = new Map();
  for (const day of days) {
    for (const mt of MEAL_TYPES) {
      const { recipe, scale } = day.meals[mt].costed;
      for (const ing of recipe.ingredients) {
        const e = needs.get(ing.id) ?? { qty: 0, usedIn: new Set() };
        e.qty += ing.qty * scale;
        e.usedIn.add(recipe.name);
        needs.set(ing.id, e);
      }
    }
  }

  return [...needs.entries()]
    .map(([id, { qty, usedIn }]) => {
      const item = priceIndex[id];
      const purchaseQty = toPurchaseQty(qty, item.divisible);
      const best = cheapestStore(item);
      const buyAt = config.store === 'CHEAPEST' ? best : config.store;
      return {
        id,
        name: item.name,
        localName: item.localName,
        category: item.category,
        unit: item.unit,
        packLabel: item.packLabel,
        requiredQty: round2(qty),
        purchaseQty,
        displayQty: formatPurchaseQty(purchaseQty, item.unit),
        buyAt,
        cost: round2(purchaseQty * item.prices[buyAt]),
        cheapestStore: best,
        cheapestCost: round2(purchaseQty * item.prices[best]),
        usedIn: [...usedIn],
      };
    })
    .sort((a, b) => a.category.localeCompare(b.category) || b.cost - a.cost);
}

/** Whole-basket cost at each store + the cheapest mix. */
export function compareStores(config, list, priceIndex) {
  const options = ['CHEAPEST', ...STORE_IDS];
  const rows = options.map((store) => ({
    store,
    label: STORE_LABELS[store],
    total: round2(sum(list.map((l) => l.purchaseQty * priceAt(priceIndex[l.id], store)))),
  }));
  const singleStores = rows.filter((r) => r.store !== 'CHEAPEST');
  const minSingle = Math.min(...singleStores.map((r) => r.total));
  const maxSingle = Math.max(...singleStores.map((r) => r.total));
  const min = Math.min(...rows.map((r) => r.total));

  return {
    rows: rows.map((r) => ({
      ...r,
      isCheapest: r.store !== 'CHEAPEST' && r.total === minSingle,
      isOverallCheapest: r.total === min,
      isSelected: r.store === config.store,
      diffFromCheapest: round2(r.total - min),
    })),
    cheapestSingle: singleStores.find((r) => r.total === minSingle),
    priciestSingle: singleStores.find((r) => r.total === maxSingle),
    /** Savings: cheapest single store vs. most expensive single store. */
    savingsVsPriciest: round2(maxSingle - minSingle),
    /** Extra savings from splitting the list across stores. */
    mixSavings: round2(minSingle - rows[0].total),
  };
}

/** If whole-pack rounding pushes the basket over budget, downgrade the priciest meals until it fits. */
function repairToBudget(config, days, catalog, priceIndex) {
  for (let step = 0; step < MAX_REPAIR_STEPS; step++) {
    const basket = sum(buildShoppingList(config, days, priceIndex).map((i) => i.cost));
    if (basket <= config.totalBudget) break;

    const usage = new Map();
    days.forEach((day) => MEAL_TYPES.forEach((mt) => {
      const id = day.meals[mt].costed.recipe.id;
      usage.set(id, (usage.get(id) ?? 0) + 1);
    }));

    let best = null;
    days.forEach((day, d) =>
      MEAL_TYPES.forEach((mt) => {
        const current = day.meals[mt].costed;
        const alt = catalog
          .filter((c) => c.recipe.mealTypes.includes(mt) && c.cost < current.cost)
          .sort((a, b) => (usage.get(a.recipe.id) ?? 0) - (usage.get(b.recipe.id) ?? 0) || a.cost - b.cost)[0];
        if (alt && (!best || current.cost - alt.cost > best.saving)) best = { d, mt, alt, saving: current.cost - alt.cost };
      }),
    );
    if (!best) break; // already the cheapest possible plan

    days = days.map((day, i) =>
      i !== best.d ? day : withDayTotal({ ...day, meals: { ...day.meals, [best.mt]: { mealType: best.mt, costed: best.alt, withinTarget: true } } }),
    );
  }
  return days;
}

function summarize(config, days, list) {
  const cookedCost = round2(sum(days.map((d) => d.dayTotal)));
  const basketCost = round2(sum(list.map((l) => l.cost)));
  return {
    totalBudget: config.totalBudget,
    targetPerMeal: targetPerMeal(config.totalBudget, config.days),
    dailyBudget: dailyBudget(config.totalBudget, config.days),
    perPersonPerDay: perPersonPerDay(config.totalBudget, config.days, config.people),
    cookedCost,
    basketCost,
    remaining: round2(config.totalBudget - basketCost),
    usageRatio: config.totalBudget > 0 ? basketCost / config.totalBudget : 0,
    status: statusFor(basketCost, config.totalBudget),
  };
}

function assemble(config, days, catalog, priceIndex, isFallback) {
  const shoppingList = buildShoppingList(config, days, priceIndex);
  return {
    config,
    days,
    summary: summarize(config, days, shoppingList),
    shoppingList,
    comparison: compareStores(config, shoppingList, priceIndex),
    catalog,
    priceIndex,
    isFallback,
  };
}

const clampInt = (n, lo, hi) => Math.min(Math.max(Math.floor(Number(n)) || lo, lo), hi);

/**
 * Main entry point.
 * @param {{totalBudget:number, days:number, people:number, store:string}} rawConfig
 * @param {{priceIndex: Record<string, object>, recipes: object[], isFallback?: boolean}} data
 */
export function generatePlan(rawConfig, { priceIndex, recipes, isFallback = false }) {
  const config = {
    ...rawConfig,
    totalBudget: Math.max(Number(rawConfig.totalBudget) || 0, 0),
    days: clampInt(rawConfig.days, 1, 14),
    people: clampInt(rawConfig.people, 1, 20),
  };
  const catalog = recipes
    .filter((r) => r.ingredients.every((i) => priceIndex[i.id]))
    .map((r) => costRecipe(r, config.people, config.store, priceIndex));

  let days = greedyPlan(config, catalog);
  days = repairToBudget(config, days, catalog, priceIndex);
  return assemble(config, days, catalog, priceIndex, isFallback);
}

/** Alternatives for one slot; affordable ones (keep the basket within budget) first, then cheapest. */
export function getSwapOptions(plan, dayIndex, mealType) {
  const current = plan.days[dayIndex]?.meals[mealType];
  if (!current) return [];
  const headroom = Math.max(plan.config.totalBudget - plan.summary.basketCost, 0);
  return plan.catalog
    .filter((c) => c.recipe.mealTypes.includes(mealType) && c.recipe.id !== current.costed.recipe.id)
    .map((c) => {
      const delta = round2(c.cost - current.costed.cost);
      return { costed: c, delta, affordable: delta <= headroom };
    })
    .sort((a, b) => Number(b.affordable) - Number(a.affordable) || a.costed.cost - b.costed.cost);
}

/** Returns a NEW plan with one meal replaced and all totals recomputed. */
export function swapMeal(plan, dayIndex, mealType, recipeId) {
  const replacement = plan.catalog.find((c) => c.recipe.id === recipeId);
  if (!replacement || !plan.days[dayIndex]) return plan;
  const target = targetPerMeal(plan.config.totalBudget, plan.config.days);
  const days = plan.days.map((d, i) =>
    i !== dayIndex
      ? d
      : withDayTotal({ ...d, meals: { ...d.meals, [mealType]: { mealType, costed: replacement, withinTarget: replacement.cost <= target } } }),
  );
  return assemble(plan.config, days, plan.catalog, plan.priceIndex, plan.isFallback);
}
