import React, { useRef, useState } from 'react';
import { Language } from '../../types';
import { translations } from '../../data/translations';
import { LeafGraphic } from '../../components/LeafGraphic';
import { CameraCapture } from '../../components/CameraCapture';
import { GalleryPicker, GalleryPickerHandle } from '../../components/GalleryPicker';
import { Image as ImageIcon, Zap } from 'lucide-react';

interface ScanHomeProps {
  language: Language;
  onImageSelected: (imageUrl: string, presetType?: string) => void;
}

export const ScanHome: React.FC<ScanHomeProps> = ({
  language,
  onImageSelected,
}) => {
  const t = translations[language];
  const galleryPickerRef = useRef<GalleryPickerHandle>(null);
  const [torchActive, setTorchActive] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);

  const handleGalleryIngest = (bitmap: ImageBitmap) => {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(bitmap, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    onImageSelected(dataUrl, 'gallery');
  };

  const handleShutterClick = () => {
    // Open full in-app camera capture modal with permission flow
    setShowCameraModal(true);
  };

  return (
    <div className="flex flex-col px-5 pt-3 pb-24 max-w-md mx-auto">
      {/* Title & Farmer-friendly description matching Reference #1 */}
      <div className="mb-4">
        <h1 className="font-editorial text-[32px] font-bold text-[#162a45] leading-tight tracking-tight">
          {t.check_crop_title}
        </h1>
        <p className="text-sm text-[#475569] mt-1.5 leading-relaxed font-normal">
          {t.check_crop_desc}
        </p>
      </div>

      {/* Main Viewfinder Card - Visual Language identical to Reference #1 */}
      <div className="relative w-full aspect-[4/4.5] bg-[#172b1d] rounded-3xl p-4 flex flex-col justify-between overflow-hidden shadow-sm">
        {/* Top Badges */}
        <div className="relative z-20 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-[#f4f7f4] text-[#1e3d25] rounded-full text-xs font-semibold shadow-xs">
              {t.light_good}
            </span>
            <span className="px-3 py-1 bg-white text-[#162a45] rounded-full text-xs font-semibold shadow-xs">
              {t.hold_steady}
            </span>
          </div>

          {torchActive && (
            <span className="px-2 py-0.5 bg-amber-400 text-amber-950 rounded-full text-[10px] font-bold">
              Torch ON
            </span>
          )}
        </div>

        {/* Viewfinder Corner Framing Brackets */}
        <div className="absolute inset-4 pointer-events-none z-10 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="w-9 h-9 border-t-2 border-l-2 border-white rounded-tl-xl" />
            <div className="w-9 h-9 border-t-2 border-r-2 border-white rounded-tr-xl" />
          </div>

          {/* Bottom bracket with centered guidance text */}
          <div className="flex items-end justify-between">
            <div className="w-9 h-9 border-b-2 border-l-2 border-white rounded-bl-xl" />
            <div className="bg-[#172b1d]/90 px-3 py-0.5 rounded-full text-center">
              <span className="text-white text-xs font-medium tracking-wide">
                {t.fill_frame}
              </span>
            </div>
            <div className="w-9 h-9 border-b-2 border-r-2 border-white rounded-br-xl" />
          </div>
        </div>

        {/* Center Graphic */}
        <div className="absolute inset-0 flex items-center justify-center">
          <LeafGraphic
            variant="healthy"
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Camera Shutter & Gallery Controls Bar */}
      <div className="flex items-center justify-around py-5">
        {/* Gallery Upload Button via GalleryPicker */}
        <button
          onClick={() => galleryPickerRef.current?.openPicker()}
          className="w-14 h-14 rounded-full bg-white border border-[#dfded5] flex items-center justify-center text-[#162a45] shadow-xs hover:bg-[#f3f2ea] active:scale-95 transition-all"
          title={t.gallery_btn}
          aria-label={t.gallery_btn}
        >
          <ImageIcon className="w-6 h-6 stroke-[1.8]" />
        </button>

        {/* Primary Shutter Button - Blue circle with ring */}
        <button
          onClick={handleShutterClick}
          className="relative group p-1 active:scale-90 transition-transform"
          title={t.take_photo_btn}
          aria-label={t.take_photo_btn}
        >
          <div className="w-20 h-20 rounded-full border-[3px] border-[#0b72c9] flex items-center justify-center p-1.5 transition-all group-hover:border-[#085da5]">
            <div className="w-full h-full rounded-full bg-[#0b72c9] group-hover:bg-[#085da5] shadow-md flex items-center justify-center transition-all">
              <div className="w-3 h-3 rounded-full bg-white/30" />
            </div>
          </div>
        </button>

        {/* Torch / Lighting Toggle */}
        <button
          onClick={() => setTorchActive(!torchActive)}
          className={`w-14 h-14 rounded-full border flex items-center justify-center shadow-xs transition-all active:scale-95 ${
            torchActive
              ? 'bg-amber-100 border-amber-300 text-amber-700'
              : 'bg-white border-[#dfded5] text-[#162a45] hover:bg-[#f3f2ea]'
          }`}
          title="Toggle light guide"
          aria-label="Toggle light guide"
        >
          <Zap className={`w-6 h-6 ${torchActive ? 'fill-amber-500' : 'stroke-[1.8]'}`} />
        </button>
      </div>



      {/* In-App Camera Capture Flow */}
      {showCameraModal && (
        <CameraCapture
          onCapture={(bitmap) => {
            const canvas = document.createElement('canvas');
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(bitmap, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            setShowCameraModal(false);
            onImageSelected(dataUrl, 'camera');
          }}
          onOpenGallery={() => {
            setShowCameraModal(false);
            galleryPickerRef.current?.openPicker();
          }}
          onClose={() => setShowCameraModal(false)}
        />
      )}

      {/* Unified Ingest Gallery Picker */}
      <GalleryPicker
        ref={galleryPickerRef}
        onImageIngested={handleGalleryIngest}
      />
    </div>
  );
};
