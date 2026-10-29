import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Type, 
  Scissors, 
  Palette, 
  RotateCw, 
  FlipHorizontal, 
  FlipVertical, 
  Sliders, 
  Trash2, 
  Plus, 
  ZoomIn, 
  ZoomOut, 
  Sparkles, 
  Check, 
  Copy 
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
  onSaveSlot,
  onSaveAllSlots
}) {
  if (!isOpen || !badgeState) return null;

  const [localBadge, setLocalBadge] = useState({ ...badgeState });
  const [activeTab, setActiveTab] = useState('text'); // 'text', 'image', 'background'
  const canvasRef = useRef(null);

  // Mouse dragging state for canvas
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPos, setInitialPos] = useState({ x: 0, y: 0 });

  // Update local state when badgeState changes
  useEffect(() => {
    setLocalBadge({ ...badgeState });
  }, [badgeState]);

  // Re-render editor canvas whenever localBadge changes
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const size = 600;
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

  // Canvas Mouse Interactions
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
    const scaleFactor = 600 / canvas.clientWidth;

    setLocalBadge(prev => ({
      ...prev,
      imageProps: {
        ...prev.imageProps,
        x: Math.round(initialPos.x + dx * scaleFactor),
        y: Math.round(initialPos.y + dy * scaleFactor)
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

  // Text layer handlers
  const handleAddTextLayer = (style = 'straight') => {
    const newLayer = {
      id: Date.now().toString(),
      text: style === 'curved-top' ? 'BOVENSTE TEKST' : (style === 'curved-bottom' ? 'ONDERSTE TEKST' : 'JOUW TEKST'),
      style: style,
      fontFamily: "'Inter', sans-serif",
      fontSize: style === 'straight' ? 36 : 28,
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

  const colorPresets = [
    '#ffffff', '#000000', '#ef4444', '#f97316', '#eab308', 
    '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">
              #{slotIndex + 1}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Button #{slotIndex + 1} Bewerken
              </h2>
              <p className="text-xs text-slate-400">
                Tekst toevoegen, afbeelding schalen en positioneren
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
          <div className="lg:col-span-6 flex flex-col items-center justify-between bg-slate-950/60 rounded-2xl p-5 border border-slate-800/80">
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
                  style={{ width: 'min(360px, 75vw)', height: 'min(360px, 75vw)' }}
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
            <div className="w-full max-w-xs mt-4">
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
                <span>Afbeelding & Crop</span>
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
                <span>Kleur</span>
              </button>
            </div>

            {/* TAB CONTENT */}
            <div className="flex-1 overflow-y-auto max-h-[50vh] pr-1 space-y-4 text-xs">
              
              {/* ================= TEXT TAB (THE CORE REQUEST) ================= */}
              {activeTab === 'text' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-white mb-1">Tekst & Boogtekst toevoegen</h3>
                    <p className="text-[11px] text-slate-400">
                      Plaats rechte tekst of gebogen tekst langs de boven- of onderboog van de button.
                    </p>
                  </div>

                  {/* Add Layer Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleAddTextLayer('straight')}
                      className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-semibold text-center transition"
                    >
                      + Recht
                    </button>
                    <button
                      onClick={() => handleAddTextLayer('curved-top')}
                      className="py-2 px-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-semibold text-center transition"
                    >
                      + Bovenboog ⌒
                    </button>
                    <button
                      onClick={() => handleAddTextLayer('curved-bottom')}
                      className="py-2 px-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-semibold text-center transition"
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
                              Laag #{index + 1}: {layer.style === 'curved-top' ? 'Bovenboog ⌒' : layer.style === 'curved-bottom' ? 'Onderboog ⌣' : 'Recht'}
                            </span>
                            <button
                              onClick={() => deleteTextLayer(layer.id)}
                              className="text-slate-500 hover:text-rose-400 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Text input */}
                          <input
                            type="text"
                            value={layer.text}
                            onChange={e => updateTextLayer(layer.id, { text: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-medium text-xs"
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
                                <span className="font-mono">{layer.fontSize}px</span>
                              </div>
                              <input
                                type="range"
                                min="12"
                                max="90"
                                value={layer.fontSize}
                                onChange={e => updateTextLayer(layer.id, { fontSize: parseInt(e.target.value, 10) })}
                                className="w-full"
                              />
                            </div>

                            <div>
                              <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                                <span>Letterafstand</span>
                                <span className="font-mono">{layer.letterSpacing}px</span>
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

                          {/* Color & Stroke */}
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <div>
                              <label className="block text-[11px] text-slate-400 mb-1">Tekstkleur</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={layer.color}
                                  onChange={e => updateTextLayer(layer.id, { color: e.target.value })}
                                  className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                                />
                                <span className="font-mono text-[11px] text-slate-300">{layer.color}</span>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] text-slate-400 mb-1">Omtrek (Stroke)</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={layer.strokeColor}
                                  onChange={e => updateTextLayer(layer.id, { strokeColor: e.target.value, hasStroke: true })}
                                  className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                                />
                                <label className="flex items-center gap-1 text-[11px] text-slate-300">
                                  <input
                                    type="checkbox"
                                    checked={layer.hasStroke}
                                    onChange={e => updateTextLayer(layer.id, { hasStroke: e.target.checked })}
                                    className="rounded bg-slate-900 border-slate-700 text-emerald-500"
                                  />
                                  <span>Aan</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ================= IMAGE & CROP TAB ================= */}
              {activeTab === 'image' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-white mb-1">Afbeelding & Positie</h3>
                    <p className="text-[11px] text-slate-400">
                      Zoom in/uit, roteer of spiegel de afbeelding van deze button.
                    </p>
                  </div>

                  {localBadge.image ? (
                    <div className="space-y-4">
                      {/* Scale / Zoom */}
                      <div>
                        <div className="flex justify-between mb-1 text-[11px]">
                          <span className="text-slate-400">Grootte / Zoom</span>
                          <span className="font-mono text-emerald-400">
                            {Math.round(localBadge.imageProps.scale * 100)}%
                          </span>
                        </div>
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
                          className="w-full"
                        />
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
                            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
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

                      {/* Center Image */}
                      <button
                        onClick={() => {
                          setLocalBadge(prev => ({
                            ...prev,
                            imageProps: { ...prev.imageProps, x: 0, y: 0 }
                          }));
                        }}
                        className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 text-xs font-semibold"
                      >
                        Centreer Afbeelding
                      </button>
                    </div>
                  ) : (
                    <div className="p-6 text-center border border-slate-800 rounded-xl text-slate-500">
                      Geen foto in deze slot. Sleep een foto uit de linkergalerij naar deze button.
                    </div>
                  )}
                </div>
              )}

              {/* ================= BACKGROUND TAB ================= */}
              {activeTab === 'background' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-white mb-1">Achtergrondkleur</h3>
                    <p className="text-[11px] text-slate-400">
                      Kies een effen achtergrondkleur of transparant voor deze button.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {colorPresets.map(c => (
                      <button
                        key={c}
                        onClick={() => setLocalBadge(prev => ({ ...prev, backgroundColor: c, backgroundType: 'solid' }))}
                        className="w-7 h-7 rounded-full border border-slate-700 shadow-sm transition hover:scale-110"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="color"
                      value={localBadge.backgroundColor || '#ffffff'}
                      onChange={e => setLocalBadge(prev => ({ ...prev, backgroundColor: e.target.value, backgroundType: 'solid' }))}
                      className="w-9 h-9 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <div>
                      <div className="font-semibold text-white">Eigen kleur</div>
                      <span className="font-mono text-slate-400">{localBadge.backgroundColor}</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Modal Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                onClick={() => onSaveAllSlots(localBadge)}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition active:scale-95"
                title="Pas deze instellingen (bijv. tekst of kleur) toe op álle buttons op het vel"
              >
                <Copy className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pas toe op álle buttons</span>
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
