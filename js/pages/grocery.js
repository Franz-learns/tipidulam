import { renderLayout } from '../ui/layout.js';
import { el, $, money, fmtQty, cap, link, toast, emptyState } from '../ui/dom.js';
import { getSettings } from '../core/services/settingsService.js';
import { getPlan } from '../core/services/planService.js';
import {
  getGrocery, syncFromPlan, addManualItem, updateGroceryItem, removeGroceryItem,
  moveBoughtToPantry, startNewWeek, getTotals, listAsText
} from '../core/services/groceryService.js';
import { UNITS } from '../core/data/ingredients.js';

renderLayout('grocery');

$('addUnit').replaceChildren(...UNITS.map((u) => el('option', { value: u, textContent: u })));

function stat(label, value, cls = '') {
  return el('div', { className: 'col-6 col-md-3 stat' }, [
    el('div', { className: `value ${cls}`, textContent: value }),
    el('div', { className: 'label', textContent: label })
  ]);
}

function renderStats() {
  const s = getSettings();
  const t = getTotals();
  $('groceryStats').replaceChildren(
    stat('Budget', money(s.weeklyBudget)),
    stat('Spent', money(t.spent)),
    stat('Still to buy', money(t.toBuy)),
    stat('Left after shopping', money(t.leftAfterShopping), t.leftAfterShopping < 0 ? 'text-danger' : 'text-success')
  );
}

function itemRow(i) {
  const check = el('input', {
    className: 'form-check-input mt-0', type: 'checkbox', checked: i.bought, 'aria-label': `Bought ${i.name}`,
    onchange: () => { updateGroceryItem(i.id, { bought: check.checked }); render(); }
  });
  const price = el('input', {
    className: 'form-control form-control-sm price-input', type: 'number', min: 0, step: 1,
    placeholder: 'Actual ₱', value: i.actualCost ?? '', 'aria-label': `Actual price of ${i.name}`,
    onchange: () => {
      const v = price.value === '' ? null : Math.max(0, Number(price.value));
      updateGroceryItem(i.id, { actualCost: v, bought: v != null ? true : i.bought });
      render();
    }
  });
  return el('li', { className: `list-group-item d-flex align-items-center gap-2 flex-wrap grocery-item${i.bought ? ' bought' : ''}` }, [
    check,
    el('span', { className: 'item-name text-capitalize me-auto', textContent: i.name }),
    i.inPantry ? el('span', { className: 'badge text-bg-light border text-body', textContent: 'in pantry' }) : null,
    i.source === 'manual' ? el('span', { className: 'badge text-bg-light border text-body', textContent: 'added' }) : null,
    el('span', { className: 'small text-secondary text-nowrap', textContent: `${fmtQty(i.qty)} ${i.unit} · est. ${money(i.estCost)}` }),
    price,
    el('button', { className: 'btn btn-sm btn-outline-danger', textContent: '✕', title: 'Remove', onclick: () => { removeGroceryItem(i.id); render(); } })
  ]);
}

function renderList() {
  const list = getGrocery();
  if (list.length === 0) {
    $('groceryList').replaceChildren(getPlan()
      ? emptyState('Nothing to buy. Your pantry covers this week\'s plan, or press Refresh from meal plan.')
      : el('div', {}, [emptyState('No meal plan yet.'), el('a', { className: 'btn btn-tipid btn-sm mt-2', href: link('planner.html'), textContent: 'Make a plan' })]));
    return;
  }
  const groups = new Map();
  for (const i of list) {
    if (!groups.has(i.category)) groups.set(i.category, []);
    groups.get(i.category).push(i);
  }
  $('groceryList').replaceChildren(...[...groups].map(([cat, items]) => el('div', { className: 'mb-3' }, [
    el('h3', { className: 'h6 text-secondary text-uppercase small mb-1', textContent: cap(cat) }),
    el('ul', { className: 'list-group' }, items.map(itemRow))
  ])));
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
  render();
});

function render() {
  renderStats();
  renderList();
}
render();
