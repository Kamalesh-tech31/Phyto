/**
 * Mobile camera capture utilities and permission flow handling.
 * Conforms strictly to AGENTS.md Section 4.
 */

import { useEffect, useRef } from 'react';

export type CameraErrorName =
  | 'NotAllowedError'
  | 'NotFoundError'
  | 'NotReadableError'
  | 'OverconstrainedError'
  | 'SecurityError'
  | 'UnknownError';

export interface CameraError {
  name: CameraErrorName;
  message: string;
  nextStep: string;
}

export type FacingMode = 'environment' | 'user';

/**
 * Request user media camera stream with mobile rear camera preference.
 * Video only, 1280x720 ideal resolution, audio false.
 */
export async function startCamera(facingMode: FacingMode = 'environment'): Promise<MediaStream> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    const error = new Error('Camera API (getUserMedia) not supported in this browser.');
    error.name = 'NotFoundError';
    throw error;
  }

  // Check HTTPS or localhost requirement
  const isSecure =
    window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  if (!isSecure) {
    const error = new Error('Camera access requires HTTPS or localhost.');
    error.name = 'SecurityError';
    throw error;
  }

  try {
    // Primary request: rear camera preferred, 1280x720 ideal
    const constraints: MediaStreamConstraints = {
      audio: false,
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    };
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (err) {
    const errorName = (err as Error)?.name;
    // OverconstrainedError: retry with relaxed constraints
    if (errorName === 'OverconstrainedError') {
      try {
        return await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: true,
        });
      } catch (fallbackErr) {
        throw fallbackErr;
      }
    }
    throw err;
  }
}

/**
 * Stops all tracks in a MediaStream.
 */
export function stopStream(stream: MediaStream | null): void {
  if (!stream) return;
  try {
    stream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {
        // Ignore individual track stop errors
      }
    });
  } catch {
    // Ignore stream stop errors
  }
}

/**
 * Capture single frame from active video element into an ImageBitmap.
 * Prefers ImageCapture.takePhoto() when supported, falls back to native canvas extraction.
 */
export async function captureFrame(video: HTMLVideoElement): Promise<ImageBitmap> {
  if (!video) {
    throw new Error('Video element is required to capture frame');
  }

  const stream = video.srcObject as MediaStream | null;
  const videoTrack = stream?.getVideoTracks()[0];

  // Try ImageCapture.takePhoto() if supported
  if (videoTrack && typeof window !== 'undefined' && 'ImageCapture' in window) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const imageCapture = new (window as any).ImageCapture(videoTrack);
      const blob: Blob = await imageCapture.takePhoto();
      return await createImageBitmap(blob);
    } catch (e) {
      console.warn('[Camera] ImageCapture.takePhoto failed, falling back to canvas:', e);
    }
  }

  // Fallback: draw video at native resolution to an offscreen canvas
  const width = video.videoWidth || 1280;
  const height = video.videoHeight || 720;

  if (width === 0 || height === 0) {
    throw new Error('Video frame not ready: dimensions are 0');
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to create 2d rendering context for frame capture');
  }

  ctx.drawImage(video, 0, 0, width, height);
  return await createImageBitmap(canvas);
}

/**
 * Maps native DOMException to user-friendly CameraError with next steps.
 * Conforms to AGENTS.md Section 4.
 */
export function mapCameraError(err: unknown): CameraError {
  const name = ((err as Error)?.name || 'UnknownError') as CameraErrorName;

  switch (name) {
    case 'NotAllowedError':
      return {
        name: 'NotAllowedError',
        message: 'Camera permission was denied.',
        nextStep:
          'Tap the lock or site settings icon in your browser address bar, set Camera to "Allow", and reload the page. Or choose a photo from your gallery.',
      };
    case 'NotFoundError':
      return {
        name: 'NotFoundError',
        message: 'No camera was found on this device.',
        nextStep: 'Please upload a photo from your gallery instead.',
      };
    case 'NotReadableError':
      return {
        name: 'NotReadableError',
        message: 'Camera is busy or in use by another app.',
        nextStep:
          'Close other apps using the camera (such as WhatsApp, native Camera, or video calls) and try again.',
      };
    case 'OverconstrainedError':
      return {
        name: 'OverconstrainedError',
        message: 'The camera could not satisfy the requested resolution.',
        nextStep: 'Try reloading with relaxed camera settings or use gallery upload.',
      };
    case 'SecurityError':
      return {
        name: 'SecurityError',
        message: 'Camera access requires a secure connection (HTTPS).',
        nextStep: 'Ensure you are browsing via HTTPS or localhost.',
      };
    default:
      return {
        name: 'UnknownError',
        message: (err as Error)?.message || 'An unexpected camera error occurred.',
        nextStep: 'Please refresh the page or upload a photo from your gallery.',
      };
  }
}

/**
 * React hook for running a lightweight preview frame check at ~5 fps (every 200ms) on a 160x160 canvas.
 * Never blocks the UI thread. Automatically pauses when the page is hidden.
 */
export function useLivePreview(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  active: boolean,
  onFrame: (imageData: ImageData) => void,
  fps: number = 5
) {
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  useEffect(() => {
    if (!active) return;

    let animId: number;
    let lastTime = 0;
    const intervalMs = 1000 / fps;

    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 160;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const tick = (now: number) => {
      if (document.hidden) {
        animId = requestAnimationFrame(tick);
        return;
      }

      if (now - lastTime >= intervalMs) {
        const video = videoRef.current;
        if (
          video &&
          video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
          video.videoWidth > 0 &&
          video.videoHeight > 0 &&
          ctx
        ) {
          ctx.drawImage(video, 0, 0, 160, 160);
          try {
            const imageData = ctx.getImageData(0, 0, 160, 160);
            onFrameRef.current(imageData);
          } catch {
            // Ignore capture glitches
          }
          lastTime = now;
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [active, fps, videoRef]);
}
