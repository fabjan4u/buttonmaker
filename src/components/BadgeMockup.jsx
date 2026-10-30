import React, { useRef, useEffect } from 'react';
import { renderButtonCanvas } from '../utils/canvasRenderer';
import { Sparkles } from 'lucide-react';

export function BadgeMockup({ badgeState }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const size = 320;
    canvas.width = size;
    canvas.height = size;

    renderButtonCanvas(ctx, {
      ...badgeState,
      width: size,
      height: size,
      showGuides: false,
      is3DPreview: true
    });
  }, [badgeState]);

  return (
    <div className="bg-slate-800/70 rounded-xl border border-slate-700/60 p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Fysieke Badge Preview</span>
        </div>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
          {badgeState?.template?.faceDiameterMm || 36} mm
        </span>
      </div>

      <div className="flex justify-center items-center py-2">
        {/* Realistic pin button container with CSS drop shadow */}
        <div className="relative group">
          <div className="relative rounded-full shadow-[0_20px_40px_-15px_rgba(0,0,0,0.8),0_0_15px_rgba(255,255,255,0.05)] border-4 border-slate-600/40 overflow-hidden transition-transform duration-300 group-hover:scale-105">
            <canvas
              ref={canvasRef}
              style={{ width: '160px', height: '160px' }}
              className="block rounded-full"
            />
          </div>
          <div className="text-center mt-2.5">
            <span className="text-[11px] text-slate-400">
              Zo ziet de button eruit na het persen
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
