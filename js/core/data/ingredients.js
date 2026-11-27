// Ingredient catalog.
// PRICES ARE SAMPLE ESTIMATES (PHP) FOR TESTING ONLY. Update them in
// Settings → Prices to match your palengke or supermarket.
//
// unit  = the unit the price is for (and the unit recipes use)
// step  = smallest amount you'd buy (grocery list rounds up to this)
// terms = names it can appear as (English + Filipino), used for matching
//         scanned/typed item names to this ingredient

export const INGREDIENTS = {
  // Grains & noodles
  rice:          { name: 'rice',            terms: ['rice', 'bigas', 'kanin'],                 category: 'grain',     unit: 'kg',     price: 52,  step: 1 },
  bihon:         { name: 'bihon',           terms: ['bihon', 'rice noodles', 'pancit bihon'],  category: 'grain',     unit: 'pack',   price: 40,  step: 1 },
  misua:         { name: 'misua',           terms: ['misua', 'miswa'],                         category: 'grain',     unit: 'pack',   price: 20,  step: 1 },
  mung_beans:    { name: 'monggo',          terms: ['monggo', 'munggo', 'mung beans', 'mung bean'], category: 'grain', unit: 'kg',    price: 120, step: 0.25 },

  // Meat, fish, eggs
  chicken:       { name: 'chicken',         terms: ['chicken', 'manok'],                       category: 'meat',      unit: 'kg',     price: 220, step: 0.25 },
  pork:          { name: 'pork',            terms: ['pork', 'baboy', 'liempo', 'kasim'],       category: 'meat',      unit: 'kg',     price: 330, step: 0.25 },
  ground_pork:   { name: 'ground pork',     terms: ['ground pork', 'giniling', 'giniling na baboy'], category: 'meat', unit: 'kg',    price: 300, step: 0.25 },
  hotdog:        { name: 'hotdog',          terms: ['hotdog', 'hot dog', 'sausage'],           category: 'meat',      unit: 'pack',   price: 95,  step: 1 },
  longganisa:    { name: 'longganisa',      terms: ['longganisa', 'longanisa'],                category: 'meat',      unit: 'pack',   price: 120, step: 1 },
  corned_beef:   { name: 'corned beef',     terms: ['corned beef'],                            category: 'canned',    unit: 'can',    price: 45,  step: 1 },
  sardines:      { name: 'sardinas',        terms: ['sardinas', 'sardines', 'sardine'],        category: 'canned',    unit: 'can',    price: 26,  step: 1 },
  galunggong:    { name: 'galunggong',      terms: ['galunggong', 'round scad'],               category: 'seafood',   unit: 'kg',     price: 240, step: 0.25 },
  bangus:        { name: 'bangus',          terms: ['bangus', 'milkfish'],                     category: 'seafood',   unit: 'kg',     price: 220, step: 0.25 },
  tuyo:          { name: 'tuyo',            terms: ['tuyo', 'dried fish', 'daing'],            category: 'seafood',   unit: 'pack',   price: 60,  step: 1 },
  egg:           { name: 'eggs',            terms: ['egg', 'itlog'],                           category: 'egg',       unit: 'pc',     price: 9,   step: 1 },
  tokwa:         { name: 'tokwa',           terms: ['tokwa', 'tofu', 'tokua'],                 category: 'other',     unit: 'pc',     price: 15,  step: 1 },

  // Vegetables
  eggplant:      { name: 'talong',          terms: ['talong', 'eggplant'],                     category: 'vegetable', unit: 'kg',     price: 100, step: 0.25 },
  kangkong:      { name: 'kangkong',        terms: ['kangkong', 'water spinach'],              category: 'vegetable', unit: 'bundle', price: 20,  step: 1 },
  string_beans:  { name: 'sitaw',           terms: ['sitaw', 'string beans', 'string bean', 'long beans'], category: 'vegetable', unit: 'bundle', price: 25, step: 1 },
  tomato:        { name: 'kamatis',         terms: ['kamatis', 'tomato'],                      category: 'vegetable', unit: 'kg',     price: 80,  step: 0.25 },
  onion:         { name: 'sibuyas',         terms: ['sibuyas', 'onion'],                       category: 'vegetable', unit: 'kg',     price: 160, step: 0.25 },
  garlic:        { name: 'bawang',          terms: ['bawang', 'garlic'],                       category: 'vegetable', unit: 'kg',     price: 160, step: 0.25 },
  ginger:        { name: 'luya',            terms: ['luya', 'ginger'],                         category: 'vegetable', unit: 'kg',     price: 150, step: 0.25 },
  sayote:        { name: 'sayote',          terms: ['sayote', 'chayote'],                      category: 'vegetable', unit: 'kg',     price: 50,  step: 0.25 },
  malunggay:     { name: 'malunggay',       terms: ['malunggay', 'moringa'],                   category: 'vegetable', unit: 'bundle', price: 10,  step: 1 },
  squash:        { name: 'kalabasa',        terms: ['kalabasa', 'squash', 'pumpkin'],          category: 'vegetable', unit: 'kg',     price: 50,  step: 0.25 },
  bitter_gourd:  { name: 'ampalaya',        terms: ['ampalaya', 'bitter gourd', 'bitter melon'], category: 'vegetable', unit: 'kg',   price: 100, step: 0.25 },
  okra:          { name: 'okra',            terms: ['okra'],                                   category: 'vegetable', unit: 'kg',     price: 80,  step: 0.25 },
  radish:        { name: 'labanos',         terms: ['labanos', 'radish'],                      category: 'vegetable', unit: 'kg',     price: 60,  step: 0.25 },
  potato:        { name: 'patatas',         terms: ['patatas', 'potato'],                      category: 'vegetable', unit: 'kg',     price: 100, step: 0.25 },
  carrot:        { name: 'carrots',         terms: ['carrot', 'karot'],                        category: 'vegetable', unit: 'kg',     price: 90,  step: 0.25 },
  cabbage:       { name: 'repolyo',         terms: ['repolyo', 'cabbage'],                     category: 'vegetable', unit: 'kg',     price: 80,  step: 0.25 },
  pechay:        { name: 'pechay',          terms: ['pechay', 'bok choy', 'petsay'],           category: 'vegetable', unit: 'bundle', price: 20,  step: 1 },

  // Sauces & condiments
  bagoong:       { name: 'bagoong',         terms: ['bagoong', 'shrimp paste'],                category: 'condiment', unit: 'pack',   price: 35,  step: 1 },
  sinigang_mix:  { name: 'sinigang mix',    terms: ['sinigang mix', 'sampalok', 'tamarind'],   category: 'condiment', unit: 'pack',   price: 22,  step: 1 },
  tomato_sauce:  { name: 'tomato sauce',    terms: ['tomato sauce'],                           category: 'condiment', unit: 'pack',   price: 25,  step: 1 },
  coconut_milk:  { name: 'gata',            terms: ['gata', 'coconut milk', 'coconut cream'],  category: 'condiment', unit: 'pack',   price: 30,  step: 1 },
  bay_leaf:      { name: 'laurel',          terms: ['laurel', 'bay leaf', 'bay leaves', 'dahon ng laurel'], category: 'condiment', unit: 'pack', price: 10, step: 1 },

  // Usual pantry staples (excluded from costs while marked as staples in Settings)
  soy_sauce:     { name: 'toyo',            terms: ['toyo', 'soy sauce'],                      category: 'condiment', unit: 'bottle', price: 30,  step: 1 },
  vinegar:       { name: 'suka',            terms: ['suka', 'vinegar'],                        category: 'condiment', unit: 'bottle', price: 25,  step: 1 },
  fish_sauce:    { name: 'patis',           terms: ['patis', 'fish sauce'],                    category: 'condiment', unit: 'bottle', price: 30,  step: 1 },
  oil:           { name: 'mantika',         terms: ['mantika', 'cooking oil', 'oil'],          category: 'condiment', unit: 'L',      price: 90,  step: 1 },
  salt:          { name: 'asin',            terms: ['asin', 'salt'],                           category: 'condiment', unit: 'pack',   price: 15,  step: 1 },
  pepper:        { name: 'paminta',         terms: ['paminta', 'pepper', 'black pepper'],      category: 'condiment', unit: 'pack',   price: 20,  step: 1 },
  sugar:         { name: 'asukal',          terms: ['asukal', 'sugar'],                        category: 'condiment', unit: 'kg',     price: 75,  step: 1 }
};

export const DEFAULT_STAPLES = ['soy_sauce', 'vinegar', 'fish_sauce', 'oil', 'salt', 'pepper', 'sugar'];

export const UNITS = ['pc', 'pack', 'bottle', 'can', 'kg', 'g', 'L', 'bundle', 'tray', 'container'];

export const CATEGORIES = ['meat', 'seafood', 'vegetable', 'fruit', 'dairy', 'egg',
  'condiment', 'canned', 'drink', 'grain', 'frozen', 'other'];
