import React, { useState, useRef, useMemo } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Check, 
  Upload, 
  Plus, 
  Minus, 
  Trash2, 
  Layers, 
  Copy, 
  ChevronLeft, 
  ChevronRight, 
  Images,
  Sparkles
} from 'lucide-react';
import { PAPER_FORMATS } from '../constants/templates';
import { calculateSheetGrid, generatePrintPdf, generateHighResBadgeDataUrl } from '../utils/pdfGenerator';

export function PrintSheetModal({ 
  isOpen, 
  onClose, 
  badgeState, 
  sheetQueue = [], 
  setSheetQueue 
}) {
  if (!isOpen) return null;

  const [sheetMode, setSheetMode] = useState(sheetQueue.length > 0 ? 'multi' : 'single'); // 'single' or 'multi'
  const [selectedPaperId, setSelectedPaperId] = useState('a4');
  const [singleFillMode, setSingleFillMode] = useState('full'); // 'full' or 'custom'
  const [singleCustomCount, setSingleCustomCount] = useState(1);
  const [cutLineStyle, setCutLineStyle] = useState('dashed');
  const [drawCenterMark, setDrawCenterMark] = useState(true);
  const [includeCalibration, setIncludeCalibration] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewPageIndex, setPreviewPageIndex] = useState(0);

  const batchFileInputRef = useRef(null);

  const paper = PAPER_FORMATS.find(p => p.id === selectedPaperId) || PAPER_FORMATS[0];
  const grid = calculateSheetGrid(paper, badgeState.template);

  // Thumbnail for the current active editor design
  const currentBadgeThumbUrl = useMemo(() => {
    return generateHighResBadgeDataUrl(badgeState, 260);
  }, [badgeState]);

  // If sheetQueue is empty, initialize it with current active design
  const initializeWithCurrent = () => {
    const newItem = {
      id: 'item-' + Date.now(),
      name: 'Huidig ontwerp',
      badgeState: { ...badgeState },
      thumbUrl: currentBadgeThumbUrl,
      count: 1
    };
    setSheetQueue([newItem]);
  };

  // Add current active design to queue
  const handleAddCurrentToQueue = () => {
    const newItem = {
      id: 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      name: `Ontwerp #${sheetQueue.length + 1}`,
      badgeState: { ...badgeState },
      thumbUrl: currentBadgeThumbUrl,
      count: 1
    };
    setSheetQueue(prev => [...prev, newItem]);
  };

  // Batch upload multiple images at once!
  const handleBatchUpload = (files) => {
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    let loadedCount = 0;
    const newItems = [];

    fileList.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Calculate scale to fill or fit face circle nicely
          const size = 800;
          const cutRadius = (size / 2) * 0.94;
          const faceRadius = cutRadius * (badgeState.template.faceDiameterMm / badgeState.template.cutDiameterMm);
          const targetDiam = cutRadius * 2; // fill up to cut line so no white edges
          const scale = targetDiam / Math.min(img.naturalWidth, img.naturalHeight);

          // Create unique badge state for this image (clean background, no default text, pure photo)
          const newBadgeState = {
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
            textLayers: [] // photos by default without conflicting sample text
          };

          const thumbUrl = generateHighResBadgeDataUrl(newBadgeState, 260);

          newItems.push({
            id: `batch-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
            name: file.name.replace(/\.[^/.]+$/, '').slice(0, 18),
            badgeState: newBadgeState,
            thumbUrl,
            count: 1
          });

          loadedCount++;
          if (loadedCount === fileList.length) {
            setSheetQueue(prev => [...prev, ...newItems]);
            setSheetMode('multi');
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Adjust count for a specific design in the queue
  const updateItemCount = (id, delta) => {
    setSheetQueue(prev => prev.map(item => {
      if (item.id === id) {
        const newCount = Math.max(1, item.count + delta);
        return { ...item, count: newCount };
      }
      return item;
    }));
  };

  // Remove item from queue
  const removeItem = (id) => {
    setSheetQueue(prev => prev.filter(item => item.id !== id));
  };

  // Clear entire queue
  const clearQueue = () => {
    setSheetQueue([]);
  };

  // Fill sheet to capacity by distributing counts evenly or duplicating
  const handleAutoFillCapacity = () => {
    if (sheetQueue.length === 0) return;
    const target = grid.maxButtonsPerPage;
    const currentTotal = sheetQueue.reduce((sum, item) => sum + item.count, 0);

    if (currentTotal >= target) return;

    const diff = target - currentTotal;
    // Add extra copies to existing items starting from first
    setSheetQueue(prev => {
      const copy = [...prev];
      for (let i = 0; i < diff; i++) {
        const idx = i % copy.length;
        copy[idx] = { ...copy[idx], count: copy[idx].count + 1 };
      }
      return copy;
    });
  };

  // Compute flattened list of badge items for display
  const flattenedBadges = useMemo(() => {
    if (sheetMode === 'single') {
      const count = singleFillMode === 'full' ? grid.maxButtonsPerPage : Math.min(singleCustomCount, grid.maxButtonsPerPage);
      return Array(count).fill({
        thumbUrl: currentBadgeThumbUrl,
        name: 'Huidig ontwerp'
      });
    } else {
      const list = [];
      sheetQueue.forEach(item => {
        for (let i = 0; i < item.count; i++) {
          list.push({
            thumbUrl: item.thumbUrl,
            name: item.name
          });
        }
      });
      return list;
    }
  }, [sheetMode, singleFillMode, singleCustomCount, grid.maxButtonsPerPage, currentBadgeThumbUrl, sheetQueue]);

  // Multi-page calculation
  const totalBadgesCount = flattenedBadges.length;
  const totalPages = Math.max(1, Math.ceil(totalBadgesCount / grid.maxButtonsPerPage));

  // Current page items for the preview
  const currentPageItems = useMemo(() => {
    const start = previewPageIndex * grid.maxButtonsPerPage;
    const end = start + grid.maxButtonsPerPage;
    return flattenedBadges.slice(start, end);
  }, [flattenedBadges, previewPageIndex, grid.maxButtonsPerPage]);

  const handleDownloadPdf = async () => {
    try {
      setIsGenerating(true);
      await new Promise(r => setTimeout(r, 60));

      await generatePrintPdf({
        paper,
        template: badgeState.template,
        badgeState,
        badgeList: sheetQueue,
        mode: sheetMode,
        buttonCount: singleFillMode === 'full' ? 'fill' : singleCustomCount,
        drawCutLine: true,
        cutLineStyle,
        drawCenterMark,
        includeCalibration
      });
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Er ging iets mis bij het genereren van de PDF: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Afdrukvel Samenstellen</h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  300 DPI Ware Grootte
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Plaats één of meerdere verschillende afbeeldingen op A4 / Letter
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

        {/* Mode Selector Header (Single vs Multi) */}
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setSheetMode('single')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                sheetMode === 'single'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Enkel ontwerp herhalen</span>
            </button>

            <button
              onClick={() => {
                setSheetMode('multi');
                if (sheetQueue.length === 0) initializeWithCurrent();
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                sheetMode === 'multi'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Images className="w-3.5 h-3.5" />
              <span>Verschillende afbeeldingen (Mix)</span>
              {sheetQueue.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-slate-900 text-emerald-300 text-[10px] flex items-center justify-center font-bold">
                  {sheetQueue.length}
                </span>
              )}
            </button>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-3">
            <span>Formaat: <strong className="text-white">{badgeState.template.name}</strong></span>
            <span>•</span>
            <span>Max per pagina: <strong className="text-emerald-400">{grid.maxButtonsPerPage}</strong></span>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: Live Sheet Preview with Paginated Circles */}
          <div className="lg:col-span-6 flex flex-col items-center justify-between bg-slate-950/70 rounded-2xl p-5 border border-slate-800/80">
            
            {/* Page navigation bar if multi-page */}
            <div className="flex items-center justify-between w-full max-w-xs mb-2 text-xs">
              <span className="text-slate-400 font-medium">
                {paper.name.split(' ')[0]} ({paper.widthMm}×{paper.heightMm}mm)
              </span>

              {totalPages > 1 ? (
                <div className="flex items-center gap-2 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                  <button
                    disabled={previewPageIndex === 0}
                    onClick={() => setPreviewPageIndex(p => Math.max(0, p - 1))}
                    className="disabled:opacity-30 hover:text-emerald-400"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-emerald-400 text-xs">
                    Pagina {previewPageIndex + 1} / {totalPages}
                  </span>
                  <button
                    disabled={previewPageIndex >= totalPages - 1}
                    onClick={() => setPreviewPageIndex(p => Math.min(totalPages - 1, p + 1))}
                    className="disabled:opacity-30 hover:text-emerald-400"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <span className="text-emerald-400 font-semibold font-mono">
                  {totalBadgesCount} / {grid.maxButtonsPerPage} buttons
                </span>
              )}
            </div>

            {/* Paper Sheet Preview Container */}
            <div
              className="bg-white rounded-lg shadow-2xl relative p-3 border border-slate-300 transition-all flex flex-col justify-between my-auto"
              style={{
                width: '100%',
                maxWidth: '290px',
                aspectRatio: `${paper.widthMm} / ${paper.heightMm}`
              }}
            >
              {/* Top sheet header */}
              <div className="text-[7px] text-slate-400 border-b border-slate-200 pb-1 mb-1 flex justify-between font-mono">
                <span>BUTTONMAKER • {badgeState.template.name}</span>
                <span>{totalPages > 1 ? `P.${previewPageIndex + 1}/${totalPages}` : paper.standard}</span>
              </div>

              {/* Grid of buttons on paper */}
              <div
                className="grid gap-1 flex-1 items-center justify-center"
                style={{
                  gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${grid.rows}, minmax(0, 1fr))`
                }}
              >
                {Array.from({ length: grid.maxButtonsPerPage }).map((_, slotIdx) => {
                  const badgeItem = currentPageItems[slotIdx];
                  const hasBadge = !!badgeItem;

                  return (
                    <div
                      key={slotIdx}
                      className={`aspect-square rounded-full flex items-center justify-center transition-all ${
                        hasBadge
                          ? 'border border-dashed border-rose-400 bg-slate-100 shadow-sm overflow-hidden'
                          : 'border border-dashed border-slate-200 bg-slate-50/60'
                      }`}
                    >
                      {hasBadge ? (
                        <img
                          src={badgeItem.thumbUrl}
                          alt="badge"
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <span className="text-[7px] text-slate-300 font-mono">
                          {slotIdx + 1}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom calibration ruler */}
              <div className="text-[6px] text-slate-400 border-t border-slate-200 pt-1 mt-1 flex justify-between font-mono items-center">
                <span>Print op 100% (Geen schaal)</span>
                <span className="border-b border-slate-800 pb-[1px]">|-- 50mm --|</span>
              </div>
            </div>

            {/* Scale badge reassurance */}
            <div className="mt-3 text-center">
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900/90 px-3 py-1 rounded-full border border-slate-800">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Geen watermerk • Exacte schaal 1:1</span>
              </span>
            </div>
          </div>

          {/* RIGHT: Controls & Batch Manager */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
            
            {/* MULTI-DESIGN MANAGER */}
            {sheetMode === 'multi' ? (
              <div className="space-y-4">
                
                {/* Batch Action Buttons */}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={batchFileInputRef}
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={e => handleBatchUpload(e.target.files)}
                  />

                  <button
                    onClick={() => batchFileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition active:scale-95"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Meerdere Foto's</span>
                  </button>

                  <button
                    onClick={handleAddCurrentToQueue}
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition"
                    title="Voeg het huidige ontwerp uit de editor toe aan de lijst"
                  >
                    <Plus className="w-4 h-4 text-emerald-400" />
                    <span>Huidig Toevoegen</span>
                  </button>
                </div>

                {/* Queue Summary / Stats */}
                <div className="flex items-center justify-between text-xs bg-slate-950/40 px-3 py-2 rounded-xl border border-slate-800">
                  <span className="text-slate-300">
                    Totaal op afdruk: <strong className="text-emerald-400">{totalBadgesCount} buttons</strong> ({totalPages} {totalPages === 1 ? 'pagina' : 'pagina’s'})
                  </span>

                  <div className="flex items-center gap-2">
                    {totalBadgesCount < grid.maxButtonsPerPage && (
                      <button
                        onClick={handleAutoFillCapacity}
                        className="text-xs text-emerald-400 hover:underline font-medium"
                      >
                        Vul vel vol ({grid.maxButtonsPerPage})
                      </button>
                    )}
                    {sheetQueue.length > 0 && (
                      <button
                        onClick={clearQueue}
                        className="text-slate-500 hover:text-rose-400 text-xs transition"
                      >
                        Wissen
                      </button>
                    )}
                  </div>
                </div>

                {/* List of images/designs */}
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {sheetQueue.length === 0 ? (
                    <div className="p-6 text-center border-2 border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                      Nog geen verschillende afbeeldingen toegevoegd.<br />
                      Klik hierboven op <strong>Upload Meerdere Foto's</strong> of <strong>Huidig Toevoegen</strong>.
                    </div>
                  ) : (
                    sheetQueue.map((item, idx) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-750 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={item.thumbUrl}
                            alt={item.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-700 bg-slate-900 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-white truncate max-w-[140px] sm:max-w-[180px]">
                              {item.name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Ontwerp #{idx + 1}
                            </div>
                          </div>
                        </div>

                        {/* Quantity Counter */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-slate-900 border border-slate-750 rounded-lg p-0.5">
                            <button
                              onClick={() => updateItemCount(item.id, -1)}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-mono text-xs font-bold text-white px-2 min-w-[24px] text-center">
                              {item.count}
                            </span>
                            <button
                              onClick={() => updateItemCount(item.id, 1)}
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                            title="Verwijder dit ontwerp"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            ) : (
              /* SINGLE MODE CONTROLS */
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Aantal op vel</label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <button
                      onClick={() => setSingleFillMode('full')}
                      className={`py-2 px-3 rounded-lg border text-center transition ${
                        singleFillMode === 'full'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      Vol vel ({grid.maxButtonsPerPage} stuks)
                    </button>
                    <button
                      onClick={() => setSingleFillMode('custom')}
                      className={`py-2 px-3 rounded-lg border text-center transition ${
                        singleFillMode === 'custom'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      Kies aantal
                    </button>
                  </div>

                  {singleFillMode === 'custom' && (
                    <div className="flex items-center gap-2 mt-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                      <input
                        type="range"
                        min="1"
                        max={grid.maxButtonsPerPage}
                        value={singleCustomCount}
                        onChange={e => setSingleCustomCount(parseInt(e.target.value, 10))}
                        className="flex-1"
                      />
                      <span className="font-mono font-bold text-emerald-400 w-8 text-right">
                        {singleCustomCount}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* COMMON PRINT SETTINGS */}
            <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Papierformaat</label>
                  <select
                    value={selectedPaperId}
                    onChange={e => setSelectedPaperId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs"
                  >
                    {PAPER_FORMATS.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Snijlijn stijl</label>
                  <select
                    value={cutLineStyle}
                    onChange={e => setCutLineStyle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs"
                  >
                    <option value="dashed">Stippellijn (Dashed)</option>
                    <option value="solid">Volle dunne lijn</option>
                    <option value="none">Geen lijn</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={drawCenterMark}
                    onChange={e => setDrawCenterMark(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-emerald-500"
                  />
                  <span>Middenkruis (+)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCalibration}
                    onChange={e => setIncludeCalibration(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-emerald-500"
                  />
                  <span>50mm meetlat</span>
                </label>
              </div>
            </div>

            {/* Download CTA Button */}
            <div className="pt-2">
              <button
                onClick={handleDownloadPdf}
                disabled={isGenerating || totalBadgesCount === 0}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 transition active:scale-[0.99]"
              >
                <Download className="w-4 h-4" />
                <span>
                  {isGenerating 
                    ? 'PDF wordt gegenereerd...' 
                    : `Download Printklare PDF (${totalBadgesCount} buttons • ${totalPages} ${totalPages === 1 ? 'pagina' : 'pagina’s'})`
                  }
                </span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
