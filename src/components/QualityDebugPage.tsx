import React, { useState, useRef } from 'react';
import { analyzeQuality } from '../ml/quality';
import { QualityReport } from '../ml/types';
import defaultQualityConfig from '../ml/quality.config.json';
import { CameraCapture } from './CameraCapture';
import { GalleryPicker, GalleryPickerHandle } from './GalleryPicker';
import {
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Tag,
  Download,
  Trash2,
  ArrowLeft,
  Sliders,
} from 'lucide-react';

interface LabeledSample {
  id: string;
  label: 'sharp' | 'blurry' | 'dark' | 'glare' | 'good';
  timestamp: string;
  report: QualityReport;
}

export const QualityDebugPage: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [showCamera, setShowCamera] = useState(false);
  const galleryRef = useRef<GalleryPickerHandle>(null);
  const [currentImageSrc, setCurrentImageSrc] = useState<string | null>(null);
  const [report, setReport] = useState<QualityReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [samples, setSamples] = useState<LabeledSample[]>([]);

  const handleProcessBitmap = async (bitmap: ImageBitmap, dataUrl: string) => {
    setCurrentImageSrc(dataUrl);
    setIsAnalyzing(true);
    try {
      const result = await analyzeQuality(bitmap);
      setReport(result);
    } catch (err) {
      console.error('Quality analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCapture = (bitmap: ImageBitmap) => {
    setShowCamera(false);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(bitmap, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    handleProcessBitmap(bitmap, dataUrl);
  };

  const handleGalleryIngest = (bitmap: ImageBitmap) => {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(bitmap, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    handleProcessBitmap(bitmap, dataUrl);
  };

  const handleLabelCurrentPhoto = (label: LabeledSample['label']) => {
    if (!report) return;
    const newSample: LabeledSample = {
      id: Date.now().toString(),
      label,
      timestamp: new Date().toLocaleTimeString(),
      report,
    };
    setSamples((prev) => [newSample, ...prev]);
  };

  const handleExportSamples = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(samples, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `agriscan-calibration-samples-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-[#f8f7f4] text-[#162a45] pb-24 max-w-lg mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#e2e1d7]">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-white border border-[#e2e1d7] hover:bg-[#f0efe8]"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <Sliders className="w-5 h-5 text-[#0b72c9]" />
          <h1 className="font-bold text-lg font-editorial">Quality Calibration Tool</h1>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-[#0b72c9]">
          /debug/quality
        </span>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => setShowCamera(true)}
          className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-[#0b72c9] text-white font-semibold text-sm shadow-sm active:scale-95 transition-all"
        >
          <Camera className="w-4 h-4" />
          <span>Scan Camera</span>
        </button>
        <button
          onClick={() => galleryRef.current?.openPicker()}
          className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-white border border-[#dcdad0] text-[#162a45] font-semibold text-sm shadow-xs hover:bg-[#f3f2eb] active:scale-95 transition-all"
        >
          <ImageIcon className="w-4 h-4 text-emerald-600" />
          <span>Upload Image</span>
        </button>
      </div>

      {/* Analysis Preview & Metrics */}
      {isAnalyzing && (
        <div className="p-8 text-center bg-white rounded-3xl border border-[#e8e7df] mb-6">
          <div className="w-8 h-8 border-3 border-[#0b72c9] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs font-medium text-slate-500">Analyzing 256px resolution-independent metrics...</p>
        </div>
      )}

      {report && currentImageSrc && !isAnalyzing && (
        <div className="bg-white rounded-3xl p-5 border border-[#e8e7df] shadow-xs mb-6 animate-in fade-in duration-200">
          <div className="flex gap-4 items-start mb-4">
            <img
              src={currentImageSrc}
              alt="Analyzed crop"
              className="w-24 h-24 object-cover rounded-2xl border border-slate-200"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {report.verdict === 'pass' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> PASS
                  </span>
                )}
                {report.verdict === 'enhance' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> ENHANCE
                  </span>
                )}
                {report.verdict === 'retake' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold">
                    <XCircle className="w-3.5 h-3.5 text-red-600" /> RETAKE
                  </span>
                )}
              </div>
              <ul className="text-xs text-slate-600 space-y-1 mt-2">
                {report.hints.map((hint, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span className="text-[#0b72c9]">•</span> {hint}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Raw Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs mb-5">
            <div className="p-3 bg-[#faf9f5] rounded-xl border border-[#ecebe2]">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Laplacian Variance</span>
              <span className="text-base font-bold text-[#162a45]">{report.blur.toFixed(1)}</span>
              <span className="text-[10px] text-slate-400 block">Retake &lt; {defaultQualityConfig.blur.retakeThreshold}</span>
            </div>
            <div className="p-3 bg-[#faf9f5] rounded-xl border border-[#ecebe2]">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Tenengrad Gradient</span>
              <span className="text-base font-bold text-[#162a45]">{report.tenengrad.toFixed(1)}</span>
              <span className="text-[10px] text-slate-400 block">Retake &lt; {defaultQualityConfig.tenengrad.retakeThreshold}</span>
            </div>
            <div className="p-3 bg-[#faf9f5] rounded-xl border border-[#ecebe2]">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Motion Blur Imbalance</span>
              <span className={`text-base font-bold ${report.motionLikely ? 'text-red-600' : 'text-emerald-600'}`}>
                {report.motionLikely ? 'LIKELY' : 'LOW'}
              </span>
              <span className="text-[10px] text-slate-400 block">H vs V gradient ratio</span>
            </div>
            <div className="p-3 bg-[#faf9f5] rounded-xl border border-[#ecebe2]">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Mean Luminance</span>
              <span className="text-base font-bold text-[#162a45]">{report.brightness.toFixed(1)}</span>
              <span className="text-[10px] text-slate-400 block">Range: 45 - 215</span>
            </div>
            <div className="p-3 bg-[#faf9f5] rounded-xl border border-[#ecebe2]">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Contrast (StdDev)</span>
              <span className="text-base font-bold text-[#162a45]">{report.contrast.toFixed(1)}</span>
              <span className="text-[10px] text-slate-400 block">Min: 22.0</span>
            </div>
            <div className="p-3 bg-[#faf9f5] rounded-xl border border-[#ecebe2]">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Dark Pixel Fraction</span>
              <span className="text-base font-bold text-[#162a45]">{(report.darkFraction * 100).toFixed(1)}%</span>
              <span className="text-[10px] text-slate-400 block">Max: 40%</span>
            </div>
            <div className="p-3 bg-[#faf9f5] rounded-xl border border-[#ecebe2]">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Glare Fraction</span>
              <span className="text-base font-bold text-[#162a45]">{(report.glare * 100).toFixed(1)}%</span>
              <span className="text-[10px] text-slate-400 block">Max: 15%</span>
            </div>
            <div className="p-3 bg-[#faf9f5] rounded-xl border border-[#ecebe2]">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Leaf Coverage</span>
              <span className="text-base font-bold text-[#162a45]">{(report.coverage * 100).toFixed(1)}%</span>
              <span className="text-[10px] text-slate-400 block">Min: 20%</span>
            </div>
            <div className="p-3 bg-[#faf9f5] rounded-xl border border-[#ecebe2] col-span-2">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Sensor Noise (Immerkaer)</span>
              <span className="text-base font-bold text-[#162a45]">{report.noise.toFixed(2)}</span>
              <span className="text-[10px] text-slate-400 block">Threshold: &lt; 14.0</span>
            </div>
          </div>

          {/* Label This Photo Calibration Controls */}
          <div className="border-t border-[#ecebe2] pt-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#162a45] mb-2.5">
              <Tag className="w-3.5 h-3.5 text-[#0b72c9]" />
              <span>Label this photo for calibration:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['sharp', 'blurry', 'dark', 'glare', 'good'] as const).map((lbl) => (
                <button
                  key={lbl}
                  onClick={() => handleLabelCurrentPhoto(lbl)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-[#0b72c9] text-xs font-semibold capitalize active:scale-95 transition-all"
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Labeled Calibration Samples Table */}
      {samples.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-[#e8e7df] shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm">Calibrated Samples ({samples.length})</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportSamples}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs flex items-center gap-1"
                title="Download JSON"
              >
                <Download className="w-3.5 h-3.5" /> JSON
              </button>
              <button
                onClick={() => setSamples([])}
                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs flex items-center gap-1"
                title="Clear all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase text-slate-500">
                  <th className="py-2 pr-2">Label</th>
                  <th className="py-2 px-2">Verdict</th>
                  <th className="py-2 px-2">Blur</th>
                  <th className="py-2 px-2">Tenengrad</th>
                  <th className="py-2 px-2">Bright</th>
                  <th className="py-2 px-2">Glare</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {samples.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-2 pr-2 font-bold capitalize">{s.label}</td>
                    <td className="py-2 px-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          s.report.verdict === 'pass'
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.report.verdict === 'enhance'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {s.report.verdict}
                      </span>
                    </td>
                    <td className="py-2 px-2">{s.report.blur.toFixed(1)}</td>
                    <td className="py-2 px-2">{s.report.tenengrad.toFixed(1)}</td>
                    <td className="py-2 px-2">{s.report.brightness.toFixed(1)}</td>
                    <td className="py-2 px-2">{(s.report.glare * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Hidden GalleryPicker and Camera Modal */}
      <GalleryPicker ref={galleryRef} onImageIngested={handleGalleryIngest} />
      {showCamera && (
        <CameraCapture
          onCapture={handleCapture}
          onOpenGallery={() => {
            setShowCamera(false);
            galleryRef.current?.openPicker();
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
};
