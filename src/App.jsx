import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { UploadsSidebar } from './components/UploadsSidebar';
import { SheetWorkspace } from './components/SheetWorkspace';
import { BadgeEditorModal } from './components/BadgeEditorModal';
import { BUTTON_TEMPLATES, PAPER_FORMATS } from './constants/templates';
import { calculateSheetGrid, generatePrintPdf } from './utils/pdfGenerator';

export default function App() {
  const [template, setTemplate] = useState(BUTTON_TEMPLATES[1]); // 32mm VEVOR default as user requested!
  const [paper, setPaper] = useState(PAPER_FORMATS[0]); // A4
  const [uploadedImages, setUploadedImages] = useState([]);
  const [editingSlotIndex, setEditingSlotIndex] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Compute grid slots capacity
  const grid = useMemo(() => calculateSheetGrid(paper, template), [paper, template]);
  const slotsPerPage = grid.maxButtonsPerPage;

  // Helper to create a sample badge
  const createSampleBadge = (tmpl) => {
    const is32 = tmpl.faceDiameterMm <= 32;
    return {
      id: 'sample-' + Date.now(),
      image: null,
      imageProps: { x: 0, y: 0, scale: 1, rotation: 0, flipX: false, flipY: false, brightness: 100, contrast: 100, grayscale: 0 },
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
          text: `${tmpl.faceDiameterMm}MM VEVOR`,
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
    initial[0] = createSampleBadge(BUTTON_TEMPLATES[1]);
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

  // Helper to construct a badge from an HTMLImageElement
  const createBadgeFromImage = (imgElement, name = '') => {
    const size = 640;
    const cutRadius = (size / 2) * 0.94;
    const targetDiam = cutRadius * 2;
    const scale = targetDiam / Math.min(imgElement.naturalWidth, imgElement.naturalHeight);

    return {
      id: 'badge-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      name: name,
      image: imgElement,
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
      backgroundColor: '#ffffff',
      backgroundType: 'solid',
      textLayers: []
    };
  };

  // Upload multiple files handler
  const handleUploadFiles = (fileList) => {
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const newImages = [];
    let processed = 0;

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
            setUploadedImages(prev => [...prev, ...newImages]);

            // Auto-populate empty slots with the newly uploaded images!
            setBadges(prev => {
              // Ensure we have enough slots across pages for all uploaded photos
              const emptyCount = prev.filter(b => b === null).length;
              let targetBadges = [...prev];

              if (newImages.length > emptyCount) {
                const neededExtraSlots = newImages.length - emptyCount;
                const extraPages = Math.ceil(neededExtraSlots / slotsPerPage);
                targetBadges = [...targetBadges, ...Array(extraPages * slotsPerPage).fill(null)];
              }

              let imgIdx = 0;
              for (let slot = 0; slot < targetBadges.length; slot++) {
                if (!targetBadges[slot] && imgIdx < newImages.length) {
                  targetBadges[slot] = createBadgeFromImage(newImages[imgIdx].imgElement, newImages[imgIdx].name);
                  imgIdx++;
                }
              }
              return targetBadges;
            });

            showToast(`✓ ${newImages.length} foto's geüpload en op het blad geplaatst!`);
          }
        };
        img.src = e.target.result;
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
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Auto fill all empty slots on the sheet
  const handleAutoFillSheet = () => {
    const pool = uploadedImages.length > 0
      ? uploadedImages.map(u => ({ img: u.imgElement, name: u.name }))
      : badges.filter(Boolean).map(b => ({ img: b.image, name: b.name }));

    if (pool.length === 0) return;

    setBadges(prev => {
      const updated = [...prev];
      let poolIdx = 0;
      for (let i = 0; i < updated.length; i++) {
        if (!updated[i]) {
          const item = pool[poolIdx % pool.length];
          if (item.img) {
            updated[i] = createBadgeFromImage(item.img, item.name);
          } else {
            const sample = prev.find(Boolean);
            if (sample) updated[i] = JSON.parse(JSON.stringify(sample));
          }
          poolIdx++;
        }
      }
      return updated;
    });
    showToast('✓ Alle lege cirkels gevuld!');
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

      {/* Main Badgermaker Workspace (Left Uploads Gallery + Center Sheet) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        <UploadsSidebar
          uploadedImages={uploadedImages}
          onUploadFiles={handleUploadFiles}
          onDeleteUploadedImage={(id) => setUploadedImages(prev => prev.filter(i => i.id !== id))}
          onClearAllUploads={() => setUploadedImages([])}
          onAutoFillSheet={handleAutoFillSheet}
          onClearSheet={() => setBadges(Array(slotsPerPage).fill(null))}
          template={template}
        />

        <SheetWorkspace
          paper={paper}
          template={template}
          badges={badges}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          onAddPage={handleAddPage}
          onDropImage={handleDropImage}
          onOpenTextEditor={(idx) => setEditingSlotIndex(idx)}
          onOpenImageEditor={(idx) => setEditingSlotIndex(idx)}
          onDuplicateToAll={handleDuplicateToAll}
          onClearSlot={handleClearSlot}
          onQuickUpload={handleQuickUpload}
          onMoveSlot={handleMoveSlot}
        />
      </div>

      {/* Text & Image Adjustment Modal (with full Curved Text module) */}
      {editingSlotIndex !== null && badges[editingSlotIndex] && (
        <BadgeEditorModal
          isOpen={editingSlotIndex !== null}
          onClose={() => setEditingSlotIndex(null)}
          slotIndex={editingSlotIndex}
          badgeState={badges[editingSlotIndex]}
          template={template}
          onSaveSlot={handleSaveSlot}
          onSaveAllSlots={handleSaveAllSlots}
        />
      )}
    </div>
  );
}
