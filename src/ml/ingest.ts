/**
 * Unified Ingest Pipeline.
 *
 * Per AGENTS.md Section 5:
 * "Camera frames and gallery files must go through the same function:
 *  ingest(source) -> ImageBitmap (oriented, downscaled).
 *  Everything after ingest is source-agnostic."
 */

import { captureFrame } from './camera';
import { calculateDownscaleDimensions, decodeGalleryFile } from './gallery';

export type IngestSource =
  | HTMLVideoElement
  | File
  | Blob
  | ImageBitmap
  | HTMLCanvasElement
  | ImageData;

export const INGEST_MAX_LONG_SIDE = 1280;

/**
 * Downscales an ImageBitmap so that max(width, height) <= maxLongSide.
 * Closes the original bitmap to free memory on mobile devices.
 */
export async function downscaleBitmap(
  bitmap: ImageBitmap,
  maxLongSide: number = INGEST_MAX_LONG_SIDE
): Promise<ImageBitmap> {
  const { width, height } = bitmap;
  const dims = calculateDownscaleDimensions(width, height, maxLongSide);

  if (!dims.scaled) {
    return bitmap;
  }

  const canvas = document.createElement('canvas');
  canvas.width = dims.width;
  canvas.height = dims.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable during downscaling.');
  }

  ctx.drawImage(bitmap, 0, 0, dims.width, dims.height);
  const downscaled = await createImageBitmap(canvas);

  // Close unscaled bitmap to prevent mobile GPU/memory leaks
  if (typeof bitmap.close === 'function') {
    bitmap.close();
  }

  return downscaled;
}

/**
 * Unified ingest entry point for all image sources.
 * Guarantees that returned ImageBitmap is correctly oriented and has long side <= 1280px.
 */
export async function ingest(source: IngestSource): Promise<ImageBitmap> {
  let rawBitmap: ImageBitmap;

  if (source instanceof HTMLVideoElement) {
    // Camera video frame
    rawBitmap = await captureFrame(source);
  } else if (source instanceof File) {
    // File from device gallery picker (with EXIF rotation applied)
    rawBitmap = await decodeGalleryFile(source);
  } else if (source instanceof Blob) {
    // Generic blob
    try {
      rawBitmap = await createImageBitmap(source, {
        imageOrientation: 'from-image',
      });
    } catch {
      rawBitmap = await createImageBitmap(source);
    }
  } else if (source instanceof HTMLCanvasElement || source instanceof ImageData) {
    rawBitmap = await createImageBitmap(source);
  } else if (source && typeof (source as ImageBitmap).close === 'function') {
    rawBitmap = source as ImageBitmap;
  } else {
    throw new Error('Invalid or unsupported source provided to ingest().');
  }

  // Uniform downscale to long side <= 1280px
  return await downscaleBitmap(rawBitmap, INGEST_MAX_LONG_SIDE);
}
