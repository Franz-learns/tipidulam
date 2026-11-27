# TipidUlam — Scan Your Ref

Take a photo of the ref or pantry → AI lists the items → user confirms/edits → saved to inventory → Filipino ulam suggestions + missing items to the grocery list.

## Files

| File | What it does |
|---|---|
| `api/scan.js` | Serverless function. Holds the Gemini API key, sends the photo, returns clean JSON. |
| `js/scan.js` | Compresses the photo in the browser (~1024px JPEG) and calls `/api/scan`. |
| `js/inventory.js` | Inventory + grocery list (localStorage for now). |
| `js/recipes.js` | Recipe database and matching (English + Filipino ingredient names). |
| `js/scan-page.js` | Page logic for `scan.html`. |
| `scan.html` | The Scan Your Ref page (Bootstrap 5.3.9). |

Copy `api/`, the `js/` files and `scan.html` into your TipidUlam project root. Keep `package.json` (`"type": "module"`), or merge that line into yours.

## Setup

1. **Get a free API key** at Google AI Studio (aistudio.google.com) → *Get API key*.
2. **Install the Vercel CLI**: `npm i -g vercel`
3. **Create `.env.local`** in the project root (never commit this):
   ```
   GEMINI_API_KEY=your-key-here
   ```
   Optional: `GEMINI_MODEL=gemini-3.7-flash` to change the model.
4. **Run locally**: `vercel dev` → open `http://localhost:3000/scan.html`
5. **Deploy**: `vercel`, then add `GEMINI_API_KEY` under *Project → Settings → Environment Variables* and redeploy.

> Opening `scan.html` straight from the file system or with Live Server won't run `/api/scan`. Use `vercel dev`, or use demo mode below.

## Demo mode (no API, no internet)

Open `scan.html?mock=1`. Any photo returns a fixed sample list (eggs, eggplant, chicken, kangkong…). Good for testing the UI and as a backup during your defense.

## Notes for your SAD documentation

- **Human verification step**: AI results are suggestions; the user confirms every item before it reaches the inventory. Low-confidence rows are highlighted.
- **Security**: API key exists only on the server; all AI text is rendered with `textContent` (no HTML injection); the server whitelists units and categories and caps quantities.
- **Limitations**: can't see inside opaque containers or behind other items, can't reliably read expiry dates, and accuracy drops with dark or blurry photos.
- **Adding recipes**: add an entry to `RECIPES` in `js/recipes.js`. List the English and Filipino names for each ingredient.
- **Free tier**: Google may use free-tier inputs to improve its products. Fine for fridge photos; switch to the paid tier for a real launch.
