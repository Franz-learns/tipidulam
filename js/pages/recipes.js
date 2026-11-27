import { renderLayout } from '../ui/layout.js';
import { el, $, money, fmtQty, cap } from '../ui/dom.js';
import { getSettings, getCatalog } from '../core/services/settingsService.js';
import { getPantry } from '../core/services/pantryService.js';
import { recipeCost } from '../core/engine/costing.js';
import { suggestFromPantry } from '../core/engine/suggest.js';
import { termMatches } from '../core/engine/matcher.js';
import { RECIPES, RECIPES_BY_ID } from '../core/data/recipes.js';

renderLayout('recipes');

const settings = getSettings();
const catalog = getCatalog(settings);
const pantry = getPantry();
const haveKeys = new Set(pantry.filter((p) => p.key && p.qty > 0).map((p) => p.key));
const readiness = new Map(suggestFromPantry(RECIPES, pantry, settings.staples, { minScore: 0 }).map((s) => [s.recipe.id, s]));
const costs = new Map(RECIPES.map((r) => [r.id, recipeCost(r, catalog, settings)]));

function readyScore(r) {
  return readiness.get(r.id)?.score ?? 0;
}

function matchesSearch(r, q) {
  if (!q) return true;
  if (termMatches(r.name, q) || r.name.toLowerCase().includes(q.toLowerCase())) return true;
  return r.ingredients.some((i) => catalog[i.key]?.terms.some((t) => termMatches(t, q) || t.includes(q.toLowerCase())));
}

function renderGrid() {
  const q = $('search').value.trim();
  const type = $('filterType').value;
  const sort = $('sortBy').value;
  const list = RECIPES
    .filter((r) => (!type || r.mealTypes.includes(type)) && matchesSearch(r, q))
    .sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name)
      : sort === 'ready' ? readyScore(b) - readyScore(a) || costs.get(a.id).total - costs.get(b.id).total
        : costs.get(a.id).total - costs.get(b.id).total);

  $('recipeGrid').replaceChildren(...(list.length ? list.map((r) => {
    const ready = readiness.get(r.id);
    const missing = r.ingredients.filter((i) => !haveKeys.has(i.key) && !settings.staples.includes(i.key)).length;
    const badge = !ready ? null
      : missing === 0 ? el('span', { className: 'badge text-bg-success', textContent: 'Kaya na! Ready to cook' })
        : el('span', { className: 'badge text-bg-light border text-body', textContent: `${missing} missing` });
    return el('div', { className: 'col-sm-6 col-lg-4' },
      el('div', { className: 'card h-100 recipe-card', tabIndex: 0, onclick: () => openRecipe(r.id), onkeydown: (e) => e.key === 'Enter' && openRecipe(r.id) },
        el('div', { className: 'card-body' }, [
          el('div', { className: 'd-flex justify-content-between align-items-start gap-2' }, [
            el('h2', { className: 'h6 mb-1', textContent: r.name }),
            el('span', { className: 'fw-semibold text-nowrap', textContent: money(costs.get(r.id).total) })
          ]),
          el('div', { className: 'small text-secondary mb-2', textContent: `${r.mealTypes.map(cap).join(' · ')} · ${r.minutes} min · ${money(costs.get(r.id).total / settings.householdSize)}/person` }),
          badge
        ])));
  }) : [el('p', { className: 'text-secondary', textContent: 'No recipes match your search.' })]));
}

function openRecipe(id) {
  const r = RECIPES_BY_ID[id];
  if (!r) return;
  const { total, lines } = costs.get(id);
  $('modalTitle').textContent = r.name;
  $('modalBody').replaceChildren(
    el('p', { className: 'text-secondary small', textContent: `For ${settings.householdSize} ${settings.householdSize === 1 ? 'person' : 'people'} · ${r.minutes} minutes · estimated ${money(total)}` }),
    el('h3', { className: 'h6', textContent: 'Ingredients' }),
    el('table', { className: 'table table-sm' }, el('tbody', {}, lines.map((l) => el('tr', {}, [
      el('td', { className: 'text-capitalize', textContent: l.name }),
      el('td', { className: 'text-secondary', textContent: `${fmtQty(l.qty)} ${l.unit}` }),
      el('td', {}, haveKeys.has(l.key) ? el('span', { className: 'badge text-bg-success', textContent: 'in pantry' })
        : l.isStaple ? el('span', { className: 'badge text-bg-light border text-body', textContent: 'staple' }) : ''),
      el('td', { className: 'text-end', textContent: l.isStaple ? '—' : money(l.cost) })
    ])))),
    el('h3', { className: 'h6', textContent: 'Steps' }),
    el('ol', { className: 'mb-0' }, r.steps.map((s) => el('li', { className: 'mb-1', textContent: s })))
  );
  window.bootstrap.Modal.getOrCreateInstance($('recipeModal')).show();
}

for (const id of ['search', 'filterType', 'sortBy']) $(id).addEventListener('input', renderGrid);
renderGrid();

const requested = new URLSearchParams(location.search).get('r');
if (requested && RECIPES_BY_ID[requested]) openRecipe(requested);
