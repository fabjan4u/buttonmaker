import React from 'react';
import { Printer, RotateCcw, Github, Zap, Check, ChevronDown } from 'lucide-react';
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
  return (
    <header className="bg-slate-900/95 backdrop-blur border-b border-slate-800 sticky top-0 z-40 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-black text-xl border-2 border-emerald-300/30">
            B
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">ButtonMaker</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                100% Gratis
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Printklaar vel direct op 1:1 schaal (300 DPI)
            </p>
          </div>
        </div>

        {/* Template & Paper Selectors */}
        <div className="flex items-center gap-2">
          {/* Button Size Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-slate-400 mr-2 hidden md:inline">Maat:</span>
            <select
              value={template.id}
              onChange={(e) => {
                const found = BUTTON_TEMPLATES.find(t => t.id === e.target.value);
                if (found) setTemplate(found);
              }}
              className="bg-transparent text-emerald-400 font-bold focus:outline-none cursor-pointer"
            >
              {BUTTON_TEMPLATES.map(t => (
                <option key={t.id} value={t.id} className="bg-slate-900 text-white font-normal">
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Paper Format Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-slate-400 mr-2 hidden md:inline">Papier:</span>
            <select
              value={paper.id}
              onChange={(e) => {
                const found = PAPER_FORMATS.find(p => p.id === e.target.value);
                if (found) setPaper(found);
              }}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
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
        <div className="flex items-center gap-2">
          {/* Auto fill button */}
          <button
            onClick={onAutoFill}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition"
            title="Herhaal aanwezige foto's om alle lege cirkels op het vel op te vullen"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Vul vel vol</span>
          </button>

          {/* Reset sheet */}
          <button
            onClick={onResetSheet}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700 transition"
            title="Maak alle cirkels op het blad leeg"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Download PDF (PRIMARY CTA) */}
          <button
            onClick={onDownloadPdf}
            disabled={isGenerating || badgesCount === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition active:scale-95"
            title="Download direct de printklare PDF op 100% ware grootte"
          >
            <Printer className="w-4 h-4" />
            <span>
              {isGenerating ? 'Bezig met PDF...' : `Download PDF (${badgesCount}/${totalSlots})`}
            </span>
          </button>

          {/* GitHub link */}
          <a
            href="https://github.com/fabjan4u/buttonmaker"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700 transition"
            title="Bekijk broncode op GitHub"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>

      </div>
    </header>
  );
}
