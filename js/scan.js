// Browser side of the scan: shrink the photo, send it to /api/scan.
// Add ?mock=1 to the page URL to use sample results (no API call) —
// handy for offline demos and for your defense if the Wi-Fi is bad.

const MOCK = new URLSearchParams(location.search).has('mock');

const MOCK_ITEMS = [
  { name: 'eggs', qty: 6, unit: 'pc', category: 'egg', confidence: 'high' },
  { name: 'eggplant', qty: 2, unit: 'pc', category: 'vegetable', confidence: 'high' },
  { name: 'tomato', qty: 3, unit: 'pc', category: 'vegetable', confidence: 'medium' },
  { name: 'kangkong', qty: 1, unit: 'bundle', category: 'vegetable', confidence: 'medium' },
  { name: 'chicken', qty: 1, unit: 'kg', category: 'meat', confidence: 'medium' },
  { name: 'hotdog', qty: 1, unit: 'pack', category: 'frozen', confidence: 'high' },
  { name: 'unknown container', qty: 1, unit: 'container', category: 'other', confidence: 'low' }
];

async function loadImage(file) {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    // Fallback for browsers that can't decode this way
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('This image format is not supported. Try a JPEG or PNG.'));
      img.src = URL.createObjectURL(file);
    });
  }
}

// Resize so the longest side is maxSize px, re-encode as JPEG.
// A 4000px phone photo becomes ~150 KB, which keeps scans fast and cheap.
export async function compressImage(file, maxSize = 1024, quality = 0.8) {
  const img = await loadImage(file);
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  return { dataUrl, base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' };
}

export async function scanImage(file) {
  if (MOCK) {
    await new Promise((r) => setTimeout(r, 800));
    return structuredClone(MOCK_ITEMS);
  }

  const { base64, mimeType } = await compressImage(file);
  const res = await fetch('/api/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64, mimeType })
  });

  let body = {};
  try { body = await res.json(); } catch { /* non-JSON error page */ }
  if (!res.ok) throw new Error(body.error || `Scan failed (${res.status}).`);
  return body.items || [];
}
