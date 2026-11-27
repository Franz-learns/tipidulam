// Name matching: links free-text item names ("Eggs", "kangkong bundle",
// "giniling") to catalog ingredient keys. Pure functions, no DOM.

export const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();

// "eggs" → egg, "tomatoes" → tomato; "eggplant" stays eggplant.
function variants(word) {
  const v = new Set([word]);
  if (word.length > 3 && word.endsWith('es')) v.add(word.slice(0, -2));
  if (word.length > 3 && word.endsWith('s')) v.add(word.slice(0, -1));
  return v;
}

/** True if `term` appears in `name` as whole word(s). */
export function termMatches(name, term) {
  const words = norm(name).split(' ');
  const expanded = words.map((w) => [...variants(w)]);
  const t = norm(term).split(' ');
  if (!t[0]) return false;
  for (let start = 0; start + t.length <= words.length; start++) {
    if (t.every((tw, k) => expanded[start + k].includes(tw))) return true;
  }
  return false;
}

/**
 * Best catalog key for a name, or null.
 * Longer (more specific) terms win: "ground pork" → ground_pork, not pork.
 */
export function matchKey(name, catalog) {
  let best = null;
  let bestScore = 0;
  for (const [key, ing] of Object.entries(catalog)) {
    for (const term of ing.terms) {
      if (termMatches(name, term)) {
        const score = norm(term).split(' ').length * 100 + term.length;
        if (score > bestScore) { bestScore = score; best = key; }
      }
    }
  }
  return best;
}
