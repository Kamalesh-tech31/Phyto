import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateGalleryFile,
  calculateDownscaleDimensions,
} from '../gallery.js';

test('Gallery Validation - validates file size under 20 MB', () => {
  // Mock file within limit (5 MB)
  const validFile = {
    name: 'leaf_photo.jpg',
    size: 5 * 1024 * 1024,
    type: 'image/jpeg',
  } as unknown as File;

  const result = validateGalleryFile(validFile);
  assert.equal(result.valid, true);
  assert.equal(result.error, undefined);
});

test('Gallery Validation - rejects files exceeding 20 MB', () => {
  // Mock file exceeding limit (21 MB)
  const oversizedFile = {
    name: 'huge_scan.png',
    size: 21 * 1024 * 1024,
    type: 'image/png',
  } as unknown as File;

  const result = validateGalleryFile(oversizedFile);
  assert.equal(result.valid, false);
  assert.match(result.error || '', /20 MB/);
});

test('Gallery Validation - rejects non-image files', () => {
  const pdfFile = {
    name: 'report.pdf',
    size: 1024 * 1024,
    type: 'application/pdf',
  } as unknown as File;

  const result = validateGalleryFile(pdfFile);
  assert.equal(result.valid, false);
  assert.match(result.error || '', /image photo file/i);
});

test('Gallery Validation - accepts supported image extensions regardless of mime quirks', () => {
  const fileWithExt = {
    name: 'DSC_001.JPG',
    size: 1024 * 1024,
    type: '',
  } as unknown as File;

  const result = validateGalleryFile(fileWithExt);
  assert.equal(result.valid, true);
});

test('Downscale Math - scales down 12 MP landscape photo (4000x3000) to max 1280px', () => {
  const res = calculateDownscaleDimensions(4000, 3000, 1280);
  assert.equal(res.scaled, true);
  assert.equal(res.width, 1280);
  assert.equal(res.height, 960);
  assert.equal(res.scale, 1280 / 4000);
});

test('Downscale Math - scales down 12 MP portrait photo (3000x4000) to max 1280px', () => {
  const res = calculateDownscaleDimensions(3000, 4000, 1280);
  assert.equal(res.scaled, true);
  assert.equal(res.width, 960);
  assert.equal(res.height, 1280);
});

test('Downscale Math - scales down large square photo (2000x2000) to 1280x1280', () => {
  const res = calculateDownscaleDimensions(2000, 2000, 1280);
  assert.equal(res.scaled, true);
  assert.equal(res.width, 1280);
  assert.equal(res.height, 1280);
});

test('Downscale Math - leaves smaller images untouched', () => {
  const res = calculateDownscaleDimensions(800, 600, 1280);
  assert.equal(res.scaled, false);
  assert.equal(res.width, 800);
  assert.equal(res.height, 600);
  assert.equal(res.scale, 1.0);
});

test('Downscale Math - leaves images exactly at 1280 boundary untouched', () => {
  const res = calculateDownscaleDimensions(1280, 720, 1280);
  assert.equal(res.scaled, false);
  assert.equal(res.width, 1280);
  assert.equal(res.height, 720);
});

test('Downscale Math - throws on invalid non-positive dimensions', () => {
  assert.throws(() => calculateDownscaleDimensions(0, 100, 1280));
  assert.throws(() => calculateDownscaleDimensions(-10, 50, 1280));
});
