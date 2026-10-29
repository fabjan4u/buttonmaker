import React, { useRef, useEffect, useState } from 'react';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import { X, ZoomIn, ZoomOut, RotateCw, Check, Scissors, RotateCcw } from 'lucide-react';

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
  const [imageSrc, setImageSrc] = useState('');
  const [cropTarget, setCropTarget] = useState('face'); // 'face' = groene lijn (36mm), 'bleed' = rode lijn (44mm)

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
      aspectRatio: 1, // 1:1 exact badge circle/square
      viewMode: 1,
      dragMode: 'move',
      autoCropArea: 0.95,
      responsive: true,
      restore: false,
      guides: true,
      center: true,
      highlight: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
      ready() {
        const data = cropper.getImageData();
        const minSize = Math.min(data.width, data.height);
        cropper.setCropBoxData({
          left: (data.width - minSize) / 2,
          top: (data.height - minSize) / 2,
          width: minSize,
          height: minSize
        });
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

  const handleZoom = (ratio) => {
    if (cropperRef.current) {
      cropperRef.current.zoom(ratio);
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
    }
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
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Foto Bijsnijden naar Cirkel
                <span className="text-[11px] font-mono text-emerald-400 font-normal bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Button #{slotIndex + 1}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Kies uitsnede voor de maximale afbeelding op de pin.
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
              title={`Cropt exact passend op de zichtbare voorkant (${template.faceDiameterMm} mm)`}
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
              title={`Cropt inclusief de aflooprand (${template.cutDiameterMm} mm)`}
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

        {/* Legend Notice */}
        <div className="px-5 py-2 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between text-[11px] flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-3 h-3 rounded-full border-2 border-dashed border-emerald-400 inline-block"></span>
              <span>Groene ring: <strong>{template.faceDiameterMm} mm</strong> (zichtbaar oppervlak / maximale foto)</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-3 h-3 rounded-full border border-dashed border-rose-500 inline-block"></span>
              <span>Rode ring: <strong>{template.cutDiameterMm} mm</strong> (stansmaat)</span>
            </span>
          </div>
          <span className="text-slate-400 italic">
            Dubbelklik of sleep binnen kader om te schuiven
          </span>
        </div>

        {/* Cropper Container */}
        <div className="flex-1 min-h-[340px] max-h-[56vh] bg-slate-950 relative overflow-hidden flex items-center justify-center p-2">
          <div className={`w-full h-full max-h-[54vh] relative badge-cropper-wrapper ${cropTarget === 'bleed' ? 'crop-mode-bleed' : 'crop-mode-face'}`}>
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Te bewerken afbeelding"
              className="max-h-full max-w-full block"
            />
          </div>
        </div>

        {/* Controls Toolbar */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between flex-wrap gap-3">
          {/* Zoom & Rotate Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleZoom(0.1)}
              className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
              title="Inzoomen"
            >
              <ZoomIn className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zoom In</span>
            </button>

            <button
              onClick={() => handleZoom(-0.1)}
              className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
              title="Uitzoomen"
            >
              <ZoomOut className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zoom Uit</span>
            </button>

            <button
              onClick={() => handleRotate(90)}
              className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
              title="90 graden draaien"
            >
              <RotateCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Draai 90°</span>
            </button>

            <button
              onClick={handleReset}
              className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs transition"
              title="Herstel crop kader"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center gap-2">
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
    </div>
  );
}
