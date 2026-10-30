/**
 * Device gallery file picking, size/format validation, EXIF orientation decoding, and downscaling.
 * Conforms to AGENTS.md Section 5.
 */

export interface GalleryValidationResult {
  valid: boolean;
  error?: string;
  file?: File;
}

export interface DownscaleResult {
  width: number;
  height: number;
  scaled: boolean;
  scale: number;
}

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB per AGENTS.md Section 5
const DEFAULT_MAX_LONG_SIDE = 1280; // 1280 px per AGENTS.md Section 5

/**
 * Validates selected file MIME type and file size (< 20 MB).
 * Conforms to AGENTS.md Section 5.
 */
export function validateGalleryFile(file: File | null | undefined): GalleryValidationResult {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  // Size validation
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'Photo is too large (maximum allowed size is 20 MB).',
      file,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'Selected file is empty.',
      file,
    };
  }

  // Type validation: Accept image MIME or common image extensions
  const isImageMime = file.type ? file.type.startsWith('image/') : false;
  const fileName = file.name ? file.name.toLowerCase() : '';
  const hasImageExtension = /\.(jpg|jpeg|png|webp|heic|heif|bmp|avif)$/i.test(fileName);

  if (!isImageMime && !hasImageExtension) {
    return {
      valid: false,
      error: 'Please choose an image photo file (JPG, PNG, or WebP).',
      file,
    };
  }

  return {
    valid: true,
    file,
  };
}

/**
 * Pure function: calculates target dimensions such that the longest side is at most maxLongSide.
 * Preserves exact aspect ratio.
 */
export function calculateDownscaleDimensions(
  width: number,
  height: number,
  maxLongSide: number = DEFAULT_MAX_LONG_SIDE
): DownscaleResult {
  if (width <= 0 || height <= 0) {
    throw new Error(`Invalid dimensions: width=${width}, height=${height}`);
  }

  const currentLongSide = Math.max(width, height);

  if (currentLongSide <= maxLongSide) {
    return {
      width,
      height,
      scaled: false,
      scale: 1.0,
    };
  }

  const scale = maxLongSide / currentLongSide;
  const targetWidth = Math.round(width * scale);
  const targetHeight = Math.round(height * scale);

  return {
    width: targetWidth,
    height: targetHeight,
    scaled: true,
    scale,
  };
}

/**
 * Decodes a File into an ImageBitmap applying EXIF rotation metadata (`imageOrientation: "from-image"`).
 * Throws user-friendly error if decoding fails (e.g. unsupported HEIC).
 */
export async function decodeGalleryFile(file: File): Promise<ImageBitmap> {
  const validation = validateGalleryFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid photo file.');
  }

  try {
    // Try modern createImageBitmap with EXIF auto-rotation
    return await createImageBitmap(file, {
      imageOrientation: 'from-image',
    });
  } catch (err) {
    // Fallback without imageOrientation option
    try {
      return await createImageBitmap(file);
    } catch {
      // Decode completely failed - usually due to unsupported HEIC/HEIF on browser
      const isHeic = /\.(heic|heif)$/i.test(file.name);
      if (isHeic) {
        throw new Error('Please choose a JPG or PNG photo (HEIC format is not supported by your browser).');
      }
      throw new Error('Unable to read this photo file. Please choose a JPG or PNG photo.');
    }
  }
}
