import { renderLayout, emptyBlock } from '../ui/layout.js';
import { el, $, money, fmtDate, cap, link, toast, btn } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { MEAL_ICON, recipeImage } from '../ui/recipeVisual.js';
import { getCatalog } from '../core/services/settingsService.js';
import { RECIPES_BY_ID } from '../core/data/recipes.js';
import { getSettings, saveSettings } from '../core/services/settingsService.js';
import { getPlan, createPlan, swapPlanMeal, markCooked } from '../core/services/planService.js';
import { getTotals } from '../core/services/groceryService.js';
import { MEAL_TYPES, toISODate } from '../core/engine/planner.js';

renderLayout('planner');
const catalog = getCatalog();

function fillForm() {
  const s = getSettings();
  $('budget').value = s.weeklyBudget;
  $('household').value = s.householdSize;
  $('mealTypes').replaceChildren(...MEAL_TYPES.map((t) => el('label', { className: 'chip-check' }, [
    el('input', { type: 'checkbox', id: `mt-${t}`, value: t, checked: s.mealTypes.includes(t) }),
    el('span', {}, [icon(MEAL_ICON[t][0], { size: 16 }), cap(t)])
  ])));
}

$('planForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const mealTypes = MEAL_TYPES.filter((t) => $(`mt-${t}`).checked);
  if (mealTypes.length === 0) return toast('Pick at least one meal per day.', 'warning');
  saveSettings({ weeklyBudget: Number($('budget').value), householdSize: Number($('household').value), mealTypes });
  fillForm();
  createPlan();
  toast('New plan ready. Your grocery list was updated.');
  render();
});

function renderSummary(plan) {
  const box = $('planSummary');
  if (!plan) return box.classList.add('d-none');
  box.classList.remove('d-none');
  const t = getTotals();
  const over = t.leftAfterShopping < 0;
  const pct = (n) => `${Math.min(100, Math.max(0, (n / plan.budget) * 100))}%`;
  box.replaceChildren(el('div', { className: 'card surface-pad' }, [
    el('div', { className: 'row g-3 align-items-center' }, [
      el('div', { className: 'col-6 col-md-3' }, [el('div', { className: 'kicker', textContent: 'Meals this week' }), el('div', { className: 'price fs-4', textContent: money(plan.totalCost) })]),
      el('div', { className: 'col-6 col-md-3' }, [el('div', { className: 'kicker', textContent: 'Still to buy' }), el('div', { className: 'price fs-4', textContent: money(t.toBuy) })]),
      el('div', { className: 'col-12 col-md-6' }, [
        el('div', { className: 'd-flex justify-content-between small fw-bold' }, [
          el('span', { className: over ? 'text-danger' : 'text-success' }, [icon(over ? 'circle-alert' : 'piggy-bank', { size: 16 }), over ? ` Over by ${money(-t.leftAfterShopping)}` : ` ${money(t.leftAfterShopping)} to spare`]),
          el('span', { className: 'text-secondary', textContent: `Budget ${money(plan.budget)}` })
        ]),
        el('div', { className: 'meter light my-2', role: 'img', 'aria-label': `Spent ${money(t.spent)}, still to buy ${money(t.toBuy)}, budget ${money(plan.budget)}` }, [
          el('span', { className: 'seg-spent', style: `width:${pct(t.spent)}` }),
          el('span', { className: 'seg-tobuy', style: `width:${pct(t.toBuy)}` })
        ]),
        el('a', { className: 'small fw-bold text-decoration-none', href: link('grocery.html') }, ['View grocery list ', icon('arrow-right', { size: 14 })])
      ])
    ])
  ]));
}

function mealRow(meal, dayIdx, mealIdx) {
  const [ic] = MEAL_ICON[meal.type];
  const recipe = RECIPES_BY_ID[meal.recipeId];
  return el('div', { className: `meal${meal.cooked ? ' cooked' : ''}` }, [
    recipe ? recipeImage(recipe, catalog, { iconSize: 18 }) : el('span', { className: 'chip-icon sm' }, icon(ic, { size: 16 })),
    el('div', { className: 'meal-body' }, [
      el('div', { className: 'd-flex justify-content-between gap-2' }, [
        el('div', {}, [
          el('div', { className: 'kicker' }, [icon(ic, { size: 12 }), ` ${meal.type}`]),
          el('a', { className: 'meal-name', href: link(`recipes.html?r=${meal.recipeId}`), textContent: meal.name })
        ]),
        el('span', { className: 'price small', textContent: money(meal.cost) })
      ]),
      meal.cooked
        ? el('span', { className: 'tag tag-success mt-2' }, [icon('check', { size: 13 }), 'Cooked'])
        : el('div', { className: 'meal-actions' }, [
          btn('Swap', { className: 'btn btn-ghost', iconEl: icon('shuffle', { size: 14 }), ariaLabel: `Swap ${meal.name}`, onclick: () => { swapPlanMeal(dayIdx, mealIdx); render(); } }),
          btn('Cooked', {
            className: 'btn btn-soft', iconEl: icon('check', { size: 14 }), ariaLabel: `Mark ${meal.name} as cooked`,
            onclick: () => {
              const { used } = markCooked(dayIdx, mealIdx);
              toast(used.length ? `Used from pantry: ${used.join(', ')}` : 'Marked as cooked.');
              render();
            }
          })
        ])
    ])
  ]);
}

function renderGrid(plan) {
  const grid = $('planGrid');
  if (!plan) {
    grid.replaceChildren(el('div', { className: 'col-12' }, el('div', { className: 'card' },
      emptyBlock('calendar-days', 'No plan yet', 'Set your budget above and press Generate plan.'))));
    return;
  }
  const today = toISODate(new Date());
  grid.replaceChildren(...plan.days.map((day, i) => {
    const dayCost = day.meals.reduce((s, m) => s + m.cost, 0);
    const isToday = day.date === today;
    return el('div', { className: 'col-sm-6 col-xl-4' },
      el('article', { className: `card day-card reveal${isToday ? ' today' : ''}`, style: `animation-delay:${i * 40}ms` }, [
        el('div', { className: 'day-head' }, [
          el('h2', { className: 'day-name m-0' }, [fmtDate(day.date), isToday ? el('span', { className: 'today-pill', textContent: 'Today' }) : null]),
          el('span', { className: 'price small text-secondary', textContent: money(dayCost) })
        ]),
        ...day.meals.map((m, j) => mealRow(m, i, j))
      ]));
  }));
}

function render() {
  const plan = getPlan();
  renderSummary(plan);
  renderGrid(plan);
}

fillForm();
render();
