import { renderLayout, emptyBlock } from '../ui/layout.js';
import { el, $, money, fmtQty, fmtDate, link, toast, btn } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { MEAL_ICON, recipeImage } from '../ui/recipeVisual.js';
import { getSettings, getCatalog } from '../core/services/settingsService.js';
import { getPlan, markCooked } from '../core/services/planService.js';
import { getTotals, getGrocery } from '../core/services/groceryService.js';
import { getPantry, expiringSoon, daysLeft } from '../core/services/pantryService.js';
import { suggestFromPantry } from '../core/engine/suggest.js';
import { dayIndex, toISODate } from '../core/engine/planner.js';
import { RECIPES, RECIPES_BY_ID } from '../core/data/recipes.js';

renderLayout('dashboard');

$('todayLabel').replaceChildren(icon('sun', { size: 14 }),
  fmtDate(toISODate(new Date()), { weekday: 'long', month: 'long', day: 'numeric' }));

function renderBudget() {
  const s = getSettings();
  const t = getTotals();
  const left = t.leftAfterShopping;
  const pct = (n) => `${Math.min(100, Math.max(0, (n / s.weeklyBudget) * 100))}%`;
  const meter = el('div', {
    className: 'meter', role: 'img',
    'aria-label': `Spent ${money(t.spent)} and ${money(t.toBuy)} still to buy, out of ${money(s.weeklyBudget)}`
  }, [
    el('span', { className: 'seg-spent', style: `width:${pct(t.spent)}` }),
    el('span', { className: 'seg-tobuy', style: `width:${pct(t.toBuy)}` })
  ]);
  $('budgetHero').replaceChildren(
    el('div', { className: 'd-flex align-items-start justify-content-between gap-3' }, [
      el('div', {}, [
        el('div', { className: 'hero-label', textContent: 'Left after shopping' }),
        el('div', { className: 'hero-value', textContent: money(left) }),
        left < 0
          ? el('div', { className: 'hero-sub over', textContent: `Over budget by ${money(-left)}` })
          : el('div', { className: 'hero-sub', textContent: `of your ${money(s.weeklyBudget)} weekly budget` })
      ]),
      el('a', { className: 'btn btn-hero btn-sm', href: link('planner.html') }, [icon('calendar-days', { size: 16 }), 'Plan'])
    ]),
    meter,
    el('div', { className: 'hero-stats' }, [
      el('div', {}, [el('div', { className: 'k' }, [el('i', { style: 'display:inline-block;width:9px;height:9px;border-radius:3px;background:#fff;margin-right:6px' }), 'Spent']), el('div', { className: 'v', textContent: money(t.spent) })]),
      el('div', {}, [el('div', { className: 'k' }, [el('i', { style: 'display:inline-block;width:9px;height:9px;border-radius:3px;background:#fcd34d;margin-right:6px' }), 'To buy']), el('div', { className: 'v', textContent: money(t.toBuy) })]),
      el('div', {}, [el('div', { className: 'k', textContent: 'Budget' }), el('div', { className: 'v', textContent: money(s.weeklyBudget) })])
    ])
  );
}

function statTile(iconName, tone, value, label, href) {
  return el('div', { className: 'col-6 col-lg-6' },
    el('a', { className: 'card stat-tile text-decoration-none h-100 reveal', href: link(href) }, [
      el('span', { className: `chip-icon ${tone}` }, icon(iconName)),
      el('div', {}, [el('div', { className: 'v', textContent: value }), el('div', { className: 'k', textContent: label })])
    ]));
}

function renderQuickStats() {
  const plan = getPlan();
  const pantry = getPantry();
  const toBuy = getGrocery().filter((i) => !i.bought).length;
  const cooked = plan ? plan.days.reduce((n, d) => n + d.meals.filter((m) => m.cooked).length, 0) : 0;
  const total = plan ? plan.days.reduce((n, d) => n + d.meals.length, 0) : 0;
  $('quickStats').replaceChildren(
    statTile('calendar-days', '', plan ? `${cooked}/${total}` : '—', 'Meals cooked', 'planner.html'),
    statTile('refrigerator', 'indigo', String(pantry.length), 'Pantry items', 'pantry.html'),
    statTile('shopping-cart', 'amber', String(toBuy), 'Items to buy', 'grocery.html'),
    statTile('clock', 'red', String(expiringSoon(3).length), 'Expiring soon', 'pantry.html')
  );
}

