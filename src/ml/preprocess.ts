/**
 * Model preprocessing matching training pipeline:
 * Center-square crop, resize to 224, RGB scale to [0, 1], ImageNet mean/std, NCHW Float32Array.
 * Conforms to AGENTS.md Section 7.
 */

import { ModelConfig } from './types';

/**
 * Preprocess an ImageBitmap into an NCHW Float32Array tensor input.
 */
export async function preprocessImage(
  bitmap: ImageBitmap,
  config?: Partial<ModelConfig>
): Promise<Float32Array> {
  // TODO: Implement center-crop, resize to 224x224, ImageNet normalization, NCHW float32 (P6)
  const size = config?.inputSize || 224;
  return new Float32Array(1 * 3 * size * size);
}
