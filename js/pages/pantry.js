import { renderLayout, emptyBlock } from '../ui/layout.js';
import { el, $, select, fmtQty, money, link, toast, btn } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { recipeImage, CATEGORY_ICON } from '../ui/recipeVisual.js';
import { compressImage } from '../ui/image.js';
import { scanImage, scanErrorText } from '../core/services/scanService.js';
import { getSettings, getCatalog } from '../core/services/settingsService.js';
import { getPantry, addPantryItems, consumePantryItem, removePantryItem, daysLeft, expiringSoon } from '../core/services/pantryService.js';
import { syncFromPlan } from '../core/services/groceryService.js';
import { suggestFromPantry } from '../core/engine/suggest.js';
import { recipeCost } from '../core/engine/costing.js';
import { RECIPES } from '../core/data/recipes.js';
import { UNITS, CATEGORIES } from '../core/data/ingredients.js';

renderLayout('pantry');

let selectedFile = null;

function showError(msg, { offerManual = false } = {}) {
  const box = $('scanError');
  box.replaceChildren();
  box.classList.toggle('d-none', !msg);
  if (!msg) return;
  box.append(el('div', { className: 'd-flex gap-2 align-items-start' }, [icon('circle-alert', { size: 18 }), el('span', { textContent: msg })]));
  if (offerManual) {
    box.append(btn('Add items manually', {
      className: 'btn btn-sm btn-light mt-2', iconEl: icon('plus', { size: 15 }),
      onclick: () => { showError(''); renderConfirm([]); }
    }));
  }
}

// ---------- 1. Photo + scan ----------
async function pickFile(file) {
  selectedFile = file || null;
  showError('');
  $('scanBtn').disabled = !selectedFile;
  if (!selectedFile) return $('preview').classList.add('d-none');
  try {
    $('preview').src = (await compressImage(selectedFile, 800, 0.7)).dataUrl;
    $('preview').classList.remove('d-none');
  } catch (err) {
    showError(err.message);
  }
}

$('photoInput').addEventListener('change', (e) => pickFile(e.target.files[0]));

const dz = $('dropzone');
dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('dragover'); });
dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
dz.addEventListener('drop', (e) => {
  e.preventDefault();
  dz.classList.remove('dragover');
  const f = e.dataTransfer.files[0];
  if (f && f.type.startsWith('image/')) pickFile(f);
});
dz.tabIndex = 0;
dz.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('photoInput').click(); } });

