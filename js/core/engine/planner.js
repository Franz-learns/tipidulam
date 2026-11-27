// Weekly meal planner: picks meals that fit the budget, uses what's in the
// pantry first, and avoids repeating dishes on back-to-back days.
// Pure functions, no DOM — portable to the Angular app.

import { recipeCost, round2 } from './costing.js';
import { buildStock, peekStock, takeFromStock } from './stock.js';

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];

// Small seeded random generator so a plan can be reproduced from its seed.
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function toISODate(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(isoDate, n) {
  const d = new Date(isoDate + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

/** Cost of a recipe after using pantry stock (stock is not changed). */
function effectiveCost(lines, stock, catalog) {
  let eff = 0;
  for (const l of lines) {
    if (l.isStaple || l.unknown) continue;
    eff += Math.max(0, l.qty - peekStock(stock, l.key, l.qty)) * catalog[l.key].price;
  }
  return eff;
}

/**
 * @returns plan { seed, createdAt, startDate, householdSize, budget, days:[{date, meals:[{type, recipeId, name, cost, cooked}]}], totalCost }
 */
export function generatePlan({ recipes, catalog, settings, pantry = [], startDate, days = 7, seed = Date.now() }) {
  const rng = seededRandom(seed);
  const stock = buildStock(pantry, catalog);
  const types = MEAL_TYPES.filter((t) => settings.mealTypes.includes(t));
  const costs = new Map(recipes.map((r) => [r.id, recipeCost(r, catalog, settings)]));
  const used = new Map(); // recipeId → { lastDay, count }

  let slotsLeft = days * types.length;
  // Aim ~8% under budget: buying whole packs / quarter-kilos costs a bit more
  // than the exact recipe amounts.
  let budgetLeft = settings.weeklyBudget * 0.92;
  const outDays = [];

  for (let d = 0; d < days; d++) {
    const meals = [];
    for (const type of types) {
      const target = Math.max(budgetLeft, 0) / slotsLeft;
      let best = null;

      for (const r of recipes) {
        if (!r.mealTypes.includes(type)) continue;
        const { lines, total } = costs.get(r.id);
        const eff = effectiveCost(lines, stock, catalog);
        const u = used.get(r.id) || { lastDay: -99, count: 0 };

        let score = eff;
        if (meals.some((m) => m.recipeId === r.id) || d - u.lastDay < 2) score += 1e6; // no same/next-day repeats
        score += u.count * 0.45 * target;                                              // variety
        if (eff > target) score += (eff - target) * 1.5;                                // stay on budget
        score += rng() * 0.3 * target;                                                  // shuffle

        if (!best || score < best.score) best = { r, score, eff, total, lines };
      }
      slotsLeft--;
      if (!best) continue;

      for (const l of best.lines) if (!l.isStaple && !l.unknown) takeFromStock(stock, l.key, l.qty);
      const u = used.get(best.r.id) || { count: 0 };
      used.set(best.r.id, { lastDay: d, count: u.count + 1 });
      budgetLeft -= best.eff;
      meals.push({ type, recipeId: best.r.id, name: best.r.name, cost: round2(best.total), cooked: false });
    }
    outDays.push({ date: addDays(startDate, d), meals });
  }

  return {
    seed,
    createdAt: new Date().toISOString(),
    startDate,
    householdSize: settings.householdSize,
    budget: settings.weeklyBudget,
    days: outDays,
    totalCost: planTotal(outDays)
  };
}

export function planTotal(days) {
  return round2(days.reduce((s, d) => s + d.meals.reduce((t, m) => t + m.cost, 0), 0));
}

/** Replace one meal with another affordable dish not already on that day. */
export function swapMeal(plan, dayIdx, mealIdx, { recipes, catalog, settings, rng = Math.random }) {
  const day = plan.days[dayIdx];
  const meal = day?.meals[mealIdx];
  if (!meal) return plan;
  const onDay = new Set(day.meals.map((m) => m.recipeId));
  const options = recipes
    .filter((r) => r.mealTypes.includes(meal.type) && !onDay.has(r.id))
    .map((r) => ({ r, cost: recipeCost(r, catalog, settings).total }))
    .sort((a, b) => a.cost - b.cost)
    .slice(0, 5);
  if (options.length === 0) return plan;
  const pick = options[Math.floor(rng() * options.length)];
  const days = plan.days.map((dd, i) => i !== dayIdx ? dd : {
    ...dd,
    meals: dd.meals.map((m, j) => j !== mealIdx ? m
      : { type: m.type, recipeId: pick.r.id, name: pick.r.name, cost: round2(pick.cost), cooked: false })
  });
  return { ...plan, days, totalCost: planTotal(days) };
}

/** Index of `isoDate` within the plan, or -1. */
export function dayIndex(plan, isoDate) {
  return plan ? plan.days.findIndex((d) => d.date === isoDate) : -1;
}
