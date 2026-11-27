// API #2 — TheMealDB (Filipino area) + detailed local PH budget recipes.
import { fetchJson, normalize } from '../utils/format.js';

export const MEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];
export const MEAL_LABELS = { breakfast: 'Almusal', lunch: 'Tanghalian', dinner: 'Hapunan' };

/**
 * Local recipes — calibrated for 4 people (servings: 4).
 * ingredients[].id links to storePricesApi.js SEED_PRICES; qty is in that item's purchase unit.
 * prepTime / cookTime are minutes. difficulty: 'Easy' | 'Medium' | 'Hard'.
 * steps[]: { title, text, minutes? } — beginner-friendly, in order.
 */
export const PH_RECIPES = [
  {
    id: 'ginisang-monggo',
    name: 'Ginisang Monggo',
    description: 'Mung bean stew with malunggay and a little giniling — the classic Friday ulam.',
    mealTypes: ['lunch', 'dinner'],
    servings: 4, prepTime: 10, cookTime: 50, difficulty: 'Easy',
    tags: ['gulay', 'protein-rich', 'tipid'],
    ingredients: [
      { id: 'monggo', qty: 0.25, prep: 'rinsed' },
      { id: 'giniling', qty: 0.1 },
      { id: 'malunggay', qty: 1, prep: 'leaves picked' },
      { id: 'kamatis', qty: 0.1, prep: 'diced' },
      { id: 'sibuyas', qty: 0.05, prep: 'chopped' },
      { id: 'bawang', qty: 0.02, prep: 'minced' },
      { id: 'patis', qty: 0.1 },
      { id: 'mantika', qty: 0.03 },
      { id: 'bigas', qty: 0.5, prep: 'for steamed rice' },
    ],
    steps: [
      { title: 'Cook the rice', text: 'Wash the rice 2–3 times, add water up to the first knuckle of your finger above the rice, and cook in a rice cooker or covered pot.', minutes: 25 },
      { title: 'Boil the monggo', text: 'Put the rinsed monggo in a pot with 6 cups of water. Boil, then lower the heat and simmer until the beans split and turn soft. Add more water if it gets too thick.', minutes: 35 },
      { title: 'Sauté the aromatics', text: 'In a separate pan, heat the oil over medium heat. Sauté the garlic until light golden, then the onion until soft, then the tomato until it breaks down.', minutes: 4 },
      { title: 'Brown the giniling', text: 'Add the ground pork and cook, breaking it apart, until no longer pink.', minutes: 5 },
      { title: 'Combine and season', text: 'Pour the sauté into the monggo pot. Season with patis a little at a time and taste. Simmer 5 more minutes.', minutes: 5 },
      { title: 'Add malunggay and serve', text: 'Turn off the heat and stir in the malunggay leaves — the heat will wilt them. Serve hot with rice.' },
    ],
  },
  {
    id: 'adobong-manok',
    name: 'Adobong Manok',
    description: 'Chicken braised in toyo, suka, garlic, and laurel.',
    mealTypes: ['lunch', 'dinner'],
    servings: 4, prepTime: 25, cookTime: 40, difficulty: 'Easy',
    tags: ['manok', 'classic', 'baon-friendly'],
    mealDbAliases: ['adobo'],
    ingredients: [
      { id: 'manok', qty: 1, prep: 'cut into serving pieces' },
      { id: 'toyo', qty: 0.1 },
      { id: 'suka', qty: 0.08 },
      { id: 'bawang', qty: 0.05, prep: 'crushed' },
      { id: 'laurel', qty: 0.2 },
      { id: 'paminta', qty: 0.1 },
      { id: 'mantika', qty: 0.03 },
      { id: 'bigas', qty: 0.5, prep: 'for steamed rice' },
    ],
    steps: [
      { title: 'Marinate', text: 'Combine the chicken, toyo, half of the garlic, and pepper in a bowl. Let it sit for at least 20 minutes (overnight in the ref is even better).', minutes: 20 },
      { title: 'Cook the rice', text: 'While the chicken marinates, wash and cook the rice.', minutes: 25 },
      { title: 'Start the braise', text: 'Put the chicken and marinade in a pot with the laurel and ½ cup water. Bring to a boil over medium-high heat.', minutes: 5 },
      { title: 'Add the suka — don’t stir!', text: 'Pour in the vinegar and let it boil uncovered for 3 minutes without stirring. This cooks off the sharp vinegar taste.', minutes: 3 },
      { title: 'Simmer until tender', text: 'Lower the heat, cover, and simmer until the chicken is tender, turning pieces once halfway.', minutes: 25 },
      { title: 'Brown for extra flavor', text: 'Optional: in a pan, fry the remaining garlic in oil, add the chicken pieces and brown them, then pour the sauce back in and reduce until slightly thick.', minutes: 7 },
      { title: 'Serve', text: 'Taste and adjust with a splash of toyo or a pinch of sugar. Spoon the sauce over hot rice.' },
    ],
  },
  {
    id: 'sinigang-na-baboy',
    name: 'Sinigang na Baboy',
    description: 'Sour tamarind pork soup with kangkong, labanos, sitaw, and gabi.',
    mealTypes: ['lunch', 'dinner'],
    servings: 4, prepTime: 15, cookTime: 70, difficulty: 'Medium',
    tags: ['baboy', 'sabaw'],
    mealDbAliases: ['sinigang'],
    ingredients: [
      { id: 'baboy', qty: 0.75, prep: 'cubed' },
      { id: 'sinigang-mix', qty: 1 },
      { id: 'kangkong', qty: 1, prep: 'cut, stalks and leaves separated' },
      { id: 'labanos', qty: 0.25, prep: 'sliced diagonally' },
      { id: 'sitaw', qty: 1, prep: 'cut into 2-inch pieces' },
      { id: 'gabi', qty: 0.25, prep: 'peeled, halved' },
      { id: 'kamatis', qty: 0.15, prep: 'quartered' },
      { id: 'sibuyas', qty: 0.1, prep: 'quartered' },
      { id: 'sili', qty: 0.3 },
      { id: 'patis', qty: 0.1 },
      { id: 'bigas', qty: 0.5, prep: 'for steamed rice' },
    ],
    steps: [
      { title: 'Boil the pork', text: 'Put the pork, onion, and tomato in a pot with 8 cups of water. Bring to a boil and skim off the gray scum that floats up — this keeps the soup clear.', minutes: 10 },
      { title: 'Simmer until tender', text: 'Lower the heat, cover, and simmer until the pork is fork-tender. Cook the rice meanwhile.', minutes: 45 },
      { title: 'Add gabi and labanos', text: 'Add the gabi first (it thickens the soup), then the labanos. Cook until soft.', minutes: 10 },
      { title: 'Season', text: 'Stir in the sinigang mix and patis. Taste — add a little more water if too sour, more patis if bland.', minutes: 2 },
      { title: 'Add the greens', text: 'Add the sitaw and sili and cook 3 minutes. Add kangkong stalks, then the leaves last and turn off the heat.', minutes: 4 },
      { title: 'Serve', text: 'Serve piping hot with rice and a small dish of patis with sili on the side.' },
    ],
  },
  {
    id: 'tortang-talong',
    name: 'Tortang Talong',
    description: 'Grilled eggplant dipped in seasoned egg and pan-fried.',
    mealTypes: ['breakfast', 'lunch', 'dinner'],
    servings: 4, prepTime: 15, cookTime: 20, difficulty: 'Easy',
    tags: ['gulay', 'itlog', 'tipid'],
    ingredients: [
      { id: 'talong', qty: 0.5, prep: '4 medium pieces' },
      { id: 'itlog', qty: 4, prep: 'beaten' },
      { id: 'sibuyas', qty: 0.03, prep: 'minced' },
      { id: 'bawang', qty: 0.01, prep: 'minced' },
      { id: 'mantika', qty: 0.08 },
      { id: 'asin', qty: 0.01 },
      { id: 'bigas', qty: 0.5, prep: 'for steamed rice' },
    ],
    steps: [
      { title: 'Char the eggplants', text: 'Grill the eggplants directly over the stove flame (or broil), turning often, until the skin is blackened and the flesh is soft.', minutes: 10 },
      { title: 'Peel and flatten', text: 'Let them cool slightly, peel off the skin but keep the stem on. Flatten each eggplant with a fork into a fan shape.', minutes: 5 },
      { title: 'Season the egg', text: 'Beat the eggs with salt, minced onion, and garlic in a wide plate.', minutes: 2 },
      { title: 'Dip and fry', text: 'Heat oil in a pan over medium heat. Dip an eggplant in the egg, lay it in the pan, and spoon extra egg on top. Fry until golden, about 2–3 minutes per side.', minutes: 10 },
      { title: 'Serve', text: 'Drain on paper towels. Serve with rice and banana ketchup.' },
    ],
  },
  {
    id: 'tinolang-manok',
    name: 'Tinolang Manok',
    description: 'Ginger chicken soup with sayote and malunggay.',
    mealTypes: ['lunch', 'dinner'],
    servings: 4, prepTime: 15, cookTime: 40, difficulty: 'Easy',
    tags: ['manok', 'sabaw', 'comfort food'],
    ingredients: [
      { id: 'manok', qty: 0.75, prep: 'cut into serving pieces' },
      { id: 'sayote', qty: 0.5, prep: 'peeled, wedges' },
      { id: 'malunggay', qty: 1, prep: 'leaves picked' },
      { id: 'luya', qty: 0.05, prep: 'julienned' },
      { id: 'sibuyas', qty: 0.05, prep: 'sliced' },
      { id: 'bawang', qty: 0.02, prep: 'minced' },
      { id: 'patis', qty: 0.1 },
      { id: 'mantika', qty: 0.02 },
      { id: 'bigas', qty: 0.5, prep: 'for steamed rice' },
    ],
    steps: [
      { title: 'Sauté the aromatics', text: 'Heat oil in a pot. Sauté the ginger until fragrant, then garlic and onion until soft.', minutes: 3 },
      { title: 'Sear the chicken', text: 'Add the chicken and 2 tbsp of patis. Stir until the chicken turns opaque on the outside.', minutes: 5 },
      { title: 'Simmer', text: 'Pour in 6 cups of water, bring to a boil, then lower the heat and simmer covered. Cook the rice meanwhile.', minutes: 25 },
      { title: 'Add sayote', text: 'Add the sayote and cook until just tender — a fork should go in easily.', minutes: 5 },
      { title: 'Season and finish', text: 'Taste and add the remaining patis if needed. Turn off the heat and stir in the malunggay.', minutes: 1 },
      { title: 'Serve', text: 'Serve hot. Tip: a squeeze of kalamansi on the side brightens the soup.' },
    ],
  },
  {
    id: 'sardinas-misua',
    name: 'Sardinas with Misua',
    description: 'Comforting sardine and misua noodle soup — the ultimate tipid meal.',
    mealTypes: ['breakfast', 'lunch', 'dinner'],
    servings: 4, prepTime: 5, cookTime: 15, difficulty: 'Easy',
    tags: ['de lata', 'sabaw', 'tipid'],
    ingredients: [
      { id: 'sardinas', qty: 2 },
      { id: 'misua', qty: 1 },
      { id: 'sibuyas', qty: 0.05, prep: 'sliced' },
      { id: 'bawang', qty: 0.02, prep: 'minced' },
      { id: 'mantika', qty: 0.02 },
      { id: 'bigas', qty: 0.5, prep: 'for steamed rice' },
    ],
    steps: [
      { title: 'Sauté', text: 'Heat oil in a pot. Sauté the garlic until light golden, then the onion until soft.', minutes: 3 },
      { title: 'Add the sardines', text: 'Add the sardines with all the sauce. Gently break them into chunks with your spoon.', minutes: 2 },
      { title: 'Add water', text: 'Pour in 4 cups of water and bring to a boil.', minutes: 5 },
      { title: 'Cook the misua', text: 'Add the misua and stir. It cooks very fast — about 2 minutes. Don’t overcook or it turns mushy.', minutes: 2 },
      { title: 'Serve', text: 'Taste and adjust with a pinch of salt or patis. Serve immediately with rice.' },
    ],
  },
  {
    id: 'pritong-bangus',
    name: 'Pritong Bangus',
    description: 'Crispy fried milkfish with garlic-vinegar dip and fresh tomatoes.',
    mealTypes: ['breakfast', 'lunch', 'dinner'],
    servings: 4, prepTime: 15, cookTime: 20, difficulty: 'Easy',
    tags: ['isda', 'silog'],
    ingredients: [
      { id: 'bangus', qty: 0.75, prep: 'cleaned, butterflied' },
      { id: 'mantika', qty: 0.12 },
      { id: 'asin', qty: 0.02 },
      { id: 'suka', qty: 0.05 },
      { id: 'bawang', qty: 0.02, prep: 'crushed' },
      { id: 'kamatis', qty: 0.1, prep: 'sliced' },
      { id: 'bigas', qty: 0.5, prep: 'for steamed rice' },
    ],
    steps: [
      { title: 'Salt the fish', text: 'Pat the bangus dry with paper towels and rub salt on both sides. Let it rest 10 minutes.', minutes: 10 },
      { title: 'Make the dip', text: 'Mix the suka with crushed garlic, a pinch of salt, and pepper in a small bowl.', minutes: 2 },
      { title: 'Heat the oil', text: 'Heat about ½ inch of oil in a pan over medium-high heat. It is ready when a drop of water sizzles.', minutes: 3 },
      { title: 'Fry skin side down', text: 'Lay the fish skin side down, away from you, to avoid splatter. Fry without moving it until golden and crisp.', minutes: 7 },
      { title: 'Flip and finish', text: 'Flip carefully and fry the other side until golden. Drain on paper towels.', minutes: 5 },
      { title: 'Serve', text: 'Serve with rice, sliced tomatoes, and the garlic-vinegar dip.' },
    ],
  },
  {
    id: 'pritong-tilapia',
    name: 'Pritong Tilapia',
    description: 'Whole fried tilapia, crispy outside and juicy inside.',
    mealTypes: ['lunch', 'dinner'],
    servings: 4, prepTime: 10, cookTime: 20, difficulty: 'Easy',
    tags: ['isda'],
    ingredients: [
      { id: 'tilapia', qty: 0.75, prep: 'cleaned, scored' },
      { id: 'mantika', qty: 0.12 },
      { id: 'asin', qty: 0.02 },
      { id: 'kamatis', qty: 0.15, prep: 'diced' },
      { id: 'sibuyas', qty: 0.05, prep: 'diced' },
      { id: 'bigas', qty: 0.5, prep: 'for steamed rice' },
    ],
    steps: [
      { title: 'Prepare the fish', text: 'Make 2–3 diagonal cuts on each side of the tilapia. Pat dry and rub with salt inside and out.', minutes: 5 },
      { title: 'Heat the oil', text: 'Heat the oil in a pan over medium-high heat until shimmering.', minutes: 3 },
      { title: 'Fry', text: 'Slide the fish in and fry until the edges are golden and crisp, about 6–7 minutes per side. Flip only once.', minutes: 14 },
      { title: 'Make the salsa', text: 'Toss the diced tomato and onion with a pinch of salt.', minutes: 2 },
      { title: 'Serve', text: 'Serve the fish with rice and the tomato-onion salsa.' },
    ],
  },
  {
    id: 'ginisang-sayote',
    name: 'Ginisang Sayote',
    description: 'Sautéed chayote with a little ground pork — quick, light, and cheap.',
    mealTypes: ['lunch', 'dinner'],
    servings: 4, prepTime: 10, cookTime: 15, difficulty: 'Easy',
    tags: ['gulay', 'tipid'],
    ingredients: [
      { id: 'sayote', qty: 0.75, prep: 'peeled, julienned' },
      { id: 'giniling', qty: 0.15 },
      { id: 'kamatis', qty: 0.1, prep: 'diced' },
      { id: 'sibuyas', qty: 0.05, prep: 'chopped' },
      { id: 'bawang', qty: 0.02, prep: 'minced' },
      { id: 'patis', qty: 0.05 },
      { id: 'mantika', qty: 0.03 },
      { id: 'bigas', qty: 0.5, prep: 'for steamed rice' },
    ],
    steps: [
      { title: 'Prep the sayote', text: 'Peel the sayote under running water (the sap is sticky), then cut into thin strips.', minutes: 5 },
      { title: 'Sauté aromatics', text: 'Heat oil over medium heat. Sauté garlic, onion, then tomato until soft.', minutes: 3 },
      { title: 'Cook the giniling', text: 'Add the ground pork and cook until browned. Season with patis.', minutes: 5 },
      { title: 'Add sayote', text: 'Add the sayote and ¼ cup water. Cover and cook until tender-crisp, stirring once.', minutes: 6 },
      { title: 'Serve', text: 'Taste, adjust seasoning, and serve with rice.' },
    ],
  },
  {
    id: 'lugaw-itlog',
    name: 'Lugaw with Itlog',
    description: 'Ginger rice porridge topped with boiled egg, toasted garlic, and kalamansi.',
    mealTypes: ['breakfast', 'dinner'],
    servings: 4, prepTime: 10, cookTime: 40, difficulty: 'Easy',
    tags: ['sabaw', 'tipid', 'comfort food'],
    ingredients: [
      { id: 'bigas', qty: 0.3, prep: 'rinsed' },
      { id: 'itlog', qty: 4 },
      { id: 'luya', qty: 0.05, prep: 'julienned' },
      { id: 'bawang', qty: 0.03, prep: 'minced' },
      { id: 'sibuyas', qty: 0.05, prep: 'chopped' },
      { id: 'patis', qty: 0.08 },
      { id: 'mantika', qty: 0.03 },
      { id: 'calamansi', qty: 0.2 },
    ],
    steps: [
      { title: 'Toast the garlic', text: 'Fry the minced garlic in oil over low heat until golden. Scoop it out and set aside for topping — keep the garlic oil in the pot.', minutes: 4 },
      { title: 'Sauté ginger and onion', text: 'In the same oil, sauté the ginger and onion until fragrant.', minutes: 2 },
      { title: 'Toast the rice', text: 'Add the rinsed rice and stir for 2 minutes so it absorbs the flavor.', minutes: 2 },
      { title: 'Simmer', text: 'Add 8 cups of water. Bring to a boil, then simmer on low, stirring every few minutes so it doesn’t stick, until thick and creamy.', minutes: 30 },
      { title: 'Boil the eggs', text: 'Meanwhile, boil the eggs for 10 minutes, cool in water, and peel.', minutes: 10 },
      { title: 'Season and serve', text: 'Season the lugaw with patis. Serve topped with a halved egg, toasted garlic, and kalamansi on the side.' },
    ],
  },
  {
    id: 'pancit-bihon',
    name: 'Pancit Bihon',
    description: 'Stir-fried rice noodles with chicken, cabbage, and carrots — party-style on a budget.',
    mealTypes: ['breakfast', 'lunch', 'dinner'],
    servings: 4, prepTime: 20, cookTime: 25, difficulty: 'Medium',
    tags: ['noodles', 'merienda', 'handaan'],
    mealDbAliases: ['pancit'],
    ingredients: [
      { id: 'bihon', qty: 1 },
      { id: 'manok', qty: 0.25, prep: 'boiled and shredded' },
      { id: 'repolyo', qty: 0.25, prep: 'shredded' },
      { id: 'carrots', qty: 0.15, prep: 'julienned' },
      { id: 'sibuyas', qty: 0.05, prep: 'sliced' },
      { id: 'bawang', qty: 0.03, prep: 'minced' },
      { id: 'toyo', qty: 0.05 },
      { id: 'mantika', qty: 0.03 },
      { id: 'calamansi', qty: 0.2 },
    ],
    steps: [
      { title: 'Soak the bihon', text: 'Soak the noodles in tap water for 10 minutes until pliable, then drain.', minutes: 10 },
      { title: 'Make the broth', text: 'Boil the chicken in 3 cups of water until cooked. Shred the meat and keep the broth.', minutes: 15 },
      { title: 'Sauté', text: 'Heat oil in a wok. Sauté garlic and onion, then add the chicken, carrots, and cabbage. Cook 2 minutes and scoop out half of the vegetables for topping.', minutes: 4 },
      { title: 'Cook the noodles', text: 'Pour in 2 cups of broth and the toyo and bring to a boil. Add the bihon and toss continuously with tongs until all liquid is absorbed.', minutes: 5 },
      { title: 'Top and serve', text: 'Top with the reserved vegetables. Serve with kalamansi wedges.' },
    ],
  },
  {
    id: 'sinangag-itlog',
    name: 'Sinangag at Itlog',
    description: 'Garlic fried rice with sunny-side-up eggs and tomatoes.',
    mealTypes: ['breakfast'],
    servings: 4, prepTime: 5, cookTime: 15, difficulty: 'Easy',
    tags: ['silog', 'tipid'],
    ingredients: [
      { id: 'bigas', qty: 0.4, prep: 'cooked the day before' },
      { id: 'itlog', qty: 4 },
      { id: 'bawang', qty: 0.04, prep: 'minced' },
      { id: 'mantika', qty: 0.05 },
      { id: 'asin', qty: 0.01 },
      { id: 'kamatis', qty: 0.1, prep: 'sliced' },
    ],
    steps: [
      { title: 'Use day-old rice', text: 'Cold leftover rice works best — fresh rice gets mushy. Break up any clumps with your hands.', minutes: 2 },
      { title: 'Fry the garlic', text: 'Heat oil over medium-low heat and fry the garlic, stirring, until light golden. Don’t let it burn — it turns bitter.', minutes: 3 },
      { title: 'Fry the rice', text: 'Add the rice and salt. Toss over medium-high heat until every grain is coated and hot.', minutes: 5 },
      { title: 'Fry the eggs', text: 'In another pan, fry the eggs sunny side up, spooning hot oil over the yolks.', minutes: 4 },
      { title: 'Serve', text: 'Serve the sinangag with eggs and sliced tomatoes.' },
    ],
  },
  {
    id: 'champorado',
    name: 'Champorado',
    description: 'Chocolate rice porridge with tablea and evap.',
    mealTypes: ['breakfast'],
    servings: 4, prepTime: 5, cookTime: 30, difficulty: 'Easy',
    tags: ['matamis', 'comfort food'],
    ingredients: [
      { id: 'bigas', qty: 0.25, prep: 'rinsed' },
      { id: 'tablea', qty: 1 },
      { id: 'asukal', qty: 0.15 },
      { id: 'evap', qty: 1 },
    ],
    steps: [
      { title: 'Boil the rice', text: 'Bring 6 cups of water to a boil, add the rice, and lower the heat.', minutes: 5 },
      { title: 'Simmer and stir', text: 'Simmer, stirring every few minutes, until the rice is soft and the porridge thickens.', minutes: 20 },
      { title: 'Add the tablea', text: 'Drop in the tablea and stir until fully melted.', minutes: 3 },
      { title: 'Sweeten', text: 'Add sugar gradually and taste. Cook 2 more minutes.', minutes: 2 },
      { title: 'Serve', text: 'Ladle into bowls and drizzle with evaporated milk. Best with tuyo, if your budget allows!' },
    ],
  },
  {
    id: 'cornsilog',
    name: 'Corned Beef Silog',
    description: 'Sautéed corned beef with potatoes, garlic rice, and fried egg.',
    mealTypes: ['breakfast'],
    servings: 4, prepTime: 10, cookTime: 20, difficulty: 'Easy',
    tags: ['silog', 'de lata'],
    ingredients: [
      { id: 'corned-beef', qty: 2 },
      { id: 'patatas', qty: 0.2, prep: 'small cubes' },
      { id: 'sibuyas', qty: 0.05, prep: 'chopped' },
      { id: 'itlog', qty: 4 },
      { id: 'bawang', qty: 0.03, prep: 'minced' },
      { id: 'mantika', qty: 0.05 },
      { id: 'bigas', qty: 0.4, prep: 'day-old, for sinangag' },
    ],
    steps: [
      { title: 'Fry the potatoes', text: 'Fry the diced potatoes in oil until golden and cooked through.', minutes: 8 },
      { title: 'Add the corned beef', text: 'Add onion, then the corned beef. Break it apart and cook until slightly crispy.', minutes: 5 },
      { title: 'Make garlic rice', text: 'Fry the garlic until golden, add the rice, and toss until hot.', minutes: 5 },
      { title: 'Fry the eggs', text: 'Fry the eggs to your liking.', minutes: 4 },
      { title: 'Serve', text: 'Plate corned beef, sinangag, and egg together.' },
    ],
  },
  {
    id: 'tortang-tuna',
    name: 'Tortang Tuna',
    description: 'Tuna and egg patties with onion — quick almusal or baon.',
    mealTypes: ['breakfast', 'lunch'],
    servings: 4, prepTime: 10, cookTime: 10, difficulty: 'Easy',
    tags: ['de lata', 'itlog', 'baon-friendly'],
    ingredients: [
      { id: 'tuna', qty: 1, prep: 'drained' },
      { id: 'itlog', qty: 4, prep: 'beaten' },
      { id: 'sibuyas', qty: 0.05, prep: 'minced' },
      { id: 'mantika', qty: 0.04 },
      { id: 'bigas', qty: 0.4, prep: 'for steamed rice' },
    ],
    steps: [
      { title: 'Mix', text: 'Combine the drained tuna, beaten eggs, and onion in a bowl.', minutes: 2 },
      { title: 'Heat the pan', text: 'Heat a thin layer of oil over medium heat.', minutes: 2 },
      { title: 'Fry the patties', text: 'Scoop ¼ cup of the mixture per patty. Fry until set and golden, about 2 minutes per side.', minutes: 8 },
      { title: 'Serve', text: 'Serve with rice and ketchup.' },
    ],
  },
  {
    id: 'adobong-kangkong',
    name: 'Adobong Kangkong with Tokwa',
    description: 'Water spinach and fried tofu in adobo sauce.',
    mealTypes: ['lunch', 'dinner'],
    servings: 4, prepTime: 10, cookTime: 15, difficulty: 'Easy',
    tags: ['gulay', 'meatless', 'tipid'],
    ingredients: [
      { id: 'kangkong', qty: 3, prep: 'stalks and leaves separated' },
      { id: 'tokwa', qty: 2, prep: 'cubed' },
      { id: 'toyo', qty: 0.06 },
      { id: 'suka', qty: 0.05 },
      { id: 'bawang', qty: 0.04, prep: 'minced' },
      { id: 'mantika', qty: 0.05 },
      { id: 'bigas', qty: 0.5, prep: 'for steamed rice' },
    ],
    steps: [
      { title: 'Fry the tokwa', text: 'Pat the tofu cubes dry and fry until golden on all sides. Set aside.', minutes: 8 },
      { title: 'Sauté garlic', text: 'In the same pan, sauté the garlic until fragrant.', minutes: 1 },
      { title: 'Cook the stalks', text: 'Add the kangkong stalks first since they take longer. Pour in toyo and suka; let it simmer without stirring for 1 minute.', minutes: 2 },
      { title: 'Add leaves and tokwa', text: 'Add the leaves and tofu, toss just until wilted.', minutes: 1 },
      { title: 'Serve', text: 'Serve right away with rice.' },
    ],
  },
  {
    id: 'ginisang-pechay',
    name: 'Ginisang Pechay with Giniling',
    description: 'Sautéed pechay and ground pork in a light savory sauce.',
    mealTypes: ['lunch', 'dinner'],
    servings: 4, prepTime: 10, cookTime: 12, difficulty: 'Easy',
    tags: ['gulay', 'tipid'],
    ingredients: [
      { id: 'pechay', qty: 2, prep: 'cut, stems and leaves separated' },
      { id: 'giniling', qty: 0.2 },
      { id: 'kamatis', qty: 0.1, prep: 'diced' },
      { id: 'sibuyas', qty: 0.05, prep: 'chopped' },
      { id: 'bawang', qty: 0.02, prep: 'minced' },
      { id: 'patis', qty: 0.05 },
      { id: 'mantika', qty: 0.03 },
      { id: 'bigas', qty: 0.5, prep: 'for steamed rice' },
    ],
    steps: [
      { title: 'Sauté', text: 'Sauté garlic, onion, and tomato in oil until soft.', minutes: 3 },
      { title: 'Brown the giniling', text: 'Add the ground pork; cook until browned. Season with patis.', minutes: 5 },
      { title: 'Add pechay', text: 'Add the stems first and cook 2 minutes, then the leaves until just wilted.', minutes: 3 },
      { title: 'Serve', text: 'Taste, adjust, and serve with rice.' },
    ],
  },
];

