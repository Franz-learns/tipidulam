// TipidUlam — UI controller: DOM events, state, and Bootstrap rendering.
// All data fetching lives in js/api/, all budget math in js/engine/.

import { fetchIngredientPrices, STORE_IDS, STORE_LABELS, STORE_SHORT } from './api/storePricesApi.js';
import { getAllRecipes, lookupMeal, MEAL_LABELS, MEAL_TYPES } from './api/recipesApi.js';
import { searchProducts } from './api/openFoodFactsApi.js';
import { findNearbyStores, getCurrentPosition, PH_CITIES } from './api/storeLocatorApi.js';
import { convertToPhp, CURRENCIES, fetchPhpRates } from './api/currencyApi.js';
import {
  dailyBudget, generatePlan, getSwapOptions, perPersonPerDay, statusFor, swapMeal, targetPerMeal,
} from './engine/budgetEngine.js';
import { escapeHtml as esc, formatPeso } from './utils/format.js';

const { Modal, Tab, Toast } = window.bootstrap;

// ─────────────────────────── State ───────────────────────────
const state = {
  data: null,          // { priceIndex, recipes, isFallback }
  rates: null,         // PHP exchange rates
  plan: null,          // result of generatePlan()
  checked: new Set(),  // shopping list item IDs in the cart
  swapTarget: null,    // { dayIndex, mealType }
  recipe: null,        // costed recipe open in the How to Cook modal
  recipeIngDone: new Set(),
  recipeStepsDone: new Set(),
};

// ─────────────────────────── DOM refs ───────────────────────────
const $ = (sel) => document.querySelector(sel);
const el = {
  form: $('#budgetForm'),
  totalBudget: $('#totalBudget'),
  days: $('#days'),
  people: $('#people'),
  store: $('#store'),
  generateBtn: $('#generateBtn'),
  fxCurrency: $('#fxCurrency'),
  fxAmount: $('#fxAmount'),
  fxApplyBtn: $('#fxApplyBtn'),
  fxResult: $('#fxResult'),
  alertArea: $('#alertArea'),
  summaryStats: $('#summaryStats'),
  mealPlan: $('#mealPlan'),
  planStoreBadge: $('#planStoreBadge'),
  storeComparison: $('#storeComparison'),
  shoppingList: $('#shoppingList'),
  listMeta: $('#listMeta'),
  cartTotal: $('#cartTotal'),
  cartCount: $('#cartCount'),
  cartRemaining: $('#cartRemaining'),
  cartProgress: $('#cartProgress'),
  cartProgressWrap: $('#cartProgressWrap'),
  recipeModal: $('#recipeModal'),
  recipeTitle: $('#recipeTitle'),
  recipeBody: $('#recipeBody'),
  swapModal: $('#swapModal'),
  swapCurrent: $('#swapCurrent'),
  swapTitle: $('#swapTitle'),
  swapOptions: $('#swapOptions'),
  nutritionForm: $('#nutritionForm'),
  nutritionQuery: $('#nutritionQuery'),
  nutritionResults: $('#nutritionResults'),
  citySelect: $('#citySelect'),
  storeResults: $('#storeResults'),
  storeFinderStatus: $('#storeFinderStatus'),
  toast: $('#appToast'),
  toastBody: $('#appToastBody'),
};

const recipeModal = Modal.getOrCreateInstance(el.recipeModal);
const swapModal = Modal.getOrCreateInstance(el.swapModal);
const toast = Toast.getOrCreateInstance(el.toast, { delay: 2600 });

const STATUS_COLOR = { under: 'success', warning: 'warning', over: 'danger' };
const MEAL_ICONS = { breakfast: 'bi-cup-hot', lunch: 'bi-sun', dinner: 'bi-moon-stars' };
const DIFFICULTY_COLOR = { Easy: 'success', Medium: 'warning', Hard: 'danger' };

const showToast = (msg) => {
  el.toastBody.textContent = msg;
  toast.show();
};

// ─────────────────────────── Budget form ───────────────────────────
function readConfig() {
  return {
    totalBudget: Number(el.totalBudget.value),
    days: Number(el.days.value),
    people: Number(el.people.value),
    store: el.store.value,
  };
}

function validateForm() {
  const checks = [
    [el.totalBudget, (v) => v >= 100],
    [el.days, (v) => Number.isInteger(v) && v >= 1 && v <= 14],
    [el.people, (v) => Number.isInteger(v) && v >= 1 && v <= 20],
  ];
  let ok = true;
  for (const [input, test] of checks) {
    const valid = test(Number(input.value));
    input.classList.toggle('is-invalid', !valid);
    ok &&= valid;
  }
  return ok;
}

