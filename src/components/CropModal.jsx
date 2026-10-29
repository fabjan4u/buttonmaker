import React, { useRef, useEffect, useState } from 'react';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import { X, ZoomIn, ZoomOut, RotateCw, Check, Scissors, RotateCcw, Move } from 'lucide-react';

export function CropModal({
  isOpen,
  onClose,
  slotIndex,
  badgeState,
  template,
  onApplyCrop
}) {
  if (!isOpen || !badgeState?.image) return null;

  const imageRef = useRef(null);
  const cropperRef = useRef(null);
  const initialRatioRef = useRef(1);
  const [imageSrc, setImageSrc] = useState('');
  const [cropTarget, setCropTarget] = useState('face'); // 'face' = 36mm groene lijn, 'bleed' = 44mm rode lijn
  const [zoomPercent, setZoomPercent] = useState(100);

  // Ratio of face diameter to cut diameter (e.g. 36 / 44 = 81.8%)
  const faceRatioPercent = Math.round((template.faceDiameterMm / template.cutDiameterMm) * 100);

  useEffect(() => {
    if (badgeState.image) {
      setImageSrc(badgeState.image.src);
    }
  }, [badgeState]);

  useEffect(() => {
    if (!imageRef.current || !imageSrc) return;

    // Destroy existing instance if any
    if (cropperRef.current) {
      cropperRef.current.destroy();
      cropperRef.current = null;
    }

    const cropper = new Cropper(imageRef.current, {
      aspectRatio: 1, // 1:1 circular badge
      viewMode: 0, // allow free moving and zooming of the image
      dragMode: 'move', // dragging moves the IMAGE, not the pin!
      autoCropArea: 0.8,
      responsive: true,
      restore: false,
      guides: false, // clean circle without grid lines
      center: true,
      highlight: false,
      cropBoxMovable: false, // Pin stays FIXED in the center!
      cropBoxResizable: false, // Pin NEVER resizes - user resizes the IMAGE!
      toggleDragModeOnDblclick: false,
      zoomable: true,
      zoomOnWheel: true,
      zoomOnTouch: true,
      wheelZoomRatio: 0.08,
      ready() {
        const container = cropper.getContainerData();
        // Fixed size for the pin circle in the center of the cropper container
        const boxSize = Math.min(container.width, container.height) * 0.72;
        cropper.setCropBoxData({
          left: (container.width - boxSize) / 2,
          top: (container.height - boxSize) / 2,
          width: boxSize,
          height: boxSize
        });

        // Store initial zoom ratio as 100% baseline
        const canvasData = cropper.getCanvasData();
        const baseRatio = canvasData.width / canvasData.naturalWidth;
        initialRatioRef.current = baseRatio || 1;
        setZoomPercent(100);
      },
      zoom(e) {
        if (e.detail && typeof e.detail.ratio === 'number' && initialRatioRef.current) {
          const currentPct = Math.round((e.detail.ratio / initialRatioRef.current) * 100);
          setZoomPercent(Math.max(20, Math.min(400, currentPct)));
        }
      }
    });

    cropperRef.current = cropper;

    return () => {
      if (cropperRef.current) {
        cropperRef.current.destroy();
        cropperRef.current = null;
      }
    };
  }, [imageSrc]);

  const handleSliderZoom = (e) => {
    const val = parseInt(e.target.value, 10);
    setZoomPercent(val);
    if (cropperRef.current && initialRatioRef.current) {
      const targetRatio = initialRatioRef.current * (val / 100);
      cropperRef.current.zoomTo(targetRatio);
    }
  };

  const handleZoomStep = (delta) => {
    const nextVal = Math.max(20, Math.min(400, zoomPercent + delta));
    setZoomPercent(nextVal);
    if (cropperRef.current && initialRatioRef.current) {
      const targetRatio = initialRatioRef.current * (nextVal / 100);
      cropperRef.current.zoomTo(targetRatio);
    }
  };

  const handleRotate = (deg) => {
    if (cropperRef.current) {
      cropperRef.current.rotate(deg);
    }
  };

  const handleReset = () => {
    if (cropperRef.current) {
      cropperRef.current.reset();
      setZoomPercent(100);
    }
  };

  const handleApply = () => {
    if (!cropperRef.current) return;

    // High resolution 1200x1200px export for crisp 300 DPI print quality
    const canvas = cropperRef.current.getCroppedCanvas({
      width: 1200,
      height: 1200,
      fillColor: '#ffffff',
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high'
    });

    if (!canvas) return;

    const croppedDataUrl = canvas.toDataURL('image/png', 1.0);
    const croppedImg = new Image();
    croppedImg.onload = () => {
      onApplyCrop(slotIndex, croppedImg, croppedDataUrl, cropTarget);
      onClose();
    };
    croppedImg.src = croppedDataUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        style={{ '--face-ratio': `${faceRatioPercent}%` }}
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Afbeelding Aanpassen in Pin
                <span className="text-[11px] font-mono text-emerald-400 font-normal bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Button #{slotIndex + 1}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Sleep en zoom de foto zodat deze perfect in de pin past.
              </p>
            </div>
          </div>

          {/* Mode Selector Toggle */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setCropTarget('face')}
              className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                cropTarget === 'face'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={`Foto passend maken op het zichtbare oppervlak van ${template.faceDiameterMm} mm`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
              <span>Groene Lijn ({template.faceDiameterMm} mm)</span>
            </button>

            <button
              onClick={() => setCropTarget('bleed')}
              className={`px-3 py-1 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                cropTarget === 'bleed'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={`Foto vullend maken inclusief stansrand van ${template.cutDiameterMm} mm`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-300"></span>
              <span>Rode Lijn ({template.cutDiameterMm} mm)</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Legend Notice & User Guidance */}
        <div className="px-5 py-2 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between text-[11px] flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-3 h-3 rounded-full border-2 border-dashed border-emerald-400 inline-block"></span>
              <span>Vaste pin cirkel: <strong>{template.faceDiameterMm} mm</strong> (zichtbaar oppervlak)</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <Move className="w-3.5 h-3.5 text-slate-400" />
              <span>Sleep foto om te verschuiven</span>
            </span>
          </div>
          <span className="text-slate-400 italic">
            Gebruik de slider of muiswiel om de foto te vergroten/verkleinen
          </span>
        </div>

        {/* Cropper Container (Pin is FIXED in center, user moves/zooms the image behind it!) */}
        <div className="flex-1 min-h-[320px] max-h-[54vh] bg-slate-950 relative overflow-hidden flex items-center justify-center p-2">
          <div className={`w-full h-full max-h-[52vh] relative badge-cropper-wrapper ${cropTarget === 'bleed' ? 'crop-mode-bleed' : 'crop-mode-face'}`}>
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Te bewerken afbeelding"
              className="max-h-full max-w-full block"
            />
          </div>
        </div>

        {/* Direct Image Zoom & Resize Bar */}
        <div className="px-5 py-2.5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between gap-3 text-xs">
          <span className="font-semibold text-slate-300 whitespace-nowrap">
            Afbeelding vergroten / verkleinen:
          </span>

          <div className="flex-1 max-w-md flex items-center gap-2.5">
            <button
              onClick={() => handleZoomStep(-15)}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-sm transition"
              title="Afbeelding verkleinen"
            >
              -
            </button>

            <input
              type="range"
              min="30"
              max="300"
              value={zoomPercent}
              onChange={handleSliderZoom}
              className="flex-1 h-2 bg-slate-800 rounded-lg cursor-pointer accent-emerald-500"
            />

            <button
              onClick={() => handleZoomStep(15)}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-sm transition"
              title="Afbeelding vergroten"
            >
              +
            </button>

            <span className="font-mono text-emerald-400 font-bold w-12 text-right">
              {zoomPercent}%
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleRotate(90)}
              className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition"
              title="90 graden draaien"
            >
              <RotateCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Draai 90°</span>
            </button>

            <button
              onClick={handleReset}
              className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs transition"
              title="Herstel uitsnede"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Modal Action Buttons Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/90 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
          >
            Annuleren
          </button>

          <button
            onClick={handleApply}
            className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Bijsnijden & Toepassen</span>
          </button>
        </div>
      </div>
    </div>
  );
}
