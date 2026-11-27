import { renderLayout, emptyBlock } from '../ui/layout.js';
import { el, $, money, fmtQty, cap } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { recipeVisual, recipeImage, photoFor } from '../ui/recipeVisual.js';
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

const readyScore = (r) => readiness.get(r.id)?.score ?? 0;
const missingCount = (r) => r.ingredients.filter((i) => !haveKeys.has(i.key) && !settings.staples.includes(i.key)).length;

function matchesSearch(r, q) {
  if (!q) return true;
  const ql = q.toLowerCase();
  if (r.name.toLowerCase().includes(ql)) return true;
  return r.ingredients.some((i) => catalog[i.key]?.terms.some((t) => termMatches(t, q) || t.includes(ql)));
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

  $('resultCount').textContent = `${list.length} recipe${list.length === 1 ? '' : 's'}`;
  if (!list.length) {
    $('recipeGrid').replaceChildren(el('div', { className: 'col-12' }, el('div', { className: 'card' },
      emptyBlock('search', 'No recipes found', 'Try another dish or ingredient name.'))));
    return;
  }
  $('recipeGrid').replaceChildren(...list.map((r, i) => {
    const missing = missingCount(r);
    const hasAny = readiness.has(r.id);
    const total = costs.get(r.id).total;
    return el('div', { className: 'col-sm-6 col-lg-4' },
      el('button', {
        type: 'button', className: 'card recipe-card reveal', style: `animation-delay:${Math.min(i, 9) * 30}ms`,
        onclick: () => openRecipe(r.id), 'aria-label': `${r.name}, ${money(total)}. Open recipe`
      }, [
        (() => {
          const pic = recipeImage(r, catalog, { variant: 'card', iconSize: 40 });
          if (hasAny && missing === 0) pic.append(el('span', { className: 'tag tag-success thumb-tag' }, [icon('check', { size: 13 }), 'Kaya na!']));
          return pic;
        })(),
        el('div', { className: 'recipe-body' }, [
          el('h2', { textContent: r.name }),
          el('div', { className: 'row-meta' }, [icon('clock', { size: 14 }), ` ${r.minutes} min · ${r.mealTypes.map(cap).join(', ')}`]),
          el('div', { className: 'recipe-foot' }, [
            el('div', {}, [
              el('span', { className: 'price fs-5', textContent: money(total) }),
              el('span', { className: 'row-meta', textContent: ` · ${money(total / settings.householdSize)}/tao` })
            ]),
            hasAny && missing > 0 ? el('span', { className: 'tag', textContent: `${missing} missing` }) : null
          ])
        ])
      ]));
  }));
}

function openRecipe(id) {
  const r = RECIPES_BY_ID[id];
  if (!r) return;
  const { total, lines } = costs.get(id);
  const v = recipeVisual(r, catalog);
  $('modalHero').replaceChildren(
    el('span', { className: `chip-icon thumb-${v.tone}`, style: 'width:52px;height:52px;border-radius:16px' }, icon(v.icon, { size: 26 })),
    el('div', {}, [
      el('h2', { className: 'modal-title h4 m-0', id: 'modalTitle', textContent: r.name }),
      el('div', { className: 'row-meta' }, `${settings.householdSize} ${settings.householdSize === 1 ? 'person' : 'people'} · ${r.minutes} min · ${money(total)}`)
    ])
  );
  const banner = recipeImage(r, catalog, { variant: 'banner', iconSize: 48, decorative: false });
  const { credit } = photoFor(r);
  const creditEl = credit ? el('p', { className: 'photo-credit', textContent: credit }) : null;
  // Hide the banner entirely if there's no photo (the header already shows the icon)
  const dropBanner = () => { banner.remove(); creditEl?.remove(); };
  if (banner.dataset.noPhoto) setTimeout(dropBanner);
  banner.addEventListener('nophoto', dropBanner);
  $('modalBody').replaceChildren(...[
    banner,
    creditEl,
    el('h3', { className: 'section-title' }, 'Ingredients'),
    el('table', { className: 'table ing-table mb-4' }, el('tbody', {}, lines.map((l) => el('tr', {}, [
      el('td', { className: 'fw-bold text-capitalize', textContent: l.name }),
      el('td', { className: 'text-secondary', textContent: `${fmtQty(l.qty)} ${l.unit}` }),
      el('td', {}, haveKeys.has(l.key) ? el('span', { className: 'tag tag-success' }, [icon('refrigerator', { size: 13 }), 'In pantry'])
        : l.isStaple ? el('span', { className: 'tag', textContent: 'Staple' }) : ''),
      el('td', { className: 'text-end price', textContent: l.isStaple ? '—' : money(l.cost) })
    ])))),
    el('h3', { className: 'section-title' }, 'Steps'),
    el('ol', { className: 'steps' }, r.steps.map((s) => el('li', {}, el('span', { textContent: s }))))
  ].filter(Boolean));
  window.bootstrap.Modal.getOrCreateInstance($('recipeModal')).show();
}

for (const id of ['search', 'filterType', 'sortBy']) $(id).addEventListener('input', renderGrid);
renderGrid();

const requested = new URLSearchParams(location.search).get('r');
if (requested && RECIPES_BY_ID[requested]) openRecipe(requested);
