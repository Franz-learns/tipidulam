// Filipino recipe database.
// qty is per `servings` (4) in the ingredient's catalog unit (see ingredients.js).
// withRice: true → the planner adds rice for the household automatically.
// Silog meals list rice as an ingredient instead (sinangag is part of the dish).

const ing = (key, qty) => ({ key, qty });

export const RECIPES = [
  // ---------- Breakfast ----------
  {
    id: 'hotsilog', name: 'Hotsilog', mealTypes: ['breakfast'], servings: 4, minutes: 20, withRice: false,
    ingredients: [ing('hotdog', 0.5), ing('egg', 4), ing('rice', 0.4), ing('garlic', 0.03), ing('oil', 0.05)],
    steps: ['Cook rice ahead (day-old rice is best for sinangag).', 'Fry minced garlic until golden, add rice and salt, toss until heated.', 'Score and fry the hotdogs.', 'Fry the eggs. Serve together.']
  },
  {
    id: 'longsilog', name: 'Longsilog', mealTypes: ['breakfast'], servings: 4, minutes: 25, withRice: false,
    ingredients: [ing('longganisa', 1), ing('egg', 4), ing('rice', 0.4), ing('garlic', 0.03), ing('oil', 0.05)],
    steps: ['Simmer longganisa in a little water until it dries, then fry in its own fat.', 'Make garlic fried rice.', 'Fry the eggs and serve.']
  },
  {
    id: 'tuyosilog', name: 'Tuyo, Itlog at Sinangag', mealTypes: ['breakfast'], servings: 4, minutes: 20, withRice: false,
    ingredients: [ing('tuyo', 0.5), ing('egg', 4), ing('rice', 0.4), ing('garlic', 0.03), ing('oil', 0.05), ing('vinegar', 0.05)],
    steps: ['Fry tuyo in oil until crisp (open a window).', 'Make garlic fried rice.', 'Fry eggs. Serve with spiced vinegar.']
  },
  {
    id: 'scrambled-egg-tomato', name: 'Scrambled Egg with Kamatis', mealTypes: ['breakfast'], servings: 4, minutes: 15, withRice: true,
    ingredients: [ing('egg', 5), ing('tomato', 0.25), ing('onion', 0.1), ing('oil', 0.03), ing('salt', 0.02)],
    steps: ['Sauté onion and diced tomato until soft.', 'Pour in beaten eggs with salt.', 'Stir gently until just set. Serve with rice.']
  },
  {
    id: 'tortang-talong', name: 'Tortang Talong', mealTypes: ['breakfast', 'lunch', 'dinner'], servings: 4, minutes: 30, withRice: true,
    ingredients: [ing('eggplant', 0.5), ing('egg', 4), ing('garlic', 0.02), ing('oil', 0.1), ing('salt', 0.02)],
    steps: ['Grill or broil eggplants until the skin is charred; peel.', 'Flatten each eggplant with a fork.', 'Dip in beaten egg with garlic and salt.', 'Pan-fry both sides until golden.']
  },
  {
    id: 'corned-beef-guisado', name: 'Ginisang Corned Beef', mealTypes: ['breakfast', 'lunch', 'dinner'], servings: 4, minutes: 20, withRice: true,
    ingredients: [ing('corned_beef', 2), ing('potato', 0.25), ing('onion', 0.1), ing('garlic', 0.02), ing('oil', 0.03)],
    steps: ['Fry diced potatoes until tender; set aside.', 'Sauté garlic and onion.', 'Add corned beef and potatoes; cook 5 minutes.']
  },

  // ---------- Lunch / dinner ----------
  {
    id: 'adobong-manok', name: 'Adobong Manok', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 45, withRice: true,
    ingredients: [ing('chicken', 1), ing('garlic', 0.05), ing('bay_leaf', 0.2), ing('soy_sauce', 0.15), ing('vinegar', 0.1), ing('pepper', 0.05), ing('oil', 0.03)],
    steps: ['Marinate chicken in toyo and garlic for 20 minutes.', 'Simmer with marinade, laurel and peppercorns for 20 minutes.', 'Add suka; simmer without stirring for 5 minutes, then reduce the sauce.']
  },
  {
    id: 'tinolang-manok', name: 'Tinolang Manok', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 45, withRice: true,
    ingredients: [ing('chicken', 1), ing('ginger', 0.05), ing('sayote', 0.5), ing('malunggay', 1), ing('onion', 0.1), ing('garlic', 0.03), ing('fish_sauce', 0.1)],
    steps: ['Sauté ginger, garlic and onion.', 'Add chicken and patis; cook until lightly browned.', 'Add water; simmer 25 minutes.', 'Add sayote; cook until tender. Add malunggay last.']
  },
  {
    id: 'sinigang-na-baboy', name: 'Sinigang na Baboy', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 75, withRice: true,
    ingredients: [ing('pork', 0.75), ing('sinigang_mix', 1), ing('kangkong', 1), ing('radish', 0.25), ing('tomato', 0.25), ing('onion', 0.1), ing('string_beans', 1), ing('fish_sauce', 0.1)],
    steps: ['Boil pork with onion and tomato; skim the scum.', 'Simmer until tender (about 45 minutes).', 'Add labanos and sitaw, then sinigang mix and patis.', 'Add kangkong last and turn off the heat.']
  },
  {
    id: 'ginisang-monggo', name: 'Ginisang Monggo', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 60, withRice: true,
    ingredients: [ing('mung_beans', 0.25), ing('garlic', 0.03), ing('onion', 0.1), ing('tomato', 0.15), ing('malunggay', 1), ing('fish_sauce', 0.1), ing('oil', 0.03)],
    steps: ['Boil monggo until soft (about 40 minutes).', 'Sauté garlic, onion and tomato.', 'Add the cooked monggo and patis; simmer 5 minutes.', 'Stir in malunggay.']
  },
  {
    id: 'pinakbet', name: 'Pinakbet', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 40, withRice: true,
    ingredients: [ing('squash', 0.25), ing('string_beans', 1), ing('eggplant', 0.25), ing('bitter_gourd', 0.25), ing('okra', 0.25), ing('bagoong', 0.5), ing('tomato', 0.15), ing('pork', 0.15), ing('garlic', 0.03), ing('onion', 0.1)],
    steps: ['Render the pork until crispy.', 'Sauté garlic, onion, tomato and bagoong.', 'Add kalabasa and a little water; cook 5 minutes.', 'Add the rest of the vegetables; cover and cook until tender.']
  },
  {
    id: 'adobong-kangkong', name: 'Adobong Kangkong', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 15, withRice: true,
    ingredients: [ing('kangkong', 2), ing('garlic', 0.05), ing('soy_sauce', 0.1), ing('vinegar', 0.05), ing('oil', 0.03)],
    steps: ['Fry garlic until golden.', 'Add kangkong stalks, then leaves.', 'Add toyo and suka; toss for 2 minutes.']
  },
  {
    id: 'sardinas-misua', name: 'Ginisang Sardinas with Misua', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 15, withRice: true,
    ingredients: [ing('sardines', 2), ing('misua', 1), ing('onion', 0.1), ing('garlic', 0.03), ing('oil', 0.02)],
    steps: ['Sauté garlic and onion.', 'Add sardinas with sauce and 3 cups of water; boil.', 'Add misua; cook 2 minutes.']
  },
  {
    id: 'pritong-galunggong', name: 'Pritong Galunggong', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 20, withRice: true,
    ingredients: [ing('galunggong', 0.75), ing('salt', 0.03), ing('oil', 0.2), ing('tomato', 0.15)],
    steps: ['Clean the fish and rub with salt.', 'Fry in hot oil until crisp on both sides.', 'Serve with sliced kamatis.']
  },
  {
    id: 'paksiw-na-bangus', name: 'Paksiw na Bangus', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 30, withRice: true,
    ingredients: [ing('bangus', 0.75), ing('vinegar', 0.15), ing('ginger', 0.05), ing('eggplant', 0.2), ing('bitter_gourd', 0.2), ing('garlic', 0.03), ing('salt', 0.02)],
    steps: ['Arrange bangus, ginger, garlic and vegetables in a pot.', 'Add suka, water and salt.', 'Bring to a boil without stirring; simmer 15 minutes.']
  },
  {
    id: 'chicken-afritada', name: 'Chicken Afritada', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 50, withRice: true,
    ingredients: [ing('chicken', 1), ing('potato', 0.25), ing('carrot', 0.2), ing('tomato_sauce', 1), ing('onion', 0.1), ing('garlic', 0.03), ing('fish_sauce', 0.05), ing('oil', 0.05)],
    steps: ['Brown the chicken; set aside.', 'Sauté garlic and onion; add tomato sauce and water.', 'Return chicken; simmer 20 minutes.', 'Add potatoes and carrots; cook until tender.']
  },
  {
    id: 'tokwat-baboy', name: "Tokwa't Baboy", mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 50, withRice: true,
    ingredients: [ing('tokwa', 4), ing('pork', 0.4), ing('onion', 0.1), ing('soy_sauce', 0.1), ing('vinegar', 0.1), ing('oil', 0.2)],
    steps: ['Boil pork until tender; slice into cubes.', 'Fry tokwa until golden; cube.', 'Mix toyo, suka and chopped onion for the sauce.', 'Pour the sauce over the pork and tokwa.']
  },
  {
    id: 'ginisang-repolyo', name: 'Ginisang Repolyo', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 20, withRice: true,
    ingredients: [ing('cabbage', 0.5), ing('carrot', 0.15), ing('ground_pork', 0.2), ing('onion', 0.1), ing('garlic', 0.03), ing('fish_sauce', 0.05), ing('oil', 0.03)],
    steps: ['Sauté garlic and onion; add giniling and brown it.', 'Add carrots; cook 3 minutes.', 'Add repolyo and patis; toss until just wilted.']
  },
  {
    id: 'pancit-bihon', name: 'Pancit Bihon', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 35, withRice: false,
    ingredients: [ing('bihon', 1), ing('chicken', 0.25), ing('cabbage', 0.25), ing('carrot', 0.15), ing('onion', 0.1), ing('garlic', 0.03), ing('soy_sauce', 0.1), ing('oil', 0.03)],
    steps: ['Soak bihon in water for 10 minutes.', 'Sauté garlic, onion and sliced chicken.', 'Add vegetables, toyo and 2 cups of water; boil.', 'Add bihon; toss until the liquid is absorbed.']
  },
  {
    id: 'ginataang-kalabasa', name: 'Ginataang Kalabasa at Sitaw', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 30, withRice: true,
    ingredients: [ing('squash', 0.5), ing('string_beans', 1), ing('coconut_milk', 1), ing('ground_pork', 0.15), ing('garlic', 0.03), ing('onion', 0.1), ing('fish_sauce', 0.05)],
    steps: ['Sauté garlic, onion and giniling.', 'Add gata and kalabasa; simmer 10 minutes.', 'Add sitaw and patis; cook until tender.']
  },
  {
    id: 'ginisang-pechay', name: 'Ginisang Pechay with Giniling', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 20, withRice: true,
    ingredients: [ing('pechay', 2), ing('ground_pork', 0.25), ing('garlic', 0.03), ing('onion', 0.1), ing('fish_sauce', 0.05), ing('oil', 0.03)],
    steps: ['Sauté garlic and onion; brown the giniling.', 'Add a little water and patis.', 'Add pechay stems, then leaves; cook 2 minutes.']
  }
];

export const RECIPES_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));