function updatePreview() {
  const { totalBudget, days, people } = readConfig();
  const set = (key, v) => ($(`[data-preview="${key}"]`).textContent = formatPeso(v));
  set('perMeal', targetPerMeal(totalBudget, days));
  set('daily', dailyBudget(totalBudget, days));
  set('perPerson', perPersonPerDay(totalBudget, days, people));
}

function generate() {
  if (!state.data || !validateForm()) return;
  state.plan = generatePlan(readConfig(), state.data);
  state.checked.clear();
  renderAll();
}

// ─────────────────────────── OFW currency converter ───────────────────────────
function renderFx() {
  const code = el.fxCurrency.value;
  const amount = Number(el.fxAmount.value);
  const r = state.rates;
  if (!r) return;

  const rateText = code === 'PHP'
    ? 'No conversion needed.'
    : `1 ${code} = ${formatPeso(r.phpPer[code])}${r.derived.includes(code) ? ' (via USD peg)' : ''} · ${r.isFallback ? 'offline estimate' : `Frankfurter, ${esc(r.date)}`}`;

  if (code !== 'PHP' && amount > 0) {
    const php = convertToPhp(amount, code, r);
    el.totalBudget.value = Math.round(php);
    updatePreview();
    el.fxResult.innerHTML = `<strong>${amount.toLocaleString('en-PH')} ${code} ≈ ${formatPeso(php)}</strong> — filled into Total Budget.<br>${rateText}`;
  } else {
    el.fxResult.textContent = rateText;
  }
}

// ─────────────────────────── Rendering: plan ───────────────────────────
function renderAll() {
  renderAlerts();
  renderSummary();
  renderMealPlan();
  renderComparison();
  renderShoppingList();
  updateCart();
}

function renderAlerts() {
  const p = state.plan;
  const parts = [];
  if (p.summary.status === 'over') {
    parts.push(`
      <div class="alert alert-danger d-flex gap-2">
        <i class="bi bi-exclamation-octagon-fill"></i>
        <div><strong>Masyadong maliit ang budget.</strong> Even the cheapest dishes cost ${formatPeso(p.summary.basketCost)}
        for ${p.config.people} people over ${p.config.days} days — about ${formatPeso(-p.summary.remaining)} short.
        Try fewer days, fewer people, or <em>Cheapest Mix Across Stores</em>.</div>
      </div>`);
  }
  if (p.isFallback) {
    parts.push(`<div class="alert alert-info py-2 small mb-3"><i class="bi bi-info-circle me-1"></i>
      Using built-in demo prices (live price database not connected).</div>`);
  }
  el.alertArea.innerHTML = parts.join('');
}

function statCard(label, value, sub, extraClass = '', valueClass = '') {
  return `
    <div class="col-6 col-lg-3">
      <div class="card tu-stat h-100 border-0 shadow-sm ${extraClass}">
        <div class="card-body">
          <div class="small text-body-secondary">${label}</div>
          <div class="tu-stat-value ${valueClass}">${value}</div>
          <div class="small text-body-secondary">${sub}</div>
        </div>
      </div>
    </div>`;
}

function renderSummary() {
  const { summary: s, config: c } = state.plan;
  const color = STATUS_COLOR[s.status];
  const short = s.remaining < 0;
  el.summaryStats.innerHTML = [
    statCard('Total Budget', formatPeso(s.totalBudget), `${c.days} days · ${c.people} pax`),
    statCard('Grocery Basket', formatPeso(s.basketCost), `Cooked portions: ${formatPeso(s.cookedCost)}`, `tu-status-${s.status}`, `text-${color}`),
    statCard(short ? 'Kulang (Short)' : 'Natitira (Left)', formatPeso(Math.abs(s.remaining)), `${Math.round(s.usageRatio * 100)}% of budget used`, '', short ? 'text-danger' : 'text-success'),
    statCard('Target per Meal', formatPeso(s.targetPerMeal), `Daily: ${formatPeso(s.dailyBudget)}`),
  ].join('');
}

function photoHtml(recipe, cls, mealType) {
  return recipe.image
    ? `<img src="${esc(recipe.image)}/preview" alt="${esc(recipe.name)}" class="${cls}" loading="lazy">`
    : `<div class="${cls} tu-photo-placeholder" aria-hidden="true"><i class="bi ${MEAL_ICONS[mealType] ?? 'bi-basket'}"></i></div>`;
}

