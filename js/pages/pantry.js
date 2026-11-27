import { renderLayout } from '../ui/layout.js';
import { el, $, select, fmtQty, money, link, toast, emptyState } from '../ui/dom.js';
import { compressImage } from '../ui/image.js';
import { scanImage } from '../core/services/scanService.js';
import { getSettings, getCatalog } from '../core/services/settingsService.js';
import { getPantry, addPantryItems, consumePantryItem, removePantryItem, daysLeft, expiringSoon } from '../core/services/pantryService.js';
import { syncFromPlan } from '../core/services/groceryService.js';
import { suggestFromPantry } from '../core/engine/suggest.js';
import { recipeCost } from '../core/engine/costing.js';
import { RECIPES } from '../core/data/recipes.js';
import { UNITS, CATEGORIES } from '../core/data/ingredients.js';

renderLayout('pantry');

let selectedFile = null;

function showError(msg) {
  $('scanError').textContent = msg;
  $('scanError').classList.toggle('d-none', !msg);
}

// ---------- 1. Photo + scan ----------
$('photoInput').addEventListener('change', async (e) => {
  selectedFile = e.target.files[0] || null;
  showError('');
  $('scanBtn').disabled = !selectedFile;
  if (!selectedFile) return $('preview').classList.add('d-none');
  try {
    $('preview').src = (await compressImage(selectedFile, 800, 0.7)).dataUrl;
    $('preview').classList.remove('d-none');
  } catch (err) {
    showError(err.message);
  }
});

$('scanBtn').addEventListener('click', async () => {
  if (!selectedFile) return;
  showError('');
  $('scanBtn').disabled = true;
  $('scanSpinner').classList.remove('d-none');
  try {
    const items = await scanImage(await compressImage(selectedFile));
    if (items.length === 0) showError('No food detected. Try a brighter, closer photo, or add items manually.');
    renderConfirm(items);
  } catch (err) {
    showError(err.message);
  } finally {
    $('scanBtn').disabled = false;
    $('scanSpinner').classList.add('d-none');
  }
});

$('manualBtn').addEventListener('click', () => renderConfirm([]));

// ---------- 2. Confirm ----------
function confirmRow(item = { name: '', qty: 1, unit: 'pc', category: 'other', confidence: 'high' }) {
  const tr = el('tr', { className: item.confidence === 'low' ? 'conf-low' : '' });
  tr.append(
    el('td', {}, el('input', { className: 'form-control form-control-sm', value: item.name, placeholder: 'e.g. kangkong', 'aria-label': 'Item name' })),
    el('td', {}, el('input', { className: 'form-control form-control-sm', type: 'number', min: 0.25, step: 0.25, value: item.qty, 'aria-label': 'Quantity' })),
    el('td', {}, select(UNITS, item.unit)),
    el('td', {}, select(CATEGORIES, item.category)),
    el('td', {}, el('input', { className: 'form-control form-control-sm', type: 'date', 'aria-label': 'Expiry date' })),
    el('td', {}, el('button', { className: 'btn btn-sm btn-outline-danger', textContent: '✕', title: 'Remove row', onclick: () => tr.remove() }))
  );
  return tr;
}

function renderConfirm(items) {
  $('confirmBody').replaceChildren(...(items.length ? items.map(confirmRow) : [confirmRow()]));
  $('confirmSection').classList.remove('d-none');
  $('confirmSection').scrollIntoView({ behavior: 'smooth' });
}

$('addRowBtn').addEventListener('click', () => $('confirmBody').append(confirmRow()));
$('cancelBtn').addEventListener('click', () => $('confirmSection').classList.add('d-none'));

