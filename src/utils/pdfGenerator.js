import { jsPDF } from 'jspdf';
import { renderButtonCanvas } from './canvasRenderer';

/**
 * Calculates how many buttons fit on a given paper format
 */
export function calculateSheetGrid(paper, template, options = {}) {
  const { gapMm = 3, marginMm = 8 } = options;
  const cutDiam = template.cutDiameterMm;

  const availableWidth = paper.widthMm - 2 * marginMm;
  // Reserve 14mm at bottom for calibration bar and metadata
  const availableHeight = paper.heightMm - 2 * marginMm - 14;

  const cols = Math.max(1, Math.floor((availableWidth + gapMm) / (cutDiam + gapMm)));
  const rows = Math.max(1, Math.floor((availableHeight + gapMm) / (cutDiam + gapMm)));
  const maxButtonsPerPage = cols * rows;

  // Calculate centered start coordinates
  const totalGridWidth = cols * cutDiam + (cols - 1) * gapMm;
  const totalGridHeight = rows * cutDiam + (rows - 1) * gapMm;

  const startX = (paper.widthMm - totalGridWidth) / 2;
  const startY = marginMm + 6 + (availableHeight - totalGridHeight) / 2;

  return {
    cols,
    rows,
    maxButtonsPerPage,
    startX,
    startY,
    cutDiam,
    gapMm
  };
}

/**
 * Generates an ultra high-res (300 DPI) raster image of a badge
 */
export function generateHighResBadgeDataUrl(badgeOptions, template, resolutionPx = 1000) {
  const canvas = document.createElement('canvas');
  canvas.width = resolutionPx;
  canvas.height = resolutionPx;
  const ctx = canvas.getContext('2d');

  renderButtonCanvas(ctx, {
    ...badgeOptions,
    template,
    width: resolutionPx,
    height: resolutionPx,
    showGuides: false,
    is3DPreview: false
  });

  return canvas.toDataURL('image/png', 1.0);
}

/**
 * Generates and downloads a print-ready 300 DPI PDF sheet on 100% true physical scale
 * Handles multiple pages automatically if slots count exceeds 1 page!
 */
export async function generatePrintPdf(options) {
  const {
    paper,
    template,
    slots = [], // array of badges (can contain null for empty slots)
    drawCutLine = true,
    cutLineStyle = 'dashed',
    drawCenterMark = true,
    includeCalibration = true
  } = options;

  const grid = calculateSheetGrid(paper, template);
  const totalSlots = slots.length > 0 ? slots.length : grid.maxButtonsPerPage;
  const totalPages = Math.max(1, Math.ceil(totalSlots / grid.maxButtonsPerPage));

  // Orientation
  const isLandscape = paper.widthMm > paper.heightMm;
  const orientation = isLandscape ? 'landscape' : 'portrait';

  // Initialize jsPDF in millimeters
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: [paper.widthMm, paper.heightMm]
  });

  // Image cache to avoid re-rendering duplicate designs
  const imageCache = new Map();
  const renderResolution = Math.min(1600, Math.max(800, Math.round(template.cutDiameterMm * 12)));
  const rMm = template.cutDiameterMm / 2;

  let globalSlotIndex = 0;
  let activeBadgesCount = 0;

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) {
      doc.addPage([paper.widthMm, paper.heightMm], orientation);
    }

    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        if (globalSlotIndex >= totalSlots) break;

        const badge = slots[globalSlotIndex];
        const badgeX = grid.startX + c * (grid.cutDiam + grid.gapMm);
        const badgeY = grid.startY + r * (grid.cutDiam + grid.gapMm);
        const centerX = badgeX + rMm;
        const centerY = badgeY + rMm;

        if (badge) {
          activeBadgesCount++;
          let imgData = imageCache.get(badge);
          if (!imgData) {
            imgData = generateHighResBadgeDataUrl(badge, template, renderResolution);
            imageCache.set(badge, imgData);
          }

          // Add high-res raster artwork
          doc.addImage(
            imgData,
            'PNG',
            badgeX,
            badgeY,
            template.cutDiameterMm,
            template.cutDiameterMm,
            `badge-img-${globalSlotIndex}`,
            'FAST'
          );
        }

        // Draw vector cut guide around every slot
        if (drawCutLine && cutLineStyle !== 'none') {
          doc.saveGraphicsState();
          doc.setDrawColor(badge ? 180 : 225, badge ? 180 : 225, badge ? 180 : 225);
          doc.setLineWidth(0.18);

          if (cutLineStyle === 'dashed') {
            doc.setLineDashPattern([1.5, 1.5], 0);
          } else {
            doc.setLineDashPattern([], 0);
          }

          doc.circle(centerX, centerY, rMm, 'S');
          doc.restoreGraphicsState();
        }

        // Draw rotary punch alignment center crossmark
        if (drawCenterMark) {
          doc.saveGraphicsState();
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.1);
          const crossSize = 1.2;
          doc.line(centerX - crossSize, centerY, centerX + crossSize, centerY);
          doc.line(centerX, centerY - crossSize, centerX, centerY + crossSize);
          doc.restoreGraphicsState();
        }

        globalSlotIndex++;
      }
      if (globalSlotIndex >= totalSlots) break;
    }

    // Header / Metadata at top of sheet
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    const pageLabel = totalPages > 1 ? ` (Pagina ${page + 1} van ${totalPages})` : '';
    const cleanTemplateName = (template.name || '')
      .replace(/[•\u2022]/g, '|')
      .replace(/[—–]/g, '-')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'");

    doc.text(
      `ButtonMaker | Formaat: ${cleanTemplateName} (Snijmaat: ${template.cutDiameterMm}mm / Gezicht: ${template.faceDiameterMm}mm) | VEVOR Standaard${pageLabel}`,
      paper.marginMm,
      paper.marginMm + 2
    );

    // Calibration test bar and printer instructions at bottom
    if (includeCalibration) {
      const bottomY = paper.heightMm - paper.marginMm - 4;

      doc.setFontSize(7.5);
      doc.setTextColor(100, 100, 100);
      doc.text(
        'LET OP: Print altijd op 100% / Schaal: Geen (Actual Size / Do not scale)',
        paper.marginMm,
        bottomY - 4
      );

      // 50mm Calibration bar
      const calStartX = paper.widthMm - paper.marginMm - 50;
      doc.setDrawColor(80, 80, 80);
      doc.setLineWidth(0.4);
      doc.line(calStartX, bottomY, calStartX + 50, bottomY);
      doc.line(calStartX, bottomY - 1.5, calStartX, bottomY + 1.5);
      doc.line(calStartX + 50, bottomY - 1.5, calStartX + 50, bottomY + 1.5);

      doc.text('50 mm kalibratie meetlat (controleer met liniaal)', calStartX - 60, bottomY + 1);
    }
  }

  // Save the PDF
  const filename = `vevor-buttons-${template.id}-${activeBadgesCount}stuks-${paper.id}.pdf`;
  doc.save(filename);
}

/**
 * Downloads a single high-res PNG image
 */
export function downloadSinglePng(badgeState, template, filename = 'button-design.png', withCutGuide = false) {
  const canvas = document.createElement('canvas');
  const size = 1200;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const safeTemplate = template || badgeState?.template || { faceDiameterMm: 36, cutDiameterMm: 44 };

  renderButtonCanvas(ctx, {
    ...badgeState,
    template: safeTemplate,
    width: size,
    height: size,
    showGuides: withCutGuide,
    showFaceGuide: false,
    showBleedShade: false,
    showCutGuide: withCutGuide,
    is3DPreview: false
  });

  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
}
