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
  onCapture: (bitmap: ImageBitmap) => void;
  onOpenGallery: () => void;
  onClose: () => void;
}

type CameraState = 'pre_permission' | 'streaming' | 'error' | 'capturing';

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  onOpenGallery,
  onClose,
}) => {
  const [cameraState, setCameraState] = useState<CameraState>('pre_permission');
  const [facingMode, setFacingMode] = useState<FacingMode>('environment');
  const [cameraError, setCameraError] = useState<CameraError | null>(null);
  const [liveHint, setLiveHint] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
      setCameraError(null);
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

  // Start camera on request
  const handleRequestPermission = () => {
    initCamera(facingMode);
  };

  // Flip front / back camera
  const handleToggleFacingMode = () => {
    const nextMode: FacingMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    initCamera(nextMode);
  };

  // Capture frame
  const handleCapture = async () => {
    const video = videoRef.current;
    if (!video || cameraState !== 'streaming') return;

    try {
      // 1. Capture the frame FIRST while video is actively visible and streaming
      const bitmap = await ingest(video);

      // 2. Stop stream tracks cleanly
      stopActiveStream();

      // 3. Deliver captured bitmap to parent
      onCapture(bitmap);
    } catch (err) {
      console.error('[CameraCapture] Capture failed:', err);
      setCameraError({
        name: 'UnknownError',
        message: 'Failed to capture frame from camera.',
        nextStep: 'Please try taking the photo again or pick from gallery.',
      });
      setCameraState('error');
    }
  };

  // Live preview hook: processes 160x160 downscale ~5 times per sec without UI blocking
  useLivePreview(
    videoRef,
    cameraState === 'streaming',
    (imageData: ImageData) => {
      // Cheap brightness check on preview frame
      const data = imageData.data;
      let totalLum = 0;
      const count = data.length / 4;
      for (let i = 0; i < data.length; i += 16) {
        // sampled
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        totalLum += 0.299 * r + 0.587 * g + 0.114 * b;
      }
      const meanLum = totalLum / (count / 4);

      if (meanLum < 45) {
        setLiveHint('Too dark — move into brighter light');
      } else if (meanLum > 220) {
        setLiveHint('Too bright / glare — avoid direct flash or reflection');
      } else {
        setLiveHint('Point leaf into frame and hold steady');
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

  return (
    <div className="fixed inset-0 z-50 bg-[#0d1624] text-white flex flex-col justify-between select-none max-w-md mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent z-10">
        <button
          onClick={() => {
            stopActiveStream();
            onClose();
          }}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white"
          aria-label="Close camera"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-xs font-medium text-emerald-400 border border-white/10">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Offline & On-Device</span>
        </div>

        {cameraState === 'streaming' ? (
          <button
            onClick={handleToggleFacingMode}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white"
            aria-label="Switch camera"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-10" />
        )}
      </div>

      {/* Main View Area */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        {/* Pre-Permission Screen */}
        {cameraState === 'pre_permission' && (
          <div className="flex flex-col items-center justify-center p-6 text-center max-w-xs animate-in fade-in duration-200">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5 text-emerald-400">
              <Camera className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold font-editorial text-white mb-2">
              Camera Access
            </h2>
            <p className="text-sm text-slate-300 mb-8 leading-relaxed">
              AgriScan needs the camera to scan leaves. Photos stay on your phone and are never uploaded to any cloud.
            </p>

            <button
              onClick={handleRequestPermission}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] font-bold text-base text-white shadow-lg shadow-emerald-950/40 mb-3 transition-all flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              <span>Allow Camera</span>
            </button>

            <button
              onClick={() => {
                stopActiveStream();
                onOpenGallery();
              }}
              className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-[0.98] font-semibold text-sm text-slate-200 transition-all flex items-center justify-center gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Upload from gallery instead</span>
            </button>
          </div>
        )}

        {/* Error Screen */}
        {cameraState === 'error' && (
          <div className="flex flex-col items-center justify-center p-6 text-center max-w-xs animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 text-amber-400">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {cameraError?.message || 'Camera Error'}
            </h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/10 text-left">
              {cameraError?.nextStep}
            </p>

            <button
              onClick={() => {
                stopActiveStream();
                onOpenGallery();
              }}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] font-bold text-sm text-white shadow-md transition-all mb-3 flex items-center justify-center gap-2"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Upload from Gallery</span>
            </button>

            <button
              onClick={() => initCamera(facingMode)}
              className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-[0.98] font-semibold text-xs text-slate-200 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          </div>
        )}

        {/* Live Video Preview Screen */}
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
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-8">
            <div className="relative w-64 h-64 border-2 border-dashed border-emerald-400/70 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.15)]">
              {/* Corner Accents */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />
            </div>

            {/* Live Hint Floating Chip */}
            {liveHint && (
              <div className="mt-6 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-xs font-medium text-slate-100 flex items-center gap-2 animate-in fade-in duration-150">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{liveHint}</span>
              </div>
            )}
          </div>
        )}

        {/* Capturing Indicator */}
        {cameraState === 'capturing' && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm font-semibold text-white">Capturing photo...</p>
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="p-6 pb-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-around z-10">
        <button
          onClick={() => {
            stopActiveStream();
            onOpenGallery();
          }}
          className="p-3.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white flex flex-col items-center"
          aria-label="Upload from gallery"
        >
          <ImageIcon className="w-6 h-6" />
          <span className="text-[10px] mt-1 text-slate-300">Gallery</span>
        </button>

        {/* Shutter Button */}
        <button
          onClick={handleCapture}
          disabled={cameraState !== 'streaming'}
          className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            cameraState === 'streaming'
              ? 'bg-white hover:scale-105 active:scale-95 shadow-xl shadow-emerald-500/20'
              : 'bg-white/30 opacity-50 cursor-not-allowed'
          }`}
          aria-label="Take photo"
        >
          <div className="w-16 h-16 rounded-full border-2 border-black/20 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500" />
          </div>
        </button>

        <div className="w-14" />
      </div>
    </div>
  );
};
