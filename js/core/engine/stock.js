// Turns pantry items into "available stock" per catalog key.
// If a pantry item's unit matches the catalog unit (e.g. both kg), its
// quantity is used. If units differ (e.g. "2 pc" of talong vs a price per kg),
// we can't convert, so we assume it covers ONE recipe's need.

export function buildStock(pantryItems, catalog) {
  const stock = new Map();
  for (const it of pantryItems) {
    if (!it.key || !catalog[it.key] || !(Number(it.qty) > 0)) continue;
    const e = stock.get(it.key) || { qty: 0, anyUse: false };
    if (it.unit === catalog[it.key].unit) e.qty += Number(it.qty);
    else e.anyUse = true;
    stock.set(it.key, e);
  }
  return stock;
}

/** How much of `need` the stock can cover, without changing it. */
export function peekStock(stock, key, need) {
  const e = stock.get(key);
  if (!e) return 0;
  return e.anyUse ? need : Math.min(e.qty, need);
}

/** Take up to `need` from stock. Returns the amount covered. Mutates stock. */
export function takeFromStock(stock, key, need) {
  const e = stock.get(key);
  if (!e) return 0;
  let covered = Math.min(e.qty, need);
  e.qty -= covered;
  if (covered < need && e.anyUse) { covered = need; e.anyUse = false; }
  return covered;
}
