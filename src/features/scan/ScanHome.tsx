import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Language } from '../../types';
import { t } from '../../services/i18n';
import { RetroViewfinderArt } from '../../components/RetroViewfinderArt';
import {
  startCamera,
  stopStream,
  captureFrame,
  mapCameraError,
  useLivePreview,
  CameraError,
  FacingMode,
} from '../../ml/camera';
import { analyzePreviewQuality } from '../../ml/quality';
import {
  Image as ImageIcon,
  Zap,
  Sparkles,
  Camera,
  RotateCcw,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

interface ScanHomeProps {
  language: Language;
  onImageSelected: (imageUrl: string, presetType?: string) => void;
}

type CameraState = 'idle' | 'starting' | 'streaming' | 'error' | 'capturing';

export const ScanHome: React.FC<ScanHomeProps> = ({
  language,
  onImageSelected,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [cameraError, setCameraError] = useState<CameraError | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>('environment');
  const [torchActive, setTorchActive] = useState(false);
  const [selectedSample, setSelectedSample] = useState<'early_blight' | 'late_blight' | 'healthy' | 'blurry'>('early_blight');

  // Live preview quality state (~5 fps)
  const [liveQuality, setLiveQuality] = useState<{
    sharp: boolean;
    bright: boolean;
    motion: boolean;
  }>({
    sharp: true,
    bright: true,
    motion: false,
  });

  // Stop active camera stream cleanly
  const stopActiveStream = useCallback(() => {
    if (streamRef.current) {
      stopStream(streamRef.current);
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Request camera stream and attach to video element
  const initCamera = useCallback(
    async (mode: FacingMode = 'environment') => {
      setCameraError(null);
      setCameraState('starting');
      stopActiveStream();

      try {
        const stream = await startCamera(mode);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraState('streaming');
      } catch (err) {
        const mapped = mapCameraError(err);
        setCameraError(mapped);
        setCameraState('error');
      }
    },
    [stopActiveStream]
  );

  // Switch between front and rear cameras
  const handleToggleFacingMode = () => {
    const nextMode: FacingMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (cameraState === 'streaming') {
      initCamera(nextMode);
    }
  };

  // Start camera on user tap
  const handleStartCamera = () => {
    initCamera(facingMode);
  };

  // Capture frame from active streaming video
  const handleCapture = async () => {
    const video = videoRef.current;
    if (!video || cameraState !== 'streaming') return;

    try {
      setCameraState('capturing');
      // Capture the visible frame directly from the video stream
      const bitmap = await captureFrame(video);

      // Stop camera tracks immediately after frame capture
      stopActiveStream();

      // Convert bitmap to JPEG data URL
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        onImageSelected(dataUrl, 'camera');
      }
    } catch (err) {
      console.error('[ScanHome] Capture error:', err);
      setCameraError({
        name: 'UnknownError',
        message: 'Failed to capture frame from camera.',
        nextStep: 'Please try taking the photo again or pick from gallery.',
        messageKey: 'camera_denied_title',
        descKey: 'camera_denied_desc',
      });
      setCameraState('error');
    }
  };

  // Shutter button click dispatcher
  const handleShutterClick = () => {
    if (cameraState === 'streaming') {
      handleCapture();
    } else if (cameraState === 'idle' || cameraState === 'error') {
      handleStartCamera();
    }
  };

  // Live preview quality analysis hook: ~5 fps on 160x160 canvas
  useLivePreview(
    videoRef,
    cameraState === 'streaming',
    (imageData: ImageData) => {
      try {
        const res = analyzePreviewQuality(imageData);
        setLiveQuality({
          sharp: res.sharp,
          bright: res.bright,
          motion: !res.sharp,
        });
      } catch {
        // Ignore live sampling glitch
      }
    },
    5
  );

  // Gallery file picker change handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      stopActiveStream();
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onImageSelected(event.target.result as string, 'gallery');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Sample leaf prototype handler
  const handleSampleClick = (sampleType: 'early_blight' | 'late_blight' | 'healthy' | 'blurry') => {
    stopActiveStream();
    setSelectedSample(sampleType);
    onImageSelected(`sample:${sampleType}`, sampleType);
  };

  // Stop stream when tab is hidden or component unmounts
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopActiveStream();
        if (cameraState === 'streaming') {
          setCameraState('idle');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopActiveStream();
    };
  }, [stopActiveStream, cameraState]);

  return (
    <div className="flex flex-col px-5 pt-3 pb-24 max-w-md mx-auto">
      {/* Title & Farmer-friendly description */}
      <div className="mb-4">
        <h1 className="font-editorial text-[32px] font-bold text-[var(--color-ink)] leading-tight tracking-tight">
          {t('check_crop_title', undefined, language)}
        </h1>
        <p className="text-sm text-[var(--color-muted)] mt-1.5 leading-relaxed font-normal">
          {t('check_crop_desc', undefined, language)}
        </p>
      </div>

      {/* Hidden file input for gallery upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Viewfinder Card */}
      <div className="relative w-full aspect-[4/4.5] bg-[var(--color-vf-bg)] border-2 border-[var(--color-outline)] rounded-[14px] shadow-[3px_3px_0_var(--color-shadow-color)] overflow-hidden">
        {/* Retro Poster Scene or Live Camera Stream with Frame Overlay */}
        <RetroViewfinderArt
          variant={selectedSample}
          showOverlay={cameraState !== 'error'}
          isVideoLive={cameraState === 'streaming' || cameraState === 'capturing'}
          className="w-full h-full"
        >
          {/* Live Video Element */}
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`w-full h-full object-cover transition-opacity duration-200 ${
              cameraState === 'streaming' || cameraState === 'capturing'
                ? 'opacity-100'
                : 'opacity-0'
            }`}
          />
        </RetroViewfinderArt>

        {/* Idle State: Tap anywhere in viewfinder to activate live camera */}
        {cameraState === 'idle' && (
          <button
            onClick={handleStartCamera}
            className="absolute inset-0 z-10 w-full h-full flex flex-col items-center justify-center bg-black/10 hover:bg-black/5 transition-colors cursor-pointer group"
            aria-label={t('start_camera', undefined, language)}
          >
            <div className="px-4 py-2 rounded-full bg-[var(--color-surface)] border-2 border-[var(--color-outline)] text-[var(--color-ink)] shadow-[2px_2px_0_var(--color-shadow-color)] flex items-center gap-2 group-hover:scale-105 transition-transform">
              <Camera className="w-4 h-4 text-[var(--color-primary)] stroke-[2.5]" />
              <span className="text-xs font-bold">{t('start_camera', undefined, language)}</span>
            </div>
          </button>
        )}

        {/* Starting Camera Spinner */}
        {cameraState === 'starting' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[var(--color-vf-bg)]/80 backdrop-blur-sm p-6 text-center">
            <div className="w-9 h-9 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-bold text-[var(--color-ink)]">
              {t('starting_camera', undefined, language)}
            </p>
          </div>
        )}

        {/* Capturing Indicator */}
        {cameraState === 'capturing' && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-9 h-9 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-bold text-white">
              {t('take_photo_btn', undefined, language)}...
            </p>
          </div>
        )}

        {/* Error State: Clear translated permission / device error view */}
        {cameraState === 'error' && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[var(--color-surface)] p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--color-warning-bg)] border border-[var(--color-outline)] flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6 text-[var(--color-warning-text)]" />
            </div>
            <h3 className="font-editorial text-lg font-bold text-[var(--color-ink)] mb-1.5">
              {cameraError?.messageKey
                ? t(cameraError.messageKey, undefined, language)
                : t('camera_denied_title', undefined, language)}
            </h3>
            <p className="text-xs text-[var(--color-muted)] mb-5 leading-relaxed max-w-xs">
              {cameraError?.descKey
                ? t(cameraError.descKey, undefined, language)
                : t('camera_denied_desc', undefined, language)}
            </p>
            <div className="flex flex-col gap-2.5 w-full max-w-xs">
              <button
                onClick={handleStartCamera}
                className="w-full py-2.5 retro-btn-primary text-xs font-bold flex items-center justify-center gap-2 retro-focus"
              >
                <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{t('camera_retry_btn', undefined, language)}</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 retro-btn-surface text-xs font-bold flex items-center justify-center gap-2 retro-focus"
              >
                <ImageIcon className="w-3.5 h-3.5 stroke-[2]" />
                <span>{t('camera_gallery_fallback', undefined, language)}</span>
              </button>
            </div>
          </div>
        )}

        {/* Top Chips: placed inside frame overlay at top-8 left-7 right-7 without overlapping corner brackets */}
        {cameraState !== 'error' && (
          <div className="absolute top-8 left-7 right-7 z-20 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-2">
              {/* Light Status Chip */}
              <span className="px-3 py-1 bg-[var(--color-surface)] text-[var(--color-ink)] border-[1.5px] border-[var(--color-outline)] rounded-full text-xs font-bold shadow-[2px_2px_0_var(--color-shadow-color)]">
                {cameraState === 'streaming'
                  ? liveQuality.bright
                    ? t('light_good', undefined, language)
                    : t('hint_check_light', undefined, language)
                  : t('light_good', undefined, language)}
              </span>

              {/* Blur / Steady Motion Status Chip */}
              <span
                className={`px-3 py-1 border-[1.5px] border-[var(--color-outline)] rounded-full text-xs font-bold shadow-[2px_2px_0_var(--color-shadow-color)] transition-colors ${
                  cameraState === 'streaming' && !liveQuality.sharp
                    ? 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]'
                    : 'bg-[var(--color-surface)] text-[var(--color-ink)]'
                }`}
              >
                {cameraState === 'streaming'
                  ? liveQuality.sharp
                    ? t('hold_steady', undefined, language)
                    : t('hint_motion_blur', undefined, language)
                  : t('hold_steady', undefined, language)}
              </span>
            </div>

            {torchActive && (
              <span className="px-2.5 py-1 bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] border border-[var(--color-outline)] rounded-full text-[10px] font-bold shadow-[2px_2px_0_var(--color-shadow-color)]">
                Torch ON
              </span>
            )}
          </div>
        )}

        {/* Caption: Centred at bottom-6, placed between bottom brackets */}
        {cameraState !== 'error' && (
          <div className="absolute bottom-6 inset-x-0 z-20 flex justify-center pointer-events-none px-12">
            <span className="bg-[var(--color-surface)] text-[var(--color-ink)] border-[1.5px] border-[var(--color-outline)] px-3.5 py-1 rounded-full text-center text-xs font-bold shadow-[2px_2px_0_var(--color-shadow-color)] leading-none max-w-[260px] truncate">
              {t('fill_frame', undefined, language)}
            </span>
          </div>
        )}
      </div>

      {/* Camera Shutter & Controls Bar */}
      <div className="flex items-center justify-around py-5">
        {/* Gallery Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-14 h-14 rounded-full retro-btn-surface flex items-center justify-center retro-focus"
          title={t('gallery_btn', undefined, language)}
          aria-label={t('gallery_btn', undefined, language)}
        >
          <ImageIcon className="w-6 h-6 stroke-[2]" />
        </button>

        {/* Primary Shutter Button - Circular with ink outline and physical press */}
        <button
          onClick={handleShutterClick}
          disabled={cameraState === 'starting' || cameraState === 'capturing'}
          className={`w-20 h-20 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] border-2 border-[var(--color-primary-outline)] shadow-[3px_3px_0_var(--color-shadow-color)] retro-btn-press flex items-center justify-center retro-focus ${
            cameraState === 'starting' || cameraState === 'capturing'
              ? 'opacity-70 cursor-not-allowed'
              : ''
          }`}
          title={
            cameraState === 'streaming'
              ? t('take_photo_btn', undefined, language)
              : t('start_camera', undefined, language)
          }
          aria-label={
            cameraState === 'streaming'
              ? t('take_photo_btn', undefined, language)
              : t('start_camera', undefined, language)
          }
        >
          <div className="w-14 h-14 rounded-full border-2 border-[var(--color-on-primary)]/40 flex items-center justify-center">
            {cameraState === 'streaming' ? (
              <div className="w-3.5 h-3.5 rounded-full bg-[var(--color-on-primary)]" />
            ) : (
              <Camera className="w-5 h-5 stroke-[2.5]" />
            )}
          </div>
        </button>

        {/* Secondary Action: Flip Camera if Streaming, or Toggle Light Guide */}
        {cameraState === 'streaming' ? (
          <button
            onClick={handleToggleFacingMode}
            className="w-14 h-14 rounded-full retro-btn-surface flex items-center justify-center retro-focus"
            title={t('camera_switch', undefined, language)}
            aria-label={t('camera_switch', undefined, language)}
          >
            <RotateCcw className="w-6 h-6 stroke-[2]" />
          </button>
        ) : (
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
        )}
      </div>

      {/* Test Sample Leaves Bar for Immediate Farmer Prototyping */}
      <div className="mt-1 retro-card p-3.5">
        <div
          className={`flex items-center gap-1.5 text-xs font-bold text-[var(--color-ink)] mb-2.5 ${
            language === 'en' ? 'uppercase tracking-wider' : ''
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[var(--color-primary)]" />
          <span>{t('test_samples_title', undefined, language)}</span>
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
            <div className="font-bold">{t('sample_early_blight', undefined, language)}</div>
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
            <div className="font-bold">{t('sample_blurry', undefined, language)}</div>
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
            <div className="font-bold">{t('sample_late_blight', undefined, language)}</div>
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
            <div className="font-bold">{t('sample_healthy', undefined, language)}</div>
            <div className="text-[10px] text-[var(--color-muted)]">Clean green foliage</div>
          </button>
        </div>
      </div>
    </div>
  );
};
