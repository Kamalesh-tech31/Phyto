import React, { useRef, useState } from 'react';
import { Language } from '../../types';
import { translations } from '../../data/translations';
import { LeafGraphic } from '../../components/LeafGraphic';
import { Image as ImageIcon, Zap, Sparkles, Layers } from 'lucide-react';
import { pesticideKbService } from '../../services/pesticideKbService';

interface ScanHomeProps {
  language: Language;
  onImageSelected: (imageUrl: string, presetType?: string) => void;
}

export const ScanHome: React.FC<ScanHomeProps> = ({
  language,
  onImageSelected,
}) => {
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [torchActive, setTorchActive] = useState(false);
  const [selectedSample, setSelectedSample] = useState<string>('early_blight');

  const allRecords = pesticideKbService.getAllRecords();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onImageSelected(event.target.result as string, 'custom');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleShutterClick = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleSampleClick = (sampleType: string) => {
    setSelectedSample(sampleType);
    onImageSelected(`sample:${sampleType}`, sampleType);
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

      {/* Hidden file inputs for real camera capture and gallery upload */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

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
          <div className="flex justify-between items-end">
            <div className="w-9 h-9 border-b-2 border-l-2 border-white rounded-bl-xl" />
            <div className="w-9 h-9 border-b-2 border-r-2 border-white rounded-br-xl" />
          </div>
        </div>

        {/* Center Leaf Graphic Animation / Camera preview placeholder */}
        <div className="relative flex-1 flex items-center justify-center z-0 my-2">
          <LeafGraphic
            variant={(selectedSample === 'blurry' ? 'early_blight' : (selectedSample as any)) || 'early_blight'}
            className="w-48 h-48 drop-shadow-md"
          />
        </div>

        {/* Viewfinder Bottom Controls Inside Viewfinder (Gallery & Torch buttons) */}
        <div className="relative z-20 flex items-center justify-between px-2 pt-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-11 h-11 rounded-2xl bg-black/40 hover:bg-black/60 backdrop-blur-md flex items-center justify-center text-white transition-all active:scale-95"
            aria-label="Gallery"
          >
            <ImageIcon className="w-5 h-5 stroke-[2.2]" />
          </button>

          <button
            onClick={() => setTorchActive(!torchActive)}
            className={`w-11 h-11 rounded-2xl backdrop-blur-md flex items-center justify-center transition-all active:scale-95 ${
              torchActive ? 'bg-amber-400 text-amber-950 shadow-md' : 'bg-black/40 hover:bg-black/60 text-white'
            }`}
            aria-label="Torch"
          >
            <Zap className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* Main Shutter Button Bar Below Viewfinder */}
      <div className="mt-4 flex flex-col items-center">
        <button
          onClick={handleShutterClick}
          className="group relative flex items-center justify-center active:scale-95 transition-all"
          aria-label="Capture leaf photo"
        >
          {/* Outer circle ring */}
          <div className="w-20 h-20 rounded-full border-4 border-[#162a45]/20 flex items-center justify-center">
            {/* Inner solid button */}
            <div className="w-16 h-16 rounded-full bg-[#162a45] group-hover:bg-[#1e3a61] flex items-center justify-center shadow-lg transition-colors">
              <div className="w-6 h-6 rounded-full border-2 border-white" />
            </div>
          </div>
        </button>
        <span className="text-xs text-[#64748b] mt-2 font-medium">
          {language === 'ml' ? 'ഫോട്ടോ എടുക്കുക അല്ലെങ്കിൽ താഴെ നിന്ന് തിരഞ്ഞെടുക്കുക' : 'Tap shutter to capture or test 22 classes below'}
        </span>
      </div>

      {/* Interactive 22-Class Knowledge-Base Inspector Dropdown */}
      <div className="mt-5 bg-white rounded-3xl p-4 border border-[#e8e7de] shadow-xs space-y-2.5">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#0b72c9]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#162a45]">
            22-Class Knowledge-Base Verifier
          </span>
        </div>
        <select
          value={selectedSample}
          onChange={(e) => handleSampleClick(e.target.value)}
          className="w-full py-2.5 px-3 bg-[#fafaf8] border border-[#dcdad0] rounded-xl text-xs font-semibold text-[#162a45] focus:outline-none focus:ring-2 focus:ring-[#0b72c9]"
        >
          <option value="early_blight">Tomato: Early blight (Tier A, Full)</option>
          <option value="late_blight">Tomato: Late blight (Tier A, Full)</option>
          <option value="blurry">⚠️ Quality Test: Blurry (Inconclusive)</option>
          {allRecords.map((r) => (
            <option key={r.class_id} value={r.class_id}>
              [{r.crop.toUpperCase()}] {r.class_name} ({r.tier} · {r.display_mode})
            </option>
          ))}
        </select>
      </div>

      {/* Quick Demo Preset Pills */}
      <div className="mt-3 bg-white rounded-3xl p-4 border border-[#e8e7de] shadow-xs">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Sparkles className="w-3.5 h-3.5 text-[#0b72c9]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
            Quick Test Cases
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleSampleClick('early_blight')}
            className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
              selectedSample === 'early_blight'
                ? 'bg-[#e5f1fb] border-[#0b72c9] text-[#0b72c9] font-medium'
                : 'bg-[#faf9f5] border-[#e8e7de] text-[#334155] hover:bg-[#f0efe8]'
            }`}
          >
            <div className="font-semibold">{t.sample_early_blight}</div>
            <div className="text-[10px] text-[#64748b]">Bullseye spots (Mild 18%)</div>
          </button>

          <button
            onClick={() => handleSampleClick('blurry')}
            className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
              selectedSample === 'blurry'
                ? 'bg-[#fef3c7] border-[#d97706] text-[#b45309] font-medium'
                : 'bg-[#faf9f5] border-[#e8e7de] text-[#334155] hover:bg-[#f0efe8]'
            }`}
          >
            <div className="font-semibold">{t.sample_blurry}</div>
            <div className="text-[10px] text-[#64748b]">Tests uncertain screen</div>
          </button>

          <button
            onClick={() => handleSampleClick('tomato_yellow_leaf_curl_virus')}
            className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
              selectedSample === 'tomato_yellow_leaf_curl_virus'
                ? 'bg-[#fffbeb] border-[#f59e0b] text-[#b45309] font-medium'
                : 'bg-[#faf9f5] border-[#e8e7de] text-[#334155] hover:bg-[#f0efe8]'
            }`}
          >
            <div className="font-semibold">Tomato: TYLCV</div>
            <div className="text-[10px] text-[#64748b]">Vector Control Only</div>
          </button>

          <button
            onClick={() => handleSampleClick('armyworm')}
            className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
              selectedSample === 'armyworm'
                ? 'bg-[#ede9fe] border-[#7c3aed] text-[#6d28d9] font-medium'
                : 'bg-[#faf9f5] border-[#e8e7de] text-[#334155] hover:bg-[#f0efe8]'
            }`}
          >
            <div className="font-semibold">Armyworm</div>
            <div className="text-[10px] text-[#64748b]">Crop Choice: Corn / Rice</div>
          </button>
        </div>
      </div>
    </div>
  );
};
