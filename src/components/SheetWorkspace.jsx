import React, { useState } from 'react';
import { BadgeSlot } from './BadgeSlot';
import { calculateSheetGrid } from '../utils/pdfGenerator';
import { ChevronLeft, ChevronRight, PlusCircle, ZoomIn, ZoomOut } from 'lucide-react';

export function SheetWorkspace({
  paper,
  template,
  badges,
  currentPage = 0,
  setCurrentPage,
  onAddPage,
  onDropImage,
  onOpenTextEditor,
  onOpenCropModal,
  onDuplicateToAll,
  onClearSlot,
  onQuickUpload,
  onMoveSlot,
  onUploadFiles,
  onSlotClick
}) {
  const [zoomScale, setZoomScale] = useState(1);
  const grid = calculateSheetGrid(paper, template);
  const slotsPerPage = grid.maxButtonsPerPage;

  // Multi-page calculation
  const totalSlotsCount = badges.length;
  const totalPages = Math.max(1, Math.ceil(totalSlotsCount / slotsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages - 1);

  // Slices badges for the currently visible page
  const pageStartIndex = safeCurrentPage * slotsPerPage;
  const activeCount = badges.filter(Boolean).length;

  const handleWorkspaceDrop = (e) => {
    // If dropping files directly from computer onto the workspace
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && onUploadFiles) {
      e.preventDefault();
      onUploadFiles(e.dataTransfer.files);
    }
  };

  return (
    <main
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleWorkspaceDrop}
      className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 flex flex-col items-center justify-start bg-slate-950/80 select-none"
    >
      {/* Top Banner / Bar above sheet */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-3 text-xs text-slate-400 px-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span className="font-semibold text-white">{paper.name.split(' ')[0]} ({paper.widthMm}×{paper.heightMm}mm)</span>
          <span className="text-slate-600">•</span>
          <span>{template.name} ({template.cutDiameterMm}mm VEVOR stans)</span>
        </div>

        {/* Page Switcher, Zoom & Stats */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap">
          {totalPages > 1 && (
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                disabled={safeCurrentPage === 0}
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 transition"
                title="Vorige pagina"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-emerald-400 text-xs px-1 font-bold">
                P.{safeCurrentPage + 1}/{totalPages}
              </span>
              <button
                disabled={safeCurrentPage >= totalPages - 1}
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 transition"
                title="Volgende pagina"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Mobile/Desktop Sheet Zoom */}
          <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setZoomScale(z => Math.max(0.75, Number((z - 0.25).toFixed(2))))}
              className="p-1 rounded text-slate-400 hover:text-white transition"
              title="Uitzoomen"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-slate-300 text-[10px] px-1 font-semibold">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={() => setZoomScale(z => Math.min(2.0, Number((z + 0.25).toFixed(2))))}
              className="p-1 rounded text-slate-400 hover:text-white transition"
              title="Inzoomen"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full text-emerald-400 font-mono font-semibold text-[11px] sm:text-xs">
            {activeCount} buttons
          </span>

          <button
            onClick={onAddPage}
            className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs transition"
            title="Voeg een extra leeg vel toe voor meer buttons"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Extra vel</span>
          </button>
        </div>
      </div>

      {/* The Printable Paper Sheet Mockup (True Aspect Ratio) */}
      <div
        className="bg-white text-slate-800 rounded-xl shadow-2xl p-3 sm:p-6 md:p-8 border border-slate-300 relative flex flex-col justify-between transition-all"
        style={{
          width: `${zoomScale * 100}%`,
          maxWidth: zoomScale === 1 ? '780px' : 'none',
          aspectRatio: `${paper.widthMm} / ${paper.heightMm}`,
          minHeight: 'auto'
        }}
      >
        {/* Top Sheet Header Information */}
        <div className="border-b border-slate-200 pb-2 mb-3 flex items-center justify-between text-[11px] text-slate-400 font-mono flex-wrap gap-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 tracking-wider">BUTTONMAKER</span>
            <span>•</span>
            <span className="truncate max-w-[240px] sm:max-w-md">{template.name}</span>
            {totalPages > 1 && (
              <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                P.{safeCurrentPage + 1}/{totalPages}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-rose-600 font-semibold">🔴 Snijmaat: {template.cutDiameterMm}mm (VEVOR stans)</span>
            <span>|</span>
            <span className="text-emerald-700 font-semibold">🟢 Zichtbaar: {template.faceDiameterMm}mm (voorkant)</span>
          </div>
        </div>

        {/* Central Grid of Badge Slots for this page */}
        <div
          className="grid gap-2.5 sm:gap-4 flex-1 items-center justify-center my-auto"
          style={{
            gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${grid.rows}, minmax(0, 1fr))`
          }}
        >
          {Array.from({ length: slotsPerPage }).map((_, slotIdx) => {
            const globalIndex = pageStartIndex + slotIdx;
            return (
              <BadgeSlot
                key={globalIndex}
                index={globalIndex}
                badge={badges[globalIndex]}
                template={template}
                onDropImage={onDropImage}
                onOpenTextEditor={onOpenTextEditor}
                onOpenCropModal={onOpenCropModal}
                onDuplicateToAll={onDuplicateToAll}
                onClearSlot={onClearSlot}
                onQuickUpload={onQuickUpload}
                onMoveSlot={onMoveSlot}
                onSlotClick={onSlotClick}
              />
            );
          })}
        </div>

        {/* Bottom Sheet Footer: Calibration Line & Print Advice */}
        <div className="border-t border-slate-200 pt-2.5 mt-3 flex items-center justify-between text-[10px] text-slate-500 font-mono flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">⚠️ Print instructie:</span>
            <span>Kies altijd <strong>100% / Geen schaal</strong> (Do not scale / Actual size)</span>
          </div>

          {/* 50 mm Calibration Bar */}
          <div className="flex items-center gap-2">
            <span className="text-[9px]">50 mm meetlat:</span>
            <div className="w-[120px] h-3 border-b-2 border-slate-800 relative flex justify-between">
              <div className="w-[1px] h-full bg-slate-800"></div>
              <span className="text-[8px] text-slate-700 self-center">|-- 50mm --|</span>
              <div className="w-[1px] h-full bg-slate-800"></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
