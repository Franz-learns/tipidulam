# Recipe photos

Put one photo per dish in this folder, named exactly as below. It shows up automatically on the recipe cards, the recipe popup, the meal plan and the dashboard. Dishes without a photo keep their icon.

| Dish | File name |
|---|---|
| Hotsilog | `hotsilog.jpg` |
| Longsilog | `longsilog.jpg` |
| Tuyo, Itlog at Sinangag | `tuyosilog.jpg` |
| Scrambled Egg with Kamatis | `scrambled-egg-tomato.jpg` |
| Tortang Talong | `tortang-talong.jpg` |
| Ginisang Corned Beef | `corned-beef-guisado.jpg` |
| Adobong Manok | `adobong-manok.jpg` |
| Tinolang Manok | `tinolang-manok.jpg` |
| Sinigang na Baboy | `sinigang-na-baboy.jpg` |
| Ginisang Monggo | `ginisang-monggo.jpg` |
| Pinakbet | `pinakbet.jpg` |
| Adobong Kangkong | `adobong-kangkong.jpg` |
| Ginisang Sardinas with Misua | `sardinas-misua.jpg` |
| Pritong Galunggong | `pritong-galunggong.jpg` |
| Paksiw na Bangus | `paksiw-na-bangus.jpg` |
| Chicken Afritada | `chicken-afritada.jpg` |
| Tokwa't Baboy | `tokwat-baboy.jpg` |
| Ginisang Repolyo | `ginisang-repolyo.jpg` |
| Pancit Bihon | `pancit-bihon.jpg` |
| Ginataang Kalabasa at Sitaw | `ginataang-kalabasa.jpg` |
| Ginisang Pechay with Giniling | `ginisang-pechay.jpg` |

## Photo tips

- **Size:** about 1200 × 750 px (landscape, 16:10) and under 200 KB. Squoosh (squoosh.app) or any photo editor can resize and compress.
- **Format:** `.jpg` by default. For `.webp` or `.png`, or a different file name, add an entry in `js/core/data/photos.js`.
- **Framing:** the cards crop to a wide rectangle, so keep the food in the center.

## Where to get photos you're allowed to use

1. **Take your own.** This is best for a capstone: it's authentic, and you own the rights.
2. **Unsplash or Pexels:** free to use, credit appreciated.
3. **Wikimedia Commons:** many Filipino dishes are there under Creative Commons. You **must** credit the author and license. Add it in `js/core/data/photos.js`, e.g. `'pinakbet': { credit: 'Author Name, CC BY-SA 4.0, via Wikimedia Commons' }`, and it will show under the photo in the recipe popup.

Don't copy photos from recipe blogs, Facebook pages or Google Images unless the owner gave permission. Those photos are copyrighted.