$('saveBtn').addEventListener('click', () => {
  const items = [...$('confirmBody').querySelectorAll('tr')].map((tr) => {
    const [name, qty, expiry] = tr.querySelectorAll('input');
    const [unit, category] = tr.querySelectorAll('select');
    return { name: name.value, qty: Number(qty.value) || 1, unit: unit.value, category: category.value, expiry: expiry.value };
  }).filter((i) => i.name.trim() && i.name.trim().toLowerCase() !== 'unknown container');
  if (items.length === 0) return toast('Nothing to save.', 'warning');
  addPantryItems(items);
  syncFromPlan();
  $('confirmSection').classList.add('d-none');
  $('photoInput').value = '';
  $('preview').classList.add('d-none');
  $('scanBtn').disabled = true;
  selectedFile = null;
  toast(`Saved ${items.length} item${items.length === 1 ? '' : 's'}. Grocery list updated.`);
  render();
});

// ---------- 3. Inventory ----------
function expiryBadge(p) {
  const d = daysLeft(p);
  if (d === null) return el('span', { className: 'badge text-bg-light border text-body', textContent: 'no expiry' });
  if (d < 0) return el('span', { className: 'badge text-bg-danger', textContent: 'expired' });
  if (d <= 3) return el('span', { className: 'badge text-bg-warning', textContent: d === 0 ? 'expires today' : `${d}d left` });
  return el('span', { className: 'badge text-bg-success', textContent: `${d}d left` });
}

function renderInventory() {
  const pantry = getPantry();
  $('invCount').textContent = `${pantry.length} item${pantry.length === 1 ? '' : 's'}`;
  const sorted = [...pantry].sort((a, b) => (daysLeft(a) ?? 9999) - (daysLeft(b) ?? 9999) || a.name.localeCompare(b.name));
  $('inventoryList').replaceChildren(...(sorted.length ? sorted.map((p) => el('li', { className: 'list-group-item d-flex align-items-center gap-2 flex-wrap' }, [
    el('span', { className: 'fw-semibold text-capitalize me-auto', textContent: p.name }),
    el('span', { className: 'text-secondary small', textContent: `${fmtQty(p.qty)} ${p.unit}` }),
    expiryBadge(p),
    el('button', { className: 'btn btn-sm btn-outline-secondary', textContent: 'Use 1', onclick: () => { consumePantryItem(p.id, 1); syncFromPlan(); render(); } }),
    el('button', { className: 'btn btn-sm btn-outline-danger', textContent: 'Remove', onclick: () => { removePantryItem(p.id); syncFromPlan(); render(); } })
  ])) : [el('li', { className: 'list-group-item px-0' }, emptyState('Your pantry is empty. Scan your ref or add items manually.'))]));
}

// ---------- 4. Suggestions ----------
function renderSuggestions() {
  const s = getSettings();
  const catalog = getCatalog(s);
  const expiringKeys = expiringSoon(3).map((p) => p.key).filter(Boolean);
  const list = suggestFromPantry(RECIPES, getPantry(), s.staples, { expiringKeys }).slice(0, 6);
  $('suggestList').replaceChildren(...(list.length ? list.map((sug) => {
    const pct = Math.round(sug.score * 100);
    const missingNames = sug.missing.map((k) => catalog[k].name);
    return el('a', { className: 'card text-decoration-none recipe-card border', href: link(`recipes.html?r=${sug.recipe.id}`) },
      el('div', { className: 'card-body py-2' }, [
        el('div', { className: 'd-flex justify-content-between' }, [
          el('span', { className: 'fw-semibold text-body', textContent: sug.recipe.name }),
          el('span', { className: 'small text-secondary', textContent: money(recipeCost(sug.recipe, catalog, s).total) })
        ]),
        el('div', { className: 'progress my-1', style: 'height:5px' }, el('div', { className: `progress-bar ${pct === 100 ? 'bg-success' : 'bg-info'}`, style: `width:${pct}%` })),
        sug.usesExpiring.length ? el('div', { className: 'small text-warning-emphasis', textContent: `Uses soon-to-expire: ${sug.usesExpiring.map((k) => catalog[k].name).join(', ')}` }) : null,
        el('div', { className: `small ${missingNames.length ? 'text-danger' : 'text-success'}`, textContent: missingNames.length ? `Missing: ${missingNames.join(', ')}` : 'You have everything. Luto na!' })
      ]));
  }) : [emptyState('Add items to see what you can cook.')]));
}

function render() {
  renderInventory();
  renderSuggestions();
}
render();