/** Fetch the list of Filipino dishes from TheMealDB (name, id, thumbnail). */
export async function fetchFilipinoMeals() {
  try {
    const data = await fetchJson(`${MEALDB_BASE}/filter.php?a=Filipino`, { timeoutMs: 7000 });
    return data.meals ?? [];
  } catch (err) {
    console.warn('[recipesApi] TheMealDB list unavailable:', err.message);
    return [];
  }
}

/** Full details for one meal (instructions, thumbnail, YouTube). */
export async function lookupMeal(id) {
  try {
    const data = await fetchJson(`${MEALDB_BASE}/lookup.php?i=${encodeURIComponent(id)}`, { timeoutMs: 7000 });
    return data.meals?.[0] ?? null;
  } catch (err) {
    console.warn('[recipesApi] lookup failed:', err.message);
    return null;
  }
}

const matches = (recipe, meal) => {
  const mealName = normalize(meal.strMeal);
  return [recipe.name, ...(recipe.mealDbAliases ?? [])].map(normalize).some((k) => mealName.includes(k));
};

/**
 * Local recipes enriched with TheMealDB photos/links where names match.
 * Never throws — if TheMealDB is down, local recipes are returned as-is.
 */
export async function getAllRecipes() {
  const remote = await fetchFilipinoMeals();
  return PH_RECIPES.map((r) => {
    const hit = remote.find((m) => matches(r, m));
    return hit
      ? { ...r, source: 'local+themealdb', mealDbId: hit.idMeal, image: hit.strMealThumb, sourceUrl: `https://www.themealdb.com/meal/${hit.idMeal}` }
      : { ...r, source: 'local' };
  });
}

/** TheMealDB Filipino dishes not in our local list (for "more ideas"). */
export async function getMealDbInspirations() {
  const remote = await fetchFilipinoMeals();
  return remote.filter((m) => !PH_RECIPES.some((r) => matches(r, m)));
}
