import React, { useState } from 'react';
import { X, Printer, Download, Check, HelpCircle, FileText, Settings2 } from 'lucide-react';
import { PAPER_FORMATS } from '../constants/templates';
import { calculateSheetGrid, generatePrintPdf, generateHighResBadgeDataUrl } from '../utils/pdfGenerator';

export function PrintSheetModal({ isOpen, onClose, badgeState }) {
  if (!isOpen) return null;

  const [selectedPaperId, setSelectedPaperId] = useState('a4');
  const [fillMode, setFillMode] = useState('full'); // 'full' or 'custom'
  const [customCount, setCustomCount] = useState(1);
  const [cutLineStyle, setCutLineStyle] = useState('dashed'); // 'dashed', 'solid', 'none'
  const [drawCenterMark, setDrawCenterMark] = useState(true);
  const [includeCalibration, setIncludeCalibration] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const paper = PAPER_FORMATS.find(p => p.id === selectedPaperId) || PAPER_FORMATS[0];
  const grid = calculateSheetGrid(paper, badgeState.template);
  const badgeCount = fillMode === 'full' ? grid.maxButtonsPerPage : Math.min(customCount, grid.maxButtonsPerPage);

  // Generate thumbnail data URL
  const badgeThumbUrl = React.useMemo(() => {
    return generateHighResBadgeDataUrl(badgeState, 300);
  }, [badgeState]);

  const handleDownloadPdf = async () => {
    try {
      setIsGenerating(true);
      // Let UI update
      await new Promise(r => setTimeout(r, 50));
      await generatePrintPdf({
        paper,
        template: badgeState.template,
        badgeState,
        buttonCount: badgeCount,
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

  // Build grid layout preview array
  const previewItems = [];
  for (let i = 0; i < grid.maxButtonsPerPage; i++) {
    previewItems.push(i < badgeCount);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Printklaar Vel (PDF)</h2>
              <p className="text-xs text-slate-400">
                Automatisch uitgelijnd op 100% ware grootte (300 DPI)
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

        {/* Modal Body: Left Preview, Right Settings */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Sheet Visual Preview (Left Column) */}
          <div className="md:col-span-7 flex flex-col items-center justify-center bg-slate-950/60 rounded-xl p-6 border border-slate-800/80">
            <div className="flex items-center justify-between w-full max-w-xs mb-3 text-xs text-slate-400">
              <span>{paper.name}</span>
              <span className="font-semibold text-emerald-400">{badgeCount} buttons op dit vel</span>
            </div>

            {/* Visual sheet mockup matching paper aspect ratio */}
            <div
              className="bg-white rounded shadow-2xl relative p-3 border border-slate-300 transition-all flex flex-col justify-between"
              style={{
                width: '100%',
                maxWidth: '280px',
                aspectRatio: `${paper.widthMm} / ${paper.heightMm}`
              }}
            >
              {/* Paper header label */}
              <div className="text-[7px] text-slate-400 border-b border-slate-200 pb-1 mb-1 flex justify-between font-mono">
                <span>BUTTONMAKER • {badgeState.template.name}</span>
                <span>{paper.standard}</span>
              </div>

              {/* Grid of buttons */}
              <div
                className="grid gap-1 flex-1 items-center justify-center"
                style={{
                  gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${grid.rows}, minmax(0, 1fr))`
                }}
              >
                {previewItems.map((isActive, idx) => (
                  <div
                    key={idx}
                    className={`aspect-square rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? 'border border-dashed border-rose-400 bg-slate-100 shadow-sm overflow-hidden'
                        : 'border border-dashed border-slate-200 bg-slate-50 opacity-40'
                    }`}
                  >
                    {isActive ? (
                      <img
                        src={badgeThumbUrl}
                        alt="badge"
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-[7px] text-slate-300 font-mono">{idx + 1}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Calibration bar preview at bottom */}
              <div className="text-[6px] text-slate-400 border-t border-slate-200 pt-1 mt-1 flex justify-between font-mono items-center">
                <span>Print op 100% (Geen schaal)</span>
                <span className="border-b border-slate-800 pb-[1px]">|-- 50mm --|</span>
              </div>
            </div>

            <div className="mt-4 text-center">
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Geen watermerk • Exact op ware grootte</span>
              </span>
            </div>
          </div>

          {/* Settings Column (Right Column) */}
          <div className="md:col-span-5 flex flex-col justify-between space-y-5">
            <div className="space-y-4 text-xs">
              {/* Paper Format */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Papierformaat</label>
                <div className="grid grid-cols-2 gap-2">
                  {PAPER_FORMATS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPaperId(p.id)}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        selectedPaperId === p.id
                          ? 'bg-emerald-500/10 border-emerald-500 text-white font-medium'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-semibold text-xs">{p.id.toUpperCase()}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{p.widthMm} × {p.heightMm} mm</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Aantal op vel</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    onClick={() => setFillMode('full')}
                    className={`py-2 px-3 rounded-lg border text-center transition ${
                      fillMode === 'full'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                    }`}
                  >
                    Vol vel ({grid.maxButtonsPerPage} stuks)
                  </button>
                  <button
                    onClick={() => setFillMode('custom')}
                    className={`py-2 px-3 rounded-lg border text-center transition ${
                      fillMode === 'custom'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                    }`}
                  >
                    Kies aantal
                  </button>
                </div>
                {fillMode === 'custom' && (
                  <div className="flex items-center gap-2 mt-2 bg-slate-800/60 p-2 rounded-lg border border-slate-700">
                    <input
                      type="range"
                      min="1"
                      max={grid.maxButtonsPerPage}
                      value={customCount}
                      onChange={e => setCustomCount(parseInt(e.target.value, 10))}
                      className="flex-1"
                    />
                    <span className="font-mono font-bold text-emerald-400 w-8 text-right">
                      {customCount}
                    </span>
                  </div>
                )}
              </div>

              {/* Cut Guides & Markings */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Snijlijnen & Hulptekens</label>
                <div className="space-y-2 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Snijlijn stijl:</span>
                    <select
                      value={cutLineStyle}
                      onChange={e => setCutLineStyle(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs"
                    >
                      <option value="dashed">Stippellijn (Dashed)</option>
                      <option value="solid">Dunne volle lijn</option>
                      <option value="none">Geen snijlijn</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 pt-1">
                    <input
                      type="checkbox"
                      checked={drawCenterMark}
                      onChange={e => setDrawCenterMark(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                    />
                    <span>Middenkruis voor cirkelsnijders (+)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={includeCalibration}
                      onChange={e => setIncludeCalibration(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                    />
                    <span>50mm kalibratie meetlat op vel</span>
                  </label>
                </div>
              </div>

              {/* Print Tip Box */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-[11px] text-amber-200/90 leading-relaxed">
                <div className="font-semibold text-amber-300 mb-0.5 flex items-center gap-1">
                  <span>💡 Tip voor printen op ware grootte:</span>
                </div>
                Kies in je printerdialoogvenster altijd voor <strong>"Ware grootte" (100% / Do not scale)</strong>. Schakel "Passend maken" of "Fit to page" uit.
              </div>
            </div>

            {/* Download Button */}
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={handleDownloadPdf}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 transition active:scale-[0.99]"
              >
                <Download className="w-4 h-4" />
                <span>{isGenerating ? 'PDF wordt gegenereerd...' : `Download Printklare PDF (${badgeCount} stuks)`}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
