/**
 * Automatic Client-Side Background Removal for ButtonMaker
 * Powered by @imgly/background-removal (WebAssembly / ONNX Runtime Web).
 * 100% free, runs entirely inside the user's browser, no server or API key required.
 */

export async function removeImageBackground(imageSource, onProgress) {
  try {
    // Dynamic import to keep initial bundle size lightweight
    const { default: removeBackground } = await import('@imgly/background-removal');

    const config = {
      model: 'small', // quantized 8-bit model for fast download & low memory
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

    const blob = await removeBackground(imageSource, config);
    return blob;
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
