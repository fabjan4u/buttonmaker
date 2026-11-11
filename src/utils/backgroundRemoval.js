/**
 * Automatic Client-Side Background Removal for ButtonMaker
 * Powered by @imgly/background-removal (WebAssembly / ONNX Runtime Web).
 * 100% free, runs entirely inside the user's browser, no server or API key required.
 */

/**
 * Safely converts a base64 Data URL to a native Blob without relying on fetch(data:).
 * Prevents URL length limits and browser-specific fetch(data:) restrictions.
 */
function dataUrlToBlob(dataUrl) {
  try {
    const parts = dataUrl.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (e) {
    console.warn('dataUrlToBlob fallback failed:', e);
    return null;
  }
}

/**
 * Normalizes any image input (Blob, File, HTMLImageElement, or Data URL) into a Blob
 */
async function prepareInputBlob(imageSource) {
  if (imageSource instanceof Blob) {
    return imageSource;
  }

  if (typeof imageSource === 'string') {
    if (imageSource.startsWith('data:')) {
      const b = dataUrlToBlob(imageSource);
      if (b) return b;
    }
    const res = await fetch(imageSource);
    return await res.blob();
  }

  if (imageSource instanceof HTMLImageElement) {
    if (imageSource.src && imageSource.src.startsWith('data:')) {
      const b = dataUrlToBlob(imageSource.src);
      if (b) return b;
    }
    const canvas = document.createElement('canvas');
    canvas.width = imageSource.naturalWidth || imageSource.width || 800;
    canvas.height = imageSource.naturalHeight || imageSource.height || 800;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageSource, 0, 0);
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  }

  return imageSource;
}

export async function removeImageBackground(imageSource, onProgress) {
  try {
    // Dynamic import to keep initial bundle size lightweight
    const imgly = await import('@imgly/background-removal');
    const removeBackground = imgly.removeBackground || imgly.default;

    if (typeof removeBackground !== 'function') {
      throw new Error('@imgly/background-removal export not found');
    }

    const inputBlob = await prepareInputBlob(imageSource);

    const config = {
      model: 'small', // quantized 8-bit model (isnet_quint8) for fast download & low memory
      publicPath: 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/',
      progress: (key, current, total) => {
        if (typeof onProgress === 'function') {
          const percent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
          let label = 'AI model initialiseren...';
          if (key.includes('fetch')) {
            label = `AI model downloaden (${percent}%)...`;
          } else if (key.includes('compute') || key.includes('process')) {
            label = `Achtergrond verwijderen (${percent}%)...`;
          }
          onProgress({ key, current, total, percent, label });
        }
      }
    };

    const resultBlob = await removeBackground(inputBlob, config);
    return resultBlob;
  } catch (error) {
    console.error('Fout bij achtergrond verwijderen:', error);
    throw error;
  }
}

/**
 * Converts a Blob to an HTMLImageElement and data URL
 */
export function blobToImage(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const img = new Image();
      img.onload = () => resolve({ img, dataUrl });
      img.onerror = (err) => reject(err);
      img.src = dataUrl;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(blob);
  });
}
