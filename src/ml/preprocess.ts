/**
 * Model preprocessing matching training pipeline:
 * Center-square crop, resize to 224x224, RGB normalized to [0, 1], ImageNet mean/std, NCHW Float32Array.
 * Conforms to AGENTS.md Section 7.
 */

import { ModelConfig } from './types';

export const DEFAULT_IMAGENET_MEAN: [number, number, number] = [0.485, 0.456, 0.406];
export const DEFAULT_IMAGENET_STD: [number, number, number] = [0.229, 0.224, 0.225];

/**
 * Normalizes an array of RGBA pixels into planar NCHW float32 tensor data.
 * Shape: [1, 3, height, width]
 */
export function normalizePixelsToNCHW(
  rgba: ArrayLike<number>,
  width: number,
  height: number,
  mean: [number, number, number] = DEFAULT_IMAGENET_MEAN,
  std: [number, number, number] = DEFAULT_IMAGENET_STD
): Float32Array {
  const planeSize = width * height;
  const tensor = new Float32Array(3 * planeSize);

  const meanR = mean[0], meanG = mean[1], meanB = mean[2];
  const stdR = std[0], stdG = std[1], stdB = std[2];

  for (let i = 0, p = 0; p < planeSize; i += 4, p++) {
    const r = rgba[i] / 255.0;
    const g = rgba[i + 1] / 255.0;
    const b = rgba[i + 2] / 255.0;

    tensor[p] = (r - meanR) / stdR;
    tensor[planeSize + p] = (g - meanG) / stdG;
    tensor[2 * planeSize + p] = (b - meanB) / stdB;
  }

  return tensor;
}

/**
 * Extracts a center-square crop from image source and resizes to targetSize x targetSize.
 */
export function cropAndResizeToCanvas(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  targetSize: number
): { canvas: HTMLCanvasElement | OffscreenCanvas; ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D } {
  const cropSize = Math.min(sourceWidth, sourceHeight);
  const sx = Math.floor((sourceWidth - cropSize) / 2);
  const sy = Math.floor((sourceHeight - cropSize) / 2);

  let canvas: HTMLCanvasElement | OffscreenCanvas;
  let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;

  if (typeof OffscreenCanvas !== 'undefined') {
    canvas = new OffscreenCanvas(targetSize, targetSize);
    ctx = canvas.getContext('2d');
  } else if (typeof document !== 'undefined') {
    canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;
    ctx = canvas.getContext('2d');
  } else {
    throw new Error('Canvas rendering context unavailable in current environment');
  }

  if (!ctx) {
    throw new Error('Failed to acquire 2D canvas context for preprocessing');
  }

  // High-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw center-square crop scaled to targetSize
  ctx.drawImage(source, sx, sy, cropSize, cropSize, 0, 0, targetSize, targetSize);

  return { canvas, ctx };
}

/**
 * Preprocesses an ImageBitmap or Canvas into an NCHW Float32Array tensor.
 * Output tensor shape: [1, 3, targetSize, targetSize]
 */
export async function preprocessImage(
  source: ImageBitmap | HTMLCanvasElement | ImageData,
  config?: Partial<ModelConfig>
): Promise<Float32Array> {
  const targetSize = config?.inputSize ?? 224;
  const mean = config?.mean ?? DEFAULT_IMAGENET_MEAN;
  const std = config?.std ?? DEFAULT_IMAGENET_STD;

  if ('data' in source && 'width' in source && 'height' in source && !(source instanceof HTMLCanvasElement)) {
    // Direct ImageData input
    if (source.width === targetSize && source.height === targetSize) {
      return normalizePixelsToNCHW(source.data, targetSize, targetSize, mean, std);
    }
  }

  const width = (source as any).width;
  const height = (source as any).height;

  const { ctx } = cropAndResizeToCanvas(source as CanvasImageSource, width, height, targetSize);
  const imageData = ctx.getImageData(0, 0, targetSize, targetSize);

  return normalizePixelsToNCHW(imageData.data, targetSize, targetSize, mean, std);
}
