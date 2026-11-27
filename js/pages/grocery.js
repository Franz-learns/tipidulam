import { renderLayout, emptyBlock } from '../ui/layout.js';
import { el, $, money, fmtQty, cap, link, toast, btn } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { CATEGORY_ICON } from '../ui/recipeVisual.js';
import { getSettings } from '../core/services/settingsService.js';
import { getPlan } from '../core/services/planService.js';
import {
  getGrocery, syncFromPlan, addManualItem, updateGroceryItem, removeGroceryItem,
  moveBoughtToPantry, startNewWeek, getTotals, listAsText
} from '../core/services/groceryService.js';
import { UNITS } from '../core/data/ingredients.js';

renderLayout('grocery');

$('addUnit').replaceChildren(...UNITS.map((u) => el('option', { value: u, textContent: u })));

function stat(iconName, tone, label, value, extraCls = '') {
  return el('div', { className: 'col-6 col-md-3' },
    el('div', { className: 'card stat-tile h-100' }, [
      el('span', { className: `chip-icon ${tone}` }, icon(iconName)),
      el('div', {}, [el('div', { className: `v ${extraCls}`, textContent: value }), el('div', { className: 'k', textContent: label })])
    ]));
}

function renderStats() {
  const s = getSettings();
  const t = getTotals();
  const over = t.leftAfterShopping < 0;
  $('groceryStats').replaceChildren(
    stat('wallet', 'slate', 'Budget', money(s.weeklyBudget)),
    stat('receipt-text', '', 'Spent', money(t.spent)),
    stat('shopping-cart', 'amber', 'Still to buy', money(t.toBuy)),
    stat(over ? 'circle-alert' : 'piggy-bank', over ? 'red' : '', 'Left after shopping', money(t.leftAfterShopping), over ? 'text-danger' : 'text-success')
  );
}

function itemRow(i) {
  const check = el('input', {
    className: 'form-check-input g-check', type: 'checkbox', checked: i.bought, id: `g-${i.id}`,
    onchange: () => { updateGroceryItem(i.id, { bought: check.checked }); render(); }
  });
  const price = el('input', {
    className: 'form-control form-control-sm price-input', type: 'number', min: 0, step: 1, inputMode: 'numeric',
    placeholder: 'Actual ₱', value: i.actualCost ?? '', 'aria-label': `Actual price of ${i.name}`,
    onchange: () => {
      const v = price.value === '' ? null : Math.max(0, Number(price.value));
      updateGroceryItem(i.id, { actualCost: v, bought: v != null ? true : i.bought });
      render();
    }
  });
  return el('div', { className: `g-item${i.bought ? ' bought' : ''}` }, [
    check,
    el('label', { className: 'row-main', htmlFor: `g-${i.id}` }, [
      el('div', { className: 'item-name text-capitalize', textContent: i.name }),
      el('div', { className: 'row-meta' }, [
        `${fmtQty(i.qty)} ${i.unit} · est. ${money(i.estCost)}`,
        i.inPantry ? el('span', { className: 'tag tag-success ms-2' }, [icon('refrigerator', { size: 12 }), 'In pantry']) : null,
        i.source === 'manual' ? el('span', { className: 'tag ms-2', textContent: 'Added' }) : null
      ])
    ]),
    price,
    btn('', { className: 'btn btn-danger-ghost btn-sm btn-icon', iconEl: icon('x', { size: 16 }), ariaLabel: `Remove ${i.name}`, onclick: () => { removeGroceryItem(i.id); render(); } })
  ]);
}

function renderList() {
  const list = getGrocery();
  if (list.length === 0) {
    $('groceryList').replaceChildren(getPlan()
      ? emptyBlock('package-check', 'Nothing to buy', 'Your pantry covers this week\'s plan. Press Refresh from plan after changing it.')
      : emptyBlock('calendar-days', 'No meal plan yet', 'Make a plan and your grocery list builds itself.',
        el('a', { className: 'btn btn-tipid btn-sm mt-1', href: link('planner.html') }, [icon('sparkles', { size: 16 }), 'Make a plan'])));
    return;
  }
  const groups = new Map();
  for (const i of list) {
    if (!groups.has(i.category)) groups.set(i.category, []);
    groups.get(i.category).push(i);
  }
  const done = list.filter((i) => i.bought).length;
  $('groceryList').replaceChildren(
    el('div', { className: 'd-flex justify-content-between small fw-bold mb-1' }, [
      el('span', { textContent: `${done} of ${list.length} bought` }),
      el('span', { className: 'text-secondary', textContent: `${Math.round((done / list.length) * 100)}%` })
    ]),
    el('div', { className: 'mini-bar mb-4' }, el('span', { style: `width:${(done / list.length) * 100}%` })),
    ...[...groups].map(([cat, items]) => el('div', { className: 'g-group' }, [
      el('div', { className: 'g-group-head' }, [
        el('span', { className: 'chip-icon sm slate' }, icon(CATEGORY_ICON[cat] || 'shopping-cart', { size: 15 })),
        el('h3', { className: 'kicker m-0', textContent: cap(cat) }),
        el('span', { className: 'row-meta ms-auto', textContent: money(items.reduce((s, x) => s + (Number(x.estCost) || 0), 0)) })
      ]),
      ...items.map(itemRow)
    ]))
  );
}

$('syncBtn').addEventListener('click', () => { syncFromPlan(); toast('Grocery list refreshed.'); render(); });

$('moveBtn').addEventListener('click', () => {
  const n = moveBoughtToPantry();
  toast(n ? `Moved ${n} item${n === 1 ? '' : 's'} to your pantry.` : 'Tick bought items first.', n ? 'success' : 'warning');
  render();
});

$('copyBtn').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(listAsText());
    toast('List copied. Paste it in Messenger or Notes.');
  } catch {
    toast('Could not copy. Your browser blocked clipboard access.', 'warning');
  }
});

$('newWeekBtn').addEventListener('click', () => {
  if (!confirm('Clear the whole grocery list, including what you bought this week? Your pantry stays the same.')) return;
  startNewWeek();
  render();
});

$('addForm').addEventListener('submit', (e) => {
  e.preventDefault();
  addManualItem({ name: $('addName').value, qty: $('addQty').value, unit: $('addUnit').value, estCost: $('addPrice').value });
  $('addForm').reset();
  $('addQty').value = 1;
  toast('Item added.');
  render();
});

function render() {
  renderStats();
  renderList();
}
render();
