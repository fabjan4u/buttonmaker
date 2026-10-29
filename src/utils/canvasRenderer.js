/**
 * Canvas Rendering Engine for ButtonMaker
 * Handles high-resolution rendering, layers, curved text, auto cover-crop, and print guides.
 */

export function renderButtonCanvas(ctx, options) {
  const {
    width,
    height,
    template,
    image,
    imageProps = { x: 0, y: 0, scale: 1, rotation: 0, flipX: false, flipY: false, brightness: 100, contrast: 100, grayscale: 0 },
    backgroundColor = '#ffffff',
    backgroundType = 'solid', // 'solid', 'gradient', 'transparent'
    gradientColor2 = '#3b82f6',
    gradientDirection = 'vertical',
    textLayers = [],
    showGuides = true,
    showFaceGuide = true,
    showCutGuide = true,
    showBleedShade = true,
    is3DPreview = false,
    usePadding = false,
  } = options;

  const size = Math.min(width, height);
  const cx = width / 2;
  const cy = height / 2;

  // Exact relative radii based on physical button specifications
  // When printing (showGuides === false) or rendering in a round slot, cutRadius is exactly size / 2.
  // Slight padding is only used if explicitly requested (e.g. editor modal preview)
  const paddingRatio = usePadding ? 0.04 : 0;
  const cutRadius = (size / 2) * (1 - paddingRatio);
  const faceRadius = cutRadius * (template.faceDiameterMm / template.cutDiameterMm);

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Save base state
  ctx.save();

  // If rendering for 3D preview, clip to face circle
  if (is3DPreview) {
    ctx.beginPath();
    ctx.arc(cx, cy, faceRadius, 0, Math.PI * 2);
    ctx.clip();
  } else {
    // Normal editor / print canvas: clip to exact cut circle
    ctx.beginPath();
    ctx.arc(cx, cy, cutRadius, 0, Math.PI * 2);
    ctx.clip();
  }

  // 1. Render Background
  if (backgroundType === 'solid') {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
  } else if (backgroundType === 'gradient') {
    let grad;
    if (gradientDirection === 'horizontal') {
      grad = ctx.createLinearGradient(cx - cutRadius, cy, cx + cutRadius, cy);
    } else if (gradientDirection === 'radial') {
      grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cutRadius);
    } else {
      // vertical
      grad = ctx.createLinearGradient(cx, cy - cutRadius, cx, cy + cutRadius);
    }
    grad.addColorStop(0, backgroundColor);
    grad.addColorStop(1, gradientColor2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  // 2. Render Image Layer (Direct Cover-Crop to Face Circle / Green Line)
  if (image && image.complete && image.naturalWidth > 0) {
    ctx.save();

    const imgW = image.naturalWidth;
    const imgH = image.naturalHeight;
    const minDim = Math.min(imgW, imgH);
    
    // Target diameter:
    // Default is faceRadius * 2 (the green line, e.g. 36mm) so user gets the MAXIMAL image on the visible pin!
    // (If fitMode === 'bleed', it fills to the cutRadius * 2 red cut line)
    const targetDiam = (imageProps.fitMode === 'bleed') ? (cutRadius * 2) : (faceRadius * 2);

    // Automatic cover scale: makes the smaller dimension fill the target circle 100%
    const coverScale = targetDiam / minDim;

    // User zoom factor (default 1.0 = exact cover fit)
    const rawScale = typeof imageProps.scale === 'number' && imageProps.scale > 0 ? imageProps.scale : 1.0;
    // Handle any legacy sub-0.3 scale values from old 640px base math gracefully
    const userScale = (rawScale < 0.35 && minDim > 600) ? 1.0 : rawScale;
    const finalScale = coverScale * userScale;

    // Offset: normalized percentage (-50 to +50 percent of diameter)
    let offsetX = 0;
    let offsetY = 0;
    if (typeof imageProps.x === 'number') {
      if (Math.abs(imageProps.x) <= 100) {
        offsetX = (imageProps.x / 100) * targetDiam;
      } else {
        offsetX = (imageProps.x / 640) * targetDiam;
      }
    }
    if (typeof imageProps.y === 'number') {
      if (Math.abs(imageProps.y) <= 100) {
        offsetY = (imageProps.y / 100) * targetDiam;
      } else {
        offsetY = (imageProps.y / 640) * targetDiam;
      }
    }

    ctx.translate(cx + offsetX, cy + offsetY);
    ctx.rotate(((imageProps.rotation || 0) * Math.PI) / 180);
    ctx.scale(
      (imageProps.flipX ? -1 : 1) * finalScale,
      (imageProps.flipY ? -1 : 1) * finalScale
    );

    // Apply filters if needed
    if (imageProps.brightness !== 100 || imageProps.contrast !== 100 || (imageProps.grayscale || 0) > 0) {
      const b = imageProps.brightness ?? 100;
      const c = imageProps.contrast ?? 100;
      const g = imageProps.grayscale ?? 0;
      ctx.filter = `brightness(${b}%) contrast(${c}%) grayscale(${g}%)`;
    }

    // Draw image centered at origin
    ctx.drawImage(image, -imgW / 2, -imgH / 2, imgW, imgH);
    ctx.restore();
  }

  // 3. Render Text Layers (Resolution Independent via fontScale relative to 640px editor base)
  const fontScale = size / 640;

  textLayers.forEach(layer => {
    if (!layer.text || !layer.text.trim()) return;

    ctx.save();
    const fontSize = Math.max(8, Math.round((layer.fontSize || 32) * fontScale));
    const fontFamily = layer.fontFamily || "'Inter', sans-serif";
    const fontWeight = layer.bold ? 'bold' : 'normal';
    const fontStyle = layer.italic ? 'italic' : 'normal';
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const fillStyle = layer.color || '#ffffff';
    const strokeStyle = layer.strokeColor || '#000000';
    const hasStroke = layer.hasStroke && (layer.strokeWidth || 3) > 0;
    const strokeWidth = (layer.strokeWidth || 3) * fontScale;

    if (layer.style === 'curved-top' || layer.style === 'curved-bottom') {
      // Curved text along circular arc
      const textRadius = faceRadius * (layer.curveRadiusRatio || 0.78);
      drawCurvedText(ctx, layer.text, cx, cy, textRadius, {
        isBottom: layer.style === 'curved-bottom',
        letterSpacing: (layer.letterSpacing || 2) * fontScale,
        fillStyle,
        strokeStyle,
        hasStroke,
        strokeWidth,
        rotationOffsetDeg: layer.rotationDeg || 0
      });
    } else {
      // Straight text
      const tx = (layer.x || 0) * fontScale;
      const ty = (layer.y || 0) * fontScale;
      ctx.translate(cx + tx, cy + ty);
      ctx.rotate(((layer.rotationDeg || 0) * Math.PI) / 180);

      const lines = layer.text.split('\n');
      const lineHeight = fontSize * 1.2;
      const startY = -((lines.length - 1) * lineHeight) / 2;

      lines.forEach((line, index) => {
        const lineY = startY + index * lineHeight;
        if (hasStroke) {
          ctx.strokeStyle = strokeStyle;
          ctx.lineWidth = strokeWidth * 2;
          ctx.lineJoin = 'round';
          ctx.strokeText(line, 0, lineY);
        }
        ctx.fillStyle = fillStyle;
        ctx.fillText(line, 0, lineY);
      });
    }

    ctx.restore();
  });

  // Restore base clip
  ctx.restore();

  // 4. Render Visual Alignment Guides
  if (showGuides && !is3DPreview) {
    // Bleed Shade Area (the fold-over area that wraps around the shell)
    if (showBleedShade) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, cutRadius, 0, Math.PI * 2);
      ctx.arc(cx, cy, faceRadius, 0, Math.PI * 2, true); // counter-clockwise hole
      ctx.fillStyle = 'rgba(15, 23, 42, 0.40)'; // subtle darkening
      ctx.fill();
      ctx.restore();
    }

    // Face / Art safe line (dashed emerald green line)
    if (showFaceGuide) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, faceRadius, 0, Math.PI * 2);
      ctx.strokeStyle = '#10b981'; // emerald-500
      ctx.lineWidth = Math.max(1.5, 2 * fontScale);
      ctx.setLineDash([6 * fontScale, 6 * fontScale]);
      ctx.stroke();
      ctx.restore();
    }

    // Cut line (dashed rose / red line)
    if (showCutGuide) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, cutRadius, 0, Math.PI * 2);
      ctx.strokeStyle = '#f43f5e'; // rose-500
      ctx.lineWidth = Math.max(1.5, 2 * fontScale);
      ctx.setLineDash([4 * fontScale, 4 * fontScale]);
      ctx.stroke();
      ctx.restore();
    }
  }

  // 5. Render 3D Mockup Glare / Bevel (when in 3D preview mode)
  if (is3DPreview) {
    ctx.save();

    // Convex spherical top-left highlight
    const glareGradient = ctx.createRadialGradient(
      cx - faceRadius * 0.35,
      cy - faceRadius * 0.35,
      faceRadius * 0.05,
      cx - faceRadius * 0.15,
      cy - faceRadius * 0.15,
      faceRadius * 0.95
    );
    glareGradient.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    glareGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.15)');
    glareGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.0)');
    glareGradient.addColorStop(1, 'rgba(0, 0, 0, 0.25)');

    ctx.beginPath();
    ctx.arc(cx, cy, faceRadius, 0, Math.PI * 2);
    ctx.fillStyle = glareGradient;
    ctx.fill();

    // Curved specular gloss streak across the top
    ctx.beginPath();
    ctx.ellipse(
      cx,
      cy - faceRadius * 0.45,
      faceRadius * 0.65,
      faceRadius * 0.25,
      0,
      0,
      Math.PI * 2
    );
    const sheen = ctx.createLinearGradient(cx, cy - faceRadius * 0.7, cx, cy - faceRadius * 0.2);
    sheen.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    sheen.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = sheen;
    ctx.fill();

    // Metallic outer ring border
    ctx.beginPath();
    ctx.arc(cx, cy, faceRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  }
}

