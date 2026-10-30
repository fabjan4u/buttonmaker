import React from 'react';
import { Printer, RotateCcw, Github, Zap } from 'lucide-react';
import { BUTTON_TEMPLATES, PAPER_FORMATS } from '../constants/templates';

export function Navbar({
  template,
  setTemplate,
  paper,
  setPaper,
  onDownloadPdf,
  onAutoFill,
  onResetSheet,
  isGenerating,
  badgesCount,
  totalSlots
}) {
  const handleTemplateChange = (e) => {
    const val = e.target.value;
    if (val === 'custom') {
      const faceStr = window.prompt('Voer de zichtbare diameter van de button in (in millimeters, bijv. 38):', template.faceDiameterMm || 36);
      if (!faceStr) return;
      const cutStr = window.prompt('Voer de totale stansmaat / snijdiameter in (in millimeters, bijv. 44):', template.cutDiameterMm || 44);
      if (!cutStr) return;

      const face = parseFloat(faceStr);
      const cut = parseFloat(cutStr);
      if (!isNaN(face) && !isNaN(cut) && face > 10 && cut >= face) {
        setTemplate({
          id: 'custom',
          name: `Aangepast (${face}mm / ${cut}mm)`,
          category: 'custom',
          popular: false,
          faceDiameterMm: face,
          cutDiameterMm: cut,
          bleedMm: Number(((cut - face) / 2).toFixed(1)),
          press: 'Aangepaste maat',
          description: `${face}mm zichtbaar, ${cut}mm stansmaat.`
        });
      } else {
        alert('Voer geldige afmetingen in (minimaal 10mm en stansmaat groter dan of gelijk aan zichtbare maat).');
      }
      return;
    }

    const found = BUTTON_TEMPLATES.find(t => t.id === val);
    if (found) setTemplate(found);
  };

  return (
    <header className="bg-slate-900/95 backdrop-blur border-b border-slate-800 sticky top-0 z-40 px-3 sm:px-4 py-2 sm:py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        
        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-black text-base sm:text-xl border-2 border-emerald-300/30 shrink-0">
            B
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-bold text-sm sm:text-lg text-white tracking-tight">ButtonMaker</span>
              <span className="text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hidden xs:inline">
                100% Gratis
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Printklaar vel direct op 1:1 schaal (300 DPI)
            </p>
          </div>
        </div>

        {/* Template & Paper Selectors */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Button Size Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-2 sm:px-2.5 py-1 text-xs">
            <span className="text-slate-400 mr-1.5 hidden md:inline">Maat:</span>
            <select
              value={template.id}
              onChange={handleTemplateChange}
              className="bg-transparent text-emerald-400 font-bold focus:outline-none cursor-pointer max-w-[125px] sm:max-w-xs truncate text-[11px] sm:text-xs"
            >
              {BUTTON_TEMPLATES.map(t => (
                <option key={t.id} value={t.id} className="bg-slate-900 text-white font-normal">
                  {t.name}{t.popular ? ' ★' : ''}
                </option>
              ))}
            </select>
            {template.popular && (
              <span className="hidden xl:inline text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded ml-1.5 uppercase tracking-wider">
                Populair
              </span>
            )}
          </div>

          {/* Paper Format Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-xs">
            <span className="text-slate-400 mr-1.5 hidden md:inline">Papier:</span>
            <select
              value={paper.id}
              onChange={(e) => {
                const found = PAPER_FORMATS.find(p => p.id === e.target.value);
                if (found) setPaper(found);
              }}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer text-[11px] sm:text-xs"
            >
              {PAPER_FORMATS.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white font-normal">
                  {p.name.split(' ')[0]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Auto fill button (Desktop) */}
          <button
            onClick={onAutoFill}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
            title="Herhaal aanwezige foto's om alle lege cirkels op het vel op te vullen"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Vul vel vol</span>
          </button>

          {/* Reset sheet */}
          <button
            onClick={onResetSheet}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
            title="Maak alle cirkels op het blad leeg"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Download PDF (PRIMARY CTA) */}
          <button
            onClick={onDownloadPdf}
            disabled={isGenerating || badgesCount === 0}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition active:scale-95 shrink-0"
            title="Download direct de printklare PDF op 100% ware grootte"
          >
            <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">
              {isGenerating ? 'Bezig met PDF...' : `Download PDF (${badgesCount}/${totalSlots})`}
            </span>
            <span className="sm:hidden font-bold">
              {isGenerating ? '...' : `PDF (${badgesCount})`}
            </span>
          </button>

          {/* GitHub link */}
          <a
            href="https://github.com/fabjan4u/buttonmaker"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
            title="Bekijk broncode op GitHub"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>

      </div>
    </header>
  );
}
