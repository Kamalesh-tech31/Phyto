/**
 * Device gallery file picking, size/format validation, EXIF orientation decoding, and downscaling.
 * Conforms to AGENTS.md Section 5.
 */

export interface GalleryValidationResult {
  valid: boolean;
  error?: string;
  file?: File;
}

/**
 * Validate selected file type, size (<20MB), and decodability.
 */
export function validateGalleryFile(file: File): GalleryValidationResult {
  // TODO: Implement file validation per AGENTS.md Section 5 (P3)
  if (file.size > 20 * 1024 * 1024) {
    return { valid: false, error: 'File size must be under 20 MB.' };
  }
  return { valid: true, file };
}

/**
 * Decode File into ImageBitmap with EXIF orientation preserved and downscaled to max 1280px long side.
 */
export async function decodeAndDownscaleFile(file: File, maxLongSide: number = 1280): Promise<ImageBitmap> {
  // TODO: Implement createImageBitmap with { imageOrientation: 'from-image' } and downscaling (P3)
  throw new Error('TODO: decodeAndDownscaleFile implementation pending');
}
