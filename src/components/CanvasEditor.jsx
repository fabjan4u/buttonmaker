import React, { useRef, useEffect, useState } from 'react';
import { renderButtonCanvas } from '../utils/canvasRenderer';
import { ZoomIn, ZoomOut, Move, RotateCw, Maximize2, Sparkles, HelpCircle } from 'lucide-react';

export function CanvasEditor({ badgeState, setBadgeState, is3D }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialImagePos, setInitialImagePos] = useState({ x: 0, y: 0 });

  // Handle high-DPI rendering
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Base resolution for high precision
    const size = 800;
    canvas.width = size;
    canvas.height = size;

    renderButtonCanvas(ctx, {
      ...badgeState,
      width: size,
      height: size,
      is3DPreview: is3D
    });
  }, [badgeState, is3D]);

  // Direct mouse dragging on canvas to move image
  const handleMouseDown = (e) => {
    if (!badgeState.image) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialImagePos({ x: badgeState.imageProps.x, y: badgeState.imageProps.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !badgeState.image) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    // Scale movement to canvas coordinate space
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scaleFactor = 800 / canvas.clientWidth;

    setBadgeState(prev => ({
      ...prev,
      imageProps: {
        ...prev.imageProps,
        x: Math.round(initialImagePos.x + dx * scaleFactor),
        y: Math.round(initialImagePos.y + dy * scaleFactor)
      }
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e) => {
    if (!badgeState.image) return;
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
    setBadgeState(prev => ({
      ...prev,
      imageProps: {
        ...prev.imageProps,
        scale: Math.max(0.1, Math.min(10, Number((prev.imageProps.scale * zoomFactor).toFixed(2))))
      }
    }));
  };

  // Quick action helpers
  const handleCenterImage = () => {
    setBadgeState(prev => ({
      ...prev,
      imageProps: { ...prev.imageProps, x: 0, y: 0 }
    }));
  };

  const handleFitToFace = () => {
    if (!badgeState.image) return;
    const img = badgeState.image;
    // Fit image to face circle diameter
    const size = 800;
    const cutRadius = (size / 2) * 0.94;
    const faceRadius = cutRadius * (badgeState.template.faceDiameterMm / badgeState.template.cutDiameterMm);
    const targetDiam = faceRadius * 2;
    const scale = targetDiam / Math.max(img.naturalWidth, img.naturalHeight);

    setBadgeState(prev => ({
      ...prev,
      imageProps: { ...prev.imageProps, x: 0, y: 0, scale: Number(scale.toFixed(2)) }
    }));
  };

  const handleFillCutCircle = () => {
    if (!badgeState.image) return;
    const img = badgeState.image;
    const size = 800;
    const cutRadius = (size / 2) * 0.94;
    const targetDiam = cutRadius * 2;
    const scale = targetDiam / Math.min(img.naturalWidth, img.naturalHeight);

    setBadgeState(prev => ({
      ...prev,
      imageProps: { ...prev.imageProps, x: 0, y: 0, scale: Number(scale.toFixed(2)) }
    }));
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-6 overflow-hidden relative select-none">
      {/* Top Floating Badge Info */}
      <div className="absolute top-4 left-6 z-10 flex items-center gap-3">
        <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-lg px-3 py-1.5 shadow-md flex items-center gap-2 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span className="text-slate-300 font-medium">{badgeState.template.name}</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">Zichtbaar: <strong className="text-white">{badgeState.template.faceDiameterMm}mm</strong></span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">Snijmaat: <strong className="text-rose-400">{badgeState.template.cutDiameterMm}mm</strong></span>
        </div>
      </div>

      {/* Guide Legend */}
      {!is3D && (
        <div className="absolute top-4 right-6 z-10 hidden sm:flex items-center gap-3 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-lg px-3 py-1.5 shadow-md text-[11px]">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-0.5 border-t border-dashed border-emerald-400"></span>
            Zichtbaar vlak
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded bg-slate-700"></span>
            Bleed (omgevouwen)
          </span>
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="w-2.5 h-0.5 border-t border-dashed border-rose-400"></span>
            Snijlijn
          </span>
        </div>
      )}

      {/* Main Canvas Container */}
      <div
        ref={containerRef}
        className="relative max-w-full max-h-full flex items-center justify-center p-4"
      >
        <div
          className={`relative rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
            is3D
              ? 'p-6 bg-transparent'
              : 'p-2 bg-slate-950/60 border border-slate-800'
          }`}
        >
          <div className="rounded-xl overflow-hidden bg-checkerboard shadow-inner flex items-center justify-center">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              className={`block max-w-[70vh] max-h-[70vh] w-auto h-auto aspect-square ${
                badgeState.image ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
              }`}
              style={{ width: 'min(480px, 85vw)', height: 'min(480px, 85vw)' }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Floating Control Pill */}
      {badgeState.image && (
        <div className="absolute bottom-5 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur border border-slate-800/80 px-3 py-1.5 rounded-xl shadow-xl text-xs text-slate-300">
          <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Afbeelding:</span>

          <button
            onClick={handleCenterImage}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            title="Centreer afbeelding"
          >
            Centreer
          </button>

          <button
            onClick={handleFitToFace}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            title="Passend in zichtbare cirkel"
          >
            Passend
          </button>

          <button
            onClick={handleFillCutCircle}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            title="Vul hele snijcirkel inclusief bleed"
          >
            Vullend
          </button>

          <div className="w-[1px] h-4 bg-slate-750 mx-1"></div>

          <button
            onClick={() => {
              setBadgeState(prev => ({
                ...prev,
                imageProps: { ...prev.imageProps, scale: Math.max(0.1, Number((prev.imageProps.scale - 0.1).toFixed(2))) }
              }));
            }}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            title="Uitzoomen"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="font-mono text-[11px] text-emerald-400 w-10 text-center">
            {Math.round(badgeState.imageProps.scale * 100)}%
          </span>

          <button
            onClick={() => {
              setBadgeState(prev => ({
                ...prev,
                imageProps: { ...prev.imageProps, scale: Number((prev.imageProps.scale + 0.1).toFixed(2)) }
              }));
            }}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            title="Inzoomen"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