function renderMealPlan() {
  const p = state.plan;
  const dailyTarget = p.summary.targetPerMeal * 3;
  el.planStoreBadge.textContent = STORE_LABELS[p.config.store];

  el.mealPlan.innerHTML = p.days.map((day, di) => `
    <div class="card border-0 shadow-sm mb-3">
      <div class="card-header bg-white d-flex justify-content-between align-items-center">
        <span class="fw-semibold">${day.label}</span>
        <span class="badge rounded-pill tu-day-badge text-bg-${day.dayTotal <= dailyTarget ? 'success' : 'warning'}">${formatPeso(day.dayTotal)}</span>
      </div>
      <div class="card-body">
        <div class="row g-3">
          ${MEAL_TYPES.map((mt) => mealCard(day.meals[mt], di, mt)).join('')}
        </div>
      </div>
    </div>`).join('');
}

function mealCard(meal, dayIndex, mealType) {
  const { recipe, cost, costPerServing } = meal.costed;
  return `
    <div class="col-md-4">
      <article class="tu-meal h-100 d-flex flex-column ${meal.withinTarget ? '' : 'tu-meal-over'}">
        ${photoHtml(recipe, 'tu-meal-photo', mealType)}
        <div class="p-3 d-flex flex-column flex-grow-1">
          <div class="d-flex justify-content-between align-items-center mb-1">
            <span class="tu-meal-type text-uppercase fw-semibold text-body-secondary">
              <i class="bi ${MEAL_ICONS[mealType]} me-1"></i>${MEAL_LABELS[mealType]}
            </span>
            <span class="badge text-bg-${meal.withinTarget ? 'success' : 'warning'}">${formatPeso(cost)}</span>
          </div>
          <h3 class="h6 fw-bold mb-1">${esc(recipe.name)}</h3>
          <div class="small text-body-secondary mb-3">
            ${formatPeso(costPerServing)}/serving · <i class="bi bi-clock"></i> ${recipe.prepTime + recipe.cookTime} min
          </div>
          <div class="d-grid gap-2 mt-auto">
            <button type="button" class="btn btn-sm btn-success" data-action="cook" data-day="${dayIndex}" data-meal="${mealType}">
              <i class="bi bi-journal-text me-1"></i>How to Cook
            </button>
            <button type="button" class="btn btn-sm btn-outline-secondary" data-action="swap" data-day="${dayIndex}" data-meal="${mealType}">
              <i class="bi bi-arrow-left-right me-1"></i>Swap Dish
            </button>
          </div>
        </div>
      </article>
    </div>`;
}

function renderComparison() {
  const { comparison: cmp, summary } = state.plan;
  const maxTotal = Math.max(...cmp.rows.map((r) => r.total));

  const rows = cmp.rows.map((r) => {
    const color = r.total <= summary.totalBudget ? (r.isOverallCheapest ? 'success' : 'secondary') : 'danger';
    const tag = r.store === 'CHEAPEST'
      ? '<span class="badge text-bg-light border">Split across stores</span>'
      : r.isCheapest ? '<span class="badge text-bg-success"><i class="bi bi-trophy me-1"></i>Cheapest store</span>' : '';
    return `
      <li class="list-group-item tu-store-row ${r.isSelected ? 'tu-selected' : ''}">
        <div class="d-flex justify-content-between align-items-start gap-2">
          <div>
            <div class="fw-semibold">${esc(r.label)} ${r.isSelected ? '<span class="badge text-bg-dark ms-1">Selected</span>' : ''}</div>
            <div class="d-flex gap-1 flex-wrap mt-1">${tag}
              ${r.diffFromCheapest > 0 ? `<span class="small text-body-secondary">+${formatPeso(r.diffFromCheapest)}</span>` : ''}</div>
          </div>
          <span class="fw-bold text-${color === 'secondary' ? 'body' : color} text-nowrap">${formatPeso(r.total)}</span>
        </div>
        <div class="tu-bar mt-2"><span class="bg-${color}" style="width:${(r.total / maxTotal) * 100}%"></span></div>
      </li>`;
  }).join('');

  el.storeComparison.innerHTML = `
    <ul class="list-group list-group-flush">${rows}</ul>
    <div class="p-3 small border-top">
      <div class="mb-1"><i class="bi bi-piggy-bank text-success me-1"></i>
        Shopping at <strong>${esc(cmp.cheapestSingle.label)}</strong> instead of ${esc(cmp.priciestSingle.label)} saves
        <strong class="text-success">${formatPeso(cmp.savingsVsPriciest)}</strong>.</div>
      ${cmp.mixSavings > 0 ? `<div class="text-body-secondary"><i class="bi bi-shuffle me-1"></i>Splitting the list across stores saves another ${formatPeso(cmp.mixSavings)}.</div>` : ''}
    </div>`;
}

