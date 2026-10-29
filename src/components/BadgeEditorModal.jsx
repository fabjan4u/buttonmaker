import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Type, 
  Scissors, 
  Palette, 
  RotateCw, 
  FlipHorizontal, 
  FlipVertical, 
  Trash2, 
  Plus, 
  ZoomIn, 
  ZoomOut, 
  Sparkles, 
  Check, 
  Copy,
  Upload,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { renderButtonCanvas } from '../utils/canvasRenderer';
import { BadgeMockup } from './BadgeMockup';
import { GOOGLE_FONTS } from '../constants/templates';

export function BadgeEditorModal({
  isOpen,
  onClose,
  slotIndex,
  badgeState,
  template,
  initialTab = 'text',
  onSaveSlot,
  onSaveAllSlots
}) {
  if (!isOpen || !badgeState) return null;

  const [localBadge, setLocalBadge] = useState({ ...badgeState });
  const [activeTab, setActiveTab] = useState(initialTab); // 'text', 'image', 'background'
  const canvasRef = useRef(null);
  const replaceFileInputRef = useRef(null);

  // Mouse dragging state for canvas
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPos, setInitialPos] = useState({ x: 0, y: 0 });

  // Update local state when badgeState changes
  useEffect(() => {
    setLocalBadge({ ...badgeState });
    setActiveTab(initialTab);
  }, [badgeState, initialTab]);

  // Re-render editor canvas whenever localBadge changes
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const size = 640;
    canvas.width = size;
    canvas.height = size;

    renderButtonCanvas(ctx, {
      ...localBadge,
      template,
      width: size,
      height: size,
      showGuides: true,
      showFaceGuide: true,
      showCutGuide: true,
      showBleedShade: true,
      is3DPreview: false
    });
  }, [localBadge, template]);

  // Canvas Mouse Dragging Interactions
  const handleMouseDown = (e) => {
    if (!localBadge.image) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialPos({ x: localBadge.imageProps.x, y: localBadge.imageProps.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !localBadge.image) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const displaySize = canvas.clientWidth || 360;
    // Percentage shift (-50 to +50 percent)
    const deltaPercentX = (dx / displaySize) * 100;
    const deltaPercentY = (dy / displaySize) * 100;

    setLocalBadge(prev => ({
      ...prev,
      imageProps: {
        ...prev.imageProps,
        x: Math.round(initialPos.x + deltaPercentX),
        y: Math.round(initialPos.y + deltaPercentY)
      }
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    if (!localBadge.image) return;
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.05 : 0.95;
    setLocalBadge(prev => ({
      ...prev,
      imageProps: {
        ...prev.imageProps,
        scale: Math.max(0.1, Math.min(8, Number((prev.imageProps.scale * zoomFactor).toFixed(2))))
      }
    }));
  };

  // Quick Image Sizing Helpers
  const handleFitToFace = () => {
    if (!localBadge.image) return;
    setLocalBadge(prev => ({
      ...prev,
      imageProps: { ...prev.imageProps, fitMode: 'face', scale: 1.0, x: 0, y: 0 }
    }));
  };

  const handleFillCutCircle = () => {
    if (!localBadge.image) return;
    setLocalBadge(prev => ({
      ...prev,
      imageProps: { ...prev.imageProps, fitMode: 'bleed', scale: 1.0, x: 0, y: 0 }
    }));
  };

  // Replace image handler
  const handleReplaceImage = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setLocalBadge(prev => ({
          ...prev,
          image: img,
          name: file.name.replace(/\.[^/.]+$/, '').slice(0, 18),
          imageProps: {
            ...prev.imageProps,
            x: 0,
            y: 0,
            scale: 1.0,
            rotation: 0
          }
        }));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Text layer handlers
  const handleAddTextLayer = (style = 'straight') => {
    // Determine sensible default font size based on template (smaller buttons get smaller default text)
    const baseFontSize = template.faceDiameterMm <= 32 ? 22 : 32;

    const newLayer = {
      id: Date.now().toString(),
      text: style === 'curved-top' ? 'BOVENSTE TEKST' : (style === 'curved-bottom' ? 'ONDERSTE TEKST' : 'JOUW TEKST'),
      style: style,
      fontFamily: "'Inter', sans-serif",
      fontSize: style === 'straight' ? baseFontSize : Math.round(baseFontSize * 0.85),
      bold: true,
      italic: false,
      color: '#ffffff',
      hasStroke: true,
      strokeColor: '#000000',
      strokeWidth: 3,
      letterSpacing: 2,
      curveRadiusRatio: 0.78,
      rotationDeg: 0,
      x: 0,
      y: 0
    };

    setLocalBadge(prev => ({
      ...prev,
      textLayers: [...(prev.textLayers || []), newLayer]
    }));
  };

  const updateTextLayer = (id, updates) => {
    setLocalBadge(prev => ({
      ...prev,
      textLayers: prev.textLayers.map(l => l.id === id ? { ...l, ...updates } : l)
    }));
  };

  const deleteTextLayer = (id) => {
    setLocalBadge(prev => ({
      ...prev,
      textLayers: prev.textLayers.filter(l => l.id !== id)
    }));
  };

  const quickColors = [
    '#ffffff', '#000000', '#facc15', '#ef4444', '#f97316', 
    '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[96vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">
              #{slotIndex + 1}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white">
                  Button #{slotIndex + 1} Bewerken
                </h2>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {template.name}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Tekst & boogtekst bewerken, foto schalen, roteren en positioneren
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: Live Interactive Canvas + 3D Mini Preview */}
          <div className="lg:col-span-6 flex flex-col items-center justify-between bg-slate-950/60 rounded-2xl p-4 sm:p-5 border border-slate-800/80">
            {/* VEVOR Specific Line Guide Explanation */}
            <div className="w-full flex items-center justify-center gap-2 sm:gap-3 text-[11px] bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 mb-3 flex-wrap">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2.5 h-0.5 border-t-2 border-dashed border-emerald-400"></span>
                🟢 Voorkant: {template.faceDiameterMm}mm
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded bg-slate-700"></span>
                Omslag: {template.bleedMm}mm
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                <span className="w-2.5 h-0.5 border-t-2 border-dashed border-rose-400"></span>
                🔴 VEVOR Stans: {template.cutDiameterMm}mm
              </span>
            </div>

            {/* Canvas Area */}
            <div className="relative my-auto flex flex-col items-center">
              <div className="rounded-full bg-checkerboard shadow-2xl border-4 border-slate-800 overflow-hidden">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onWheel={handleWheel}
                  style={{ width: 'min(360px, 72vw)', height: 'min(360px, 72vw)' }}
                  className={`block rounded-full ${
                    localBadge.image ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
                  }`}
                />
              </div>

              {/* Canvas Drag Hint */}
              <div className="mt-3 text-center">
                <span className="text-[11px] text-slate-400 bg-slate-900/90 px-3 py-1 rounded-full border border-slate-800">
                  💡 Sleep foto om te verschuiven • Scroll om te zoomen
                </span>
              </div>
            </div>

            {/* Bottom 3D Preview Card */}
            <div className="w-full max-w-xs mt-3">
              <BadgeMockup badgeState={{ ...localBadge, template }} />
            </div>
          </div>

          {/* RIGHT: Tabs for Text, Image, and Background */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
            
            {/* Tab Navigation */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
              <button
                onClick={() => setActiveTab('text')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'text'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>Tekst & Boogtekst</span>
                {(localBadge.textLayers || []).length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-slate-900 text-emerald-300 text-[10px] flex items-center justify-center font-bold">
                    {localBadge.textLayers.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('image')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'image'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Afbeelding & Positie</span>
              </button>

              <button
                onClick={() => setActiveTab('background')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'background'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Achtergrond</span>
              </button>
            </div>

            {/* TAB CONTENT */}
            <div className="flex-1 overflow-y-auto max-h-[50vh] pr-1 space-y-4 text-xs">
              
              {/* ================= TEXT TAB (ENHANCED FOR CONVENIENCE) ================= */}
              {activeTab === 'text' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-white mb-0.5">Tekst toevoegen</h3>
                    <p className="text-[11px] text-slate-400">
                      Kies rechte tekst of boogtekst langs de rand van de button.
                    </p>
                  </div>

                  {/* Add Layer Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleAddTextLayer('straight')}
                      className="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-semibold text-center transition"
                    >
                      + Recht
                    </button>
                    <button
                      onClick={() => handleAddTextLayer('curved-top')}
                      className="py-2 px-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-semibold text-center transition"
                    >
                      + Bovenboog ⌒
                    </button>
                    <button
                      onClick={() => handleAddTextLayer('curved-bottom')}
                      className="py-2 px-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-semibold text-center transition"
                    >
                      + Onderboog ⌣
                    </button>
                  </div>

                  {/* Layers List */}
                  {(!localBadge.textLayers || localBadge.textLayers.length === 0) ? (
                    <div className="p-6 text-center border-2 border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                      Nog geen tekst op deze button.<br />
                      Klik op één van de knoppen hierboven om tekst toe te voegen.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {localBadge.textLayers.map((layer, index) => (
                        <div
                          key={layer.id}
                          className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-400">
                              Laag #{index + 1}: {layer.style === 'curved-top' ? 'Bovenboog ⌒' : layer.style === 'curved-bottom' ? 'Onderboog ⌣' : 'Rechte Tekst'}
                            </span>
                            <button
                              onClick={() => deleteTextLayer(layer.id)}
                              className="text-slate-500 hover:text-rose-400 transition"
                              title="Verwijder tekstlaag"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Text input */}
                          <input
                            type="text"
                            value={layer.text}
                            onChange={e => updateTextLayer(layer.id, { text: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-medium text-xs focus:border-emerald-500 outline-none"
                            placeholder="Typ tekst..."
                          />

                          {/* Font Family */}
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">Lettertype</label>
                            <select
                              value={layer.fontFamily}
                              onChange={e => updateTextLayer(layer.id, { fontFamily: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                            >
                              {GOOGLE_FONTS.map(f => (
                                <option key={f.name} value={f.family}>{f.name}</option>
                              ))}
                            </select>
                          </div>

                          {/* Font Size & Letter Spacing */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                                <span>Grootte</span>
                                <span className="font-mono text-emerald-400">{layer.fontSize}px</span>
                              </div>
                              <input
                                type="range"
                                min="10"
                                max="80"
                                value={layer.fontSize}
                                onChange={e => updateTextLayer(layer.id, { fontSize: parseInt(e.target.value, 10) })}
                                className="w-full"
                              />
                            </div>

                            <div>
                              <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                                <span>Letterafstand</span>
                                <span className="font-mono text-emerald-400">{layer.letterSpacing}px</span>
                              </div>
                              <input
                                type="range"
                                min="-2"
                                max="20"
                                value={layer.letterSpacing}
                                onChange={e => updateTextLayer(layer.id, { letterSpacing: parseInt(e.target.value, 10) })}
                                className="w-full"
                              />
                            </div>
                          </div>

                          {/* Curved text controls (Radius & Rotation) */}
                          {(layer.style === 'curved-top' || layer.style === 'curved-bottom') && (
                            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
                              <div>
                                <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                                  <span>Boogstraal</span>
                                  <span className="font-mono text-emerald-400">{Math.round((layer.curveRadiusRatio || 0.78) * 100)}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0.5"
                                  max="0.95"
                                  step="0.02"
                                  value={layer.curveRadiusRatio || 0.78}
                                  onChange={e => updateTextLayer(layer.id, { curveRadiusRatio: parseFloat(e.target.value) })}
                                  className="w-full"
                                />
                              </div>

                              <div>
                                <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                                  <span>Draaihoek</span>
                                  <span className="font-mono text-emerald-400">{layer.rotationDeg || 0}°</span>
                                </div>
                                <input
                                  type="range"
                                  min="-180"
                                  max="180"
                                  value={layer.rotationDeg || 0}
                                  onChange={e => updateTextLayer(layer.id, { rotationDeg: parseInt(e.target.value, 10) })}
                                  className="w-full"
                                />
                              </div>
                            </div>
                          )}

                          {/* Straight text position controls (Vertical Y position) */}
                          {layer.style === 'straight' && (
                            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
                              <div>
                                <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                                  <span>Verticale Positie (Y)</span>
                                  <span className="font-mono text-emerald-400">{layer.y || 0}px</span>
                                </div>
                                <input
                                  type="range"
                                  min="-180"
                                  max="180"
                                  value={layer.y || 0}
                                  onChange={e => updateTextLayer(layer.id, { y: parseInt(e.target.value, 10) })}
                                  className="w-full"
                                />
                              </div>

                              <div>
                                <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                                  <span>Horizontale Positie (X)</span>
                                  <span className="font-mono text-emerald-400">{layer.x || 0}px</span>
                                </div>
                                <input
                                  type="range"
                                  min="-180"
                                  max="180"
                                  value={layer.x || 0}
                                  onChange={e => updateTextLayer(layer.id, { x: parseInt(e.target.value, 10) })}
                                  className="w-full"
                                />
                              </div>
                            </div>
                          )}

                          {/* Color & Quick Palette */}
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-[11px] text-slate-400">Tekstkleur</label>
                              <span className="font-mono text-[11px] text-slate-300">{layer.color}</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <input
                                type="color"
                                value={layer.color}
                                onChange={e => updateTextLayer(layer.id, { color: e.target.value })}
                                className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                              />
                              {quickColors.map(c => (
                                <button
                                  key={c}
                                  onClick={() => updateTextLayer(layer.id, { color: c })}
                                  className="w-5 h-5 rounded-full border border-slate-600 transition hover:scale-110"
                                  style={{ backgroundColor: c }}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Stroke Outline Controls */}
                          <div className="pt-2 border-t border-slate-800">
                            <div className="flex items-center justify-between mb-2">
                              <label className="flex items-center gap-2 cursor-pointer text-slate-300 font-semibold text-[11px]">
                                <input
                                  type="checkbox"
                                  checked={layer.hasStroke}
                                  onChange={e => updateTextLayer(layer.id, { hasStroke: e.target.checked })}
                                  className="rounded bg-slate-900 border-slate-700 text-emerald-500"
                                />
                                <span>Zwarte/Witte omtreklijn (Stroke)</span>
                              </label>

                              {layer.hasStroke && (
                                <input
                                  type="color"
                                  value={layer.strokeColor || '#000000'}
                                  onChange={e => updateTextLayer(layer.id, { strokeColor: e.target.value })}
                                  className="w-6 h-6 rounded border border-slate-700 bg-transparent cursor-pointer"
                                />
                              )}
                            </div>

                            {layer.hasStroke && (
                              <div>
                                <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                                  <span>Omtrek Dikte</span>
                                  <span className="font-mono text-emerald-400">{layer.strokeWidth || 3}px</span>
                                </div>
                                <input
                                  type="range"
                                  min="1"
                                  max="8"
                                  value={layer.strokeWidth || 3}
                                  onChange={e => updateTextLayer(layer.id, { strokeWidth: parseInt(e.target.value, 10) })}
                                  className="w-full"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ================= IMAGE & CROP TAB (ENHANCED) ================= */}
              {activeTab === 'image' && (
                <div className="space-y-4">
                  <input
                    type="file"
                    ref={replaceFileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      if (e.target.files?.[0]) handleReplaceImage(e.target.files[0]);
                    }}
                  />

                  <div>
                    <h3 className="font-bold text-white mb-0.5">Afbeelding aanpassen</h3>
                    <p className="text-[11px] text-slate-400">
                      Snel passend maken, zoomen, roteren of vervangen.
                    </p>
                  </div>

                  {localBadge.image ? (
                    <div className="space-y-4">
                      {/* Quick Fit / Fill Automation Buttons */}
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={handleFitToFace}
                          className="py-2 px-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-semibold flex items-center justify-center gap-1.5 transition"
                          title={`Past foto binnen de groene lijn (${template.faceDiameterMm} mm) voor maximale afbeelding`}
                        >
                          <Minimize2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Groene Lijn ({template.faceDiameterMm}mm)</span>
                        </button>

                        <button
                          onClick={handleFillCutCircle}
                          className="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-semibold flex items-center justify-center gap-1.5 transition"
                          title={`Vult de hele button tot de rode stansrand (${template.cutDiameterMm} mm)`}
                        >
                          <Maximize2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>Rode Lijn ({template.cutDiameterMm}mm)</span>
                        </button>

                        <button
                          onClick={() => {
                            setLocalBadge(prev => ({
                              ...prev,
                              imageProps: { ...prev.imageProps, x: 0, y: 0 }
                            }));
                          }}
                          className="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-semibold transition"
                        >
                          Centreer
                        </button>
                      </div>

                      {/* Scale / Zoom */}
                      <div>
                        <div className="flex justify-between mb-1 text-[11px]">
                          <span className="text-slate-400">Grootte / Zoom</span>
                          <span className="font-mono text-emerald-400">
                            {Math.round(localBadge.imageProps.scale * 100)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setLocalBadge(prev => ({
                                ...prev,
                                imageProps: { ...prev.imageProps, scale: Math.max(0.1, Number((prev.imageProps.scale - 0.1).toFixed(2))) }
                              }));
                            }}
                            className="p-1 rounded bg-slate-800 text-slate-300"
                          >
                            <ZoomOut className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="range"
                            min="0.1"
                            max="4"
                            step="0.05"
                            value={localBadge.imageProps.scale}
                            onChange={e => {
                              const val = parseFloat(e.target.value);
                              setLocalBadge(prev => ({
                                ...prev,
                                imageProps: { ...prev.imageProps, scale: val }
                              }));
                            }}
                            className="flex-1"
                          />
                          <button
                            onClick={() => {
                              setLocalBadge(prev => ({
                                ...prev,
                                imageProps: { ...prev.imageProps, scale: Number((prev.imageProps.scale + 0.1).toFixed(2)) }
                              }));
                            }}
                            className="p-1 rounded bg-slate-800 text-slate-300"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Rotation */}
                      <div>
                        <div className="flex justify-between mb-1 text-[11px]">
                          <span className="text-slate-400">Rotatie</span>
                          <span className="font-mono text-emerald-400">{localBadge.imageProps.rotation}°</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="360"
                            value={localBadge.imageProps.rotation}
                            onChange={e => {
                              const val = parseInt(e.target.value, 10);
                              setLocalBadge(prev => ({
                                ...prev,
                                imageProps: { ...prev.imageProps, rotation: val }
                              }));
                            }}
                            className="flex-1"
                          />
                          <button
                            onClick={() => {
                              setLocalBadge(prev => ({
                                ...prev,
                                imageProps: { ...prev.imageProps, rotation: (prev.imageProps.rotation + 90) % 360 }
                              }));
                            }}
                            className="p-1.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-300"
                            title="+90° Draaien"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Mirror Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setLocalBadge(prev => ({
                              ...prev,
                              imageProps: { ...prev.imageProps, flipX: !prev.imageProps.flipX }
                            }));
                          }}
                          className={`py-1.5 px-3 rounded-lg border flex items-center justify-center gap-1.5 ${
                            localBadge.imageProps.flipX
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                              : 'bg-slate-800 border-slate-750 text-slate-300'
                          }`}
                        >
                          <FlipHorizontal className="w-3.5 h-3.5" />
                          <span>Spiegel Horiz.</span>
                        </button>

                        <button
                          onClick={() => {
                            setLocalBadge(prev => ({
                              ...prev,
                              imageProps: { ...prev.imageProps, flipY: !prev.imageProps.flipY }
                            }));
                          }}
                          className={`py-1.5 px-3 rounded-lg border flex items-center justify-center gap-1.5 ${
                            localBadge.imageProps.flipY
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                              : 'bg-slate-800 border-slate-750 text-slate-300'
                          }`}
                        >
                          <FlipVertical className="w-3.5 h-3.5" />
                          <span>Spiegel Vert.</span>
                        </button>
                      </div>

                      {/* Replace / Remove Image Actions */}
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                        <button
                          onClick={() => replaceFileInputRef.current?.click()}
                          className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Vervang deze foto...</span>
                        </button>

                        <button
                          onClick={() => setLocalBadge(prev => ({ ...prev, image: null }))}
                          className="text-xs text-rose-400 hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Verwijder foto</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center border-2 border-dashed border-slate-800 rounded-xl space-y-3">
                      <p className="text-slate-400 text-xs">Geen foto geladen in deze button.</p>
                      <button
                        onClick={() => replaceFileInputRef.current?.click()}
                        className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-md transition"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Kies een foto</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ================= BACKGROUND TAB ================= */}
              {activeTab === 'background' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-white mb-0.5">Achtergrond</h3>
                    <p className="text-[11px] text-slate-400">
                      Kies een effen kleur, verloop of transparant.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setLocalBadge(prev => ({ ...prev, backgroundType: 'solid' }))}
                      className={`py-2 rounded-lg border text-center transition ${
                        localBadge.backgroundType === 'solid'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold'
                          : 'bg-slate-800 border-slate-750 text-slate-300'
                      }`}
                    >
                      Effen Kleur
                    </button>
                    <button
                      onClick={() => setLocalBadge(prev => ({ ...prev, backgroundType: 'transparent' }))}
                      className={`py-2 rounded-lg border text-center transition ${
                        localBadge.backgroundType === 'transparent'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold'
                          : 'bg-slate-800 border-slate-750 text-slate-300'
                      }`}
                    >
                      Transparant
                    </button>
                  </div>

                  {localBadge.backgroundType !== 'transparent' && (
                    <div className="space-y-3 pt-2">
                      <div className="flex flex-wrap gap-2">
                        {quickColors.map(c => (
                          <button
                            key={c}
                            onClick={() => setLocalBadge(prev => ({ ...prev, backgroundColor: c, backgroundType: 'solid' }))}
                            className="w-7 h-7 rounded-full border border-slate-700 shadow-sm transition hover:scale-110"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>

                      <div className="flex items-center gap-3 pt-1">
                        <input
                          type="color"
                          value={localBadge.backgroundColor || '#ffffff'}
                          onChange={e => setLocalBadge(prev => ({ ...prev, backgroundColor: e.target.value, backgroundType: 'solid' }))}
                          className="w-9 h-9 rounded border border-slate-700 bg-transparent cursor-pointer"
                        />
                        <div>
                          <div className="font-semibold text-white">Eigen kleurkiezer</div>
                          <span className="font-mono text-slate-400">{localBadge.backgroundColor}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Bottom Modal Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap">
              <button
                onClick={() => onSaveAllSlots(localBadge)}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition active:scale-95"
                title="Pas deze instellingen (bijv. tekst of kleur) toe op álle buttons op het vel"
              >
                <Copy className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kopieer naar álle buttons</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs transition"
                >
                  Annuleren
                </button>

                <button
                  onClick={() => onSaveSlot(slotIndex, localBadge)}
                  className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Klaar</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
