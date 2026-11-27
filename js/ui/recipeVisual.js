// Recipe visuals: dish photo when available, otherwise an icon + color tone.
import { el } from './dom.js';
import { icon } from './icons.js';
import { photoFor } from '../core/data/photos.js';

const BY_ID = {
  'sinigang-na-baboy': ['soup', 'red'],
  'tinolang-manok': ['soup', 'amber'],
  'ginisang-monggo': ['soup', 'green'],
  'sardinas-misua': ['soup', 'indigo'],
  'pancit-bihon': ['wheat', 'amber'],
  'tokwat-baboy': ['flame', 'red'],
  'corned-beef-guisado': ['flame', 'red'],
  'nilagang-baboy': ['soup', 'amber'],
  'sinigang-na-isda': ['soup', 'indigo'],
  'sinigang-na-hipon': ['soup', 'red'],
  'arroz-caldo': ['soup', 'amber'],
  'champorado': ['soup', 'slate'],
  'chicken-sopas': ['soup', 'amber'],
  'sotanghon-soup': ['soup', 'green'],
  'misua-patola': ['soup', 'green'],
  'pancit-canton': ['wheat', 'amber'],
  'lumpiang-shanghai': ['flame', 'amber'],
  'lumpiang-gulay': ['leaf', 'amber'],
  'lechon-kawali': ['flame', 'red'],
  'chicken-curry': ['flame', 'amber'],
  'tortang-tuna': ['egg', 'indigo'],
  'tortang-giniling': ['egg', 'red']
};

export const GROUPS = [
  ['chicken', 'Manok', 'drumstick'],
  ['pork', 'Baboy', 'flame'],
  ['beef', 'Baka', 'flame'],
  ['seafood', 'Isda', 'fish'],
  ['vegetable', 'Gulay', 'leaf'],
  ['egg', 'Itlog', 'egg'],
  ['noodles', 'Pansit & Lugaw', 'soup']
];

const BY_CATEGORY = {
  meat: ['drumstick', 'red'],
  seafood: ['fish', 'indigo'],
  canned: ['flame', 'slate'],
  egg: ['egg', 'amber'],
  vegetable: ['leaf', 'green'],
  grain: ['wheat', 'amber']
};

export function recipeVisual(recipe, catalog) {
  if (BY_ID[recipe.id]) return { icon: BY_ID[recipe.id][0], tone: BY_ID[recipe.id][1] };
  const first = catalog[recipe.ingredients[0]?.key];
  const [ic, tone] = BY_CATEGORY[first?.category] || ['chef-hat', 'slate'];
  return { icon: ic, tone };
}

export const MEAL_ICON = {
  breakfast: ['sunrise', 'amber'],
  lunch: ['sun', ''],
  dinner: ['moon', 'indigo']
};

export const CATEGORY_ICON = {
  meat: 'drumstick', seafood: 'fish', egg: 'egg', vegetable: 'leaf', fruit: 'leaf',
  grain: 'wheat', canned: 'package-check', condiment: 'flame', dairy: 'refrigerator',
  frozen: 'refrigerator', drink: 'refrigerator', other: 'shopping-cart'
};


/**
 * Recipe picture: shows the dish photo if it exists, otherwise the icon.
 * The icon sits underneath and is hidden once the photo loads, so a missing
 * photo never shows as a broken image.
 * variant: 'card' (recipe cards), 'banner' (recipe modal), 'thumb' (small square)
 */
export function recipeImage(recipe, catalog, { variant = 'thumb', iconSize = 18, decorative = true } = {}) {
  const v = recipeVisual(recipe, catalog);
  const box = el('div', { className: `rimg rimg-${variant} thumb-${v.tone}` }, icon(v.icon, { size: iconSize }));
  const { src } = photoFor(recipe);
  if (!src || missing.has(src)) {
    if (variant === 'banner') box.dataset.noPhoto = '1';
    return box;
  }
  const img = el('img', { src, alt: decorative ? '' : `Photo of ${recipe.name}`, loading: 'lazy', decoding: 'async' });
  img.addEventListener('load', () => box.classList.add('has-photo'));
  img.addEventListener('error', () => { img.remove(); rememberMissing(src); box.dispatchEvent(new Event('nophoto')); });
  box.append(img);
  return box;
}

// Remember photos that don't exist so each one is only requested once per session.
const MISSING_KEY = 'tipidulam.missingPhotos';
const missing = new Set((() => { try { return JSON.parse(sessionStorage.getItem(MISSING_KEY)) || []; } catch { return []; } })());
function rememberMissing(src) {
  missing.add(src);
  try { sessionStorage.setItem(MISSING_KEY, JSON.stringify([...missing])); } catch { /* ignore */ }
}

export { photoFor };
