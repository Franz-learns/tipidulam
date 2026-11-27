import { renderLayout } from '../ui/layout.js';
import { el, $, money, toast, btn } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { getSettings, saveSettings, getCatalog, setPrice } from '../core/services/settingsService.js';
import { syncFromPlan } from '../core/services/groceryService.js';
import { exportAll, importAll, clearAll } from '../core/services/storage.js';

renderLayout('settings');

function fillHousehold() {
  const s = getSettings();
  $('sBudget').value = s.weeklyBudget;
  $('sHousehold').value = s.householdSize;
  $('sRice').value = s.riceKgPerPersonMeal;
  $('sIncludeRice').checked = s.includeRice;
}

$('householdForm').addEventListener('submit', (e) => {
  e.preventDefault();
  saveSettings({
    weeklyBudget: Number($('sBudget').value),
    householdSize: Number($('sHousehold').value),
    riceKgPerPersonMeal: Number($('sRice').value),
    includeRice: $('sIncludeRice').checked
  });
  syncFromPlan();
  fillHousehold();
  toast('Saved. Generate a new plan to apply the new household size to meals.');
});

function renderStaples() {
  const s = getSettings();
  const catalog = getCatalog(s);
  const keys = Object.keys(catalog).filter((k) => catalog[k].category === 'condiment' || s.staples.includes(k));
  $('staplesBox').replaceChildren(...keys.map((k) => el('label', { className: 'chip-check' }, [
    el('input', {
      type: 'checkbox', checked: s.staples.includes(k),
      onchange: (e) => {
        const cur = new Set(getSettings().staples);
        e.target.checked ? cur.add(k) : cur.delete(k);
        saveSettings({ staples: [...cur] });
        syncFromPlan();
      }
    }),
    el('span', { className: 'text-capitalize', textContent: catalog[k].name })
  ])));
}

function renderPrices() {
  const q = $('priceSearch').value.trim().toLowerCase();
  const catalog = getCatalog();
  const rows = Object.values(catalog)
    .filter((i) => !q || i.terms.some((t) => t.includes(q)))
    .sort((a, b) => a.name.localeCompare(b.name));
  $('priceBody').replaceChildren(...rows.map((i) => {
    const input = el('input', {
      className: 'form-control form-control-sm price-input', type: 'number', min: 0, step: 0.5, value: i.price,
      inputMode: 'decimal', 'aria-label': `Price of ${i.name} per ${i.unit}`,
      onchange: () => { setPrice(i.key, input.value); syncFromPlan(); renderPrices(); }
    });
    const changed = i.price !== i.defaultPrice;
    return el('tr', {}, [
      el('td', { className: 'fw-bold text-capitalize' }, [i.name, changed ? el('span', { className: 'tag tag-success ms-2', textContent: 'Custom' }) : null]),
      el('td', { className: 'text-secondary', textContent: i.unit }),
      el('td', {}, input),
      el('td', { className: 'text-end' }, changed ? btn(`Reset to ${money(i.defaultPrice)}`, {
        className: 'btn btn-ghost btn-sm', iconEl: icon('rotate-ccw', { size: 14 }),
        onclick: () => { setPrice(i.key, null); syncFromPlan(); renderPrices(); }
      }) : '')
    ]);
  }));
}
$('priceSearch').addEventListener('input', renderPrices);

$('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(exportAll(), null, 2)], { type: 'application/json' });
  const a = el('a', { href: URL.createObjectURL(blob), download: `tipidulam-backup-${new Date().toISOString().slice(0, 10)}.json` });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

$('importInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    importAll(JSON.parse(await file.text()));
    toast('Backup restored.');
    renderAll();
  } catch (err) {
    toast(err instanceof SyntaxError ? 'That file is not valid JSON.' : err.message, 'danger');
  } finally {
    e.target.value = '';
  }
});

$('resetBtn').addEventListener('click', () => {
  if (!confirm('Delete your plan, pantry, grocery list and settings from this browser? This cannot be undone.')) return;
  clearAll();
  toast('All data cleared.');
  renderAll();
});

function renderAll() {
  fillHousehold();
  renderStaples();
  renderPrices();
}
renderAll();
