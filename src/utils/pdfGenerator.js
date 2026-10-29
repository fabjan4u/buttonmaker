import { jsPDF } from 'jspdf';
import { renderButtonCanvas } from './canvasRenderer';

/**
 * Calculates how many buttons fit on a given paper format
 */
export function calculateSheetGrid(paper, template, options = {}) {
  const { gapMm = 3, marginMm = 8 } = options;
  const cutDiam = template.cutDiameterMm;

  const availableWidth = paper.widthMm - 2 * marginMm;
  // Reserve 16mm at bottom for calibration bar and metadata
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
export function generateHighResBadgeDataUrl(badgeOptions, resolutionPx = 1000) {
  const canvas = document.createElement('canvas');
  canvas.width = resolutionPx;
  canvas.height = resolutionPx;
  const ctx = canvas.getContext('2d');

  renderButtonCanvas(ctx, {
    ...badgeOptions,
    width: resolutionPx,
    height: resolutionPx,
    showGuides: false,
    is3DPreview: false
  });

  return canvas.toDataURL('image/png', 1.0);
}

/**
 * Generates and downloads a print-ready 300 DPI PDF sheet on 100% true physical scale
 * Supports direct slot-based grid printing (matching badgermaker)
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

  // Initialize jsPDF in millimeters
  const doc = new jsPDF({
    orientation: paper.widthMm > paper.heightMm ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [paper.widthMm, paper.heightMm]
  });

  // Image cache to avoid re-rendering duplicate designs
  const imageCache = new Map();
  const renderResolution = Math.min(1600, Math.max(800, Math.round(template.cutDiameterMm * 12)));
  const rMm = template.cutDiameterMm / 2;

  let slotIndex = 0;
  let activeBadgesCount = 0;

  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      if (slotIndex >= grid.maxButtonsPerPage) break;

      const badge = slots[slotIndex];
      const badgeX = grid.startX + c * (grid.cutDiam + grid.gapMm);
      const badgeY = grid.startY + r * (grid.cutDiam + grid.gapMm);
      const centerX = badgeX + rMm;
      const centerY = badgeY + rMm;

      if (badge) {
        activeBadgesCount++;
        let imgData = imageCache.get(badge);
        if (!imgData) {
          imgData = generateHighResBadgeDataUrl(badge, renderResolution);
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
          `badge-img-${slotIndex}`,
          'FAST'
        );
      }

      // Draw vector cut guide around every slot (or active slots)
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

      slotIndex++;
    }
  }

  // Header / Metadata at top of sheet
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(
    `ButtonMaker • Formaat: ${template.name} (Snijmaat: ${template.cutDiameterMm}mm / Gezicht: ${template.faceDiameterMm}mm) • ${activeBadgesCount} buttons op ${paper.name.split(' ')[0]}`,
    paper.marginMm,
    paper.marginMm + 2
  );

  // Calibration test bar and printer instructions at bottom
  if (includeCalibration) {
    const bottomY = paper.heightMm - paper.marginMm - 4;

    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text(
      '⚠️ Belangrijk: Print op 100% / Schaal: Geen (Actual Size / Do not scale)',
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

  // Save the PDF
  const filename = `buttons-${template.id}-${activeBadgesCount}stuks-${paper.id}.pdf`;
  doc.save(filename);
}