$('scanBtn').addEventListener('click', async () => {
  if (!selectedFile) return;
  showError('');
  $('scanBtn').disabled = true;
  $('scanSpinner').classList.remove('d-none');
  $('scanLabel').textContent = 'Scanning…';
  try {
    const items = await scanImage(await compressImage(selectedFile));
    if (items.length === 0) {
      showError("We didn't spot any food in that photo. Try a brighter, closer photo, or add your items manually.", { offerManual: true });
    } else {
      renderConfirm(items);
    }
  } catch (err) {
    showError(scanErrorText(err), { offerManual: true });
  } finally {
    $('scanBtn').disabled = false;
    $('scanSpinner').classList.add('d-none');
    $('scanLabel').textContent = 'Scan photo';
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
    el('td', {}, btn('', { className: 'btn btn-danger-ghost btn-sm btn-icon', iconEl: icon('x', { size: 16 }), ariaLabel: 'Remove row', onclick: () => tr.remove() }))
  );
  for (const s of tr.querySelectorAll('select')) s.setAttribute('aria-label', s === tr.querySelectorAll('select')[0] ? 'Unit' : 'Category');
  return tr;
}

function renderConfirm(items) {
  $('confirmBody').replaceChildren(...(items.length ? items.map(confirmRow) : [confirmRow()]));
  $('confirmSection').classList.remove('d-none');
  $('confirmSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
  $('confirmBody').querySelector('input')?.focus({ preventScroll: true });
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
function expiryTag(p) {
  const d = daysLeft(p);
  if (d === null) return el('span', { className: 'tag', textContent: 'No expiry' });
  if (d < 0) return el('span', { className: 'tag tag-danger', textContent: 'Expired' });
  if (d <= 3) return el('span', { className: 'tag tag-warning', textContent: d === 0 ? 'Today' : `${d}d left` });
  return el('span', { className: 'tag tag-success', textContent: `${d}d left` });
}

function renderInventory() {
  const pantry = getPantry();
  $('invCount').textContent = `${pantry.length} item${pantry.length === 1 ? '' : 's'}`;
  const sorted = [...pantry].sort((a, b) => (daysLeft(a) ?? 9999) - (daysLeft(b) ?? 9999) || a.name.localeCompare(b.name));
  if (!sorted.length) {
    $('inventoryList').replaceChildren(el('li', { className: 'border-0 p-0' },
      emptyBlock('refrigerator', 'Your pantry is empty', 'Scan your ref or add items manually.')));
    return;
  }
  $('inventoryList').replaceChildren(...sorted.map((p) => el('li', { className: 'flex-wrap' }, [
    el('span', { className: 'chip-icon sm slate' }, icon(CATEGORY_ICON[p.category] || 'shopping-cart', { size: 16 })),
    el('div', { className: 'row-main' }, [
      el('div', { className: 'row-title text-capitalize', textContent: p.name }),
      el('div', { className: 'row-meta', textContent: `${fmtQty(p.qty)} ${p.unit}` })
    ]),
    expiryTag(p),
    el('div', { className: 'd-flex gap-2' }, [
      btn('Use 1', { className: 'btn btn-ghost btn-sm', iconEl: icon('minus', { size: 14 }), ariaLabel: `Use 1 ${p.unit} of ${p.name}`, onclick: () => { consumePantryItem(p.id, 1); syncFromPlan(); render(); } }),
      btn('', { className: 'btn btn-danger-ghost btn-sm btn-icon', iconEl: icon('trash-2', { size: 16 }), ariaLabel: `Remove ${p.name}`, onclick: () => { removePantryItem(p.id); syncFromPlan(); render(); } })
    ])
  ])));
}

// ---------- 4. Suggestions ----------
function renderSuggestions() {
  const s = getSettings();
  const catalog = getCatalog(s);
  const expiringKeys = expiringSoon(3).map((p) => p.key).filter(Boolean);
  const list = suggestFromPantry(RECIPES, getPantry(), s.staples, { expiringKeys }).slice(0, 5);
  if (!list.length) {
    $('suggestList').replaceChildren(emptyBlock('sparkles', 'No suggestions yet', 'Add items to see what you can cook.'));
    return;
  }
  $('suggestList').replaceChildren(...list.map((sug) => {
    const pct = Math.round(sug.score * 100);
    const missingNames = sug.missing.map((k) => catalog[k].name);
    return el('a', { className: 'suggest-link d-flex gap-3', href: link(`recipes.html?r=${sug.recipe.id}`) }, [
      recipeImage(sug.recipe, catalog, { iconSize: 18 }),
      el('div', { className: 'row-main' }, [
        el('div', { className: 'd-flex justify-content-between gap-2' }, [
          el('span', { className: 'row-title', textContent: sug.recipe.name }),
          el('span', { className: 'price small', textContent: money(recipeCost(sug.recipe, catalog, s).total) })
        ]),
        el('div', { className: `mini-bar${pct === 100 ? ' full' : ''}` }, el('span', { style: `width:${pct}%` })),
        sug.usesExpiring.length ? el('div', { className: 'row-meta', style: 'color:var(--accent-text)' }, [icon('clock', { size: 13 }), ` Uses ${sug.usesExpiring.map((k) => catalog[k].name).join(', ')} before it spoils`]) : null,
        el('div', { className: 'row-meta', textContent: missingNames.length ? `Missing: ${missingNames.join(', ')}` : 'You have everything. Luto na!' })
      ])
    ]);
  }));
}

function render() {
  renderInventory();
  renderSuggestions();
}
render();
