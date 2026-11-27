# TipidUlam — Philippine Meal & Grocery Budget Planner (Website)

Plan a week of Filipino meals within your budget, scan your ref to track what you have, and get a grocery list of only what you still need to buy.

**Stack:** plain HTML + vanilla JavaScript (ES modules) + Bootstrap 5.3.9, with one serverless API on Vercel for the AI photo scan. No build step, no framework.

## Features

| Page | What it does |
|---|---|
| **Dashboard** (`index.html`) | Budget vs. spent vs. still-to-buy, today's meals, items expiring soon, what you can cook now |
| **Meal Plan** (`planner.html`) | Generates 7 days of meals within your weekly budget; uses pantry items first; no back-to-back repeats; swap any meal; mark meals cooked (deducts from pantry) |
| **Recipes** (`recipes.html`) | 21 Filipino recipes with cost for your household, cost per person, ingredients, steps, and a "ready to cook" badge |
| **Pantry & Scan** (`pantry.html`) | Take a photo of the ref → AI lists items → you confirm/edit → saved to pantry with expiry dates; suggestions for what to cook |
| **Grocery List** (`grocery.html`) | Auto-built from the plan minus your pantry, grouped by category; tick bought, enter actual prices, move bought items into the pantry, copy the list to share |
| **Settings** (`settings.html`) | Household size, budget, rice per person, staples, local prices, backup/restore, reset |

## Quick start (demo mode, no setup)

Open any page with `?mock=1`, for example `index.html?mock=1`. Everything works, and the photo scan returns sample items instead of calling the AI. Use this for testing, and as a backup during your defense if the internet is slow.

Because the pages use ES modules, they must be served over http, not opened by double-clicking. Any of these work for demo mode:

- VS Code **Live Server** → right-click `index.html` → *Open with Live Server*, then add `?mock=1`
- `npx serve .`
- `python -m http.server 8000`

## Full setup (real AI scan)

The AI scan needs the serverless function in `api/`, which only runs under Vercel.

1. **Get a free Gemini API key** at [Google AI Studio](https://aistudio.google.com) → *Get API key*.
2. **Install the Vercel CLI:** `npm i -g vercel`
3. **Add your key:** copy `.env.example` to `.env.local` and paste your key. Never commit `.env.local`; `.gitignore` already excludes it.
4. **Run locally:** `vercel dev` → open `http://localhost:3000`
5. **Check the API:** open `http://localhost:3000/api/health` → you should see `"hasApiKey": true`.
6. **Deploy:** `vercel --prod`, then in the Vercel dashboard add `GEMINI_API_KEY` under *Project → Settings → Environment Variables* and redeploy.

If the scan says the model was not found, set `GEMINI_MODEL` in `.env.local` to a current Gemini Flash model name from Google's docs.

## Project structure

```
tipidulam/
├── index.html, planner.html, recipes.html, pantry.html, grocery.html, settings.html
├── css/styles.css
├── images/recipes/           ← put dish photos here (see its README)
├── api/                      ← serverless functions (Vercel)
│   ├── scan.js               POST /api/scan   photo → item list (Gemini)
│   └── health.js             GET  /api/health is the API configured?
├── js/
│   ├── core/                 ← NO DOM CODE: port this folder to Angular as services
│   │   ├── data/             ingredients.js (catalog + sample prices), recipes.js
│   │   ├── engine/           pure logic: planner, costing, grocery, matcher, stock, suggest
│   │   └── services/         storage, settings, pantry, plan, grocery, scan
│   ├── ui/                   layout (navbar), dom helpers, image compression
│   └── pages/                one script per page
└── docs/SYSTEM-OVERVIEW.md   modules, data dictionary, processes (for SAD documentation)
```

**Moving to Angular later:** `js/core/engine/*` and `js/core/data/*` are plain functions with no browser dependencies, so you can copy them as-is. Wrap `js/core/services/*` in Angular `@Injectable` services. Only `storage.js` touches `localStorage`; swap it for HTTP calls when you add a database.

## Recipe photos

Drop a photo named after the recipe into `images/recipes/`, e.g. `images/recipes/sinigang-na-baboy.jpg`, and it appears on the recipe cards, the recipe popup, the meal plan and the dashboard. Dishes without a photo keep their icon, so you can add photos a few at a time. `images/recipes/README.md` lists every file name, along with size tips and where to get photos you're allowed to use. Photo credits (needed for Creative Commons photos) go in `js/core/data/photos.js`.

## Important notes

- **Prices are sample estimates.** Update them in *Settings → Prices* to match your local market before presenting cost figures as real.
- **Data is saved in the browser** (localStorage). Use *Settings → Download backup* to move it between devices.
- **Security:** the API key exists only on the server. Every AI result is checked server-side (units and categories whitelisted, quantities capped), and all text is rendered with `textContent`, so there's no HTML injection.
- **AI limitations:** the scan can't see inside opaque containers or behind other items, can't reliably read expiry dates, and gets worse with dark or blurry photos. That's why the user confirms every item before it's saved.
- **Free tier:** Google may use free-tier inputs to improve its products. Fine for fridge photos; use the paid tier for a real launch.

## Adding a recipe

Add an entry to `RECIPES` in `js/core/data/recipes.js`. Ingredient `key`s must exist in `js/core/data/ingredients.js`, and quantities are per 4 servings in that ingredient's unit. Add a new ingredient to the catalog first if needed, including its Filipino/English names in `terms`.

## Design

- **Palette:** fresh green `#047857` (primary) + food amber `#D97706` (accent) on a soft green-white background. Text contrast is 4.5:1 or better.
- **Type:** Rubik for headings, Nunito Sans for body (Google Fonts).
- **Style:** minimal, flat surfaces with 1px borders and no heavy shadows. Lucide SVG icons, no emoji.
- **Layout:** sidebar on desktop; top bar + 5-item bottom nav on mobile. Touch targets are 44px or larger, focus rings are always visible, and animations turn off when the device asks for reduced motion.
- All colors and sizes are CSS variables at the top of `css/styles.css`. Change `--primary` there to re-theme the whole app.
