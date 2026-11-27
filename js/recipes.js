// Filipino recipe database + matching against inventory.
// Each ingredient lists the words it can appear as (English + Filipino),
// so "itlog", "egg" and "eggs" all count as eggs.

// Assumed to be in every kitchen; never marked "missing".
export const DEFAULT_STAPLES = ['salt', 'asin', 'pepper', 'paminta', 'oil', 'mantika',
  'soy sauce', 'toyo', 'vinegar', 'suka', 'sugar', 'asukal', 'water', 'tubig'];

const I = (label, ...terms) => ({ label, terms: [label, ...terms] });

export const RECIPES = [
  { name: 'Tortang Talong', ingredients: [I('eggplant', 'talong'), I('egg', 'itlog'), I('garlic', 'bawang'), I('oil', 'mantika')] },
  { name: 'Adobong Manok', ingredients: [I('chicken', 'manok'), I('soy sauce', 'toyo'), I('vinegar', 'suka'), I('garlic', 'bawang'), I('bay leaf', 'laurel', 'dahon ng laurel'), I('pepper', 'paminta')] },
  { name: 'Tinolang Manok', ingredients: [I('chicken', 'manok'), I('ginger', 'luya'), I('sayote', 'chayote', 'green papaya', 'papaya'), I('malunggay', 'dahon ng sili', 'chili leaves'), I('onion', 'sibuyas'), I('garlic', 'bawang')] },
  { name: 'Sinigang na Baboy', ingredients: [I('pork', 'baboy', 'liempo'), I('sinigang mix', 'sampalok', 'tamarind'), I('kangkong', 'water spinach'), I('radish', 'labanos'), I('tomato', 'kamatis'), I('onion', 'sibuyas'), I('string beans', 'sitaw')] },
  { name: 'Adobong Kangkong', ingredients: [I('kangkong', 'water spinach'), I('garlic', 'bawang'), I('soy sauce', 'toyo'), I('vinegar', 'suka')] },
  { name: 'Ginisang Monggo', ingredients: [I('mung beans', 'monggo', 'munggo'), I('garlic', 'bawang'), I('onion', 'sibuyas'), I('tomato', 'kamatis'), I('malunggay', 'spinach', 'ampalaya leaves')] },
  { name: 'Pinakbet', ingredients: [I('squash', 'kalabasa'), I('string beans', 'sitaw'), I('eggplant', 'talong'), I('bitter gourd', 'ampalaya'), I('okra'), I('shrimp paste', 'bagoong'), I('tomato', 'kamatis')] },
  { name: 'Hotsilog', ingredients: [I('hotdog'), I('egg', 'itlog'), I('rice', 'kanin', 'bigas'), I('garlic', 'bawang')] },
  { name: 'Ginisang Sardinas with Misua', ingredients: [I('sardines', 'sardinas'), I('misua', 'miswa'), I('onion', 'sibuyas'), I('garlic', 'bawang')] },
  { name: 'Corned Beef Guisado', ingredients: [I('corned beef'), I('potato', 'patatas'), I('onion', 'sibuyas'), I('garlic', 'bawang')] },
  { name: 'Scrambled Egg with Tomato', ingredients: [I('egg', 'itlog'), I('tomato', 'kamatis'), I('onion', 'sibuyas')] }
];

const norm = (s) => String(s).toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();

// Word variants so "eggs"/"tomatoes" match "egg"/"tomato",
// but "eggplant" does NOT match "egg".
function variants(word) {
  const v = new Set([word]);
  if (word.length > 3 && word.endsWith('es')) v.add(word.slice(0, -2));
  if (word.length > 3 && word.endsWith('s')) v.add(word.slice(0, -1));
  return v;
}

// True if `term` appears in `itemName` as whole word(s).
export function termMatches(itemName, term) {
  const words = norm(itemName).split(' ');
  const expanded = words.map((w) => [...variants(w)]);
  const t = norm(term).split(' ');
  for (let start = 0; start + t.length <= words.length; start++) {
    if (t.every((tw, k) => expanded[start + k].includes(tw))) return true;
  }
  return false;
}

function findInInventory(ingredient, inventory) {
  return inventory.find((item) => ingredient.terms.some((t) => termMatches(item.name, t)));
}

/**
 * Rank recipes by how many ingredients you already have.
 * Recipes that use soon-to-expire items get a small boost.
 * Returns [{ name, score, have:[], missing:[], staples:[], usesExpiring:[] }]
 */
export function suggestRecipes(inventory, { staples = DEFAULT_STAPLES, expiringIds = [], minScore = 0.5 } = {}) {
  return RECIPES.map((recipe) => {
    const have = [], missing = [], usedStaples = [], usesExpiring = [];
    for (const ing of recipe.ingredients) {
      const found = findInInventory(ing, inventory);
      if (found) {
        have.push(ing.label);
        if (expiringIds.includes(found.id)) usesExpiring.push(found.name);
      } else if (ing.terms.some((t) => staples.some((s) => termMatches(s, t)))) {
        usedStaples.push(ing.label);
      } else {
        missing.push(ing.label);
      }
    }
    const total = recipe.ingredients.length;
    const score = (have.length + usedStaples.length) / total;
    return { name: recipe.name, score, have, missing, staples: usedStaples, usesExpiring };
  })
    .filter((r) => r.have.length > 0 && r.score >= minScore)
    .sort((a, b) => (b.usesExpiring.length - a.usesExpiring.length) || (b.score - a.score) || (a.missing.length - b.missing.length));
}
