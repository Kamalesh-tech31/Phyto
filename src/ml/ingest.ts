/**
 * Unified Ingest Pipeline.
 * Single entry point ensuring uniform dimensions (long side <= 1280px)
 * and correct EXIF orientation for camera frames and gallery images.
 * Conforms to AGENTS.md Section 5.
 */

import { captureFrame } from './camera';

export type IngestSource =
  | HTMLVideoElement
  | File
  | Blob
  | ImageBitmap
  | HTMLCanvasElement
  | ImageData;

const MAX_LONG_SIDE = 1280;

/**
 * Downscale an ImageBitmap so that its longest edge is at most maxLongSide.
 * Frees previous bitmap memory to minimize mobile browser footprint.
 */
export async function downscaleBitmap(
  bitmap: ImageBitmap,
  maxLongSide: number = MAX_LONG_SIDE
): Promise<ImageBitmap> {
  const { width, height } = bitmap;
  const longSide = Math.max(width, height);

  if (longSide <= maxLongSide) {
    return bitmap;
  }

  const scale = maxLongSide / longSide;
  const targetWidth = Math.round(width * scale);
  const targetHeight = Math.round(height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable during downscaling.');
  }

  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  const downscaled = await createImageBitmap(canvas);

  // Close unscaled bitmap to prevent memory leak on mobile
  if (typeof bitmap.close === 'function') {
    bitmap.close();
  }

  return downscaled;
}

/**
 * Ingest an image from camera, file picker, canvas, or blob.
 * Returns an oriented, downscaled ImageBitmap.
 */
export async function ingest(source: IngestSource): Promise<ImageBitmap> {
  let rawBitmap: ImageBitmap;

  if (source instanceof HTMLVideoElement) {
    // Frame from live camera stream
    rawBitmap = await captureFrame(source);
  } else if (source instanceof File || source instanceof Blob) {
    // File / Blob with EXIF orientation metadata
    try {
      rawBitmap = await createImageBitmap(source, {
        imageOrientation: 'from-image',
      });
    } catch {
      // Fallback if imageOrientation option is unsupported
      rawBitmap = await createImageBitmap(source);
    }
  } else if (source instanceof HTMLCanvasElement) {
    rawBitmap = await createImageBitmap(source);
  } else if (source instanceof ImageData) {
    rawBitmap = await createImageBitmap(source);
  } else if (source && typeof (source as ImageBitmap).close === 'function') {
    rawBitmap = source as ImageBitmap;
  } else {
    throw new Error('Unsupported image ingest source format.');
  }

  // Downscale so long side is <= 1280px
  return await downscaleBitmap(rawBitmap, MAX_LONG_SIDE);
}
