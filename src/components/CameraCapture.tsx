import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  startCamera,
  stopStream,
  mapCameraError,
  useLivePreview,
  CameraError,
  FacingMode,
} from '../ml/camera';
import { ingest } from '../ml/ingest';
import { Language } from '../types';
import { translations } from '../data/translations';
import {
  Camera,
  Image as ImageIcon,
  RotateCcw,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  X,
  Sparkles,
} from 'lucide-react';

interface CameraCaptureProps {
  language?: Language;
  onCapture: (bitmap: ImageBitmap) => void;
  onOpenGallery: () => void;
  onClose: () => void;
}

type CameraState = 'pre_permission' | 'streaming' | 'error' | 'capturing';

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  language = 'en',
  onCapture,
  onOpenGallery,
  onClose,
}) => {
  const t = translations[language] || translations.en;
  const [cameraState, setCameraState] = useState<CameraState>('pre_permission');
  const [facingMode, setFacingMode] = useState<FacingMode>('environment');
  const [cameraError, setCameraError] = useState<CameraError | null>(null);
  const [liveHint, setLiveHint] = useState<string>(t.hint_hold_steady || 'Point leaf into frame and hold steady');
  const [isSwitchingCamera, setIsSwitchingCamera] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const switchSeqRef = useRef<number>(0);

  // Stop active stream cleanly
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
      const currentSeq = ++switchSeqRef.current;
      setIsSwitchingCamera(true);
      setCameraError(null);
      stopActiveStream();

      try {
        const stream = await startCamera(mode);

        // Discard stale resolution if user flipped cameras again before stream arrived
        if (currentSeq !== switchSeqRef.current) {
          stopStream(stream);
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraState('streaming');
      } catch (err) {
        if (currentSeq !== switchSeqRef.current) return;
        const mapped = mapCameraError(err);
        setCameraError(mapped);
        setCameraState('error');
      } finally {
        if (currentSeq === switchSeqRef.current) {
          setIsSwitchingCamera(false);
        }
      }
    },
    [stopActiveStream]
  );

  // Start camera on user gesture
  const handleRequestPermission = () => {
    initCamera(facingMode);
  };

  // Flip front / back camera with safety guard
  const handleToggleFacingMode = () => {
    if (isSwitchingCamera) return;
    const nextMode: FacingMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    initCamera(nextMode);
  };

  // Capture frame
  const handleCapture = async () => {
    const video = videoRef.current;
    if (!video || cameraState !== 'streaming') return;

    setCameraState('capturing');

    try {
      // 1. Capture the frame while video is actively visible and streaming
      const bitmap = await ingest(video);

      // 2. Stop stream tracks cleanly
      stopActiveStream();

      // 3. Deliver captured bitmap to parent
      onCapture(bitmap);
    } catch (err) {
      console.error('[CameraCapture] Capture failed:', err);
      setCameraError({
        name: 'UnknownError',
        message: t.camera_error_title || 'Failed to capture frame from camera.',
        nextStep: t.camera_gallery_fallback || 'Please try taking the photo again or pick from gallery.',
      });
      setCameraState('error');
    }
  };

  // Live preview hook: processes 160x160 downscale ~5 times per sec
  useLivePreview(
    videoRef,
    cameraState === 'streaming',
    (imageData: ImageData) => {
      const data = imageData.data;
      let totalLum = 0;
      const count = data.length / 4;
      for (let i = 0; i < data.length; i += 16) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        totalLum += 0.299 * r + 0.587 * g + 0.114 * b;
      }
      const meanLum = totalLum / (count / 4);

      if (meanLum < 45) {
        setLiveHint(t.hint_too_dark || 'Move into better light');
      } else if (meanLum > 220) {
        setLiveHint(t.hint_too_bright || 'Too bright / direct glare');
      } else {
        setLiveHint(t.hint_hold_steady || 'Point leaf into frame and hold steady');
      }
    },
    5
  );

  // Stop stream when tab is hidden or component unmounts
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopActiveStream();
        if (cameraState === 'streaming') {
          setCameraState('pre_permission');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopActiveStream();
    };
  }, [stopActiveStream, cameraState]);

  // Localized error strings
  const getLocalizedError = (error: CameraError | null) => {
    if (!error) return null;
    switch (error.name) {
      case 'NotAllowedError':
        return {
          title: t.camera_denied_title || error.message,
          nextStep: t.camera_denied_desc || error.nextStep,
        };
      case 'NotFoundError':
        return {
          title: t.camera_not_found_title || error.message,
          nextStep: t.camera_not_found_desc || error.nextStep,
        };
      case 'NotReadableError':
        return {
          title: t.camera_busy_title || error.message,
          nextStep: t.camera_busy_desc || error.nextStep,
        };
      case 'SecurityError':
        return {
          title: t.camera_insecure_title || error.message,
          nextStep: t.camera_insecure_desc || error.nextStep,
        };
      default:
        return {
          title: t.camera_error_title || error.message,
          nextStep: error.nextStep,
        };
    }
  };

  const localizedError = getLocalizedError(cameraError);

  return (
    <div
      data-theme="dark"
      className="fixed inset-0 z-50 bg-[var(--color-bg)] text-[var(--color-ink)] flex flex-col justify-between select-none max-w-md mx-auto h-[100dvh]"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-[var(--color-bg)]/90 via-[var(--color-bg)]/70 to-transparent z-20">
        <button
          onClick={() => {
            stopActiveStream();
            onClose();
          }}
          className="w-10 h-10 rounded-full bg-[var(--color-surface)] border-2 border-[var(--color-outline)] shadow-[2px_2px_0_var(--color-shadow-color)] retro-btn-press flex items-center justify-center text-[var(--color-ink)] retro-focus"
          aria-label={t.btn_close_camera || 'Close camera'}
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Sticker-style offline badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-surface)] border-[1.5px] border-[var(--color-outline)] shadow-[2px_2px_0_var(--color-shadow-color)] text-xs font-bold text-[var(--color-primary)]">
          <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
          <span>{t.offline_on_device || 'Offline & On-Device'}</span>
        </div>

        {cameraState === 'streaming' ? (
          <button
            onClick={handleToggleFacingMode}
            disabled={isSwitchingCamera}
            className="w-10 h-10 rounded-full bg-[var(--color-surface)] border-2 border-[var(--color-outline)] shadow-[2px_2px_0_var(--color-shadow-color)] retro-btn-press flex items-center justify-center text-[var(--color-ink)] disabled:opacity-50 retro-focus"
            aria-label={t.btn_switch_camera || 'Switch camera'}
          >
            <RotateCcw className={`w-5 h-5 stroke-[2.5] ${isSwitchingCamera ? 'animate-spin' : ''}`} />
          </button>
        ) : (
          <div className="w-10" />
        )}
      </div>

      {/* Main View Area */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        {/* Pre-Permission Screen */}
        {cameraState === 'pre_permission' && (
          <div className="flex flex-col items-center justify-center p-6 text-center max-w-xs animate-in fade-in duration-200 z-10">
            <div className="w-20 h-20 rounded-[14px] bg-[var(--color-surface)] border-2 border-[var(--color-outline)] shadow-[3px_3px_0_var(--color-shadow-color)] flex items-center justify-center mb-5 text-[var(--color-primary)]">
              <Camera className="w-10 h-10 stroke-[2]" />
            </div>
            <h2 className="text-2xl font-bold font-editorial text-[var(--color-ink)] mb-2">
              {t.camera_access_title || 'Camera Access'}
            </h2>
            <p className="text-sm text-[var(--color-muted)] mb-8 leading-relaxed font-normal">
              {t.camera_access_desc || 'Phyto needs the camera to scan leaves. Photos stay on your phone unless you choose to send one to an expert.'}
            </p>

            <button
              onClick={handleRequestPermission}
              className="w-full min-h-[52px] py-3.5 retro-btn-primary text-base retro-focus font-bold mb-3 flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              <span>{t.btn_allow_camera || 'Allow Camera'}</span>
            </button>

            <button
              onClick={() => {
                stopActiveStream();
                onOpenGallery();
              }}
              className="w-full min-h-[48px] py-3 retro-btn-surface text-sm retro-focus font-semibold flex items-center justify-center gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              <span>{t.btn_upload_gallery_instead || 'Upload from gallery instead'}</span>
            </button>
          </div>
        )}

        {/* Error Screen */}
        {cameraState === 'error' && (
          <div className="flex flex-col items-center justify-center p-6 text-center max-w-xs animate-in fade-in duration-200 z-10">
            <div className="w-16 h-16 rounded-[14px] bg-[var(--color-warning-bg)] border-2 border-[var(--color-outline)] shadow-[3px_3px_0_var(--color-shadow-color)] flex items-center justify-center mb-4 text-[var(--color-warning-text)]">
              <AlertCircle className="w-8 h-8 stroke-[2.5]" />
            </div>
            <h3 className="text-lg font-bold font-editorial text-[var(--color-ink)] mb-2">
              {localizedError?.title || t.camera_error_title || 'Camera Error'}
            </h3>
            <p className="text-xs text-[var(--color-muted)] mb-6 leading-relaxed bg-[var(--color-surface)] p-4 rounded-[12px] border-2 border-[var(--color-outline)] shadow-[2px_2px_0_var(--color-shadow-color)] text-left font-normal">
              {localizedError?.nextStep || cameraError?.nextStep}
            </p>

            <button
              onClick={() => {
                stopActiveStream();
                onOpenGallery();
              }}
              className="w-full min-h-[48px] py-3 retro-btn-primary text-sm retro-focus font-bold mb-3 flex items-center justify-center gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              <span>{t.camera_gallery_fallback || 'Upload from Gallery'}</span>
            </button>

            <button
              onClick={() => initCamera(facingMode)}
              className="w-full min-h-[44px] py-2.5 retro-btn-surface text-xs retro-focus font-semibold flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{t.btn_try_again || 'Try Again'}</span>
            </button>
          </div>
        )}

        {/* Live Video Preview Screen - Unconditionally rendered in the DOM */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            cameraState === 'streaming' ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        />

        {/* Reticle Guide Overlay */}
        {cameraState === 'streaming' && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-8 z-10">
            <div className="relative w-64 h-64 border-2 border-dashed border-[var(--color-ink)]/70 rounded-[14px] flex items-center justify-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
              {/* Retro Corner Accents */}
              <div className="absolute -top-1 -left-1 w-7 h-7 border-t-4 border-l-4 border-[var(--color-ink)] rounded-tl-lg drop-shadow" />
              <div className="absolute -top-1 -right-1 w-7 h-7 border-t-4 border-r-4 border-[var(--color-ink)] rounded-tr-lg drop-shadow" />
              <div className="absolute -bottom-1 -left-1 w-7 h-7 border-b-4 border-l-4 border-[var(--color-ink)] rounded-bl-lg drop-shadow" />
              <div className="absolute -bottom-1 -right-1 w-7 h-7 border-b-4 border-r-4 border-[var(--color-ink)] rounded-br-lg drop-shadow" />
            </div>

            {/* Live Hint Floating Chip */}
            {liveHint && (
              <div className="mt-6 px-4 py-2 rounded-full bg-[var(--color-surface)] border-[1.5px] border-[var(--color-outline)] shadow-[2px_2px_0_var(--color-shadow-color)] text-xs font-bold text-[var(--color-ink)] flex items-center gap-2 animate-in fade-in duration-150">
                <Sparkles className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
                <span className="truncate max-w-[240px]">{liveHint}</span>
              </div>
            )}
          </div>
        )}

        {/* Capturing Indicator */}
        {cameraState === 'capturing' && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-30">
            <div className="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm font-semibold text-[var(--color-ink)]">
              {t.capturing_photo || 'Capturing photo...'}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="p-6 pb-8 bg-gradient-to-t from-[var(--color-bg)]/95 via-[var(--color-bg)]/60 to-transparent flex items-center justify-around z-20">
        <button
          onClick={() => {
            stopActiveStream();
            onOpenGallery();
          }}
          className="w-14 h-14 rounded-full retro-btn-surface flex flex-col items-center justify-center retro-focus"
          aria-label={t.btn_gallery || 'Gallery'}
        >
          <ImageIcon className="w-5 h-5 stroke-[2]" />
          <span className="text-[9px] font-bold text-[var(--color-muted)] leading-tight mt-0.5">
            {t.btn_gallery || 'Gallery'}
          </span>
        </button>

        {/* Primary Shutter Button - Cream disc with 2px outline, hard offset shadow, and primary-color inner dot */}
        <button
          onClick={handleCapture}
          disabled={cameraState !== 'streaming'}
          className="w-20 h-20 rounded-full bg-[var(--color-surface)] border-2 border-[var(--color-outline)] shadow-[3px_3px_0_var(--color-shadow-color)] retro-btn-press flex items-center justify-center retro-focus disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={t.take_photo_btn || 'Take photo'}
        >
          <div className="w-14 h-14 rounded-full border-2 border-[var(--color-outline)]/40 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-[var(--color-primary)] border border-[var(--color-outline)]" />
          </div>
        </button>

        <div className="w-14" />
      </div>
    </div>
  );
};