// ─────────────────────────── Shopping list + cart ───────────────────────────
function renderShoppingList() {
  const { shoppingList, config, summary } = state.plan;
  el.listMeta.textContent = `${config.days} days · ${config.people} pax · ${STORE_LABELS[config.store]} · ${shoppingList.length} items · Basket ${formatPeso(summary.basketCost)}`;

  const groups = new Map();
  shoppingList.forEach((i) => groups.set(i.category, [...(groups.get(i.category) ?? []), i]));

  el.shoppingList.innerHTML = [...groups.entries()].map(([category, items]) => `
    <div class="border rounded-3 mb-3 overflow-hidden">
      <div class="tu-cat-header px-3 py-2 d-flex justify-content-between">
        <span>${esc(category)}</span><span>${formatPeso(items.reduce((a, i) => a + i.cost, 0))}</span>
      </div>
      <ul class="list-group list-group-flush">
        ${items.map((i) => `
          <li class="list-group-item tu-list-item d-flex gap-3 align-items-start" data-item="${i.id}">
            <input class="form-check-input mt-1 flex-shrink-0" type="checkbox" id="buy-${i.id}" data-item="${i.id}">
            <label class="flex-grow-1 tu-item-text" for="buy-${i.id}" title="Used in: ${esc(i.usedIn.join(', '))}">
              <span class="fw-semibold">${i.displayQty} ${esc(i.localName)}</span>
              <span class="text-body-secondary small">— ${esc(i.name)} (${esc(i.packLabel)})</span>
              <span class="d-block small">
                ${i.buyAt === i.cheapestStore
                  ? `<span class="badge text-bg-success-subtle text-success-emphasis border border-success-subtle"><i class="bi bi-tag me-1"></i>Cheapest: ${STORE_SHORT[i.cheapestStore]}</span>`
                  : `<span class="badge text-bg-light border">Buy at ${STORE_SHORT[i.buyAt]}</span>
                     <span class="badge text-bg-warning-subtle text-warning-emphasis border border-warning-subtle">${STORE_SHORT[i.cheapestStore]}: ${formatPeso(i.cheapestCost)}</span>`}
              </span>
            </label>
            <span class="fw-semibold text-nowrap">${formatPeso(i.cost)}</span>
          </li>`).join('')}
      </ul>
    </div>`).join('');
}

function updateCart() {
  const { shoppingList, summary } = state.plan;
  const inCart = shoppingList.filter((i) => state.checked.has(i.id));
  const cartTotal = inCart.reduce((a, i) => a + i.cost, 0);
  const remaining = summary.totalBudget - cartTotal;
  const pct = summary.totalBudget > 0 ? Math.min((cartTotal / summary.totalBudget) * 100, 100) : 0;
  const color = STATUS_COLOR[statusFor(cartTotal, summary.totalBudget)];

  el.cartTotal.textContent = formatPeso(cartTotal);
  el.cartCount.textContent = `(${inCart.length}/${shoppingList.length} items)`;
  el.cartRemaining.textContent = formatPeso(remaining);
  el.cartRemaining.className = remaining < 0 ? 'text-danger' : 'text-success';
  el.cartProgress.style.width = `${pct}%`;
  el.cartProgress.className = `progress-bar bg-${color}`;
  el.cartProgressWrap.setAttribute('aria-valuenow', String(Math.round(pct)));

  document.querySelectorAll('#shoppingList .tu-list-item').forEach((li) => {
    const done = state.checked.has(li.dataset.item);
    li.classList.toggle('tu-done', done);
    li.querySelector('input').checked = done;
  });
}

