/**
 * Mobile camera capture utilities and permission flow handling.
 * Conforms to AGENTS.md Section 4.
 */

export interface CameraError {
  name: 'NotAllowedError' | 'NotFoundError' | 'NotReadableError' | 'OverconstrainedError' | 'SecurityError' | 'UnknownError';
  message: string;
  nextStep: string;
}

export interface CameraConfig {
  facingMode?: 'user' | 'environment';
  idealWidth?: number;
  idealHeight?: number;
}

/**
 * Request user media camera stream with mobile rear camera preference.
 */
export async function startCamera(config?: CameraConfig): Promise<MediaStream> {
  // TODO: Implement camera capture and permission flow per AGENTS.md Section 4 (P2)
  throw new Error('TODO: startCamera implementation pending');
}

/**
 * Capture single frame from active video element or stream into ImageBitmap.
 */
export async function captureFrame(video: HTMLVideoElement): Promise<ImageBitmap> {
  // TODO: Implement canvas frame capture / ImageCapture API fallback per AGENTS.md Section 4 (P2)
  throw new Error('TODO: captureFrame implementation pending');
}

/**
 * Map native DOMException to user-friendly CameraError with actionable next step.
 */
export function mapCameraError(err: unknown): CameraError {
  // TODO: Map DOMException errors per AGENTS.md Section 4
  const errorName = (err as Error)?.name || 'UnknownError';
  return {
    name: errorName as CameraError['name'],
    message: 'Unable to access camera.',
    nextStep: 'Please check camera permissions in browser settings or upload from gallery.',
  };
}