function renderToday() {
  const plan = getPlan();
  const idx = dayIndex(plan, toISODate(new Date()));
  const box = $('todayMeals');
  if (idx === -1) {
    box.replaceChildren(emptyBlock('calendar-days', plan ? 'Your plan has ended' : 'No meal plan yet',
      'Generate a week of budget-friendly ulam in one tap.',
      el('a', { className: 'btn btn-tipid btn-sm mt-1', href: link('planner.html') }, [icon('sparkles', { size: 16 }), 'Plan this week'])));
    return;
  }
  box.replaceChildren(el('ul', { className: 'row-list' }, plan.days[idx].meals.map((m, j) => {
    const [ic] = MEAL_ICON[m.type];
    const recipe = RECIPES_BY_ID[m.recipeId];
    return el('li', { className: m.cooked ? 'meal cooked p-0 py-2' : 'p-0 py-2' }, [
      recipe ? recipeImage(recipe, getCatalog(), { iconSize: 20 }) : el('span', { className: 'chip-icon' }, icon(ic)),
      el('div', { className: 'row-main' }, [
        el('div', { className: 'kicker' }, [icon(ic, { size: 12 }), ` ${m.type}`]),
        el('a', { className: 'row-title meal-name', href: link(`recipes.html?r=${m.recipeId}`), textContent: m.name })
      ]),
      el('span', { className: 'price small', textContent: money(m.cost) }),
      m.cooked
        ? el('span', { className: 'tag tag-success' }, [icon('check', { size: 14 }), 'Cooked'])
        : btn('Cooked', {
          className: 'btn btn-soft btn-sm', iconEl: icon('check', { size: 16 }), ariaLabel: `Mark ${m.name} as cooked`,
          onclick: () => {
            const { used } = markCooked(idx, j);
            toast(used.length ? `Used from pantry: ${used.join(', ')}` : 'Marked as cooked.');
            render();
          }
        })
    ]);
  })));
}

function renderExpiring() {
  const items = expiringSoon(3).sort((a, b) => daysLeft(a) - daysLeft(b));
  if (!items.length) {
    $('expiringList').replaceChildren(el('li', { className: 'border-0 p-0' },
      emptyBlock('check', 'All fresh', 'Nothing expires in the next 3 days.')));
    return;
  }
  $('expiringList').replaceChildren(...items.map((p) => {
    const d = daysLeft(p);
    return el('li', {}, [
      el('div', { className: 'row-main' }, [
        el('div', { className: 'row-title text-capitalize', textContent: p.name }),
        el('div', { className: 'row-meta', textContent: `${fmtQty(p.qty)} ${p.unit}` })
      ]),
      el('span', { className: `tag ${d < 0 ? 'tag-danger' : 'tag-warning'}`, textContent: d < 0 ? 'Expired' : d === 0 ? 'Today' : `${d}d left` })
    ]);
  }));
}

function renderCookNow() {
  const s = getSettings();
  const catalog = getCatalog(s);
  const expiringKeys = expiringSoon(3).map((p) => p.key).filter(Boolean);
  const top = suggestFromPantry(RECIPES, getPantry(), s.staples, { expiringKeys, minScore: 0.6 }).slice(0, 3);
  if (!top.length) {
    $('cookNow').replaceChildren(el('div', { className: 'col-12' }, emptyBlock('refrigerator', 'Nothing to suggest yet',
      'Scan your ref and we\'ll show dishes you can cook with what you have.')));
    return;
  }
  $('cookNow').replaceChildren(...top.map((sug) => {
    const pct = Math.round(sug.score * 100);
    const pic = recipeImage(sug.recipe, catalog, { iconSize: 22 });
    pic.classList.add('lg');
    return el('div', { className: 'col-md-4' },
      el('a', { className: 'suggest-link h-100 d-flex gap-3 align-items-center', href: link(`recipes.html?r=${sug.recipe.id}`) }, [
        pic,
        el('div', { className: 'row-main' }, [
          el('div', { className: 'row-title', textContent: sug.recipe.name }),
          el('div', { className: `mini-bar${pct === 100 ? ' full' : ''}` }, el('span', { style: `width:${pct}%` })),
          el('div', { className: 'row-meta', textContent: sug.missing.length ? `${pct}% ready · ${sug.missing.length} missing` : 'Everything ready!' })
        ])
      ]));
  }));
}

function render() {
  renderBudget();
  renderQuickStats();
  renderToday();
  renderExpiring();
  renderCookNow();
}
render();