// ─────────────────────────── How to Cook modal ───────────────────────────
function openRecipe(dayIndex, mealType) {
  const meal = state.plan.days[dayIndex].meals[mealType];
  state.recipe = meal.costed;
  state.recipeIngDone = new Set();
  state.recipeStepsDone = new Set();
  renderRecipe(mealType);
  recipeModal.show();

  // Enrich with TheMealDB lookup.php (video / source link) when this dish has a match.
  const { recipe } = meal.costed;
  if (recipe.mealDbId) {
    lookupMeal(recipe.mealDbId).then((full) => {
      if (!full || state.recipe?.recipe.id !== recipe.id) return;
      const links = $('#recipeLinks');
      if (!links) return;
      const items = [`<a href="https://www.themealdb.com/meal/${esc(full.idMeal)}" target="_blank" rel="noopener">TheMealDB</a>`];
      if (full.strYoutube) items.push(`<a href="${esc(full.strYoutube)}" target="_blank" rel="noopener"><i class="bi bi-youtube"></i> Video</a>`);
      links.innerHTML = `<i class="bi bi-box-arrow-up-right me-1"></i>Also see: ${items.join(' · ')}`;
    });
  }
}

function renderRecipe(mealType) {
  const c = state.recipe;
  const r = c.recipe;
  el.recipeTitle.textContent = r.name;

  el.recipeBody.innerHTML = `
    ${photoHtml(r, 'tu-recipe-hero mb-3', mealType)}
    <p class="text-body-secondary">${esc(r.description)}</p>

    <div class="tu-meta row g-0 text-center p-2 mb-3">
      <div class="col-4 col-md-2 p-2"><div class="small text-body-secondary">Prep</div><div class="tu-meta-value">${r.prepTime} min</div></div>
      <div class="col-4 col-md-2 p-2"><div class="small text-body-secondary">Cook</div><div class="tu-meta-value">${r.cookTime} min</div></div>
      <div class="col-4 col-md-2 p-2"><div class="small text-body-secondary">Difficulty</div>
        <span class="badge text-bg-${DIFFICULTY_COLOR[r.difficulty] ?? 'secondary'}">${esc(r.difficulty)}</span></div>
      <div class="col-4 col-md-2 p-2"><div class="small text-body-secondary">Servings</div><div class="tu-meta-value">${c.people} pax</div></div>
      <div class="col-4 col-md-2 p-2"><div class="small text-body-secondary">Total cost</div><div class="tu-meta-value text-success">${formatPeso(c.cost)}</div></div>
      <div class="col-4 col-md-2 p-2"><div class="small text-body-secondary">Per serving</div><div class="tu-meta-value">${formatPeso(c.costPerServing)}</div></div>
    </div>

    <div class="d-flex justify-content-between align-items-center mb-2">
      <h3 class="h6 fw-bold mb-0"><i class="bi bi-basket me-1"></i>Mga Sangkap (Ingredients)</h3>
      <span class="small text-body-secondary">Scaled ×${c.scale.toFixed(2)} from ${r.servings} pax · <span id="ingProgress"></span></span>
    </div>
    <ul class="list-group mb-4" id="recipeIngredients">
      ${c.lines.map((l) => `
        <li class="list-group-item tu-ingredient d-flex gap-3 align-items-start" data-ing="${l.id}">
          <input class="form-check-input mt-1 flex-shrink-0" type="checkbox" id="ing-${l.id}" data-ing="${l.id}">
          <label class="flex-grow-1 tu-ing-text" for="ing-${l.id}">
            <strong>${esc(l.displayQty)}</strong> ${esc(l.item.localName)}
            <span class="text-body-secondary">(${esc(l.item.name)})</span>${l.prep ? `, <em>${esc(l.prep)}</em>` : ''}
            <span class="d-block"><span class="badge text-bg-success-subtle text-success-emphasis border border-success-subtle">
              <i class="bi bi-tag me-1"></i>Cheapest: ${STORE_SHORT[l.cheapestStore]}</span></span>
          </label>
          <span class="small fw-semibold text-nowrap">${formatPeso(l.cost)}</span>
        </li>`).join('')}
    </ul>

    <div class="d-flex justify-content-between align-items-center mb-2">
      <h3 class="h6 fw-bold mb-0"><i class="bi bi-fire me-1"></i>Paraan ng Pagluluto (Steps)</h3>
      <span class="small text-body-secondary" id="stepProgress"></span>
    </div>
    <ol class="list-unstyled d-grid gap-2 mb-3" id="recipeSteps">
      ${r.steps.map((s, i) => `
        <li class="tu-step p-3 d-flex gap-3" role="checkbox" aria-checked="false" tabindex="0" data-step="${i}">
          <span class="tu-step-num">${i + 1}</span>
          <div class="tu-step-text">
            <div class="fw-semibold">${esc(s.title)} ${s.minutes ? `<span class="badge text-bg-light border ms-1"><i class="bi bi-stopwatch me-1"></i>${s.minutes} min</span>` : ''}</div>
            <div class="small">${esc(s.text)}</div>
          </div>
        </li>`).join('')}
    </ol>
    <p class="small text-body-secondary mb-1 no-print"><i class="bi bi-hand-index me-1"></i>Tap a step to mark it done.</p>

    <h3 class="h6 fw-bold mt-3">Dish cost per store</h3>
    <div class="d-flex flex-wrap gap-2">
      ${STORE_IDS.map((s) => `<span class="badge text-bg-light border">${STORE_SHORT[s]}: ${formatPeso(c.costByStore[s])}</span>`).join('')}
    </div>
    <div class="small mt-3" id="recipeLinks"></div>`;

  updateRecipeProgress();
}

