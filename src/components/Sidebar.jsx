import React, { useRef } from 'react';
import { 
  Maximize, 
  Image as ImageIcon, 
  Type, 
  Palette, 
  Eye, 
  Upload, 
  Trash2, 
  Plus, 
  RotateCw, 
  FlipHorizontal, 
  FlipVertical, 
  Sliders, 
  Check, 
  Sparkles,
  Images,
  Printer
} from 'lucide-react';
import { BUTTON_TEMPLATES, GOOGLE_FONTS } from '../constants/templates';
import { BadgeMockup } from './BadgeMockup';
import { generateHighResBadgeDataUrl } from '../utils/pdfGenerator';

export function Sidebar({ 
  badgeState, 
  setBadgeState, 
  activeTab, 
  setActiveTab,
  sheetQueue = [],
  setSheetQueue,
  onOpenPrintModal
}) {
  const fileInputRef = useRef(null);
  const batchInputRef = useRef(null);

  // Image Upload Handler
  const handleImageUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const size = 800;
        const cutRadius = (size / 2) * 0.94;
        const faceRadius = cutRadius * (badgeState.template.faceDiameterMm / badgeState.template.cutDiameterMm);
        const targetDiam = faceRadius * 2;
        const initialScale = targetDiam / Math.max(img.naturalWidth, img.naturalHeight);

        setBadgeState(prev => ({
          ...prev,
          image: img,
          imageProps: {
            ...prev.imageProps,
            x: 0,
            y: 0,
            scale: Number(initialScale.toFixed(2)),
            rotation: 0
          }
        }));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Batch upload multiple images directly into sheet queue
  const handleBatchUpload = (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    let loaded = 0;
    const newItems = [];

    fileList.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const size = 800;
          const cutRadius = (size / 2) * 0.94;
          const targetDiam = cutRadius * 2;
          const scale = targetDiam / Math.min(img.naturalWidth, img.naturalHeight);

          const newBadge = {
            ...badgeState,
            image: img,
            imageProps: {
              x: 0,
              y: 0,
              scale: Number(scale.toFixed(2)),
              rotation: 0,
              flipX: false,
              flipY: false,
              brightness: 100,
              contrast: 100,
              grayscale: 0
            },
            textLayers: []
          };

          const thumbUrl = generateHighResBadgeDataUrl(newBadge, 260);

          newItems.push({
            id: `batch-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
            name: file.name.replace(/\.[^/.]+$/, '').slice(0, 18),
            badgeState: newBadge,
            thumbUrl,
            count: 1
          });

          loaded++;
          if (loaded === fileList.length) {
            setSheetQueue(prev => [...prev, ...newItems]);
            if (onOpenPrintModal) onOpenPrintModal();
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Add new text layer
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

    setBadgeState(prev => ({
      ...prev,
      textLayers: [...prev.textLayers, newLayer]
    }));
  };

  const updateTextLayer = (id, updates) => {
    setBadgeState(prev => ({
      ...prev,
      textLayers: prev.textLayers.map(layer => layer.id === id ? { ...layer, ...updates } : layer)
    }));
  };

  const deleteTextLayer = (id) => {
    setBadgeState(prev => ({
      ...prev,
      textLayers: prev.textLayers.filter(layer => layer.id !== id)
    }));
  };

  const colorPresets = [
    '#ffffff', '#000000', '#ef4444', '#f97316', '#eab308', 
    '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
  ];

  return (
    <aside className="w-full lg:w-96 bg-slate-900 border-r border-slate-800 flex flex-col h-full overflow-hidden">
      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/40 px-2 pt-2 gap-1 overflow-x-auto select-none">
        <button
          onClick={() => setActiveTab('template')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition border-b-2 whitespace-nowrap ${
            activeTab === 'template'
              ? 'text-emerald-400 border-emerald-400 bg-slate-900'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <Maximize className="w-3.5 h-3.5" />
          <span>Formaat</span>
        </button>

        <button
          onClick={() => setActiveTab('image')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition border-b-2 whitespace-nowrap ${
            activeTab === 'image'
              ? 'text-emerald-400 border-emerald-400 bg-slate-900'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Afbeelding</span>
        </button>

        <button
          onClick={() => setActiveTab('text')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition border-b-2 whitespace-nowrap ${
            activeTab === 'text'
              ? 'text-emerald-400 border-emerald-400 bg-slate-900'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>Tekst</span>
          {badgeState.textLayers.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] text-emerald-400 flex items-center justify-center font-bold">
              {badgeState.textLayers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('background')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition border-b-2 whitespace-nowrap ${
            activeTab === 'background'
              ? 'text-emerald-400 border-emerald-400 bg-slate-900'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Kleur</span>
        </button>

        <button
          onClick={() => setActiveTab('guides')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition border-b-2 whitespace-nowrap ${
            activeTab === 'guides'
              ? 'text-emerald-400 border-emerald-400 bg-slate-900'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Gidsen</span>
        </button>
      </div>

      {/* Tab Content Panels */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* ===================== TAB: TEMPLATES ===================== */}
        {activeTab === 'template' && (
          <div className="space-y-3">
            <div>
              <h3 className="text-xs font-semibold text-white mb-1">Kies Button Formaat</h3>
              <p className="text-[11px] text-slate-400 mb-3">
                Selecteer de exacte maat van je buttonmaker machine.
              </p>
            </div>

            <div className="space-y-2">
              {BUTTON_TEMPLATES.map(tmpl => {
                const isSelected = badgeState.template.id === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => {
                      setBadgeState(prev => ({
                        ...prev,
                        template: tmpl
                      }));
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-sm'
                        : 'bg-slate-800/60 border-slate-750 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-white">{tmpl.name}</span>
                      {tmpl.popular && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                          Populair
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-3 font-mono">
                      <span>Zichtbaar: <strong className="text-slate-200">{tmpl.faceDiameterMm}mm</strong></span>
                      <span>•</span>
                      <span>Snijmaat: <strong className="text-rose-400">{tmpl.cutDiameterMm}mm</strong></span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 truncate">
                      {tmpl.press}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Template Editor */}
            {badgeState.template.id === 'custom' && (
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-750 space-y-3 mt-3">
                <div className="font-semibold text-emerald-400">Aangepaste afmetingen (mm)</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Zichtbare diameter</label>
                    <input
                      type="number"
                      step="0.5"
                      value={badgeState.template.faceDiameterMm}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 20;
                        setBadgeState(prev => ({
                          ...prev,
                          template: { ...prev.template, faceDiameterMm: val }
                        }));
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Snijmaat (Cut)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={badgeState.template.cutDiameterMm}
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 30;
                        setBadgeState(prev => ({
                          ...prev,
                          template: { ...prev.template, cutDiameterMm: val }
                        }));
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB: IMAGE ===================== */}
        {activeTab === 'image' && (
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={e => handleImageUpload(e.target.files[0])}
            />

            <input
              type="file"
              ref={batchInputRef}
              multiple
              accept="image/*"
              className="hidden"
              onChange={e => handleBatchUpload(e.target.files)}
            />

            {!badgeState.image ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) handleImageUpload(e.dataTransfer.files[0]);
                }}
                className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer transition bg-slate-950/40 hover:bg-slate-900/60 group"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="font-semibold text-white mb-1">Kies of sleep een afbeelding</div>
                <p className="text-slate-400 text-[11px]">JPG, PNG, WebP of SVG</p>
                <p className="text-slate-500 text-[10px] mt-2">Geen kwaliteitsverlies • Lokaal verwerkt</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-semibold text-slate-300">Afbeelding geladen</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-emerald-400 hover:text-emerald-300 underline"
                    >
                      Vervang
                    </button>
                    <button
                      onClick={() => setBadgeState(prev => ({ ...prev, image: null }))}
                      className="p-1 rounded text-rose-400 hover:bg-rose-500/10 transition"
                      title="Verwijder afbeelding"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Scale */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400">Grootte / Zoom</span>
                    <span className="font-mono text-emerald-400">{Math.round(badgeState.imageProps.scale * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="4"
                    step="0.05"
                    value={badgeState.imageProps.scale}
                    onChange={e => {
                      const val = parseFloat(e.target.value);
                      setBadgeState(prev => ({
                        ...prev,
                        imageProps: { ...prev.imageProps, scale: val }
                      }));
                    }}
                    className="w-full"
                  />
                </div>

                {/* Rotation */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400">Rotatie</span>
                    <span className="font-mono text-emerald-400">{badgeState.imageProps.rotation}°</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={badgeState.imageProps.rotation}
                      onChange={e => {
                        const val = parseInt(e.target.value, 10);
                        setBadgeState(prev => ({
                          ...prev,
                          imageProps: { ...prev.imageProps, rotation: val }
                        }));
                      }}
                      className="flex-1"
                    />
                    <button
                      onClick={() => {
                        setBadgeState(prev => ({
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

                {/* Flip buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      setBadgeState(prev => ({
                        ...prev,
                        imageProps: { ...prev.imageProps, flipX: !prev.imageProps.flipX }
                      }));
                    }}
                    className={`py-1.5 px-3 rounded-lg border flex items-center justify-center gap-1.5 ${
                      badgeState.imageProps.flipX
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 border-slate-750 text-slate-300'
                    }`}
                  >
                    <FlipHorizontal className="w-3.5 h-3.5" />
                    <span>Spiegel Horiz.</span>
                  </button>

                  <button
                    onClick={() => {
                      setBadgeState(prev => ({
                        ...prev,
                        imageProps: { ...prev.imageProps, flipY: !prev.imageProps.flipY }
                      }));
                    }}
                    className={`py-1.5 px-3 rounded-lg border flex items-center justify-center gap-1.5 ${
                      badgeState.imageProps.flipY
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-800 border-slate-750 text-slate-300'
                    }`}
                  >
                    <FlipVertical className="w-3.5 h-3.5" />
                    <span>Spiegel Vert.</span>
                  </button>
                </div>

                {/* Filters */}
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Beeldcorrectie</span>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1 text-[11px]">
                      <span className="text-slate-400">Helderheid</span>
                      <span className="font-mono text-slate-300">{badgeState.imageProps.brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={badgeState.imageProps.brightness}
                      onChange={e => {
                        const val = parseInt(e.target.value, 10);
                        setBadgeState(prev => ({
                          ...prev,
                          imageProps: { ...prev.imageProps, brightness: val }
                        }));
                      }}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1 text-[11px]">
                      <span className="text-slate-400">Contrast</span>
                      <span className="font-mono text-slate-300">{badgeState.imageProps.contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={badgeState.imageProps.contrast}
                      onChange={e => {
                        const val = parseInt(e.target.value, 10);
                        setBadgeState(prev => ({
                          ...prev,
                          imageProps: { ...prev.imageProps, contrast: val }
                        }));
                      }}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1 text-[11px]">
                      <span className="text-slate-400">Zwart/Wit (Grayscale)</span>
                      <span className="font-mono text-slate-300">{badgeState.imageProps.grayscale}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={badgeState.imageProps.grayscale}
                      onChange={e => {
                        const val = parseInt(e.target.value, 10);
                        setBadgeState(prev => ({
                          ...prev,
                          imageProps: { ...prev.imageProps, grayscale: val }
                        }));
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* NEW: Multi-Image Batch Upload Box */}
            <div className="p-3.5 bg-gradient-to-br from-emerald-950/40 to-slate-950/80 rounded-2xl border border-emerald-500/20 space-y-2.5">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Images className="w-4 h-4 text-emerald-400" />
                <span>Verschillende foto's op 1 vel?</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Wil je bijvoorbeeld 10 verschillende foto's (van een band, gezin of evenement) direct samen op één printblad zetten?
              </p>
              <button
                onClick={() => batchInputRef.current?.click()}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Selecteer Meerdere Foto's</span>
              </button>
            </div>
          </div>
        )}

        {/* ===================== TAB: TEXT ===================== */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white">Tekst & Boogtekst</h3>
                <p className="text-[11px] text-slate-400">Plaats tekst recht of gebogen langs de rand</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => handleAddTextLayer('straight')}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-center font-medium text-slate-200 transition"
              >
                + Recht
              </button>
              <button
                onClick={() => handleAddTextLayer('curved-top')}
                className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-center font-medium text-emerald-300 transition"
              >
                + Bovenboog ⌒
              </button>
              <button
                onClick={() => handleAddTextLayer('curved-bottom')}
                className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-center font-medium text-emerald-300 transition"
              >
                + Onderboog ⌣
              </button>
            </div>

            {badgeState.textLayers.length === 0 ? (
              <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-6 text-center text-slate-500">
                Geen tekstlagen toegevoegd. Klik op een knop hierboven om tekst toe te voegen.
              </div>
            ) : (
              <div className="space-y-3">
                {badgeState.textLayers.map((layer, index) => (
                  <div
                    key={layer.id}
                    className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-emerald-400">
                        Laag #{index + 1}: {layer.style === 'curved-top' ? 'Bovenboog' : layer.style === 'curved-bottom' ? 'Onderboog' : 'Recht'}
                      </span>
                      <button
                        onClick={() => deleteTextLayer(layer.id)}
                        className="text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={layer.text}
                      onChange={e => updateTextLayer(layer.id, { text: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium"
                      placeholder="Tekst typen..."
                    />

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Lettertype</label>
                      <select
                        value={layer.fontFamily}
                        onChange={e => updateTextLayer(layer.id, { fontFamily: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs"
                      >
                        {GOOGLE_FONTS.map(f => (
                          <option key={f.name} value={f.family}>{f.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                          <span>Grootte</span>
                          <span>{layer.fontSize}px</span>
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
                          <span>{layer.letterSpacing}px</span>
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

        {/* ===================== TAB: BACKGROUND ===================== */}
        {activeTab === 'background' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-white mb-1">Achtergrond</h3>
              <p className="text-[11px] text-slate-400">Kies een effen kleur, verloop of transparant.</p>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => setBadgeState(prev => ({ ...prev, backgroundType: 'solid' }))}
                className={`py-2 rounded-lg border text-center transition ${
                  badgeState.backgroundType === 'solid'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold'
                    : 'bg-slate-800 border-slate-750 text-slate-300'
                }`}
              >
                Effen Kleur
              </button>
              <button
                onClick={() => setBadgeState(prev => ({ ...prev, backgroundType: 'gradient' }))}
                className={`py-2 rounded-lg border text-center transition ${
                  badgeState.backgroundType === 'gradient'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold'
                    : 'bg-slate-800 border-slate-750 text-slate-300'
                }`}
              >
                Kleurverloop
              </button>
              <button
                onClick={() => setBadgeState(prev => ({ ...prev, backgroundType: 'transparent' }))}
                className={`py-2 rounded-lg border text-center transition ${
                  badgeState.backgroundType === 'transparent'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold'
                    : 'bg-slate-800 border-slate-750 text-slate-300'
                }`}
              >
                Transparant
              </button>
            </div>

            {badgeState.backgroundType !== 'transparent' && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-slate-400 mb-1.5">Snelle Kleuren</label>
                  <div className="flex flex-wrap gap-2">
                    {colorPresets.map(c => (
                      <button
                        key={c}
                        onClick={() => setBadgeState(prev => ({ ...prev, backgroundColor: c }))}
                        className="w-6 h-6 rounded-full border border-slate-600 shadow-sm transition hover:scale-110"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={badgeState.backgroundColor}
                    onChange={e => setBadgeState(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    className="w-10 h-10 rounded border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <div>
                    <div className="font-semibold text-slate-200">
                      {badgeState.backgroundType === 'gradient' ? 'Startkleur' : 'Hoofdkleur'}
                    </div>
                    <span className="font-mono text-slate-400">{badgeState.backgroundColor}</span>
                  </div>
                </div>

                {badgeState.backgroundType === 'gradient' && (
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={badgeState.gradientColor2}
                        onChange={e => setBadgeState(prev => ({ ...prev, gradientColor2: e.target.value }))}
                        className="w-10 h-10 rounded border border-slate-700 bg-transparent cursor-pointer"
                      />
                      <div>
                        <div className="font-semibold text-slate-200">Eindkleur</div>
                        <span className="font-mono text-slate-400">{badgeState.gradientColor2}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Richting van verloop</label>
                      <select
                        value={badgeState.gradientDirection}
                        onChange={e => setBadgeState(prev => ({ ...prev, gradientDirection: e.target.value }))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white"
                      >
                        <option value="vertical">Verticaal (Boven naar beneden ↓)</option>
                        <option value="horizontal">Horizontaal (Links naar rechts →)</option>
                        <option value="radial">Radiaal (Vanuit midden ◉)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB: GUIDES ===================== */}
        {activeTab === 'guides' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-white mb-1">Hulplijnen & Weergave</h3>
              <p className="text-[11px] text-slate-400">Pas aan welke hulplijnen zichtbaar zijn tijdens het ontwerpen.</p>
            </div>

            <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <label className="flex items-center justify-between cursor-pointer py-1">
                <span className="text-slate-300">Toon alle gidslijnen</span>
                <input
                  type="checkbox"
                  checked={badgeState.showGuides}
                  onChange={e => setBadgeState(prev => ({ ...prev, showGuides: e.target.checked }))}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1 border-t border-slate-800/80">
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Zichtbaar vlak (Voorkant)
                </span>
                <input
                  type="checkbox"
                  checked={badgeState.showFaceGuide}
                  onChange={e => setBadgeState(prev => ({ ...prev, showFaceGuide: e.target.checked }))}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1 border-t border-slate-800/80">
                <span className="text-rose-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  Snijlijn (Cut line)
                </span>
                <input
                  type="checkbox"
                  checked={badgeState.showCutGuide}
                  onChange={e => setBadgeState(prev => ({ ...prev, showCutGuide: e.target.checked }))}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer py-1 border-t border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                  Donkere bleed ring (omslag)
                </span>
                <input
                  type="checkbox"
                  checked={badgeState.showBleedShade}
                  onChange={e => setBadgeState(prev => ({ ...prev, showBleedShade: e.target.checked }))}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-500"
                />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Persistent Badge Mockup at bottom of sidebar */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/70">
        <BadgeMockup badgeState={badgeState} />
      </div>
    </aside>
  );
}
