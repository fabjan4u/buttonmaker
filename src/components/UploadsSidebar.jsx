import React, { useRef } from 'react';
import { Upload, Trash2, Zap, Images, Info, Scissors } from 'lucide-react';

export function UploadsSidebar({
  uploadedImages,
  onUploadFiles,
  onDeleteUploadedImage,
  onCropImage,
  onClearAllUploads,
  onAutoFillSheet,
  onClearSheet,
  template
}) {
  const fileInputRef = useRef(null);

  const handleDropFiles = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadFiles(e.dataTransfer.files);
    }
  };

  return (
    <aside className="w-full lg:w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full overflow-hidden select-none">
      {/* Upload Header Box */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Images className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Foto Galerij
            </h2>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            {uploadedImages.length} foto's
          </span>
        </div>

        {/* Big Drag & Drop / File Selector Target */}
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => onUploadFiles(e.target.files)}
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropFiles}
          className="border-2 border-dashed border-slate-700 hover:border-emerald-500 bg-slate-900/60 hover:bg-slate-800 rounded-xl p-4 text-center cursor-pointer transition group"
        >
          <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition">
            <Upload className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-white mb-0.5">
            Kies of sleep foto's
          </div>
          <p className="text-[11px] text-slate-400">
            Meerdere tegelijk • PNG, JPG, WebP
          </p>
        </div>

        {/* Quick Batch Automation Buttons */}
        {uploadedImages.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={onAutoFillSheet}
              className="py-2 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition active:scale-95"
              title="Vul automatisch alle lege cirkels op het afdrukblad"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Vul Vel Vol</span>
            </button>

            <button
              onClick={onClearSheet}
              className="py-2 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition"
              title="Maak alle cirkels op het vel leeg"
            >
              <span>Maak Vel Leeg</span>
            </button>
          </div>
        )}
      </div>

      {/* Gallery List of Uploaded Thumbnails */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {uploadedImages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mb-3 text-slate-600">
              <Images className="w-6 h-6" />
            </div>
            <p className="font-semibold text-slate-400 mb-1">Geen foto's geüpload</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Upload hier foto's en sleep ze direct naar een cirkel op het blad rechts.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {uploadedImages.map((imgItem) => (
              <div
                key={imgItem.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', imgItem.id);
                }}
                onDoubleClick={() => onCropImage && onCropImage(imgItem)}
                className="group relative aspect-square rounded-xl overflow-hidden bg-slate-950 border border-slate-800 hover:border-emerald-500 shadow-sm transition cursor-grab active:cursor-grabbing hover:scale-[1.02]"
                title="Dubbelklik om bij te snijden • Sleep naar een cirkel"
              >
                <img
                  src={imgItem.url}
                  alt={imgItem.name}
                  className="w-full h-full object-cover"
                />

                {/* Drag Hint Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2 opacity-90 group-hover:opacity-100 transition">
                  <span className="text-[10px] text-white font-medium truncate block">
                    {imgItem.name}
                  </span>
                  <span className="text-[9px] text-emerald-400 font-mono">
                    Sleep naar cirkel ➔
                  </span>
                </div>

                {/* Action buttons on hover */}
                <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  {onCropImage && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCropImage(imgItem);
                      }}
                      className="w-6 h-6 rounded-full bg-black/60 hover:bg-amber-600 text-white flex items-center justify-center transition shadow"
                      title="Foto bijsnijden naar cirkel (Crop)"
                    >
                      <Scissors className="w-3 h-3" />
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteUploadedImage(imgItem.id);
                    }}
                    className="w-6 h-6 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition shadow"
                    title="Verwijder uit galerij"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info Box */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-500" />
          <span>Formaat: <strong className="text-white">{template.name.split(' ')[0]}</strong></span>
        </span>
        {uploadedImages.length > 0 && (
          <button
            onClick={onClearAllUploads}
            className="text-[10px] text-rose-400 hover:underline"
          >
            Alles wissen
          </button>
        )}
      </div>
    </aside>
  );
}
