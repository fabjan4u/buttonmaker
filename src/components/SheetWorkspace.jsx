import React from 'react';
import { BadgeSlot } from './BadgeSlot';
import { calculateSheetGrid } from '../utils/pdfGenerator';
import { Sparkles, Printer, Check, Info } from 'lucide-react';

export function SheetWorkspace({
  paper,
  template,
  badges,
  onDropImage,
  onOpenTextEditor,
  onOpenImageEditor,
  onDuplicateToAll,
  onClearSlot,
  onQuickUpload
}) {
  const grid = calculateSheetGrid(paper, template);
  const totalSlots = grid.maxButtonsPerPage;
  const activeCount = badges.filter(Boolean).length;

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center justify-start bg-slate-950/80">
      {/* Top Banner / Bar above sheet */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-4 text-xs text-slate-400 px-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span className="font-semibold text-white">{paper.name}</span>
          <span className="text-slate-600">•</span>
          <span>{template.name} ({template.cutDiameterMm}mm snijmaat)</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full text-emerald-400 font-mono font-semibold">
            {activeCount} / {totalSlots} buttons ingevuld
          </span>
          <span className="hidden sm:inline text-slate-500">
            {activeCount === totalSlots ? '🎉 Blad is vol!' : 'Sleep foto’s naar de cirkels'}
          </span>
        </div>
      </div>

      {/* The Printable Paper Sheet Mockup (True Aspect Ratio) */}
      <div
        className="bg-white text-slate-800 rounded-xl shadow-2xl p-6 sm:p-10 border border-slate-300 relative flex flex-col justify-between transition-all select-none"
        style={{
          width: '100%',
          maxWidth: '780px',
          aspectRatio: `${paper.widthMm} / ${paper.heightMm}`,
          minHeight: '620px'
        }}
      >
        {/* Top Sheet Header Information */}
        <div className="border-b border-slate-200 pb-2 mb-4 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 tracking-wider">BUTTONMAKER</span>
            <span>•</span>
            <span>{template.name}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-rose-600 font-semibold">🔴 Snijmaat: {template.cutDiameterMm}mm (VEVOR stans)</span>
            <span>|</span>
            <span className="text-emerald-700 font-semibold">🟢 Zichtbaar: {template.faceDiameterMm}mm (voorkant)</span>
          </div>
        </div>

        {/* Central Grid of Badge Slots */}
        <div
          className="grid gap-3 sm:gap-4 flex-1 items-center justify-center my-auto"
          style={{
            gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${grid.rows}, minmax(0, 1fr))`
          }}
        >
          {Array.from({ length: totalSlots }).map((_, index) => (
            <BadgeSlot
              key={index}
              index={index}
              badge={badges[index]}
              template={template}
              onDropImage={onDropImage}
              onOpenTextEditor={onOpenTextEditor}
              onOpenImageEditor={onOpenImageEditor}
              onDuplicateToAll={onDuplicateToAll}
              onClearSlot={onClearSlot}
              onQuickUpload={onQuickUpload}
            />
          ))}
        </div>

        {/* Bottom Sheet Footer: Calibration Line & Print Advice */}
        <div className="border-t border-slate-200 pt-3 mt-4 flex items-center justify-between text-[10px] text-slate-500 font-mono flex-wrap gap-2">
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
