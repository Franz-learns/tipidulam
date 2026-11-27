// Inventory + grocery list stored in localStorage.
// When TipidUlam gets a real backend, replace load()/save() with API calls —
// the rest of the app only uses the exported functions.

const INV_KEY = 'tipidulam.inventory';
const GROCERY_KEY = 'tipidulam.groceryList';

function load(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full/blocked */ }
}
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));
const norm = (s) => String(s).trim().toLowerCase();

export function getInventory() {
  return load(INV_KEY);
}

// Merge confirmed scan items: same name + unit adds to the quantity.
export function addItems(items) {
  const inv = getInventory();
  const today = new Date().toISOString().slice(0, 10);
  for (const item of items) {
    const name = norm(item.name);
    if (!name) continue;
    const existing = inv.find((i) => i.name === name && i.unit === item.unit);
    if (existing) {
      existing.qty += Number(item.qty) || 1;
      if (item.expiry && (!existing.expiry || item.expiry < existing.expiry)) existing.expiry = item.expiry;
    } else {
      inv.push({
        id: newId(), name, qty: Number(item.qty) || 1, unit: item.unit || 'pc',
        category: item.category || 'other', expiry: item.expiry || '', addedOn: today
      });
    }
  }
  save(INV_KEY, inv);
  return inv;
}

// Use up some of an item (e.g. after cooking). Removes it at 0.
export function consumeItem(id, amount = 1) {
  const inv = getInventory()
    .map((i) => (i.id === id ? { ...i, qty: i.qty - amount } : i))
    .filter((i) => i.qty > 0);
  save(INV_KEY, inv);
  return inv;
}

export function removeItem(id) {
  const inv = getInventory().filter((i) => i.id !== id);
  save(INV_KEY, inv);
  return inv;
}

// Days until expiry (negative = already expired, null = no date set).
export function daysLeft(item, now = new Date()) {
  if (!item.expiry) return null;
  const end = new Date(item.expiry + 'T23:59:59');
  return Math.floor((end - now) / 86_400_000);
}

export function expiringSoon(days = 3) {
  return getInventory().filter((i) => {
    const d = daysLeft(i);
    return d !== null && d <= days;
  });
}

export function getGroceryList() {
  return load(GROCERY_KEY);
}

export function addToGroceryList(names) {
  const list = getGroceryList();
  for (const n of names.map(norm)) {
    if (n && !list.some((g) => g.name === n)) list.push({ id: newId(), name: n, done: false });
  }
  save(GROCERY_KEY, list);
  return list;
}
