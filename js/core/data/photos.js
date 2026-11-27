// Recipe photos.
//
// EASIEST WAY: put a photo in  images/recipes/<recipe-id>.jpg
// e.g. images/recipes/sinigang-na-baboy.jpg — it shows up automatically.
// (Recipe ids are listed in images/recipes/README.md.)
// Recipes without a photo keep their icon, so nothing looks broken.
//
// OPTIONAL: add an entry below to use a different file name/format,
// a full URL, or to show a photo credit (required for Creative Commons photos).

export const PHOTO_DIR = 'images/recipes/';
export const PHOTO_EXT = '.jpg';

// true  = look for images/recipes/<id>.jpg for every recipe (easiest).
//         Missing photos show a 404 once per browser session in DevTools — harmless.
// false = only load photos listed in PHOTOS below (no 404s at all).
//         Add an empty entry for each photo you have, e.g. 'pinakbet': {},
export const AUTO_DETECT = true;

export const PHOTOS = {
  // 'sinigang-na-baboy': { credit: 'Photo by Juan dela Cruz' },
  // 'adobong-manok':     { src: 'images/recipes/adobo.webp', credit: 'Photo by Maria Santos' },
  // 'pinakbet':          { src: 'https://upload.wikimedia.org/…/Pinakbet.jpg', credit: 'Author Name, CC BY-SA 4.0, via Wikimedia Commons' },
};

/** { src, credit } for a recipe. */
export function photoFor(recipe) {
  const o = PHOTOS[recipe.id];
  if (!o && !AUTO_DETECT) return { src: null, credit: '' };
  return { src: o?.src || `${PHOTO_DIR}${recipe.id}${PHOTO_EXT}`, credit: o?.credit || '' };
}
