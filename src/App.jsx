import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { UploadsSidebar } from './components/UploadsSidebar';
import { SheetWorkspace } from './components/SheetWorkspace';
import { BadgeEditorModal } from './components/BadgeEditorModal';
import { CropModal } from './components/CropModal';
import { BUTTON_TEMPLATES, PAPER_FORMATS } from './constants/templates';
import { calculateSheetGrid, generatePrintPdf } from './utils/pdfGenerator';
import { 
  FileText, 
  Images, 
  Zap, 
  Printer, 
  Scissors, 
  Type, 
  Copy, 
  Trash2, 
  X, 
  Plus, 
  Upload 
} from 'lucide-react';

export default function App() {
  const [template, setTemplate] = useState(BUTTON_TEMPLATES[0]); // 32mm VEVOR JM-32 default
  const [paper, setPaper] = useState(PAPER_FORMATS[0]); // A4
  const [uploadedImages, setUploadedImages] = useState([]);
  const [editingSlotIndex, setEditingSlotIndex] = useState(null);
  const [croppingSlotIndex, setCroppingSlotIndex] = useState(null);
  const [galleryCropItem, setGalleryCropItem] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);
  const [mobileTab, setMobileTab] = useState('sheet'); // 'sheet' | 'uploads'
  const [activeMobileSlot, setActiveMobileSlot] = useState(null); // number | null
  const mobileFileInputRef = useRef(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Compute grid slots capacity
  const grid = useMemo(() => calculateSheetGrid(paper, template), [paper, template]);
  const slotsPerPage = grid.maxButtonsPerPage;

  // Helper to create a sample badge
  const createSampleBadge = (tmpl) => {
    const is32 = tmpl.faceDiameterMm <= 36;
    return {
      id: 'sample-' + Date.now(),
      image: null,
      imageProps: { x: 0, y: 0, scale: 1, fitMode: 'face', rotation: 0, flipX: false, flipY: false, brightness: 100, contrast: 100, grayscale: 0 },
      backgroundColor: '#0f172a',
      backgroundType: 'gradient',
      gradientColor2: '#047857',
      gradientDirection: 'vertical',
      textLayers: [
        {
          id: 't-1',
          text: '★ BUTTON MAKER ★',
          style: 'curved-top',
          fontFamily: "'Montserrat', sans-serif",
          fontSize: is32 ? 18 : 26,
          bold: true,
          italic: false,
          color: '#facc15',
          hasStroke: true,
          strokeColor: '#0f172a',
          strokeWidth: 3,
          letterSpacing: is32 ? 2 : 4,
          curveRadiusRatio: 0.76,
          rotationDeg: 0,
          x: 0,
          y: 0
        },
        {
          id: 't-2',
          text: tmpl.id === '32mm' ? '32MM JM-32' : tmpl.id === '58mm' ? '58MM JM-58' : `${tmpl.faceDiameterMm}MM VEVOR`,
          style: 'straight',
          fontFamily: "'Bebas Neue', cursive",
          fontSize: is32 ? 28 : 44,
          bold: true,
          italic: false,
          color: '#ffffff',
          hasStroke: true,
          strokeColor: '#0f172a',
          strokeWidth: 4,
          letterSpacing: 2,
          rotationDeg: 0,
          x: 0,
          y: is32 ? -1 : 0
        },
        {
          id: 't-3',
          text: `STANS: ${tmpl.cutDiameterMm}MM`,
          style: 'curved-bottom',
          fontFamily: "'Inter', sans-serif",
          fontSize: is32 ? 14 : 18,
          bold: true,
          italic: false,
          color: '#94a3b8',
          hasStroke: true,
          strokeColor: '#0f172a',
          strokeWidth: 2,
          letterSpacing: 2,
          curveRadiusRatio: 0.76,
          rotationDeg: 0,
          x: 0,
          y: 0
        }
      ]
    };
  };

  // Badges array: one entry per slot on the current sheet(s)
  const [badges, setBadges] = useState(() => {
    const initial = Array(slotsPerPage).fill(null);
    initial[0] = createSampleBadge(BUTTON_TEMPLATES[0]);
    return initial;
  });

  // Adjust badges array size when paper or template changes
  useEffect(() => {
    setBadges(prev => {
      const minSlots = slotsPerPage;
      const pages = Math.max(1, Math.ceil(prev.length / slotsPerPage));
      const targetLength = Math.max(minSlots, pages * slotsPerPage);

      const next = Array(targetLength).fill(null);
      for (let i = 0; i < targetLength; i++) {
        if (prev[i]) next[i] = prev[i];
      }
      return next;
    });
    setCurrentPage(0);
  }, [slotsPerPage]);

  // Helper to construct a badge from an HTMLImageElement (Direct Cover Crop to 36mm Green Line)
  const createBadgeFromImage = (imgElement, name = '') => {
    return {
      id: 'badge-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      name: name,
      image: imgElement,
      imageProps: {
        x: 0,
        y: 0,
        scale: 1.0, // 1.0 = automatic cover crop to green line (36mm)
        fitMode: 'face', // Face circle = maximal image on the pin!
        rotation: 0,
        flipX: false,
        flipY: false,
        brightness: 100,
        contrast: 100,
        grayscale: 0
      },
      backgroundColor: '#ffffff',
      backgroundType: 'solid',
      textLayers: []
    };
  };

  // Upload multiple files handler
  const handleUploadFiles = (fileList) => {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList).filter(file => {
      return file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|svg|bmp)$/i.test(file.name);
    });

    if (files.length === 0) {
      showToast('⚠️ Selecteer geldige afbeeldingsbestanden (PNG, JPG, enz.)');
      return;
    }

    const newImages = [];
    let processed = 0;

    const finishUpload = (images) => {
      if (images.length === 0) {
        showToast('⚠️ Er konden geen afbeeldingen worden ingeladen.');
        return;
      }
      setUploadedImages(prev => [...prev, ...images]);

      // Auto-populate empty slots with the newly uploaded images!
      setBadges(prev => {
        // Ensure we have enough slots across pages for all uploaded photos
        const emptyCount = prev.filter(b => b === null).length;
        let targetBadges = [...prev];

        if (images.length > emptyCount) {
          const neededExtraSlots = images.length - emptyCount;
          const extraPages = Math.ceil(neededExtraSlots / slotsPerPage);
          targetBadges = [...targetBadges, ...Array(extraPages * slotsPerPage).fill(null)];
        }

        let imgIdx = 0;
        for (let slot = 0; slot < targetBadges.length; slot++) {
          if (!targetBadges[slot] && imgIdx < images.length) {
            targetBadges[slot] = createBadgeFromImage(images[imgIdx].imgElement, images[imgIdx].name);
            imgIdx++;
          }
        }
        return targetBadges;
      });

      showToast(`✓ ${images.length} foto's geüpload en op het blad geplaatst!`);
    };

    files.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const item = {
            id: 'img-' + Date.now() + '-' + index + '-' + Math.random().toString(36).substr(2, 4),
            name: file.name.replace(/\.[^/.]+$/, '').slice(0, 18),
            url: e.target.result,
            imgElement: img
          };
          newImages.push(item);
          processed++;

          if (processed === files.length) {
            finishUpload(newImages);
          }
        };
        img.onerror = () => {
          console.warn('Afbeelding kon niet geladen worden:', file.name);
          processed++;
          if (processed === files.length) {
            finishUpload(newImages);
          }
        };
        img.src = e.target.result;
      };
      reader.onerror = () => {
        console.warn('Bestand kon niet gelezen worden:', file.name);
        processed++;
        if (processed === files.length) {
          finishUpload(newImages);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Dropping an image from the sidebar gallery onto a specific slot
  const handleDropImage = (slotIndex, imgId) => {
    const imgItem = uploadedImages.find(img => img.id === imgId);
    if (!imgItem) return;

    setBadges(prev => {
      const updated = [...prev];
      updated[slotIndex] = createBadgeFromImage(imgItem.imgElement, imgItem.name);
      return updated;
    });
  };

  // Moving / swapping badge between two slots on the sheet
  const handleMoveSlot = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;

    setBadges(prev => {
      const updated = [...prev];
      const sourceBadge = updated[fromIndex];
      const targetBadge = updated[toIndex];

      updated[toIndex] = sourceBadge;
      updated[fromIndex] = targetBadge;
      return updated;
    });
  };

  // Quick direct drop of a file onto a slot
  const handleQuickUpload = (slotIndex, file) => {
    if (!file || (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|gif|svg|bmp)$/i.test(file.name))) {
      showToast('⚠️ Sleep een geldige afbeelding naar deze button');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const item = {
          id: 'img-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          name: file.name.replace(/\.[^/.]+$/, '').slice(0, 18),
          url: e.target.result,
          imgElement: img
        };
        setUploadedImages(prev => [...prev, item]);
        setBadges(prev => {
          const updated = [...prev];
          updated[slotIndex] = createBadgeFromImage(img, item.name);
          return updated;
        });
        showToast('✓ Afbeelding geplaatst');
      };
      img.onerror = () => {
        showToast('⚠️ Kon afbeelding niet laden');
      };
      img.src = e.target.result;
    };
    reader.onerror = () => {
      showToast('⚠️ Fout bij inlezen van bestand');
    };
    reader.readAsDataURL(file);
  };

  // Auto fill all empty slots on the sheet
  const handleAutoFillSheet = () => {
    const pool = uploadedImages.length > 0
      ? uploadedImages.map(u => ({ img: u.imgElement, name: u.name }))
      : badges.filter(Boolean).map(b => ({ img: b.image, name: b.name }));

    if (pool.length === 0) {
      showToast('ℹ️ Upload eerst afbeeldingen om het blad automatisch te vullen');
      return;
    }

    setBadges(prev => {
      const updated = [...prev];
      let poolIdx = 0;
      for (let i = 0; i < updated.length; i++) {
        if (!updated[i]) {
          const item = pool[poolIdx % pool.length];
          if (item && item.img) {
            updated[i] = createBadgeFromImage(item.img, item.name);
          } else {
            const sample = prev.find(Boolean);
            if (sample) {
              updated[i] = {
                ...sample,
                id: 'badge-' + Date.now() + '-' + i,
                imageProps: { ...sample.imageProps },
                textLayers: (sample.textLayers || []).map(t => ({ ...t }))
              };
            }
          }
          poolIdx++;
        }
      }
      return updated;
    });
    showToast('✓ Alle lege cirkels gevuld!');
  };

  // Place a photo from gallery onto a specific slot or next available slot
  const handlePlaceGalleryPhoto = (imgItem, targetSlot = null) => {
    setBadges(prev => {
      const updated = [...prev];
      if (typeof targetSlot === 'number') {
        updated[targetSlot] = createBadgeFromImage(imgItem.imgElement, imgItem.name);
        showToast(`✓ Foto geplaatst op button #${targetSlot + 1}`);
      } else {
        const emptyIdx = updated.findIndex(b => b === null);
        if (emptyIdx !== -1) {
          updated[emptyIdx] = createBadgeFromImage(imgItem.imgElement, imgItem.name);
          showToast(`✓ Foto geplaatst op button #${emptyIdx + 1}`);
        } else {
          updated.push(createBadgeFromImage(imgItem.imgElement, imgItem.name));
          showToast('✓ Extra button toegevoegd en gevuld!');
        }
      }
      return updated;
    });
    setActiveMobileSlot(null);
  };

  // Slot click / tap handler (Mobile drawer vs Desktop text editor)
  const handleSlotClick = (slotIndex) => {
    if (window.innerWidth < 1024) {
      setActiveMobileSlot(slotIndex);
    } else {
      if (badges[slotIndex]) {
        setEditingSlotIndex(slotIndex);
      }
    }
  };

  // Duplicate a specific slot to ALL other slots
  const handleDuplicateToAll = (sourceIndex) => {
    const sourceBadge = badges[sourceIndex];
    if (!sourceBadge) return;

    setBadges(prev => {
      return prev.map(() => ({
        ...sourceBadge,
        imageProps: { ...sourceBadge.imageProps },
        textLayers: (sourceBadge.textLayers || []).map(t => ({ ...t }))
      }));
    });
    showToast('✓ Dit ontwerp is naar álle buttons op het blad gekopieerd!');
  };

  // Add extra blank page of slots
  const handleAddPage = () => {
    setBadges(prev => [...prev, ...Array(slotsPerPage).fill(null)]);
    setCurrentPage(Math.floor(badges.length / slotsPerPage));
    showToast('✓ Extra pagina toegevoegd aan het afdrukvel!');
  };

  // Clear single slot
  const handleClearSlot = (index) => {
    setBadges(prev => {
      const updated = [...prev];
      updated[index] = null;
      return updated;
    });
  };

  // Clear entire sheet
  const handleResetSheet = () => {
    if (window.confirm('Weet je zeker dat je alle cirkels op het afdrukvel wilt leegmaken?')) {
      setBadges(Array(slotsPerPage).fill(null));
      setCurrentPage(0);
    }
  };

  // Save changes from editor modal for single slot
  const handleSaveSlot = (slotIndex, updatedBadge) => {
    setBadges(prev => {
      const copy = [...prev];
      copy[slotIndex] = updatedBadge;
      return copy;
    });
    setEditingSlotIndex(null);
  };

  // Apply styling / text from modal to ALL active slots
  const handleSaveAllSlots = (updatedBadge) => {
    setBadges(prev => {
      return prev.map(badge => {
        if (!badge) return null;
        return {
          ...badge,
          backgroundColor: updatedBadge.backgroundColor,
          backgroundType: updatedBadge.backgroundType,
          gradientColor2: updatedBadge.gradientColor2,
          gradientDirection: updatedBadge.gradientDirection,
          textLayers: (updatedBadge.textLayers || []).map(t => ({ ...t }))
        };
      });
    });
    setEditingSlotIndex(null);
    showToast('✓ Tekst & stijl toegepast op alle buttons!');
  };

  // Apply cropped image to a specific slot
  const handleApplyCrop = (slotIndex, croppedImg, croppedDataUrl, fitMode = 'face') => {
    setBadges(prev => {
      const copy = [...prev];
      if (copy[slotIndex]) {
        copy[slotIndex] = {
          ...copy[slotIndex],
          image: croppedImg,
          imageProps: {
            ...copy[slotIndex].imageProps,
            fitMode: fitMode,
            x: 0,
            y: 0,
            scale: 1.0,
            rotation: 0
          }
        };
      }
      return copy;
    });
    showToast(`✓ Foto direct gecropt op de groene lijn (${template.faceDiameterMm} mm)!`);
  };

  // Apply crop to a gallery item and any slots currently using it
  const handleApplyGalleryCrop = (item, croppedImg, croppedDataUrl, fitMode = 'face') => {
    setUploadedImages(prev => prev.map(u => {
      if (u.id === item.id) {
        return { ...u, url: croppedDataUrl, imgElement: croppedImg };
      }
      return u;
    }));

    setBadges(prev => prev.map(b => {
      if (b && b.image && b.image.src === item.imgElement.src) {
        return {
          ...b,
          image: croppedImg,
          imageProps: { ...b.imageProps, fitMode: fitMode, x: 0, y: 0, scale: 1.0, rotation: 0 }
        };
      }
      return b;
    }));

    setGalleryCropItem(null);
    showToast(`✓ Galerijfoto gecropt op ${template.faceDiameterMm} mm!`);
  };

  // Download Print PDF
  const handleDownloadPdf = async () => {
    try {
      setIsGenerating(true);
      await new Promise(r => setTimeout(r, 60));

      await generatePrintPdf({
        paper,
        template,
        slots: badges,
        drawCutLine: true,
        cutLineStyle: 'dashed',
        drawCenterMark: true,
        includeCalibration: true
      });
      showToast('🎉 Printklare PDF succesvol gedownload!');
    } catch (err) {
      console.error('PDF error:', err);
      alert('Fout bij het genereren van de PDF: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-900 text-slate-100 relative">
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-bounce">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        template={template}
        setTemplate={setTemplate}
        paper={paper}
        setPaper={setPaper}
        onDownloadPdf={handleDownloadPdf}
        onAutoFill={handleAutoFillSheet}
        onResetSheet={handleResetSheet}
        isGenerating={isGenerating}
        badgesCount={badges.filter(Boolean).length}
        totalSlots={badges.length}
      />

      {/* Hidden File Input for Mobile Slot Photo Picker */}
      <input
        type="file"
        ref={mobileFileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0] && activeMobileSlot !== null) {
            handleQuickUpload(activeMobileSlot, e.target.files[0]);
            setActiveMobileSlot(null);
          }
        }}
      />

      {/* Main Badgermaker Workspace (Desktop: Side-by-side | Mobile: Fullscreen Active Tab) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Uploads Gallery */}
        <div className={`h-full ${mobileTab === 'uploads' ? 'flex flex-1' : 'hidden'} lg:flex lg:w-80`}>
          <UploadsSidebar
            uploadedImages={uploadedImages}
            onUploadFiles={handleUploadFiles}
            onDeleteUploadedImage={(id) => setUploadedImages(prev => prev.filter(i => i.id !== id))}
            onCropImage={(item) => setGalleryCropItem(item)}
            onClearAllUploads={() => setUploadedImages([])}
            onAutoFillSheet={handleAutoFillSheet}
            onClearSheet={() => setBadges(Array(slotsPerPage).fill(null))}
            template={template}
            onPlacePhoto={(item) => {
              handlePlaceGalleryPhoto(item);
              if (window.innerWidth < 1024) setMobileTab('sheet');
            }}
            onSwitchToSheet={() => setMobileTab('sheet')}
          />
        </div>

        {/* Center / Right Sheet Workspace */}
        <div className={`h-full ${mobileTab === 'sheet' ? 'flex flex-1' : 'hidden'} lg:flex lg:flex-1 overflow-hidden`}>
          <SheetWorkspace
            paper={paper}
            template={template}
            badges={badges}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            onAddPage={handleAddPage}
            onDropImage={handleDropImage}
            onOpenTextEditor={(idx) => setEditingSlotIndex(idx)}
            onOpenCropModal={(idx) => {
              if (!badges[idx] || !badges[idx].image) {
                showToast('ℹ️ Upload of sleep eerst een foto naar deze button om hem bij te snijden');
                return;
              }
              setCroppingSlotIndex(idx);
            }}
            onDuplicateToAll={handleDuplicateToAll}
            onClearSlot={handleClearSlot}
            onQuickUpload={handleQuickUpload}
            onMoveSlot={handleMoveSlot}
            onUploadFiles={handleUploadFiles}
            onSlotClick={handleSlotClick}
          />
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (< lg) */}
      <nav className="lg:hidden bg-slate-950/95 backdrop-blur border-t border-slate-800 px-3 py-1.5 flex items-center justify-around z-30 shrink-0">
        <button
          onClick={() => setMobileTab('sheet')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            mobileTab === 'sheet'
              ? 'text-emerald-400 font-bold bg-emerald-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <FileText className="w-5 h-5" />
            <span className="absolute -top-1 -right-2 text-[9px] font-mono bg-emerald-500 text-slate-950 font-black px-1 rounded-full">
              {badges.filter(Boolean).length}
            </span>
          </div>
          <span className="text-[10px]">Afdrukvel</span>
        </button>

        <button
          onClick={() => setMobileTab('uploads')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            mobileTab === 'uploads'
              ? 'text-emerald-400 font-bold bg-emerald-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Images className="w-5 h-5" />
            {uploadedImages.length > 0 && (
              <span className="absolute -top-1 -right-2 text-[9px] font-mono bg-emerald-500 text-slate-950 font-black px-1 rounded-full">
                {uploadedImages.length}
              </span>
            )}
          </div>
          <span className="text-[10px]">Foto's</span>
        </button>

        <button
          onClick={handleAutoFillSheet}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-slate-400 hover:text-emerald-400 transition"
        >
          <Zap className="w-5 h-5 text-amber-400" />
          <span className="text-[10px]">Auto-vul</span>
        </button>

        <button
          onClick={handleDownloadPdf}
          disabled={isGenerating || badges.filter(Boolean).length === 0}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-emerald-400 font-bold disabled:opacity-40 transition"
        >
          <Printer className="w-5 h-5" />
          <span className="text-[10px]">PDF</span>
        </button>
      </nav>

      {/* Mobile Slot Action Drawer / Bottom Sheet (< lg) */}
      {activeMobileSlot !== null && (
        <div 
          onClick={() => setActiveMobileSlot(null)}
          className="lg:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end justify-center animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-slate-900 border-t border-slate-700/80 rounded-t-3xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 font-bold text-xs flex items-center justify-center font-mono">
                  #{activeMobileSlot + 1}
                </span>
                <h3 className="font-bold text-white text-sm">
                  {badges[activeMobileSlot] ? `Button #${activeMobileSlot + 1} Beheren` : `Button #${activeMobileSlot + 1} Vullen`}
                </h3>
              </div>
              <button 
                onClick={() => setActiveMobileSlot(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* If slot already has a badge */}
            {badges[activeMobileSlot] ? (
              <div className="space-y-2.5">
                <button
                  onClick={() => {
                    const idx = activeMobileSlot;
                    setActiveMobileSlot(null);
                    setCroppingSlotIndex(idx);
                  }}
                  className="w-full p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-3 border border-slate-700 shadow-sm transition active:scale-95"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm">Foto Bijsnijden & Zoomen</div>
                    <div className="text-[11px] text-slate-400">Direct passend maken op de {template.faceDiameterMm} mm groene lijn</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    const idx = activeMobileSlot;
                    setActiveMobileSlot(null);
                    setEditingSlotIndex(idx);
                  }}
                  className="w-full p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-3 border border-slate-700 shadow-sm transition active:scale-95"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                    <Type className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm">Tekst & Ontwerp Bewerken</div>
                    <div className="text-[11px] text-slate-400">Boogtekst, lettertype, kleuren & positie</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    handleDuplicateToAll(activeMobileSlot);
                    setActiveMobileSlot(null);
                  }}
                  className="w-full p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-3 border border-slate-700 shadow-sm transition active:scale-95"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                    <Copy className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm">Kopieer naar Álle Knoppen</div>
                    <div className="text-[11px] text-slate-400">Vul het hele afdrukblad met dit ontwerp</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    handleClearSlot(activeMobileSlot);
                    setActiveMobileSlot(null);
                  }}
                  className="w-full p-3 rounded-2xl bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 font-semibold text-xs flex items-center gap-3 border border-rose-800/40 transition active:scale-95"
                >
                  <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold">Button Leegmaken</div>
                  </div>
                </button>
              </div>
            ) : (
              /* If slot is empty: Choose from gallery or upload new / take photo */
              <div className="space-y-4">
                {uploadedImages.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 font-semibold mb-2">
                      Kies een foto uit je geüploade galerij:
                    </p>
                    <div className="grid grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1">
                      {uploadedImages.map((imgItem) => (
                        <div
                          key={imgItem.id}
                          onClick={() => handlePlaceGalleryPhoto(imgItem, activeMobileSlot)}
                          className="relative aspect-square rounded-xl overflow-hidden bg-slate-950 border-2 border-slate-700 hover:border-emerald-500 cursor-pointer active:scale-95 transition"
                        >
                          <img src={imgItem.url} alt={imgItem.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 bg-black/70 p-1 text-[9px] text-white truncate text-center">
                            {imgItem.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => mobileFileInputRef.current?.click()}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  <span>Nieuwe foto kiezen of maken (Camera)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Text & Image Adjustment Modal (with full Curved Text module) */}
      {editingSlotIndex !== null && badges[editingSlotIndex] && (
        <BadgeEditorModal
          isOpen={editingSlotIndex !== null}
          onClose={() => setEditingSlotIndex(null)}
          slotIndex={editingSlotIndex}
          badgeState={badges[editingSlotIndex]}
          template={template}
          initialTab="text"
          onSaveSlot={handleSaveSlot}
          onSaveAllSlots={handleSaveAllSlots}
        />
      )}

      {/* Dedicated Cropper Modal for Badge Slot (Matching badgemakersmall.html) */}
      {croppingSlotIndex !== null && badges[croppingSlotIndex] && (
        <CropModal
          isOpen={croppingSlotIndex !== null}
          onClose={() => setCroppingSlotIndex(null)}
          slotIndex={croppingSlotIndex}
          badgeState={badges[croppingSlotIndex]}
          template={template}
          onApplyCrop={handleApplyCrop}
        />
      )}

      {/* Dedicated Cropper Modal for Gallery Item */}
      {galleryCropItem && (
        <CropModal
          isOpen={galleryCropItem !== null}
          onClose={() => setGalleryCropItem(null)}
          slotIndex={0}
          badgeState={{ image: galleryCropItem.imgElement }}
          template={template}
          onApplyCrop={(_, croppedImg, croppedDataUrl) => handleApplyGalleryCrop(galleryCropItem, croppedImg, croppedDataUrl)}
        />
      )}
    </div>
  );
}
