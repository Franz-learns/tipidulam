// Shrinks a phone photo before upload: longest side → maxSize px, JPEG.
// A 4000px photo becomes ~150 KB, which keeps scans fast and cheap.

async function loadImage(file) {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('This image format is not supported. Try a JPEG or PNG photo.'));
      img.src = URL.createObjectURL(file);
    });
  }
}

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
