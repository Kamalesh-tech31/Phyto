/**
 * Unified ingest entrypoint.
 * Converts camera frames, gallery files, or raw canvas sources into a standardized,
 * oriented, downscaled ImageBitmap (long side <= 1280px).
 */

export type IngestSource = File | Blob | HTMLVideoElement | HTMLCanvasElement | ImageBitmap;

/**
 * Ingest an image from camera or gallery and prepare it for analysis.
 * Single entry point ensuring uniform dimensions and orientation.
 */
export async function ingest(source: IngestSource): Promise<ImageBitmap> {
  // TODO: Implement unified ingest pipeline per AGENTS.md Section 5 (P3)
  if (source instanceof ImageBitmap) {
    return source;
  }
  throw new Error('TODO: ingest implementation pending');
}
