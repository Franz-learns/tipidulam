// Controller for scan.html: scan → confirm → inventory → recipe suggestions.
// All AI output is inserted with textContent / input.value (never innerHTML),
// so a weird item name can't inject HTML into the page.

import { scanImage, compressImage } from './scan.js';
import { getInventory, addItems, consumeItem, removeItem, daysLeft, expiringSoon, addToGroceryList } from './inventory.js';
import { suggestRecipes } from './recipes.js';

const UNITS = ['pc', 'pack', 'bottle', 'can', 'kg', 'g', 'bundle', 'tray', 'container'];
const CATEGORIES = ['meat', 'seafood', 'vegetable', 'fruit', 'dairy', 'egg', 'condiment', 'drink', 'grain', 'frozen', 'other'];

const $ = (id) => document.getElementById(id);
let selectedFile = null;

function el(tag, props = {}, children = []) {
  const node = Object.assign(document.createElement(tag), props);
  for (const c of [].concat(children)) node.append(c);
  return node;
}

function select(options, value) {
  const s = el('select', { className: 'form-select form-select-sm' });
  for (const o of options) s.append(el('option', { value: o, textContent: o, selected: o === value }));
  return s;
}

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
    const { dataUrl } = await compressImage(selectedFile, 800, 0.7);
    $('preview').src = dataUrl;
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
    const items = await scanImage(selectedFile);
    if (items.length === 0) showError('No food items detected. Try a clearer, brighter photo, or add items manually below.');
    renderConfirm(items);
  } catch (err) {
    showError(err.message);
  } finally {
    $('scanBtn').disabled = false;
    $('scanSpinner').classList.add('d-none');
  }
});

// ---------- 2. Confirm ----------
function confirmRow(item = { name: '', qty: 1, unit: 'pc', category: 'other', confidence: 'high' }) {
  const tr = el('tr', { className: item.confidence === 'low' ? 'conf-low' : '' });
  const name = el('input', { className: 'form-control form-control-sm', value: item.name, placeholder: 'e.g. kangkong' });
  const qty = el('input', { className: 'form-control form-control-sm', type: 'number', min: 1, value: item.qty });
  const expiry = el('input', { className: 'form-control form-control-sm', type: 'date' });
  const del = el('button', { className: 'btn btn-sm btn-outline-danger', textContent: '✕', title: 'Remove', onclick: () => tr.remove() });
  tr.append(el('td', {}, name), el('td', {}, qty), el('td', {}, select(UNITS, item.unit)),
    el('td', {}, select(CATEGORIES, item.category)), el('td', {}, expiry), el('td', {}, del));
  return tr;
}

function renderConfirm(items) {
  const body = $('confirmBody');
  body.replaceChildren(...items.map(confirmRow));
  if (items.length === 0) body.append(confirmRow());
  $('confirmSection').classList.remove('d-none');
  $('confirmSection').scrollIntoView({ behavior: 'smooth' });
}

$('addRowBtn').addEventListener('click', () => $('confirmBody').append(confirmRow()));
$('cancelBtn').addEventListener('click', () => $('confirmSection').classList.add('d-none'));

$('saveBtn').addEventListener('click', () => {
  const rows = [...$('confirmBody').querySelectorAll('tr')];
  const items = rows.map((tr) => {
    const [name, qty, expiry] = tr.querySelectorAll('input');
    const [unit, category] = tr.querySelectorAll('select');
    return { name: name.value, qty: parseInt(qty.value, 10) || 1, unit: unit.value, category: category.value, expiry: expiry.value };
  }).filter((i) => i.name.trim() && i.name.trim().toLowerCase() !== 'unknown container');
  addItems(items);
  $('confirmSection').classList.add('d-none');
  $('photoInput').value = '';
  $('preview').classList.add('d-none');
  $('scanBtn').disabled = true;
  selectedFile = null;
  refresh();
});

// ---------- 3. Inventory ----------
function expiryBadge(item) {
  const d = daysLeft(item);
  if (d === null) return el('span', { className: 'badge text-bg-light border', textContent: 'no expiry' });
  if (d < 0) return el('span', { className: 'badge text-bg-danger', textContent: 'expired' });
  if (d <= 3) return el('span', { className: 'badge text-bg-warning', textContent: d === 0 ? 'expires today' : `${d}d left` });
  return el('span', { className: 'badge text-bg-success', textContent: `${d}d left` });
}

function renderInventory(inv) {
  $('invCount').textContent = `${inv.length} item${inv.length === 1 ? '' : 's'}`;
  $('inventoryEmpty').classList.toggle('d-none', inv.length > 0);
  const sorted = [...inv].sort((a, b) => (daysLeft(a) ?? 9999) - (daysLeft(b) ?? 9999));
  $('inventoryList').replaceChildren(...sorted.map((item) => el('li',
    { className: 'list-group-item d-flex align-items-center gap-2 flex-wrap' }, [
      el('span', { className: 'fw-semibold text-capitalize me-auto', textContent: item.name }),
      el('span', { className: 'text-secondary small', textContent: `${item.qty} ${item.unit}` }),
      expiryBadge(item),
      el('button', { className: 'btn btn-sm btn-outline-secondary', textContent: 'Use 1', onclick: () => { consumeItem(item.id); refresh(); } }),
      el('button', { className: 'btn btn-sm btn-outline-danger', textContent: 'Remove', onclick: () => { removeItem(item.id); refresh(); } })
    ])));
}

// ---------- 4. Recipes ----------
function renderRecipes(inv) {
  const expiringIds = expiringSoon(3).map((i) => i.id);
  const recipes = suggestRecipes(inv, { expiringIds });
  $('recipeEmpty').classList.toggle('d-none', recipes.length > 0);
  $('recipeList').replaceChildren(...recipes.map((r) => {
    const pct = Math.round(r.score * 100);
    const body = el('div', { className: 'card-body' }, [
      el('h3', { className: 'h6 mb-1', textContent: r.name }),
      el('div', { className: 'progress mb-2', style: 'height:6px' },
        el('div', { className: `progress-bar ${pct === 100 ? 'bg-success' : 'bg-info'}`, style: `width:${pct}%` })),
      el('p', { className: 'small mb-1', textContent: `${pct}% ready · You have: ${r.have.join(', ')}` })
    ]);
    if (r.usesExpiring.length) {
      body.append(el('p', { className: 'small text-warning-emphasis mb-1', textContent: `Uses soon-to-expire: ${r.usesExpiring.join(', ')}` }));
    }
    if (r.missing.length) {
      body.append(
        el('p', { className: 'small text-danger mb-2', textContent: `Missing: ${r.missing.join(', ')}` }),
        el('button', {
          className: 'btn btn-sm btn-outline-primary', textContent: 'Add missing to grocery list',
          onclick: () => {
            addToGroceryList(r.missing);
            $('groceryToast').textContent = `Added ${r.missing.join(', ')} to your grocery list.`;
            $('groceryToast').classList.remove('d-none');
          }
        })
      );
    } else {
      body.append(el('p', { className: 'small text-success mb-0', textContent: 'You have everything. Luto na!' }));
    }
    return el('div', { className: 'col-sm-6' }, el('div', { className: 'card h-100' }, body));
  }));
}

function refresh() {
  const inv = getInventory();
  renderInventory(inv);
  renderRecipes(inv);
}

refresh();