function updateRecipeProgress() {
  const c = state.recipe;
  if (!c) return;
  $('#ingProgress').textContent = `${state.recipeIngDone.size}/${c.lines.length} prepped`;
  $('#stepProgress').textContent = state.recipeStepsDone.size === c.recipe.steps.length
    ? 'Tapos na! Kain na! 🍽️'
    : `${state.recipeStepsDone.size}/${c.recipe.steps.length} steps done`;
}

function toggleStep(li) {
  const i = Number(li.dataset.step);
  state.recipeStepsDone.has(i) ? state.recipeStepsDone.delete(i) : state.recipeStepsDone.add(i);
  const done = state.recipeStepsDone.has(i);
  li.classList.toggle('tu-done', done);
  li.setAttribute('aria-checked', String(done));
  updateRecipeProgress();
}

// ─────────────────────────── Swap modal ───────────────────────────
function openSwap(dayIndex, mealType) {
  const current = state.plan.days[dayIndex].meals[mealType].costed;
  state.swapTarget = { dayIndex, mealType };
  el.swapTitle.textContent = `Swap ${MEAL_LABELS[mealType]} · Day ${dayIndex + 1}`;
  el.swapCurrent.textContent = `Current: ${current.recipe.name} (${formatPeso(current.cost)})`;

  const options = getSwapOptions(state.plan, dayIndex, mealType);
  el.swapOptions.innerHTML = options.length
    ? options.map((o) => {
        const color = o.delta <= 0 ? 'success' : o.affordable ? 'warning' : 'danger';
        const sign = o.delta <= 0 ? '−' : '+';
        return `
          <button type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center gap-3" data-recipe="${o.costed.recipe.id}">
            <div>
              <div class="fw-semibold">${esc(o.costed.recipe.name)}</div>
              <div class="small text-body-secondary">${esc(o.costed.recipe.description)}</div>
              <div class="mt-1">
                <span class="badge text-bg-${color}">${formatPeso(o.costed.cost)} (${sign}${formatPeso(Math.abs(o.delta))})</span>
                <span class="badge text-bg-light border">${o.costed.recipe.prepTime + o.costed.recipe.cookTime} min</span>
                ${o.affordable ? '' : '<span class="small text-danger ms-1">goes over budget</span>'}
              </div>
            </div>
            <i class="bi bi-chevron-right text-body-secondary"></i>
          </button>`;
      }).join('')
    : '<div class="list-group-item text-body-secondary">No other dishes for this meal yet.</div>';

  swapModal.show();
}

