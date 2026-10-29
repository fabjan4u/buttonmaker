import React from 'react';
import { Printer, Download, RotateCcw, Github, Sparkles, Layers } from 'lucide-react';

export function Navbar({ template, onOpenPrintModal, onDownloadPng, onReset, is3D, setIs3D }) {
  return (
    <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 sticky top-0 z-40 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
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
              Ontwerp & print pin-back badges • Zonder limieten
            </p>
          </div>
        </div>

        {/* Current Size Pill */}
        <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs">
          <span className="text-slate-400">Gekozen maat:</span>
          <span className="font-semibold text-emerald-400">{template.name}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">Snijmaat: {template.cutDiameterMm}mm</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* 3D / Flat View Toggle */}
          <button
            onClick={() => setIs3D(!is3D)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              is3D
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
            }`}
            title="Wissel tussen 2D werkvlak en 3D glans preview"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{is3D ? '3D Badge' : '2D Editor'}</span>
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Herstel naar standaard"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Download Single PNG */}
          <button
            onClick={onDownloadPng}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
            title="Download losse hoge-resolutie PNG (1200×1200 px)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PNG</span>
          </button>

          {/* Print Sheet Modal (Primary Call to Action) */}
          <button
            onClick={onOpenPrintModal}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/25 transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Printvel (PDF)</span>
          </button>

          {/* GitHub link */}
          <a
            href="https://github.com/fabjan4u/buttonmaker"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
            title="Bekijk broncode op GitHub"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
