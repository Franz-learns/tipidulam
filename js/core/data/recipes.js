// Filipino recipe database.
// qty is per `servings` (4) in the ingredient's catalog unit (see ingredients.js).
// group: chicken | pork | beef | seafood | vegetable | egg | noodles (Recipes page filter)
// withRice: true → the planner adds rice for the household automatically.
// Silog meals list rice as an ingredient instead (sinangag is part of the dish).

const ing = (key, qty) => ({ key, qty });

export const RECIPES = [
  // ---------- Breakfast ----------
  {
    id: 'hotsilog', group: 'pork', name: 'Hotsilog', mealTypes: ['breakfast'], servings: 4, minutes: 20, withRice: false,
    ingredients: [ing('hotdog', 0.5), ing('egg', 4), ing('rice', 0.4), ing('garlic', 0.03), ing('oil', 0.05)],
    steps: ['Cook rice ahead (day-old rice is best for sinangag).', 'Fry minced garlic until golden, add rice and salt, toss until heated.', 'Score and fry the hotdogs.', 'Fry the eggs. Serve together.']
  },
  {
    id: 'longsilog', group: 'pork', name: 'Longsilog', mealTypes: ['breakfast'], servings: 4, minutes: 25, withRice: false,
    ingredients: [ing('longganisa', 1), ing('egg', 4), ing('rice', 0.4), ing('garlic', 0.03), ing('oil', 0.05)],
    steps: ['Simmer longganisa in a little water until it dries, then fry in its own fat.', 'Make garlic fried rice.', 'Fry the eggs and serve.']
  },
  {
    id: 'tuyosilog', group: 'seafood', name: 'Tuyo, Itlog at Sinangag', mealTypes: ['breakfast'], servings: 4, minutes: 20, withRice: false,
    ingredients: [ing('tuyo', 0.5), ing('egg', 4), ing('rice', 0.4), ing('garlic', 0.03), ing('oil', 0.05), ing('vinegar', 0.05)],
    steps: ['Fry tuyo in oil until crisp (open a window).', 'Make garlic fried rice.', 'Fry eggs. Serve with spiced vinegar.']
  },
  {
    id: 'scrambled-egg-tomato', group: 'egg', name: 'Scrambled Egg with Kamatis', mealTypes: ['breakfast'], servings: 4, minutes: 15, withRice: true,
    ingredients: [ing('egg', 5), ing('tomato', 0.25), ing('onion', 0.1), ing('oil', 0.03), ing('salt', 0.02)],
    steps: ['Sauté onion and diced tomato until soft.', 'Pour in beaten eggs with salt.', 'Stir gently until just set. Serve with rice.']
  },
  {
    id: 'tortang-talong', group: 'egg', name: 'Tortang Talong', mealTypes: ['breakfast', 'lunch', 'dinner'], servings: 4, minutes: 30, withRice: true,
    ingredients: [ing('eggplant', 0.5), ing('egg', 4), ing('garlic', 0.02), ing('oil', 0.1), ing('salt', 0.02)],
    steps: ['Grill or broil eggplants until the skin is charred; peel.', 'Flatten each eggplant with a fork.', 'Dip in beaten egg with garlic and salt.', 'Pan-fry both sides until golden.']
  },
  {
    id: 'corned-beef-guisado', group: 'beef', name: 'Ginisang Corned Beef', mealTypes: ['breakfast', 'lunch', 'dinner'], servings: 4, minutes: 20, withRice: true,
    ingredients: [ing('corned_beef', 2), ing('potato', 0.25), ing('onion', 0.1), ing('garlic', 0.02), ing('oil', 0.03)],
    steps: ['Fry diced potatoes until tender; set aside.', 'Sauté garlic and onion.', 'Add corned beef and potatoes; cook 5 minutes.']
  },

  // ---------- Lunch / dinner ----------
  {
    id: 'adobong-manok', group: 'chicken', name: 'Adobong Manok', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 45, withRice: true,
    ingredients: [ing('chicken', 1), ing('garlic', 0.05), ing('bay_leaf', 0.2), ing('soy_sauce', 0.15), ing('vinegar', 0.1), ing('pepper', 0.05), ing('oil', 0.03)],
    steps: ['Marinate chicken in toyo and garlic for 20 minutes.', 'Simmer with marinade, laurel and peppercorns for 20 minutes.', 'Add suka; simmer without stirring for 5 minutes, then reduce the sauce.']
  },
  {
    id: 'tinolang-manok', group: 'chicken', name: 'Tinolang Manok', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 45, withRice: true,
    ingredients: [ing('chicken', 1), ing('ginger', 0.05), ing('sayote', 0.5), ing('malunggay', 1), ing('onion', 0.1), ing('garlic', 0.03), ing('fish_sauce', 0.1)],
    steps: ['Sauté ginger, garlic and onion.', 'Add chicken and patis; cook until lightly browned.', 'Add water; simmer 25 minutes.', 'Add sayote; cook until tender. Add malunggay last.']
  },
  {
    id: 'sinigang-na-baboy', group: 'pork', name: 'Sinigang na Baboy', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 75, withRice: true,
    ingredients: [ing('pork', 0.75), ing('sinigang_mix', 1), ing('kangkong', 1), ing('radish', 0.25), ing('tomato', 0.25), ing('onion', 0.1), ing('string_beans', 1), ing('fish_sauce', 0.1)],
    steps: ['Boil pork with onion and tomato; skim the scum.', 'Simmer until tender (about 45 minutes).', 'Add labanos and sitaw, then sinigang mix and patis.', 'Add kangkong last and turn off the heat.']
  },
  {
    id: 'ginisang-monggo', group: 'vegetable', name: 'Ginisang Monggo', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 60, withRice: true,
    ingredients: [ing('mung_beans', 0.25), ing('garlic', 0.03), ing('onion', 0.1), ing('tomato', 0.15), ing('malunggay', 1), ing('fish_sauce', 0.1), ing('oil', 0.03)],
    steps: ['Boil monggo until soft (about 40 minutes).', 'Sauté garlic, onion and tomato.', 'Add the cooked monggo and patis; simmer 5 minutes.', 'Stir in malunggay.']
  },
  {
    id: 'pinakbet', group: 'vegetable', name: 'Pinakbet', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 40, withRice: true,
    ingredients: [ing('squash', 0.25), ing('string_beans', 1), ing('eggplant', 0.25), ing('bitter_gourd', 0.25), ing('okra', 0.25), ing('bagoong', 0.5), ing('tomato', 0.15), ing('pork', 0.15), ing('garlic', 0.03), ing('onion', 0.1)],
    steps: ['Render the pork until crispy.', 'Sauté garlic, onion, tomato and bagoong.', 'Add kalabasa and a little water; cook 5 minutes.', 'Add the rest of the vegetables; cover and cook until tender.']
  },
  {
    id: 'adobong-kangkong', group: 'vegetable', name: 'Adobong Kangkong', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 15, withRice: true,
    ingredients: [ing('kangkong', 2), ing('garlic', 0.05), ing('soy_sauce', 0.1), ing('vinegar', 0.05), ing('oil', 0.03)],
    steps: ['Fry garlic until golden.', 'Add kangkong stalks, then leaves.', 'Add toyo and suka; toss for 2 minutes.']
  },
  {
    id: 'sardinas-misua', group: 'seafood', name: 'Ginisang Sardinas with Misua', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 15, withRice: true,
    ingredients: [ing('sardines', 2), ing('misua', 1), ing('onion', 0.1), ing('garlic', 0.03), ing('oil', 0.02)],
    steps: ['Sauté garlic and onion.', 'Add sardinas with sauce and 3 cups of water; boil.', 'Add misua; cook 2 minutes.']
  },
  {
    id: 'pritong-galunggong', group: 'seafood', name: 'Pritong Galunggong', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 20, withRice: true,
    ingredients: [ing('galunggong', 0.75), ing('salt', 0.03), ing('oil', 0.2), ing('tomato', 0.15)],
    steps: ['Clean the fish and rub with salt.', 'Fry in hot oil until crisp on both sides.', 'Serve with sliced kamatis.']
  },
  {
    id: 'paksiw-na-bangus', group: 'seafood', name: 'Paksiw na Bangus', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 30, withRice: true,
    ingredients: [ing('bangus', 0.75), ing('vinegar', 0.15), ing('ginger', 0.05), ing('eggplant', 0.2), ing('bitter_gourd', 0.2), ing('garlic', 0.03), ing('salt', 0.02)],
    steps: ['Arrange bangus, ginger, garlic and vegetables in a pot.', 'Add suka, water and salt.', 'Bring to a boil without stirring; simmer 15 minutes.']
  },
  {
    id: 'chicken-afritada', group: 'chicken', name: 'Chicken Afritada', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 50, withRice: true,
    ingredients: [ing('chicken', 1), ing('potato', 0.25), ing('carrot', 0.2), ing('tomato_sauce', 1), ing('onion', 0.1), ing('garlic', 0.03), ing('fish_sauce', 0.05), ing('oil', 0.05)],
    steps: ['Brown the chicken; set aside.', 'Sauté garlic and onion; add tomato sauce and water.', 'Return chicken; simmer 20 minutes.', 'Add potatoes and carrots; cook until tender.']
  },
  {
    id: 'tokwat-baboy', group: 'pork', name: "Tokwa't Baboy", mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 50, withRice: true,
    ingredients: [ing('tokwa', 4), ing('pork', 0.4), ing('onion', 0.1), ing('soy_sauce', 0.1), ing('vinegar', 0.1), ing('oil', 0.2)],
    steps: ['Boil pork until tender; slice into cubes.', 'Fry tokwa until golden; cube.', 'Mix toyo, suka and chopped onion for the sauce.', 'Pour the sauce over the pork and tokwa.']
  },
  {
    id: 'ginisang-repolyo', group: 'vegetable', name: 'Ginisang Repolyo', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 20, withRice: true,
    ingredients: [ing('cabbage', 0.5), ing('carrot', 0.15), ing('ground_pork', 0.2), ing('onion', 0.1), ing('garlic', 0.03), ing('fish_sauce', 0.05), ing('oil', 0.03)],
    steps: ['Sauté garlic and onion; add giniling and brown it.', 'Add carrots; cook 3 minutes.', 'Add repolyo and patis; toss until just wilted.']
  },
  {
    id: 'pancit-bihon', group: 'noodles', name: 'Pancit Bihon', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 35, withRice: false,
    ingredients: [ing('bihon', 1), ing('chicken', 0.25), ing('cabbage', 0.25), ing('carrot', 0.15), ing('onion', 0.1), ing('garlic', 0.03), ing('soy_sauce', 0.1), ing('oil', 0.03)],
    steps: ['Soak bihon in water for 10 minutes.', 'Sauté garlic, onion and sliced chicken.', 'Add vegetables, toyo and 2 cups of water; boil.', 'Add bihon; toss until the liquid is absorbed.']
  },
  {
    id: 'ginataang-kalabasa', group: 'vegetable', name: 'Ginataang Kalabasa at Sitaw', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 30, withRice: true,
    ingredients: [ing('squash', 0.5), ing('string_beans', 1), ing('coconut_milk', 1), ing('ground_pork', 0.15), ing('garlic', 0.03), ing('onion', 0.1), ing('fish_sauce', 0.05)],
    steps: ['Sauté garlic, onion and giniling.', 'Add gata and kalabasa; simmer 10 minutes.', 'Add sitaw and patis; cook until tender.']
  },
  {
    id: 'ginisang-pechay', group: 'vegetable', name: 'Ginisang Pechay with Giniling', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 20, withRice: true,
    ingredients: [ing('pechay', 2), ing('ground_pork', 0.25), ing('garlic', 0.03), ing('onion', 0.1), ing('fish_sauce', 0.05), ing('oil', 0.03)],
    steps: ['Sauté garlic and onion; brown the giniling.', 'Add a little water and patis.', 'Add pechay stems, then leaves; cook 2 minutes.']
  },
  // ================= More breakfast =================
  {
    id: 'tapsilog', group: 'beef', name: 'Tapsilog', mealTypes: ['breakfast'], servings: 4, minutes: 25, withRice: false,
    ingredients: [ing('beef_tapa', 1), ing('egg', 4), ing('rice', 0.4), ing('garlic', 0.03), ing('oil', 0.05), ing('vinegar', 0.05)],
    steps: ['Pan-fry the tapa with a splash of water until it dries, then fry until edges caramelize.', 'Make garlic fried rice with day-old rice.', 'Fry the eggs. Serve with spiced vinegar.']
  },
  {
    id: 'tocilog', group: 'pork', name: 'Tocilog', mealTypes: ['breakfast'], servings: 4, minutes: 25, withRice: false,
    ingredients: [ing('tocino', 1), ing('egg', 4), ing('rice', 0.4), ing('garlic', 0.03), ing('oil', 0.05)],
    steps: ['Simmer tocino in a little water until the water evaporates.', 'Let it caramelize in its own fat, turning often so it does not burn.', 'Serve with garlic fried rice and fried eggs.']
  },
  {
    id: 'spamsilog', group: 'pork', name: 'Luncheon Meat Silog', mealTypes: ['breakfast'], servings: 4, minutes: 15, withRice: false,
    ingredients: [ing('luncheon_meat', 1), ing('egg', 4), ing('rice', 0.4), ing('garlic', 0.03), ing('oil', 0.05)],
    steps: ['Slice the luncheon meat and pan-fry until browned.', 'Make garlic fried rice.', 'Fry the eggs and serve together.']
  },
  {
    id: 'daing-na-bangus', group: 'seafood', name: 'Daing na Bangus', mealTypes: ['breakfast', 'lunch', 'dinner'], servings: 4, minutes: 25, withRice: true,
    ingredients: [ing('daing_bangus', 2), ing('vinegar', 0.1), ing('garlic', 0.03), ing('pepper', 0.02), ing('oil', 0.15), ing('tomato', 0.15)],
    steps: ['If not pre-marinated, soak bangus in suka, crushed garlic and pepper for at least an hour.', 'Pat dry and fry skin-side down first until crisp.', 'Serve with sliced kamatis and spiced vinegar.']
  },
  {
    id: 'champorado', group: 'noodles', name: 'Champorado with Tuyo', mealTypes: ['breakfast'], servings: 4, minutes: 35, withRice: false,
    ingredients: [ing('glutinous_rice', 0.25), ing('tablea', 1), ing('sugar', 0.1), ing('evaporated_milk', 1), ing('tuyo', 0.25), ing('oil', 0.05)],
    steps: ['Boil malagkit in 5 cups of water, stirring, until soft (about 20 minutes).', 'Add tablea and sugar; stir until melted and thick.', 'Fry tuyo until crisp.', 'Serve champorado drizzled with evaporated milk, tuyo on the side.']
  },
  {
    id: 'arroz-caldo', group: 'chicken', name: 'Arroz Caldo', mealTypes: ['breakfast', 'dinner'], servings: 4, minutes: 45, withRice: false,
    ingredients: [ing('chicken', 0.5), ing('rice', 0.2), ing('glutinous_rice', 0.1), ing('ginger', 0.05), ing('garlic', 0.04), ing('onion', 0.1), ing('fish_sauce', 0.1), ing('egg', 4), ing('oil', 0.05)],
    steps: ['Sauté plenty of ginger, garlic and onion; add chicken and patis.', 'Add both rices and 8 cups of water; simmer, stirring, until thick (30 minutes).', 'Boil the eggs separately.', 'Top with fried garlic and a halved egg.']
  },

  // ================= Chicken =================
  {
    id: 'chicken-curry', group: 'chicken', name: 'Pinoy Chicken Curry', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 45, withRice: true,
    ingredients: [ing('chicken', 1), ing('potato', 0.25), ing('carrot', 0.2), ing('coconut_milk', 1), ing('curry_powder', 1), ing('bell_pepper', 0.1), ing('onion', 0.1), ing('garlic', 0.03), ing('ginger', 0.02), ing('fish_sauce', 0.05), ing('oil', 0.05)],
    steps: ['Brown potatoes and carrots lightly; set aside.', 'Sauté garlic, onion and ginger; add chicken and patis.', 'Stir in curry powder and gata; simmer 20 minutes.', 'Add the vegetables and bell pepper; cook until tender.']
  },
  {
    id: 'pininyahang-manok', group: 'chicken', name: 'Pininyahang Manok', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 45, withRice: true,
    ingredients: [ing('chicken', 1), ing('pineapple', 1), ing('evaporated_milk', 1), ing('potato', 0.25), ing('carrot', 0.15), ing('bell_pepper', 0.1), ing('onion', 0.1), ing('garlic', 0.03), ing('fish_sauce', 0.05), ing('oil', 0.05)],
    steps: ['Sauté garlic and onion; brown the chicken with patis.', 'Add the pineapple syrup; simmer 15 minutes.', 'Add potatoes and carrots; cook until tender.', 'Stir in pineapple chunks, bell pepper and evaporated milk; heat through without boiling hard.']
  },
  {
    id: 'chicken-sopas', group: 'noodles', name: 'Chicken Sopas', mealTypes: ['breakfast', 'lunch', 'dinner'], servings: 4, minutes: 35, withRice: false,
    ingredients: [ing('macaroni', 1), ing('chicken', 0.25), ing('hotdog', 0.25), ing('carrot', 0.15), ing('cabbage', 0.25), ing('evaporated_milk', 1), ing('onion', 0.1), ing('garlic', 0.03), ing('fish_sauce', 0.05), ing('oil', 0.03)],
    steps: ['Boil chicken in 8 cups of water; shred it and keep the broth.', 'Sauté garlic, onion, chicken and sliced hotdog.', 'Add the broth and macaroni; cook until tender.', 'Add carrots and repolyo, then evaporated milk and patis.']
  },

  // ================= Pork =================
  {
    id: 'adobong-baboy', group: 'pork', name: 'Adobong Baboy', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 60, withRice: true,
    ingredients: [ing('pork', 0.75), ing('soy_sauce', 0.15), ing('vinegar', 0.1), ing('garlic', 0.05), ing('bay_leaf', 0.2), ing('pepper', 0.05), ing('sugar', 0.02), ing('oil', 0.03)],
    steps: ['Simmer pork with toyo, garlic, laurel, peppercorns and a cup of water for 30 minutes.', 'Add suka; simmer 5 minutes without stirring.', 'Cook until the sauce reduces and the pork starts to fry in its own fat.']
  },
  {
    id: 'pork-menudo', group: 'pork', name: 'Pork Menudo', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 55, withRice: true,
    ingredients: [ing('pork', 0.5), ing('potato', 0.25), ing('carrot', 0.2), ing('tomato_sauce', 1), ing('bell_pepper', 0.1), ing('onion', 0.1), ing('garlic', 0.03), ing('soy_sauce', 0.05), ing('oil', 0.05)],
    steps: ['Cube pork, potatoes and carrots small and evenly.', 'Sauté garlic and onion; brown the pork with toyo.', 'Add tomato sauce and water; simmer 30 minutes.', 'Add potatoes, carrots and bell pepper; cook until tender.']
  },
  {
    id: 'pork-giniling', group: 'pork', name: 'Giniling Guisado', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 30, withRice: true,
    ingredients: [ing('ground_pork', 0.5), ing('potato', 0.25), ing('carrot', 0.2), ing('tomato_sauce', 1), ing('onion', 0.1), ing('garlic', 0.03), ing('soy_sauce', 0.05), ing('oil', 0.03)],
    steps: ['Sauté garlic and onion; brown the giniling.', 'Add diced potatoes, carrots, toyo and tomato sauce.', 'Simmer with a little water until the vegetables are tender.']
  },
  {
    id: 'binagoongang-baboy', group: 'pork', name: 'Binagoongang Baboy', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 50, withRice: true,
    ingredients: [ing('pork', 0.5), ing('bagoong', 1), ing('tomato', 0.25), ing('eggplant', 0.25), ing('onion', 0.1), ing('garlic', 0.03), ing('vinegar', 0.05), ing('sugar', 0.02), ing('oil', 0.05)],
    steps: ['Boil pork until tender, then fry until lightly browned.', 'Sauté garlic, onion and tomato; add bagoong, suka and sugar.', 'Add the pork and a little water; simmer 10 minutes.', 'Add talong and cook until soft.']
  },
  {
    id: 'nilagang-baboy', group: 'pork', name: 'Nilagang Baboy', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 80, withRice: true,
    ingredients: [ing('pork', 0.75), ing('potato', 0.25), ing('cabbage', 0.5), ing('pechay', 1), ing('onion', 0.1), ing('pepper', 0.02), ing('fish_sauce', 0.1)],
    steps: ['Boil pork with onion and peppercorns; skim the scum.', 'Simmer until tender (about 50 minutes).', 'Add potatoes, then repolyo and patis.', 'Add pechay last and turn off the heat.']
  },
  {
    id: 'lumpiang-shanghai', group: 'pork', name: 'Lumpiang Shanghai', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 50, withRice: true,
    ingredients: [ing('ground_pork', 0.25), ing('carrot', 0.1), ing('onion', 0.1), ing('garlic', 0.02), ing('egg', 1), ing('lumpia_wrapper', 1), ing('salt', 0.02), ing('pepper', 0.02), ing('oil', 0.3)],
    steps: ['Mix giniling with minced carrots, onion, garlic, egg, salt and pepper.', 'Roll a thin log of filling in each wrapper and seal the edge with water.', 'Deep-fry in batches until golden; drain on paper.', 'Serve with sweet chili or banana ketchup.']
  },
  {
    id: 'bistek-baboy', group: 'pork', name: 'Bistek na Baboy', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 35, withRice: true,
    ingredients: [ing('pork', 0.5), ing('calamansi', 0.1), ing('onion', 0.2), ing('soy_sauce', 0.15), ing('garlic', 0.03), ing('pepper', 0.02), ing('oil', 0.05)],
    steps: ['Marinate thin pork slices in toyo, calamansi, garlic and pepper for 30 minutes.', 'Fry onion rings until just soft; set aside.', 'Fry the pork, then add the marinade and a little water; simmer until tender.', 'Top with the onion rings.']
  },
  {
    id: 'lechon-kawali', group: 'pork', name: 'Lechon Kawali', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 90, withRice: true,
    ingredients: [ing('pork', 0.75), ing('bay_leaf', 0.2), ing('garlic', 0.03), ing('salt', 0.05), ing('pepper', 0.02), ing('oil', 0.5), ing('vinegar', 0.05)],
    steps: ['Boil liempo with salt, garlic, laurel and pepper until tender (45 minutes).', 'Drain and air-dry completely; chill for crisper skin.', 'Deep-fry, covered, until the skin blisters and turns golden.', 'Chop and serve with spiced vinegar.']
  },

  // ================= Beef =================
  {
    id: 'bistek-tagalog', group: 'beef', name: 'Bistek Tagalog', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 45, withRice: true,
    ingredients: [ing('beef', 0.5), ing('calamansi', 0.1), ing('onion', 0.2), ing('soy_sauce', 0.15), ing('garlic', 0.03), ing('pepper', 0.02), ing('oil', 0.05)],
    steps: ['Marinate thin beef slices in toyo, calamansi, garlic and pepper for an hour.', 'Fry onion rings until just soft; set aside.', 'Sear the beef, add the marinade and water; simmer until tender.', 'Return the onions and serve.']
  },
  {
    id: 'beef-kaldereta', group: 'beef', name: 'Beef Kaldereta', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 120, withRice: true,
    ingredients: [ing('beef', 0.75), ing('potato', 0.25), ing('carrot', 0.2), ing('bell_pepper', 0.1), ing('tomato_sauce', 1), ing('liver_spread', 1), ing('onion', 0.1), ing('garlic', 0.03), ing('soy_sauce', 0.05), ing('oil', 0.05)],
    steps: ['Brown the beef; sauté garlic and onion.', 'Add tomato sauce, toyo and water; simmer until tender (about 1½ hours).', 'Stir in liver spread to thicken.', 'Add potatoes, carrots and bell pepper; cook until tender.']
  },

  // ================= Fish & seafood =================
  {
    id: 'sinigang-na-isda', group: 'seafood', name: 'Sinigang na Isda', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 35, withRice: true,
    ingredients: [ing('tilapia', 0.75), ing('sinigang_mix', 1), ing('kangkong', 1), ing('radish', 0.25), ing('tomato', 0.25), ing('onion', 0.1), ing('okra', 0.1), ing('fish_sauce', 0.1)],
    steps: ['Boil water with onion and tomato.', 'Add labanos and okra; cook 5 minutes.', 'Add the fish gently and simmer 8 minutes; do not stir hard.', 'Add sinigang mix and patis, then kangkong last.']
  },
  {
    id: 'pritong-tilapia', group: 'seafood', name: 'Pritong Tilapia', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 25, withRice: true,
    ingredients: [ing('tilapia', 0.75), ing('salt', 0.03), ing('oil', 0.2), ing('tomato', 0.15), ing('onion', 0.05)],
    steps: ['Clean the fish, score the sides and rub with salt.', 'Pat dry and fry in hot oil until crisp on both sides.', 'Serve with kamatis and sibuyas salad.']
  },
  {
    id: 'sarciadong-isda', group: 'seafood', name: 'Sarciadong Isda', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 35, withRice: true,
    ingredients: [ing('tilapia', 0.75), ing('tomato', 0.3), ing('onion', 0.1), ing('garlic', 0.03), ing('egg', 2), ing('fish_sauce', 0.05), ing('oil', 0.2)],
    steps: ['Fry the fish until crisp; set aside.', 'Sauté garlic, onion and lots of tomatoes until saucy; add water and patis.', 'Pour in beaten eggs and stir gently until just set.', 'Pour the sauce over the fish.']
  },
  {
    id: 'escabeche', group: 'seafood', name: 'Escabeche (Sweet & Sour Fish)', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 40, withRice: true,
    ingredients: [ing('tilapia', 0.75), ing('bell_pepper', 0.1), ing('carrot', 0.1), ing('onion', 0.1), ing('ginger', 0.03), ing('garlic', 0.03), ing('vinegar', 0.1), ing('sugar', 0.05), ing('oil', 0.2)],
    steps: ['Fry the fish until crisp; arrange on a plate.', 'Sauté ginger, garlic, onion, carrots and bell pepper.', 'Add suka, sugar and a little water; simmer until slightly thick.', 'Pour the sauce over the fish.']
  },
  {
    id: 'tortang-tuna', group: 'seafood', name: 'Tortang Tuna', mealTypes: ['breakfast', 'lunch', 'dinner'], servings: 4, minutes: 20, withRice: true,
    ingredients: [ing('canned_tuna', 1), ing('egg', 4), ing('onion', 0.1), ing('garlic', 0.02), ing('salt', 0.01), ing('oil', 0.1)],
    steps: ['Drain the tuna and mix with beaten eggs, minced onion, garlic and salt.', 'Spoon into a hot oiled pan to make small patties.', 'Fry both sides until golden.']
  },
  {
    id: 'sinigang-na-hipon', group: 'seafood', name: 'Sinigang na Hipon', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 30, withRice: true,
    ingredients: [ing('shrimp', 0.5), ing('sinigang_mix', 1), ing('kangkong', 1), ing('radish', 0.25), ing('tomato', 0.25), ing('onion', 0.1), ing('string_beans', 1), ing('okra', 0.1), ing('fish_sauce', 0.1)],
    steps: ['Boil water with onion and tomato.', 'Add labanos, sitaw and okra; cook until nearly tender.', 'Add sinigang mix and patis, then the shrimp; cook only 2–3 minutes until pink.', 'Add kangkong and turn off the heat.']
  },

  // ================= Vegetables =================
  {
    id: 'ginisang-ampalaya', group: 'vegetable', name: 'Ginisang Ampalaya with Egg', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 20, withRice: true,
    ingredients: [ing('bitter_gourd', 0.5), ing('egg', 2), ing('tomato', 0.15), ing('onion', 0.1), ing('garlic', 0.03), ing('fish_sauce', 0.05), ing('oil', 0.03), ing('salt', 0.02)],
    steps: ['Slice ampalaya thinly, rub with salt, rest 10 minutes, then squeeze and rinse to reduce bitterness.', 'Sauté garlic, onion and tomato.', 'Add ampalaya and patis; cook 3 minutes.', 'Pour in beaten eggs and stir until set.']
  },
  {
    id: 'ginisang-sayote', group: 'vegetable', name: 'Ginisang Sayote', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 20, withRice: true,
    ingredients: [ing('sayote', 0.5), ing('ground_pork', 0.15), ing('carrot', 0.1), ing('onion', 0.1), ing('garlic', 0.03), ing('fish_sauce', 0.05), ing('oil', 0.03)],
    steps: ['Sauté garlic and onion; brown the giniling.', 'Add sliced sayote, carrots, patis and a little water.', 'Cover and cook until just tender.']
  },
  {
    id: 'chopsuey', group: 'vegetable', name: 'Chopsuey', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 25, withRice: true,
    ingredients: [ing('cabbage', 0.25), ing('carrot', 0.15), ing('pechay', 1), ing('sayote', 0.25), ing('bell_pepper', 0.1), ing('chicken', 0.25), ing('onion', 0.1), ing('garlic', 0.03), ing('soy_sauce', 0.05), ing('oil', 0.03)],
    steps: ['Sauté garlic, onion and sliced chicken until cooked.', 'Add carrots and sayote with a little water; cook 3 minutes.', 'Add repolyo, bell pepper and toyo.', 'Add pechay last; toss until just wilted.']
  },
  {
    id: 'ginisang-togue', group: 'vegetable', name: 'Ginisang Togue at Tokwa', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 20, withRice: true,
    ingredients: [ing('togue', 0.5), ing('tokwa', 2), ing('carrot', 0.1), ing('onion', 0.1), ing('garlic', 0.03), ing('fish_sauce', 0.05), ing('oil', 0.1)],
    steps: ['Fry cubed tokwa until golden; set aside.', 'Sauté garlic, onion and carrots.', 'Add togue and patis; toss for 2 minutes so it stays crunchy.', 'Fold in the tokwa.']
  },
  {
    id: 'laing', group: 'vegetable', name: 'Laing', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 50, withRice: true,
    ingredients: [ing('taro_leaves', 1), ing('coconut_milk', 2), ing('pork', 0.15), ing('ginger', 0.03), ing('garlic', 0.03), ing('onion', 0.1), ing('bagoong', 0.25)],
    steps: ['Simmer gata with pork, ginger, garlic, onion and bagoong for 10 minutes.', 'Add the dried gabi leaves on top; do not stir for 10 minutes so they soften (stirring early can make it itchy).', 'Stir and simmer until thick and oily, about 20 minutes.']
  },
  {
    id: 'lumpiang-gulay', group: 'vegetable', name: 'Lumpiang Gulay', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 45, withRice: true,
    ingredients: [ing('togue', 0.25), ing('kamote', 0.25), ing('string_beans', 1), ing('carrot', 0.1), ing('tokwa', 2), ing('lumpia_wrapper', 1), ing('garlic', 0.03), ing('onion', 0.1), ing('fish_sauce', 0.05), ing('oil', 0.3), ing('vinegar', 0.05)],
    steps: ['Sauté garlic, onion, diced tokwa, kamote, carrots and sitaw until nearly tender.', 'Add togue and patis; cool the filling.', 'Wrap in lumpia wrappers and fry until golden.', 'Serve with garlic vinegar.']
  },
  {
    id: 'adobong-sitaw', group: 'vegetable', name: 'Adobong Sitaw', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 25, withRice: true,
    ingredients: [ing('string_beans', 2), ing('pork', 0.15), ing('garlic', 0.04), ing('soy_sauce', 0.1), ing('vinegar', 0.05), ing('pepper', 0.02), ing('oil', 0.03)],
    steps: ['Fry thin pork slices until lightly browned; add garlic.', 'Add sitaw, toyo and a little water; cover and cook 5 minutes.', 'Add suka and pepper; cook until the sitaw is tender but still green.']
  },

  // ================= Noodles & soups =================
  {
    id: 'pancit-canton', group: 'noodles', name: 'Pancit Canton', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 30, withRice: false,
    ingredients: [ing('pancit_canton', 1), ing('chicken', 0.25), ing('cabbage', 0.25), ing('carrot', 0.15), ing('onion', 0.1), ing('garlic', 0.03), ing('soy_sauce', 0.1), ing('oil', 0.03), ing('calamansi', 0.05)],
    steps: ['Sauté garlic, onion and sliced chicken.', 'Add carrots, toyo and 2 cups of water; boil.', 'Add canton noodles and repolyo; toss until the liquid is absorbed.', 'Serve with calamansi.']
  },
  {
    id: 'sotanghon-soup', group: 'noodles', name: 'Chicken Sotanghon Soup', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 35, withRice: false,
    ingredients: [ing('sotanghon', 1), ing('chicken', 0.25), ing('cabbage', 0.25), ing('carrot', 0.1), ing('onion', 0.1), ing('garlic', 0.03), ing('fish_sauce', 0.1), ing('oil', 0.03)],
    steps: ['Boil chicken in 6 cups of water; shred and keep the broth.', 'Sauté garlic, onion and the chicken; add the broth.', 'Add carrots, repolyo and patis.', 'Add soaked sotanghon; cook 2 minutes.']
  },
  {
    id: 'misua-patola', group: 'noodles', name: 'Misua at Patola', mealTypes: ['lunch', 'dinner'], servings: 4, minutes: 20, withRice: true,
    ingredients: [ing('misua', 1), ing('patola', 0.5), ing('ground_pork', 0.15), ing('onion', 0.1), ing('garlic', 0.03), ing('fish_sauce', 0.05), ing('oil', 0.03)],
    steps: ['Sauté garlic, onion and giniling.', 'Add 5 cups of water and patis; boil.', 'Add sliced patola; cook 3 minutes.', 'Add misua; cook 1 minute and serve right away.']
  },

  // ================= Egg =================
  {
    id: 'tortang-giniling', group: 'egg', name: 'Tortang Giniling', mealTypes: ['breakfast', 'lunch', 'dinner'], servings: 4, minutes: 30, withRice: true,
    ingredients: [ing('ground_pork', 0.25), ing('egg', 4), ing('potato', 0.15), ing('onion', 0.1), ing('garlic', 0.02), ing('salt', 0.01), ing('oil', 0.1)],
    steps: ['Sauté garlic, onion, giniling and finely diced potatoes until cooked; cool slightly.', 'Mix with beaten eggs and salt.', 'Pour into a hot oiled pan; cook until set, flip and brown the other side.']
  }
];

export const RECIPES_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));
