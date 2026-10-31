import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Language } from '../../types';
import { t } from '../../services/i18n';
import { RetroViewfinderArt } from '../../components/RetroViewfinderArt';
import {
  startCamera,
  stopStream,
  captureVideoFrame,
  mapCameraError,
  useLivePreview,
  CameraError,
  FacingMode,
} from '../../ml/camera';
import { analyzePreviewQuality } from '../../ml/quality';
import {
  Image as ImageIcon,
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

type CameraState = 'idle' | 'starting' | 'live' | 'error';

export const ScanHome: React.FC<ScanHomeProps> = ({
  language,
  onImageSelected,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionTokenRef = useRef<number>(0);
  const capturedUrlRef = useRef<string | null>(null);
  const wasLiveBeforeHideRef = useRef<boolean>(false);

  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<CameraError | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>('environment');
  const [activeFacingMode, setActiveFacingMode] = useState<FacingMode>('environment');
  const [cameraCount, setCameraCount] = useState<number>(2); // Default to >=2 until enumerated
  const [isSwitching, setIsSwitching] = useState<boolean>(false);
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
    setIsVideoPlaying(false);
  }, []);

  // Check how many videoinput devices exist
  const checkCameraDevices = useCallback(async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const vInputs = devices.filter((d) => d.kind === 'videoinput');
        setCameraCount(vInputs.length);
      } catch {
        // Fallback: keep previous camera count
      }
    }
  }, []);

  // Request camera stream and attach to video element with race/cancellation safety
  const initCamera = useCallback(
    async (mode: FacingMode = 'environment') => {
      const currentToken = ++sessionTokenRef.current;
      setCameraError(null);
      setCameraState('starting');
      setIsSwitching(true);

      // Cleanly stop existing stream and detach video
      stopActiveStream();

      try {
        const stream = await startCamera(mode);

        // Cancelled or double-mounted during async getUserMedia
        if (currentToken !== sessionTokenRef.current) {
          stopStream(stream);
          return;
        }

        streamRef.current = stream;

        // Detect actual facingMode from track settings
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const settings = videoTrack.getSettings ? videoTrack.getSettings() : undefined;
          const detected = (settings?.facingMode as FacingMode) || mode;
          setActiveFacingMode(detected);

          videoTrack.onended = () => {
            if (currentToken === sessionTokenRef.current) {
              setCameraState('idle');
              setIsVideoPlaying(false);
            }
          };
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (playErr) {
            console.warn('[ScanHome] video play caught:', playErr);
          }
        }

        setFacingMode(mode);
        await checkCameraDevices();
      } catch (err) {
        if (currentToken !== sessionTokenRef.current) return;
        console.error('[ScanHome] startCamera error:', err);
        const mapped = mapCameraError(err);
        setCameraError(mapped);
        setCameraState('error');
        setIsVideoPlaying(false);
      } finally {
        if (currentToken === sessionTokenRef.current) {
          setIsSwitching(false);
        }
      }
    },
    [stopActiveStream, checkCameraDevices]
  );

  // Switch between front and rear cameras
  const handleToggleFacingMode = () => {
    if (isSwitching || cameraCount <= 1) return;
    const nextMode: FacingMode = facingMode === 'environment' ? 'user' : 'environment';
    initCamera(nextMode);
  };

  // Start camera on user action
  const handleStartCamera = () => {
    initCamera(facingMode);
  };

  // Capture frame from active streaming video capped at 1280px native resolution
  const handleCapture = async () => {
    const video = videoRef.current;
    if (!video || !isVideoPlaying) return;

    try {
      // 1. Capture raw unmirrored frame
      const { objectUrl } = await captureVideoFrame(video, 1280);

      // 2. Revoke previously generated blob URL
      if (capturedUrlRef.current && capturedUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(capturedUrlRef.current);
      }
      capturedUrlRef.current = objectUrl;

      // 3. Stop camera tracks cleanly
      stopActiveStream();

      // 4. Pass captured photo URL to app flow
      onImageSelected(objectUrl, 'camera');
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
    if (cameraState === 'live' && isVideoPlaying) {
      handleCapture();
    } else if (cameraState === 'idle' || cameraState === 'error') {
      handleStartCamera();
    }
  };

  // Live preview quality analysis hook: ~5 fps on 160x160 canvas (reads raw unmirrored video)
  useLivePreview(
    videoRef,
    cameraState === 'live' && isVideoPlaying,
    (imageData: ImageData) => {
      try {
        const res = analyzePreviewQuality(imageData);
        setLiveQuality({
          sharp: res.sharp,
          bright: res.bright,
          motion: !res.sharp,
        });
      } catch {
        // Ignore sampling glitch
      }
    },
    5
  );

  // Initial check on mount: auto-start if permission granted, otherwise idle
  useEffect(() => {
    let isMounted = true;

    // Enumerate camera devices
    checkCameraDevices();

    // Device change listener
    const handleDeviceChange = () => {
      if (isMounted) checkCameraDevices();
    };
    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    }

    // Permission check
    const checkPermissions = async () => {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const status = await navigator.permissions.query({ name: 'camera' as PermissionName });
          if (!isMounted) return;

          if (status.state === 'granted') {
            initCamera('environment');
          } else if (status.state === 'denied') {
            setCameraError(mapCameraError({ name: 'NotAllowedError' }));
            setCameraState('error');
          } else {
            setCameraState('idle');
          }

          status.onchange = () => {
            if (!isMounted) return;
            if (status.state === 'granted') {
              initCamera('environment');
            } else if (status.state === 'denied') {
              stopActiveStream();
              setCameraError(mapCameraError({ name: 'NotAllowedError' }));
              setCameraState('error');
            }
          };
          return;
        } catch {
          // Permissions query API unsupported for camera
        }
      }
      if (isMounted) {
        setCameraState('idle');
      }
    };

    checkPermissions();

    return () => {
      isMounted = false;
      if (navigator.mediaDevices && navigator.mediaDevices.removeEventListener) {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      }
    };
  }, [initCamera, checkCameraDevices, stopActiveStream]);

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

  // Stop stream when tab is hidden or component unmounts; resume on visibility if previously live
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (streamRef.current) {
          wasLiveBeforeHideRef.current = cameraState === 'live' && isVideoPlaying;
          stopActiveStream();
        }
      } else {
        if (wasLiveBeforeHideRef.current) {
          wasLiveBeforeHideRef.current = false;
          initCamera(facingMode);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopActiveStream();
      if (capturedUrlRef.current && capturedUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(capturedUrlRef.current);
      }
    };
  }, [stopActiveStream, cameraState, isVideoPlaying, initCamera, facingMode]);

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

      {/* Main Viewfinder Card - 14px rounded retro card with 3px shadow */}
      <div className="relative w-full aspect-[4/4.5] bg-[var(--color-vf-bg)] border-2 border-[var(--color-outline)] rounded-[14px] shadow-[3px_3px_0_var(--color-shadow-color)] overflow-hidden">
        {/* Layer 1 & 2: Retro Poster Scene + Always-mounted Video + Frame Overlay */}
        <RetroViewfinderArt
          variant={selectedSample}
          showOverlay={true}
          isVideoLive={cameraState === 'live' && isVideoPlaying}
          className="w-full h-full"
        >
          {/* Live Video Element: Always in DOM at z-10, transitions opacity when playing */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onPlaying={() => {
              if (videoRef.current && videoRef.current.videoWidth > 0) {
                setIsVideoPlaying(true);
                setCameraState('live');
              }
            }}
            onLoadedMetadata={() => {
              if (videoRef.current) {
                videoRef.current.play().catch(() => {});
              }
            }}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
              cameraState === 'live' && isVideoPlaying
                ? 'opacity-100'
                : 'opacity-0 pointer-events-none'
            }`}
            style={activeFacingMode === 'user' ? { transform: 'scaleX(-1)' } : undefined}
          />
        </RetroViewfinderArt>

        {/* UI Overlay: Idle State ("Enable camera" centered button over poster art) */}
        {cameraState === 'idle' && (
          <div className="absolute inset-0 z-25 flex items-center justify-center pointer-events-auto">
            <button
              onClick={handleStartCamera}
              className="px-4 py-2.5 rounded-full bg-[var(--color-surface)] border-2 border-[var(--color-outline)] text-[var(--color-ink)] shadow-[2px_2px_0_var(--color-shadow-color)] flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform cursor-pointer retro-focus"
              aria-label={t('enable_camera', undefined, language)}
            >
              <Camera className="w-4 h-4 text-[var(--color-primary)] stroke-[2.5]" />
              <span className="text-xs font-bold">{t('enable_camera', undefined, language)}</span>
            </button>
          </div>
        )}

        {/* UI Overlay: Starting Camera Indicator */}
        {cameraState === 'starting' && (
          <div className="absolute inset-0 z-25 flex items-center justify-center pointer-events-none">
            <div className="px-4 py-2 rounded-full bg-[var(--color-surface)]/95 backdrop-blur-sm border-2 border-[var(--color-outline)] text-[var(--color-ink)] shadow-[2px_2px_0_var(--color-shadow-color)] flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin motion-reduce:hidden" />
              <span className="text-xs font-bold">{t('starting_camera', undefined, language)}</span>
            </div>
          </div>
        )}

        {/* UI Overlay: Error State (Translated permission / hardware error over poster art) */}
        {cameraState === 'error' && (
          <div className="absolute inset-0 z-25 flex flex-col items-center justify-center p-6 text-center bg-[var(--color-surface)]/95 backdrop-blur-sm m-4 rounded-[12px] border-2 border-[var(--color-outline)] shadow-[2px_2px_0_var(--color-shadow-color)]">
            <div className="w-10 h-10 rounded-full bg-[var(--color-warning-bg)] border border-[var(--color-outline)] flex items-center justify-center mb-2">
              <AlertCircle className="w-5 h-5 text-[var(--color-warning-text)]" />
            </div>
            <h3 className="font-editorial text-base font-bold text-[var(--color-ink)] mb-1">
              {cameraError?.messageKey
                ? t(cameraError.messageKey, undefined, language)
                : t('camera_denied_title', undefined, language)}
            </h3>
            <p className="text-xs text-[var(--color-muted)] mb-4 leading-relaxed max-w-xs">
              {cameraError?.descKey
                ? t(cameraError.descKey, undefined, language)
                : t('camera_denied_desc', undefined, language)}
            </p>
            <div className="flex gap-2 w-full max-w-xs">
              <button
                onClick={handleStartCamera}
                className="flex-1 py-2 retro-btn-primary text-xs font-bold flex items-center justify-center gap-1.5 retro-focus"
              >
                <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{t('camera_retry_btn', undefined, language)}</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2 retro-btn-surface text-xs font-bold flex items-center justify-center gap-1.5 retro-focus"
              >
                <ImageIcon className="w-3.5 h-3.5 stroke-[2]" />
                <span>{t('camera_gallery_fallback', undefined, language)}</span>
              </button>
            </div>
          </div>
        )}

        {/* Top Chips: Inside frame overlay at top-8 left-7 right-7 without overlapping corner brackets */}
        {cameraState !== 'error' && (
          <div className="absolute top-8 left-7 right-7 z-30 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-2">
              {/* Light Status Chip */}
              <span className="px-3 py-1 bg-[var(--color-surface)] text-[var(--color-ink)] border-[1.5px] border-[var(--color-outline)] rounded-full text-xs font-bold shadow-[2px_2px_0_var(--color-shadow-color)]">
                {cameraState === 'live' && isVideoPlaying
                  ? liveQuality.bright
                    ? t('light_good', undefined, language)
                    : t('hint_check_light', undefined, language)
                  : t('light_good', undefined, language)}
              </span>

              {/* Blur / Steady Motion Status Chip */}
              <span
                className={`px-3 py-1 border-[1.5px] border-[var(--color-outline)] rounded-full text-xs font-bold shadow-[2px_2px_0_var(--color-shadow-color)] transition-colors ${
                  cameraState === 'live' && isVideoPlaying && !liveQuality.sharp
                    ? 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]'
                    : 'bg-[var(--color-surface)] text-[var(--color-ink)]'
                }`}
              >
                {cameraState === 'live' && isVideoPlaying
                  ? liveQuality.sharp
                    ? t('hold_steady', undefined, language)
                    : t('hint_motion_blur', undefined, language)
                  : t('hold_steady', undefined, language)}
              </span>
            </div>
          </div>
        )}

        {/* Caption: Centred at bottom-6, placed between bottom brackets */}
        {cameraState !== 'error' && (
          <div className="absolute bottom-6 inset-x-0 z-30 flex justify-center pointer-events-none px-12">
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
          disabled={cameraState === 'starting'}
          className={`w-20 h-20 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] border-2 border-[var(--color-primary-outline)] shadow-[3px_3px_0_var(--color-shadow-color)] retro-btn-press flex items-center justify-center retro-focus ${
            cameraState === 'starting' ? 'opacity-70 cursor-not-allowed' : ''
          }`}
          title={
            cameraState === 'live' && isVideoPlaying
              ? t('take_photo_btn', undefined, language)
              : t('enable_camera', undefined, language)
          }
          aria-label={
            cameraState === 'live' && isVideoPlaying
              ? t('take_photo_btn', undefined, language)
              : t('enable_camera', undefined, language)
          }
        >
          <div className="w-14 h-14 rounded-full border-2 border-[var(--color-on-primary)]/40 flex items-center justify-center">
            {cameraState === 'live' && isVideoPlaying ? (
              <div className="w-3.5 h-3.5 rounded-full bg-[var(--color-on-primary)]" />
            ) : (
              <Camera className="w-5 h-5 stroke-[2.5]" />
            )}
          </div>
        </button>

        {/* Secondary Action: Front / Back Camera Flip (Disabled if only 1 camera on device) */}
        <button
          onClick={handleToggleFacingMode}
          disabled={isSwitching || cameraCount <= 1}
          className={`w-14 h-14 rounded-full retro-btn-surface flex items-center justify-center retro-focus transition-opacity ${
            cameraCount <= 1 || isSwitching ? 'opacity-40 cursor-not-allowed' : ''
          }`}
          title={
            cameraCount <= 1
              ? t('camera_only_one', undefined, language)
              : t('camera_switch', undefined, language)
          }
          aria-label={
            cameraCount <= 1
              ? t('camera_only_one', undefined, language)
              : t('camera_switch', undefined, language)
          }
        >
          <RotateCcw className={`w-6 h-6 stroke-[2] ${isSwitching ? 'animate-spin' : ''}`} />
        </button>
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
