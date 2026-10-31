import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Language } from '../../types';
import { translations } from '../../data/translations';
import { RetroViewfinderArt } from '../../components/RetroViewfinderArt';
import { CameraCapture } from '../../components/CameraCapture';
import { GalleryPicker, GalleryPickerHandle } from '../../components/GalleryPicker';
import { Image as ImageIcon, Zap, Sparkles } from 'lucide-react';

interface ScanHomeProps {
  language: Language;
  onImageSelected: (imageUrl: string, presetType?: string) => void;
}

export const ScanHome: React.FC<ScanHomeProps> = ({
  language,
  onImageSelected,
}) => {
  const t = translations[language] || translations.en;
  const galleryPickerRef = useRef<GalleryPickerHandle>(null);
  const [torchActive, setTorchActive] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [selectedSample, setSelectedSample] = useState<'early_blight' | 'late_blight' | 'healthy' | 'blurry'>('early_blight');

  const handleShutterClick = () => {
    setShowCameraModal(true);
  };

  const handleSampleClick = (sampleType: 'early_blight' | 'late_blight' | 'healthy' | 'blurry') => {
    setSelectedSample(sampleType);
    onImageSelected(`sample:${sampleType}`, sampleType);
  };

  return (
    <div className="flex flex-col px-5 pt-3 pb-24 max-w-md mx-auto">
      {/* Title & Farmer-friendly description */}
      <div className="mb-4">
        <h1 className="font-editorial text-[32px] font-bold text-[var(--color-ink)] leading-tight tracking-tight">
          {t.check_crop_title}
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1.5 leading-relaxed font-normal">
          {t.check_crop_desc}
        </p>
      </div>

      {/* Main Viewfinder Card - Tapping opens Camera modal */}
      <div
        onClick={handleShutterClick}
        className="relative w-full aspect-[4/4.5] bg-[var(--color-vf-bg)] border-2 border-[var(--color-outline)] rounded-[14px] shadow-[3px_3px_0_var(--color-shadow-color)] overflow-hidden cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label={t.take_photo_btn}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleShutterClick();
          }
        }}
      >
        {/* Retro Poster Scene with Sunburst, Sun Disc, Halftone Dots, Leaf, and Overlay Brackets */}
        <RetroViewfinderArt
          variant={selectedSample}
          showOverlay={true}
          className="w-full h-full"
        />

        {/* Top Chips: Neutral farmer tips (not fake live status) */}
        <div className="absolute top-8 left-7 right-7 z-20 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-[var(--color-surface)] text-[var(--color-ink)] border-[1.5px] border-[var(--color-outline)] rounded-full text-xs font-bold shadow-[2px_2px_0_var(--color-shadow-color)]">
              {t.tip_good_light || t.light_good}
            </span>
            <span className="px-3 py-1 bg-[var(--color-surface)] text-[var(--color-ink)] border-[1.5px] border-[var(--color-outline)] rounded-full text-xs font-bold shadow-[2px_2px_0_var(--color-shadow-color)]">
              {t.tip_hold_steady || t.hold_steady}
            </span>
          </div>

          {torchActive && (
            <span className="px-2.5 py-1 bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] border border-[var(--color-outline)] rounded-full text-[10px] font-bold shadow-[2px_2px_0_var(--color-shadow-color)]">
              Torch ON
            </span>
          )}
        </div>

        {/* Caption: Centred, at least 24px above bottom edge, between bottom brackets */}
        <div className="absolute bottom-6 inset-x-0 z-20 flex justify-center pointer-events-none px-12">
          <span className="bg-[var(--color-surface)] text-[var(--color-ink)] border-[1.5px] border-[var(--color-outline)] px-3.5 py-1 rounded-full text-center text-xs font-bold shadow-[2px_2px_0_var(--color-shadow-color)] leading-none max-w-[260px] truncate">
            {t.fill_frame}
          </span>
        </div>
      </div>

      {/* Camera Shutter & Gallery Controls Bar */}
      <div className="flex items-center justify-around py-5">
        {/* Gallery Upload Button via GalleryPicker */}
        <button
          onClick={() => galleryPickerRef.current?.openPicker()}
          className="w-14 h-14 rounded-full retro-btn-surface flex items-center justify-center retro-focus"
          title={t.gallery_btn}
          aria-label={t.gallery_btn}
        >
          <ImageIcon className="w-6 h-6 stroke-[2]" />
        </button>

        {/* Primary Shutter Button - Circular with ink outline and hard shadow */}
        <button
          onClick={handleShutterClick}
          className="w-20 h-20 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] border-2 border-[var(--color-primary-outline)] shadow-[3px_3px_0_var(--color-shadow-color)] retro-btn-press flex items-center justify-center retro-focus"
          title={t.take_photo_btn}
          aria-label={t.take_photo_btn}
        >
          <div className="w-14 h-14 rounded-full border-2 border-[var(--color-on-primary)]/40 flex items-center justify-center">
            <div className="w-3.5 h-3.5 rounded-full bg-[var(--color-on-primary)]" />
          </div>
        </button>

        {/* Torch / Lighting Toggle */}
        <button
          onClick={() => setTorchActive(!torchActive)}
          className={`w-14 h-14 rounded-full flex items-center justify-center retro-focus ${
            torchActive
              ? 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] border-2 border-[var(--color-outline)] shadow-[3px_3px_0_var(--color-shadow-color)]'
              : 'retro-btn-surface'
          }`}
          title="Toggle light guide"
          aria-label="Toggle light guide"
        >
          <Zap className={`w-6 h-6 ${torchActive ? 'fill-current stroke-[2]' : 'stroke-[2]'}`} />
        </button>
      </div>

      {/* Test Sample Leaves Bar for Immediate Farmer Prototyping */}
      <div className="mt-1 retro-card p-3.5">
        <div className={`flex items-center gap-1.5 text-xs font-bold text-[var(--color-ink)] mb-2.5 ${language === 'en' ? 'uppercase tracking-wider' : ''}`}>
          <Sparkles className="w-3.5 h-3.5 text-[var(--color-primary)]" />
          <span>{t.test_samples_title}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleSampleClick('early_blight')}
            className={`p-2.5 rounded-[12px] text-left text-xs transition-all retro-focus ${
              selectedSample === 'early_blight'
                ? 'bg-[var(--color-selected-bg)] border-2 border-[var(--color-selected-border)] text-[var(--color-selected-text)] shadow-[2px_2px_0_var(--color-shadow-color)] font-medium'
                : 'bg-[var(--color-inset)] border-[1.5px] border-[var(--color-divider)] text-[var(--color-ink)] hover:bg-[var(--color-surface)]'
            }`}
          >
            <div className="font-bold">{t.sample_early_blight}</div>
            <div className="text-[10px] text-[var(--color-muted)]">Bullseye spots (Mild 18%)</div>
          </button>

          <button
            onClick={() => handleSampleClick('blurry')}
            className={`p-2.5 rounded-[12px] text-left text-xs transition-all retro-focus ${
              selectedSample === 'blurry'
                ? 'bg-[var(--color-selected-bg)] border-2 border-[var(--color-selected-border)] text-[var(--color-selected-text)] shadow-[2px_2px_0_var(--color-shadow-color)] font-medium'
                : 'bg-[var(--color-inset)] border-[1.5px] border-[var(--color-divider)] text-[var(--color-ink)] hover:bg-[var(--color-surface)]'
            }`}
          >
            <div className="font-bold">{t.sample_blurry}</div>
            <div className="text-[10px] text-[var(--color-muted)]">Tests uncertain screen</div>
          </button>

          <button
            onClick={() => handleSampleClick('late_blight')}
            className={`p-2.5 rounded-[12px] text-left text-xs transition-all retro-focus ${
              selectedSample === 'late_blight'
                ? 'bg-[var(--color-selected-bg)] border-2 border-[var(--color-selected-border)] text-[var(--color-selected-text)] shadow-[2px_2px_0_var(--color-shadow-color)] font-medium'
                : 'bg-[var(--color-inset)] border-[1.5px] border-[var(--color-divider)] text-[var(--color-ink)] hover:bg-[var(--color-surface)]'
            }`}
          >
            <div className="font-bold">{t.sample_late_blight}</div>
            <div className="text-[10px] text-[var(--color-muted)]">Water-soaked patches (42%)</div>
          </button>

          <button
            onClick={() => handleSampleClick('healthy')}
            className={`p-2.5 rounded-[12px] text-left text-xs transition-all retro-focus ${
              selectedSample === 'healthy'
                ? 'bg-[var(--color-selected-bg)] border-2 border-[var(--color-selected-border)] text-[var(--color-selected-text)] shadow-[2px_2px_0_var(--color-shadow-color)] font-medium'
                : 'bg-[var(--color-inset)] border-[1.5px] border-[var(--color-divider)] text-[var(--color-ink)] hover:bg-[var(--color-surface)]'
            }`}
          >
            <div className="font-bold">{t.sample_healthy}</div>
            <div className="text-[10px] text-[var(--color-muted)]">Clean green foliage</div>
          </button>
        </div>
      </div>

      {/* Full-screen in-app camera capture modal rendered through Portal */}
      {showCameraModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <CameraCapture
            language={language}
            onCapture={(bitmap) => {
              const canvas = document.createElement('canvas');
              canvas.width = bitmap.width;
              canvas.height = bitmap.height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(bitmap, 0, 0);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
              bitmap.close();
              setShowCameraModal(false);
              onImageSelected(dataUrl, 'camera');
            }}
            onOpenGallery={() => {
              setShowCameraModal(false);
              galleryPickerRef.current?.openPicker();
            }}
            onClose={() => setShowCameraModal(false)}
          />,
          document.body
        )}

      {/* Unified Ingest Gallery Picker */}
      <GalleryPicker
        ref={galleryPickerRef}
        onImageIngested={(bitmap) => {
          const canvas = document.createElement('canvas');
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(bitmap, 0, 0);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          bitmap.close();
          onImageSelected(dataUrl, 'gallery');
        }}
      />
    </div>
  );
};
