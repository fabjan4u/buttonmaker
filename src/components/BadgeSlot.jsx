import React, { useRef, useEffect, useState } from 'react';
import { Type, Scissors, Trash2, Copy, Plus, Sparkles } from 'lucide-react';
import { renderButtonCanvas } from '../utils/canvasRenderer';

export function BadgeSlot({
  index,
  badge,
  template,
  onDropImage,
  onOpenTextEditor,
  onOpenImageEditor,
  onDuplicateToAll,
  onClearSlot,
  onQuickUpload
}) {
  const canvasRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Exact physical ratio for VEVOR press (e.g. 32mm / 44mm = 72.7%)
  const faceRatioPercent = Math.round((template.faceDiameterMm / template.cutDiameterMm) * 100);

  // Render canvas thumbnail when badge state changes
  useEffect(() => {
    if (!badge || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const size = 320;
    canvas.width = size;
    canvas.height = size;

    renderButtonCanvas(ctx, {
      ...badge,
      template,
      width: size,
      height: size,
      showGuides: true,
      showFaceGuide: true,
      showCutGuide: true,
      showBleedShade: true,
      is3DPreview: false
    });
  }, [badge, template]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    // If an image was dragged from the upload tray (via dataTransfer)
    const imgId = e.dataTransfer.getData('text/plain');
    if (imgId) {
      onDropImage(index, imgId);
      return;
    }

    // If a direct file from desktop was dropped
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onQuickUpload(index, e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`group relative aspect-square rounded-full flex items-center justify-center transition-all ${
        isDragOver
          ? 'scale-105 ring-4 ring-emerald-500 shadow-xl bg-emerald-500/10'
          : ''
      }`}
    >
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) onQuickUpload(index, e.target.files[0]);
        }}
      />

      {badge ? (
        /* Populated Badge Slot */
        <div className="relative w-full h-full rounded-full shadow-md overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            className="w-full h-full block rounded-full"
            style={{ width: '100%', height: '100%' }}
          />

          {/* Badge Number Pill (subtle) */}
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur text-white text-[9px] font-mono px-1.5 py-0.2 rounded-full pointer-events-none opacity-70 group-hover:opacity-0 transition">
            #{index + 1}
          </div>

          {/* Slot Action Controls (Appear on hover) */}
          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs rounded-full flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <span className="text-[10px] text-slate-300 font-semibold mb-0.5">
              Button #{index + 1} • {template.faceDiameterMm}mm
            </span>

            <div className="flex items-center gap-1.5">
              {/* Text Edit Button */}
              <button
                onClick={() => onOpenTextEditor(index)}
                className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-lg transition active:scale-95"
                title="Tekst & Boogtekst bewerken"
              >
                <Type className="w-4 h-4" />
              </button>

              {/* Image Adjust / Crop Button */}
              <button
                onClick={() => onOpenImageEditor(index)}
                className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center shadow-lg transition active:scale-95"
                title="Afbeelding schalen, roteren & centreren"
              >
                <Scissors className="w-3.5 h-3.5" />
              </button>

              {/* Duplicate to All Slots Button */}
              <button
                onClick={() => onDuplicateToAll(index)}
                className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg transition active:scale-95"
                title="Kopieer dit ontwerp naar alle andere cirkels"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>

              {/* Delete / Clear Slot */}
              <button
                onClick={() => onClearSlot(index)}
                className="w-8 h-8 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg transition active:scale-95"
                title="Maak deze cirkel leeg"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty Badge Slot (Placeholder) - Accurately sized to VEVOR face vs cut ratio */
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-full rounded-full border-2 border-dashed border-rose-400/80 hover:border-emerald-500 bg-slate-50/90 hover:bg-emerald-50/40 flex flex-col items-center justify-center text-center p-1.5 cursor-pointer transition-all shadow-inner group/empty"
          title={`Snijlijn: ${template.cutDiameterMm}mm (rood) • Voorkant: ${template.faceDiameterMm}mm (groen)`}
        >
          {/* Exact VEVOR Face circle (Green dashed) */}
          <div
            style={{ width: `${faceRatioPercent}%`, height: `${faceRatioPercent}%` }}
            className="rounded-full border border-dashed border-emerald-500 flex flex-col items-center justify-center pointer-events-none p-1"
          >
            <div className="w-6 h-6 rounded-full bg-slate-200 group-hover/empty:bg-emerald-500 group-hover/empty:text-white text-slate-600 flex items-center justify-center transition mb-0.5 shadow-xs">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <span className="text-[9px] font-bold text-slate-700 group-hover/empty:text-emerald-700 leading-tight">
              Sleep foto
            </span>
            <span className="text-[8px] text-emerald-600 font-mono font-semibold">
              {template.faceDiameterMm}mm
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