/**
 * Mathematically accurate curved text along a circular arc
 */
function drawCurvedText(ctx, text, cx, cy, radius, options) {
  const {
    isBottom = false,
    letterSpacing = 2,
    fillStyle = '#ffffff',
    strokeStyle = '#000000',
    hasStroke = false,
    strokeWidth = 3,
    rotationOffsetDeg = 0
  } = options;

  const chars = Array.from(text);
  if (chars.length === 0) return;

  // Measure total width to center the arc
  const charWidths = chars.map(c => ctx.measureText(c).width + letterSpacing);
  const totalLength = charWidths.reduce((a, b) => a + b, 0);

  // Total angular span in radians
  const totalAngle = totalLength / radius;

  // Center angle in radians:
  // Top arc centers at -Math.PI / 2 (-90 deg / 12 o'clock)
  // Bottom arc centers at Math.PI / 2 (+90 deg / 6 o'clock)
  const centerAngle = (isBottom ? Math.PI / 2 : -Math.PI / 2) + (rotationOffsetDeg * Math.PI) / 180;

  let currentAngle = isBottom
    ? centerAngle + totalAngle / 2
    : centerAngle - totalAngle / 2;

  chars.forEach((char, index) => {
    const charWidth = charWidths[index];
    const halfCharAngle = (charWidth / 2) / radius;

    // Advance to center of current character
    const charCenterAngle = isBottom ? currentAngle - halfCharAngle : currentAngle + halfCharAngle;

    ctx.save();
    const charX = cx + radius * Math.cos(charCenterAngle);
    const charY = cy + radius * Math.sin(charCenterAngle);
    ctx.translate(charX, charY);

    const charRotation = isBottom
      ? charCenterAngle - Math.PI / 2
      : charCenterAngle + Math.PI / 2;

    ctx.rotate(charRotation);

    if (hasStroke) {
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = strokeWidth * 2;
      ctx.lineJoin = 'round';
      ctx.strokeText(char, 0, 0);
    }
    ctx.fillStyle = fillStyle;
    ctx.fillText(char, 0, 0);

    ctx.restore();

    // Advance angle for next character
    currentAngle = isBottom ? currentAngle - charWidth / radius : currentAngle + charWidth / radius;
  });
}
