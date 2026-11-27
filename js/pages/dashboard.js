import { renderLayout } from '../ui/layout.js';
import { el, $, money, fmtQty, link, emptyState, toast } from '../ui/dom.js';
import { getSettings } from '../core/services/settingsService.js';
import { getPlan, markCooked } from '../core/services/planService.js';
import { getTotals } from '../core/services/groceryService.js';
import { getPantry, expiringSoon, daysLeft } from '../core/services/pantryService.js';
import { suggestFromPantry } from '../core/engine/suggest.js';
import { dayIndex, toISODate } from '../core/engine/planner.js';
import { RECIPES } from '../core/data/recipes.js';

renderLayout('dashboard');

function stat(label, value, cls = '') {
  return el('div', { className: 'col-6 col-md-3 stat' }, [
    el('div', { className: `value ${cls}`, textContent: value }),
    el('div', { className: 'label', textContent: label })
  ]);
}

function renderBudget() {
  const s = getSettings();
  const t = getTotals();
  const left = t.leftAfterShopping;
  $('budgetStats').replaceChildren(
    stat('Budget', money(s.weeklyBudget)),
    stat('Spent', money(t.spent)),
    stat('Still to buy', money(t.toBuy)),
    stat('Left after shopping', money(left), left < 0 ? 'text-danger' : 'text-success')
  );
  const pct = (n) => `${Math.min(100, Math.max(0, (n / s.weeklyBudget) * 100))}%`;
  $('budgetBar').replaceChildren(
    el('div', { className: 'progress-bar bg-success', style: `width:${pct(t.spent)}`, title: 'Spent' }),
    el('div', { className: 'progress-bar bg-warning', style: `width:${pct(t.toBuy)}`, title: 'Still to buy' })
  );
  $('budgetNote').textContent = left < 0
    ? `Over budget by ${money(-left)}. Swap a few meals for cheaper ones on the Meal Plan page.`
    : 'Green = spent, yellow = still to buy (estimates).';
}

function renderToday() {
  const plan = getPlan();
  const idx = dayIndex(plan, toISODate(new Date()));
  const box = $('todayMeals');
  if (idx === -1) {
    box.replaceChildren(
      emptyState(plan ? 'Your plan has ended. Make a new one for this week.' : 'No meal plan yet.'),
      el('a', { className: 'btn btn-tipid btn-sm mt-3', href: link('planner.html'), textContent: 'Plan this week' })
    );
    return;
  }
  box.replaceChildren(el('ul', { className: 'list-group list-group-flush' }, plan.days[idx].meals.map((m, j) =>
    el('li', { className: `list-group-item d-flex align-items-center gap-2 meal${m.cooked ? ' cooked' : ''}` }, [
      el('div', { className: 'me-auto' }, [
        el('div', { className: 'meal-type', textContent: m.type }),
        el('a', { className: 'meal-name text-decoration-none', href: link(`recipes.html?r=${m.recipeId}`), textContent: m.name })
      ]),
      el('span', { className: 'small text-secondary', textContent: money(m.cost) }),
      m.cooked
        ? el('span', { className: 'badge text-bg-success', textContent: 'Cooked' })
        : el('button', {
          className: 'btn btn-sm btn-outline-success', textContent: 'Cooked',
          onclick: () => {
            const { used } = markCooked(idx, j);
            toast(used.length ? `Used from pantry: ${used.join(', ')}` : 'Marked as cooked.');
            render();
          }
        })
    ]))));
}

function renderExpiring() {
  const items = expiringSoon(3).sort((a, b) => daysLeft(a) - daysLeft(b));
  $('expiringList').replaceChildren(...(items.length ? items.map((p) => {
    const d = daysLeft(p);
    return el('li', { className: 'list-group-item d-flex justify-content-between' }, [
      el('span', {}, [el('span', { className: 'text-capitalize', textContent: p.name }), ` · ${fmtQty(p.qty)} ${p.unit}`]),
      el('span', { className: `badge ${d < 0 ? 'text-bg-danger' : 'text-bg-warning'}`, textContent: d < 0 ? 'expired' : d === 0 ? 'today' : `${d}d left` })
    ]);
  }) : [el('li', { className: 'list-group-item px-0' }, emptyState('Nothing expiring in the next 3 days.'))]));
}

function renderCookNow() {
  const s = getSettings();
  const expiringKeys = expiringSoon(3).map((p) => p.key).filter(Boolean);
  const top = suggestFromPantry(RECIPES, getPantry(), s.staples, { expiringKeys, minScore: 0.6 }).slice(0, 3);
  $('cookNow').replaceChildren(...(top.length ? top.map((sug) => el('div', { className: 'col-md-4' },
    el('a', { className: 'card h-100 text-decoration-none recipe-card', href: link(`recipes.html?r=${sug.recipe.id}`) },
      el('div', { className: 'card-body' }, [
        el('div', { className: 'fw-semibold text-body', textContent: sug.recipe.name }),
        el('div', { className: 'small text-secondary', textContent: `${Math.round(sug.score * 100)}% of ingredients ready` }),
        sug.missing.length ? el('div', { className: 'small text-danger', textContent: `Missing ${sug.missing.length}` }) : el('div', { className: 'small text-success', textContent: 'Complete!' })
      ])))) : [el('div', { className: 'col-12' }, [
    emptyState('Scan your ref to see what you can cook with what you have.'),
    el('a', { className: 'btn btn-outline-secondary btn-sm mt-2', href: link('pantry.html'), textContent: 'Scan my ref' })
  ])]));
}

function render() {
  renderBudget();
  renderToday();
  renderExpiring();
  renderCookNow();
}
render();
