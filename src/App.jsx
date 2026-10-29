import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { CanvasEditor } from './components/CanvasEditor';
import { PrintSheetModal } from './components/PrintSheetModal';
import { BUTTON_TEMPLATES } from './constants/templates';
import { downloadSinglePng } from './utils/pdfGenerator';

const DEFAULT_STATE = {
  template: BUTTON_TEMPLATES[0], // 58mm (2.25")
  image: null,
  imageProps: {
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    flipX: false,
    flipY: false,
    brightness: 100,
    contrast: 100,
    grayscale: 0
  },
  backgroundColor: '#0f172a',
  backgroundType: 'gradient',
  gradientColor2: '#047857',
  gradientDirection: 'vertical',
  textLayers: [
    {
      id: '1',
      text: '★ BUTTON MAKER ★',
      style: 'curved-top',
      fontFamily: "'Montserrat', sans-serif",
      fontSize: 26,
      bold: true,
      italic: false,
      color: '#facc15',
      hasStroke: true,
      strokeColor: '#0f172a',
      strokeWidth: 3,
      letterSpacing: 4,
      curveRadiusRatio: 0.76,
      rotationDeg: 0,
      x: 0,
      y: 0
    },
    {
      id: '2',
      text: '100% GRATIS',
      style: 'straight',
      fontFamily: "'Bebas Neue', cursive",
      fontSize: 48,
      bold: true,
      italic: false,
      color: '#ffffff',
      hasStroke: true,
      strokeColor: '#0f172a',
      strokeWidth: 4,
      letterSpacing: 2,
      curveRadiusRatio: 0.75,
      rotationDeg: 0,
      x: 0,
      y: 0
    },
    {
      id: '3',
      text: 'NO LIMITS • 300 DPI PDF',
      style: 'curved-bottom',
      fontFamily: "'Inter', sans-serif",
      fontSize: 20,
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
  ],
  showGuides: true,
  showFaceGuide: true,
  showCutGuide: true,
  showBleedShade: true
};

export default function App() {
  const [badgeState, setBadgeState] = useState(DEFAULT_STATE);
  const [activeTab, setActiveTab] = useState('template');
  const [is3D, setIs3D] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const handleReset = () => {
    if (window.confirm('Weet je zeker dat je het ontwerp wilt herstellen naar de beginstand?')) {
      setBadgeState(DEFAULT_STATE);
    }
  };

  const handleDownloadPng = () => {
    downloadSinglePng(
      badgeState,
      `button-${badgeState.template.id}-${Date.now()}.png`,
      false
    );
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-900 text-slate-100">
      {/* Top Navigation */}
      <Navbar
        template={badgeState.template}
        onOpenPrintModal={() => setIsPrintModalOpen(true)}
        onDownloadPng={handleDownloadPng}
        onReset={handleReset}
        is3D={is3D}
        setIs3D={setIs3D}
      />

      {/* Main Workspace (Sidebar + Canvas) */}
      <div className="flex-1 flex flex-col-reverse lg:flex-row overflow-hidden relative">
        <Sidebar
          badgeState={badgeState}
          setBadgeState={setBadgeState}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <CanvasEditor
          badgeState={badgeState}
          setBadgeState={setBadgeState}
          is3D={is3D}
        />
      </div>

      {/* Print Sheet Modal */}
      <PrintSheetModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        badgeState={badgeState}
      />
    </div>
  );
}
