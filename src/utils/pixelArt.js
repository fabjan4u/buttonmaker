/**
 * Pixel Art generator for ButtonMaker
 * Inspired by The Mad Badgers Pixel Art tools.
 * Supports downsampling, retro color palettes, Bayer dithering, and pixel grids.
 */

// Bayer 4x4 threshold matrix for ordered dithering
const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5]
];

// Curated retro color palettes
export const PIXEL_PALETTES = [
  {
    id: 'original',
    name: 'Originele Kleuren',
    description: 'Volledig kleurenpalet gepixeld',
    colors: null // null means keep original RGB colors
  },
  {
    id: 'gameboy',
    name: 'Game Boy (1989)',
    description: 'Klassiek 4-kleuren olijfgroen LCD scherm',
    colors: [
      [15, 56, 15],
      [48, 98, 48],
      [139, 172, 15],
      [155, 188, 15]
    ]
  },
  {
    id: 'arcade',
    name: '8-Bit Arcade / NES',
    description: 'Klassieke felle 16-kleuren arcade look',
    colors: [
      [0, 0, 0], [255, 255, 255], [128, 128, 128], [192, 192, 192],
      [228, 0, 88], [248, 56, 0], [228, 92, 16], [252, 224, 0],
      [0, 168, 0], [0, 232, 0], [0, 120, 248], [60, 188, 252],
      [104, 68, 252], [216, 0, 204], [172, 124, 0], [0, 88, 0]
    ]
  },
  {
    id: 'cga',
    name: 'CGA Retro PC',
    description: 'Klassiek cyaan, magenta, wit en zwart',
    colors: [
      [0, 0, 0],
      [85, 255, 255],
      [255, 85, 255],
      [255, 255, 255]
    ]
  },
  {
    id: 'pico8',
    name: 'PICO-8 Console',
    description: '16 nostalgische indie game kleuren',
    colors: [
      [0, 0, 0], [29, 43, 83], [126, 37, 83], [0, 135, 81],
      [171, 82, 54], [95, 87, 79], [194, 195, 199], [255, 241, 232],
      [255, 0, 77], [250, 162, 27], [255, 236, 39], [0, 228, 54],
      [41, 173, 255], [131, 118, 156], [255, 119, 168], [255, 204, 170]
    ]
  },
  {
    id: 'bw',
    name: '1-Bit Zwart/Wit',
    description: 'Hoge contrast krant & stempel look',
    colors: [
      [0, 0, 0],
      [255, 255, 255]
    ]
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    description: 'Synthewave neon violet, roze en cyaan',
    colors: [
      [13, 2, 33],
      [114, 9, 183],
      [247, 37, 133],
      [76, 201, 240],
      [254, 228, 64],
      [255, 255, 255]
    ]
  }
];

/**
 * Finds the nearest color in a palette using perceptual weighted distance.
 */
function findClosestColor(r, g, b, palette) {
  let bestDist = Infinity;
  let bestColor = palette[0];

  for (let i = 0; i < palette.length; i++) {
    const col = palette[i];
    // Perceptual color weighting (human eye is more sensitive to green, then red, then blue)
    const dr = r - col[0];
    const dg = g - col[1];
    const db = b - col[2];
    const dist = 0.299 * dr * dr + 0.587 * dg * dg + 0.114 * db * db;

    if (dist < bestDist) {
      bestDist = dist;
      bestColor = col;
    }
  }

  return bestColor;
}

/**
 * Applies Pixel Art effect to an image element or canvas.
 * 
 * @param {HTMLImageElement|HTMLCanvasElement} sourceImage
 * @param {Object} options
 * @param {number} options.pixelSize - Block size in pixels (e.g. 4 to 32)
 * @param {string} options.palette - Palette ID ('original', 'gameboy', etc.)
 * @param {boolean} options.dither - Whether to apply Bayer dithering
 * @param {boolean} options.showGrid - Whether to draw pixel tile grid lines
 * @returns {HTMLCanvasElement} Resulting canvas with crisp pixel art
 */
export function generatePixelArtCanvas(sourceImage, {
  pixelSize = 8,
  palette = 'original',
  dither = false,
  showGrid = false
} = {}) {
  const width = sourceImage.naturalWidth || sourceImage.width;
  const height = sourceImage.naturalHeight || sourceImage.height;

  if (!width || !height) return sourceImage;

  const safePixelSize = Math.max(2, Math.min(48, Math.round(pixelSize)));

  // 1. Calculate downscaled grid dimensions
  const cols = Math.max(8, Math.round(width / safePixelSize));
  const rows = Math.max(8, Math.round(height / safePixelSize));

  // 2. Downsample onto small offscreen canvas
  const smallCanvas = document.createElement('canvas');
  smallCanvas.width = cols;
  smallCanvas.height = rows;
  const smallCtx = smallCanvas.getContext('2d', { willReadFrequently: true });
  smallCtx.imageSmoothingEnabled = true;
  smallCtx.drawImage(sourceImage, 0, 0, cols, rows);

  // 3. Read downsampled image data
  const imgData = smallCtx.getImageData(0, 0, cols, rows);
  const data = imgData.data;

  // Selected palette colors
  const activePaletteObj = PIXEL_PALETTES.find(p => p.id === palette) || PIXEL_PALETTES[0];
  const paletteColors = activePaletteObj.colors;

  // 4. Quantize colors and apply optional Bayer dithering
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const idx = (y * cols + x) * 4;
      const alpha = data[idx + 3];

      // Skip transparent pixels (preserve background removal transparency!)
      if (alpha < 24) continue;

      let r = data[idx];
      let g = data[idx + 1];
      let b = data[idx + 2];

      // Dithering adjustment
      if (dither && paletteColors) {
        // Bayer matrix threshold scaled to [-16, +16]
        const bayerVal = (BAYER_4X4[y % 4][x % 4] - 7.5) * 4.2;
        r = Math.max(0, Math.min(255, r + bayerVal));
        g = Math.max(0, Math.min(255, g + bayerVal));
        b = Math.max(0, Math.min(255, b + bayerVal));
      }

      if (paletteColors) {
        const closest = findClosestColor(r, g, b, paletteColors);
        data[idx] = closest[0];
        data[idx + 1] = closest[1];
        data[idx + 2] = closest[2];
      }
    }
  }

  smallCtx.putImageData(imgData, 0, 0);

  // 5. Upscale back to full size using nearest-neighbor (crisp pixel blocks)
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = width;
  outputCanvas.height = height;
  const outCtx = outputCanvas.getContext('2d');
  outCtx.imageSmoothingEnabled = false; // CRITICAL for crisp pixel art!
  outCtx.drawImage(smallCanvas, 0, 0, cols, rows, 0, 0, width, height);

  // 6. Draw optional pixel grid overlay
  if (showGrid && safePixelSize >= 6) {
    outCtx.save();
    outCtx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
    outCtx.lineWidth = Math.max(0.75, width / (cols * 12));

    const stepX = width / cols;
    const stepY = height / rows;

    outCtx.beginPath();
    for (let c = 0; c <= cols; c++) {
      const x = Math.round(c * stepX);
      outCtx.moveTo(x, 0);
      outCtx.lineTo(x, height);
    }
    for (let r = 0; r <= rows; r++) {
      const y = Math.round(r * stepY);
      outCtx.moveTo(0, y);
      outCtx.lineTo(width, y);
    }
    outCtx.stroke();
    outCtx.restore();
  }

  return outputCanvas;
}
