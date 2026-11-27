# TipidUlam — System Overview

Reference for System Analysis & Design documentation (modules, actors, processes, data dictionary). Adapt the wording to your school's template.

## Actors

| Actor | Description |
|---|---|
| Household user | Plans meals, scans the pantry, shops, and cooks |
| AI vision service (external) | Google Gemini API; identifies food items in a photo |

## Modules

1. **Budget & Household Settings**: weekly budget, household size, rice allowance, staples, local prices
2. **Meal Planning**: generates a 7-day plan within budget; swap meals; mark meals cooked
3. **Recipe Catalog**: 57 Filipino recipes in 7 categories with scaled ingredients, cost per household and per person, steps
4. **Pantry / Inventory**: AI photo scan with human verification, manual entry, expiry tracking, consumption
5. **Grocery List & Spending**: auto-generated list, actual-price entry, budget tracking, transfer to pantry
6. **Dashboard & Reports**: budget summary, today's meals, expiring items, cook-now suggestions
7. **Data Management**: backup, restore, reset

## Main processes (for DFD / flowcharts)

**P1 Generate meal plan**
Input: budget, household size, meal types, pantry, prices, recipes.
For each of 7 days × meal types, the system picks the recipe with the lowest score, where:
score = cost after pantry use + penalty for repeating a dish (same or previous day blocked) + penalty for going over the per-meal target budget + a small random factor for variety.
The target per meal is (remaining budget × 0.92) ÷ remaining meals. The 8% buffer covers buying whole packs and quarter-kilos.
Output: weekly plan → triggers P4.

**P2 Scan pantry**
Photo → compressed in the browser (max 1024 px JPEG) → `POST /api/scan` → Gemini returns structured JSON → server validates it → user reviews, edits and adds expiry dates → items matched to catalog ingredients (English/Filipino names) → saved to pantry → triggers P4.

**P3 Cook meal**
User marks a meal cooked → ingredients deducted from pantry (soonest-to-expire first) → meal flagged cooked → triggers P4.

**P4 Build grocery list**
Sum ingredients of uncooked planned meals → subtract pantry stock and already-bought items → skip staples → round up to buying amounts (e.g. 0.25 kg, whole packs) → estimate cost from prices.

**P5 Shop & track spending**
User ticks items bought and enters the actual price → spent = actual price (or estimate if blank) → "left after shopping" = budget − spent − still to buy → bought items moved to pantry.

## Data dictionary

### settings
| Field | Type | Description |
|---|---|---|
| householdSize | integer (1–20) | People eating |
| weeklyBudget | number (₱) | Food budget for 7 days |
| mealTypes | array | breakfast / lunch / dinner |
| includeRice | boolean | Add rice to meals served with rice |
| riceKgPerPersonMeal | number (kg) | Default 0.1 kg (~1 cup cooked) |
| staples | array of ingredient keys | Assumed at home; excluded from cost and list |
| priceOverrides | map key → ₱ | User's local prices |

### pantry item
| Field | Type | Description |
|---|---|---|
| id | string (UUID) | Primary key |
| name | string | Display name |
| key | string or null | Linked catalog ingredient (null if unknown) |
| qty | number | Amount on hand |
| unit | string | pc, pack, kg, bundle, … |
| category | string | meat, vegetable, … |
| expiry | date (YYYY-MM-DD) or empty | Expiry date |
| addedOn | date | Date added |

### plan
| Field | Type | Description |
|---|---|---|
| seed | number | Random seed (plan can be reproduced) |
| createdAt | datetime | When generated |
| startDate | date | First day |
| householdSize, budget | number | Settings at generation time |
| days[] | array | `{ date, meals[] }` |
| days[].meals[] | array | `{ type, recipeId, name, cost, cooked }` |
| totalCost | number (₱) | Sum of meal costs |

### grocery item
| Field | Type | Description |
|---|---|---|
| id | string (UUID) | Primary key |
| key | string or null | Catalog ingredient |
| name, qty, unit, category | | What to buy |
| estCost | number (₱) | qty × price |
| actualCost | number or null | Price paid |
| bought | boolean | Ticked as bought |
| inPantry | boolean | Already moved into pantry |
| source | plan / manual | Generated or user-added |

### ingredient (catalog, read-only)
`key, name, terms[] (English + Filipino names), category, unit, price, step (smallest buying amount)`

### recipe (catalog, read-only)
`id, group (chicken/pork/beef/seafood/vegetable/egg/noodles), name, mealTypes[], servings (4), minutes, withRice, ingredients[{key, qty}], steps[]`

## API

| Endpoint | Method | Request | Response |
|---|---|---|---|
| `/api/scan` | POST | `{ image: base64, mimeType }` | `{ items: [{ name, qty, unit, category, confidence }] }` or `{ error }` |
| `/api/health` | GET | — | `{ ok, model, hasApiKey }` |

## Scope and limitations (suggested wording)

- Plans 7 days at a time for one household.
- Costs are estimates from user-editable prices; actual market prices vary.
- The AI scan is assistive: it may miss items or misidentify them, can't see inside closed containers, and doesn't read expiry dates reliably, so every result must be confirmed by the user.
- Data is stored on the user's browser; there are no user accounts or cloud sync in this version.
- Units that can't be converted (e.g. pieces vs. kilograms) are treated as enough for one recipe.
