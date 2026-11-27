import { renderLayout } from '../ui/layout.js';
import { el, $, money, fmtDate, cap, link, toast } from '../ui/dom.js';
import { getSettings, saveSettings } from '../core/services/settingsService.js';
import { getPlan, createPlan, swapPlanMeal, markCooked } from '../core/services/planService.js';
import { getTotals } from '../core/services/groceryService.js';
import { MEAL_TYPES, toISODate } from '../core/engine/planner.js';

renderLayout('planner');

function fillForm() {
  const s = getSettings();
  $('budget').value = s.weeklyBudget;
  $('household').value = s.householdSize;
  $('mealTypes').replaceChildren(...MEAL_TYPES.map((t) => el('div', { className: 'form-check form-check-inline' }, [
    el('input', { className: 'form-check-input', type: 'checkbox', id: `mt-${t}`, value: t, checked: s.mealTypes.includes(t) }),
    el('label', { className: 'form-check-label', htmlFor: `mt-${t}`, textContent: cap(t) })
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
  box.firstElementChild.replaceChildren(
    el('div', {}, [el('div', { className: 'small text-secondary', textContent: 'Meals this week' }), el('div', { className: 'fw-bold fs-5', textContent: money(plan.totalCost) })]),
    el('div', {}, [el('div', { className: 'small text-secondary', textContent: 'Still to buy' }), el('div', { className: 'fw-bold fs-5', textContent: money(t.toBuy) })]),
    el('div', {}, [el('div', { className: 'small text-secondary', textContent: 'Budget' }), el('div', { className: 'fw-bold fs-5', textContent: money(plan.budget) })]),
    el('div', { className: `small ${over ? 'text-danger' : 'text-success'}`, textContent: over ? `Over budget by ${money(-t.leftAfterShopping)}. Try swapping pricier meals.` : `Within budget, with ${money(t.leftAfterShopping)} to spare.` }),
    el('a', { className: 'btn btn-sm btn-outline-primary ms-auto', href: link('grocery.html'), textContent: 'View grocery list' })
  );
}

function mealRow(meal, dayIdx, mealIdx) {
  return el('li', { className: `list-group-item meal${meal.cooked ? ' cooked' : ''}` }, [
    el('div', { className: 'meal-type', textContent: meal.type }),
    el('div', { className: 'd-flex justify-content-between gap-2' }, [
      el('a', { className: 'meal-name text-decoration-none', href: link(`recipes.html?r=${meal.recipeId}`), textContent: meal.name }),
      el('span', { className: 'small text-secondary text-nowrap', textContent: money(meal.cost) })
    ]),
    meal.cooked
      ? el('span', { className: 'badge text-bg-success mt-1', textContent: 'Cooked' })
      : el('div', { className: 'mt-1 d-flex gap-1' }, [
        el('button', { className: 'btn btn-sm btn-link p-0 me-2', textContent: 'Swap', onclick: () => { swapPlanMeal(dayIdx, mealIdx); render(); } }),
        el('button', {
          className: 'btn btn-sm btn-link p-0 text-success', textContent: 'Mark cooked',
          onclick: () => {
            const { used } = markCooked(dayIdx, mealIdx);
            toast(used.length ? `Used from pantry: ${used.join(', ')}` : 'Marked as cooked.');
            render();
          }
        })
      ])
  ]);
}

function renderGrid(plan) {
  const grid = $('planGrid');
  if (!plan) {
    grid.replaceChildren(el('div', { className: 'col-12' }, el('div', { className: 'card' }, el('div', { className: 'card-body text-center py-5' }, [
      el('p', { className: 'mb-1 fw-semibold', textContent: 'No plan yet' }),
      el('p', { className: 'text-secondary small mb-0', textContent: 'Set your budget above and press Generate plan.' })
    ]))));
    return;
  }
  const today = toISODate(new Date());
  grid.replaceChildren(...plan.days.map((day, i) => {
    const dayCost = day.meals.reduce((s, m) => s + m.cost, 0);
    return el('div', { className: 'col-sm-6 col-lg-4 col-xl-3' },
      el('div', { className: `card h-100${day.date === today ? ' border border-success' : ''}` }, [
        el('div', { className: 'card-header bg-white d-flex justify-content-between' }, [
          el('span', { className: 'fw-semibold', textContent: fmtDate(day.date) + (day.date === today ? ' · Today' : '') }),
          el('span', { className: 'small text-secondary', textContent: money(dayCost) })
        ]),
        el('ul', { className: 'list-group list-group-flush' }, day.meals.map((m, j) => mealRow(m, i, j)))
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