// ─────────────────────────── Nutrition tab ───────────────────────────
async function runNutritionSearch(query) {
  const q = query.trim();
  if (!q) return;
  el.nutritionQuery.value = q;
  el.nutritionResults.innerHTML = '<div class="col-12 text-center py-4"><div class="spinner-border text-success" role="status"></div></div>';

  const { products, isFallback } = await searchProducts(q);
  if (!products.length) {
    el.nutritionResults.innerHTML = '<div class="col-12 text-body-secondary small">Walang nahanap. Try another name or a 13-digit barcode.</div>';
    return;
  }

  el.nutritionResults.innerHTML = (isFallback
    ? '<div class="col-12"><div class="alert alert-warning py-1 small mb-0">Open Food Facts is unreachable — showing offline samples.</div></div>'
    : '') + products.map((p) => `
    <div class="col-md-6 col-lg-4">
      <div class="card h-100 border">
        <div class="card-body d-flex gap-3">
          ${p.image
            ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" class="tu-product-img rounded border flex-shrink-0" loading="lazy">`
            : '<div class="tu-product-img rounded border bg-light d-flex align-items-center justify-content-center flex-shrink-0"><i class="bi bi-box-seam text-body-secondary fs-4"></i></div>'}
          <div class="small flex-grow-1">
            <div class="fw-semibold">${esc(p.name)}</div>
            <div class="text-body-secondary">${esc(p.brand)}${p.quantity ? ` · ${esc(p.quantity)}` : ''}${p.isSample ? ' · <span class="badge text-bg-light border">sample</span>' : ''}</div>
            <span class="badge nutri nutri-${p.nutriScore} my-1">${p.nutriScore === 'unknown' ? 'Nutri-Score N/A' : `Nutri-Score ${p.nutriScore}`}</span>
            <div><i class="bi bi-fire text-warning me-1"></i>${p.kcal != null ? `${p.kcal} kcal / 100 g` : 'Calories not listed'}</div>
            ${p.protein != null ? `<div><i class="bi bi-egg me-1"></i>${p.protein} g protein / 100 g</div>` : ''}
            <div class="mt-1"><span class="text-body-secondary">Allergens:</span>
              ${p.allergens.length
                ? p.allergens.map((a) => `<span class="badge text-bg-danger-subtle text-danger-emphasis border border-danger-subtle me-1">${esc(a)}</span>`).join('')
                : '<span class="text-body-secondary">none listed</span>'}
            </div>
            ${p.barcode ? `<div class="text-body-secondary mt-1">Barcode: ${esc(p.barcode)}</div>` : ''}
          </div>
        </div>
      </div>
    </div>`).join('');
}

// ─────────────────────────── Store finder tab ───────────────────────────
async function runStoreSearch(lat, lon, label) {
  el.storeFinderStatus.innerHTML = `<span class="spinner-border spinner-border-sm text-success me-2"></span>Searching near ${esc(label)}…`;
  el.storeResults.innerHTML = '';
  const { stores, isFallback } = await findNearbyStores(lat, lon, 3000);

  el.storeFinderStatus.innerHTML = isFallback
    ? '<span class="text-warning-emphasis"><i class="bi bi-exclamation-triangle me-1"></i>Overpass is busy — showing sample stores. Try again in a minute.</span>'
    : `${stores.length} store${stores.length === 1 ? '' : 's'} within 3 km of ${esc(label)}.`;

  el.storeResults.innerHTML = stores.length
    ? stores.map((s) => `
      <tr>
        <td>
          <a href="${esc(s.mapUrl)}" target="_blank" rel="noopener" class="fw-semibold text-decoration-none">${esc(s.name)}</a>
          ${s.address ? `<div class="small text-body-secondary">${esc(s.address)}</div>` : ''}
          ${s.hours ? `<div class="small text-body-secondary"><i class="bi bi-clock me-1"></i>${esc(s.hours)}</div>` : ''}
        </td>
        <td><span class="badge text-bg-${s.type === 'marketplace' ? 'warning' : 'success'}">${s.type === 'marketplace' ? 'Palengke' : 'Supermarket'}</span></td>
        <td class="text-end text-nowrap">${s.distanceKm.toFixed(1)} km</td>
      </tr>`).join('')
    : '<tr><td colspan="3" class="text-body-secondary small">No supermarkets or palengke mapped within 3 km.</td></tr>';
}

function searchSelectedCity() {
  const city = PH_CITIES.find((c) => c.id === el.citySelect.value) ?? PH_CITIES[0];
  runStoreSearch(city.lat, city.lon, city.name);
}

// ─────────────────────────── Printing ───────────────────────────
function printWithClass(cls) {
  document.body.classList.add(cls);
  window.addEventListener('afterprint', () => document.body.classList.remove(cls), { once: true });
  window.print();
}

// ─────────────────────────── Event wiring ───────────────────────────
function bindEvents() {
  el.form.addEventListener('submit', (e) => {
    e.preventDefault();
    generate();
    if (state.plan) showToast('Bagong meal plan, handa na!');
  });
  [el.totalBudget, el.days, el.people].forEach((i) => i.addEventListener('input', updatePreview));
  el.store.addEventListener('change', generate);

  el.fxCurrency.addEventListener('change', renderFx);
  el.fxAmount.addEventListener('input', renderFx);
  el.fxApplyBtn.addEventListener('click', () => {
    renderFx();
    generate();
    showToast(`Budget set to ${formatPeso(Number(el.totalBudget.value))} — plan updated.`);
  });

  // Meal card buttons (event delegation)
  el.mealPlan.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const day = Number(btn.dataset.day);
    const meal = btn.dataset.meal;
    if (btn.dataset.action === 'cook') openRecipe(day, meal);
    if (btn.dataset.action === 'swap') openSwap(day, meal);
  });

  // Swap selection
  el.swapOptions.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-recipe]');
    if (!btn || !state.swapTarget) return;
    const { dayIndex, mealType } = state.swapTarget;
    const keepChecked = new Set(state.checked);
    state.plan = swapMeal(state.plan, dayIndex, mealType, btn.dataset.recipe);
    state.checked = new Set([...keepChecked].filter((id) => state.plan.shoppingList.some((i) => i.id === id)));
    swapModal.hide();
    renderAll();
    showToast('Dish swapped — totals and shopping list updated.');
  });

  // Recipe modal: ingredient checkboxes and step cards
  el.recipeBody.addEventListener('change', (e) => {
    const id = e.target.dataset?.ing;
    if (!id) return;
    e.target.checked ? state.recipeIngDone.add(id) : state.recipeIngDone.delete(id);
    e.target.closest('.tu-ingredient').classList.toggle('tu-done', e.target.checked);
    updateRecipeProgress();
  });
  el.recipeBody.addEventListener('click', (e) => {
    const step = e.target.closest('.tu-step');
    if (step) toggleStep(step);
  });
  el.recipeBody.addEventListener('keydown', (e) => {
    const step = e.target.closest('.tu-step');
    if (step && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      toggleStep(step);
    }
  });
  $('#printRecipeBtn').addEventListener('click', () => printWithClass('print-recipe'));

  // Shopping list
  el.shoppingList.addEventListener('change', (e) => {
    const id = e.target.dataset?.item;
    if (!id) return;
    e.target.checked ? state.checked.add(id) : state.checked.delete(id);
    updateCart();
  });
  $('#uncheckAllBtn').addEventListener('click', () => {
    state.checked.clear();
    updateCart();
  });
  $('#printListBtn').addEventListener('click', () => {
    Tab.getOrCreateInstance($('#tab-list')).show();
    printWithClass('print-list');
  });

  // Nutrition
  el.nutritionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    runNutritionSearch(el.nutritionQuery.value);
  });
  $('#nutritionSuggestions').addEventListener('click', (e) => {
    const q = e.target.closest('[data-q]')?.dataset.q;
    if (q) runNutritionSearch(q);
  });

  // Store finder
  $('#findStoresBtn').addEventListener('click', searchSelectedCity);
  el.citySelect.addEventListener('change', searchSelectedCity);
  $('#myLocationBtn').addEventListener('click', async () => {
    el.storeFinderStatus.innerHTML = '<span class="spinner-border spinner-border-sm text-success me-2"></span>Getting your location…';
    try {
      const { lat, lon } = await getCurrentPosition();
      runStoreSearch(lat, lon, 'your location');
    } catch (err) {
      el.storeFinderStatus.innerHTML = `<span class="text-danger"><i class="bi bi-geo-alt me-1"></i>${esc(err.message)} Pick a city instead.</span>`;
    }
  });
  // Load stores the first time the tab is opened (Overpass is slow; don't block page load).
  $('#tab-stores').addEventListener('shown.bs.tab', () => {
    if (!el.storeResults.dataset.loaded) {
      el.storeResults.dataset.loaded = '1';
      searchSelectedCity();
    }
  });
}

// ─────────────────────────── Init ───────────────────────────
async function init() {
  el.fxCurrency.innerHTML = CURRENCIES.map((c) => `<option value="${c.code}">${c.label}</option>`).join('');
  el.fxCurrency.value = 'USD';
  el.citySelect.innerHTML = PH_CITIES.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');

  bindEvents();
  updatePreview();

  fetchPhpRates().then((rates) => {
    state.rates = rates;
    renderFx();
  });

  el.generateBtn.disabled = true;
  const [catalog, recipes] = await Promise.all([fetchIngredientPrices(), getAllRecipes()]);
  state.data = { priceIndex: catalog.byId, recipes, isFallback: catalog.isFallback };
  el.generateBtn.disabled = false;
  generate();
}

init().catch((err) => {
  console.error(err);
  el.mealPlan.innerHTML = `<div class="alert alert-danger">Something went wrong while loading TipidUlam. Please refresh the page.</div>`;
});
