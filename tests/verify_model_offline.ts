import * as tf from '@tensorflow/tfjs';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { fileURLToPath } from 'url';
import { mapModelClassName } from '../src/services/classMappingAdapter';
import { restricted22Service } from '../src/services/restricted22Service';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runModelVerification() {
  console.log('====================================================');
  console.log('RUNNING VERIFICATION FOR OFFLINE TENSORFLOW.JS MODEL');
  console.log('====================================================\n');

  // 1. Verify static asset existence and byte sizes
  const modelDir = path.resolve(__dirname, '../public/models/tfjs_model');
  const modelJsonPath = path.join(modelDir, 'model.json');
  const weightsBinPath = path.join(modelDir, 'group1-shard1of1.bin');
  const labelsJsonPath = path.join(modelDir, 'labels.json');

  if (!fs.existsSync(modelJsonPath) || !fs.existsSync(weightsBinPath) || !fs.existsSync(labelsJsonPath)) {
    throw new Error('Model static assets missing in public/models/tfjs_model');
  }

  const modelJsonSize = fs.statSync(modelJsonPath).size;
  const weightsBinSize = fs.statSync(weightsBinPath).size;
  const labelsJsonSize = fs.statSync(labelsJsonPath).size;

  console.log(`[PASS] Static assets verified:`);
  console.log(`  - model.json: ${(modelJsonSize / 1024).toFixed(2)} KB (${modelJsonSize} bytes)`);
  console.log(`  - group1-shard1of1.bin: ${(weightsBinSize / (1024 * 1024)).toFixed(2)} MB (${weightsBinSize} bytes)`);
  console.log(`  - labels.json: ${(labelsJsonSize / 1024).toFixed(2)} KB (${labelsJsonSize} bytes)`);

  const labelsConfig = JSON.parse(fs.readFileSync(labelsJsonPath, 'utf8'));

  // Start a local static HTTP server to test offline browser-like loading
  const server = http.createServer((req, res) => {
    const cleanUrl = (req.url || '').split('?')[0];
    let filePath = '';
    if (cleanUrl.endsWith('model.json')) filePath = modelJsonPath;
    else if (cleanUrl.endsWith('group1-shard1of1.bin')) filePath = weightsBinPath;
    else if (cleanUrl.endsWith('labels.json')) filePath = labelsJsonPath;

    if (filePath && fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      const contentType = filePath.endsWith('.json') ? 'application/json' : 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stat.size,
        'Access-Control-Allow-Origin': '*',
      });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  await new Promise<void>((resolve) => server.listen(3099, '127.0.0.1', () => resolve()));
  console.log('[PASS] Local offline HTTP server started on http://127.0.0.1:3099');

  try {
    // 2. Measure Model Load Time
    console.log('\n--- Test 1: Offline Model Loading via HTTP ---');
    const modelHttpUrl = 'http://127.0.0.1:3099/model.json';
    const loadStart = performance.now();
    const model = await tf.loadGraphModel(modelHttpUrl);
    const loadTimeMs = Math.round(performance.now() - loadStart);
    console.log(`[PASS] Model loaded in ${loadTimeMs}ms (Backend: ${tf.getBackend()})`);

    // 3. Measure Model Warmup Time
    console.log('\n--- Test 2: Model Warmup ---');
    const warmupStart = performance.now();
    tf.tidy(() => {
      const dummy = tf.zeros([1, 224, 224, 3], 'float32');
      const out = model.predict(dummy) as tf.Tensor;
      out.dataSync();
    });
    const warmupTimeMs = Math.round(performance.now() - warmupStart);
    console.log(`[PASS] Warmup completed in ${warmupTimeMs}ms`);

    // 4. Measure Inference Time & Verify Output Shape
    console.log('\n--- Test 3: Inference Timing & Output Shape ---');
    const numRuns = 5;
    const inferenceTimes: number[] = [];

    for (let i = 0; i < numRuns; i++) {
      // Generate raw 0-255 RGB float32 dummy image
      const runStart = performance.now();
      const output = tf.tidy(() => {
        const rawImage = tf.randomUniform([1, 224, 224, 3], 0, 255, 'float32');
        const out = model.predict(rawImage) as tf.Tensor;
        return out.dataSync();
      });
      const runTime = Math.round(performance.now() - runStart);
      inferenceTimes.push(runTime);

      if (i === 0) {
        if (output.length !== 22) {
          throw new Error(`Expected output length 22, got ${output.length}`);
        }
        console.log(`[PASS] Output tensor shape verified: [1, ${output.length}] softmax distribution`);
      }
    }

    const avgInferenceTime = Math.round(inferenceTimes.reduce((a, b) => a + b, 0) / numRuns);
    console.log(`[PASS] Inference benchmark (${numRuns} runs):`);
    console.log(`  - Individual runs: ${inferenceTimes.join('ms, ')}ms`);
    console.log(`  - Average inference time: ${avgInferenceTime}ms`);

    // 5. Verify 22-Class Mapping from labels.json
    console.log('\n--- Test 4: 22-Class Adapter Mapping ---');
    const classes = labelsConfig.classes;
    if (!Array.isArray(classes) || classes.length !== 22) {
      throw new Error(`Expected 22 classes in labels.json, found ${classes?.length}`);
    }

    let mappedCount = 0;
    for (const entry of classes) {
      const mapping = mapModelClassName(entry.name);
      if (!mapping) {
        throw new Error(`Failed to map class: ${entry.name}`);
      }
      if (mapping.modelClassName !== entry.name) {
        throw new Error(`Mismatch in modelClassName: ${mapping.modelClassName} vs ${entry.name}`);
      }
      mappedCount++;
    }
    console.log(`[PASS] All ${mappedCount} model classes mapped cleanly without fallback.`);

    // 6. Verify Grape "Coming Soon" & 0 Schemes & No Fallback to Early Blight
    console.log('\n--- Test 5: Grape "Coming Soon" Isolation ---');
    const grapeClasses = ['grape_black_rot', 'grape_esca', 'grape_leaf_blight'];
    for (const gc of grapeClasses) {
      const mapping = mapModelClassName(gc);
      if (!mapping) throw new Error(`Missing mapping for ${gc}`);
      if (mapping.crop !== 'grape') throw new Error(`Grape class crop must be 'grape', got ${mapping.crop}`);
      if (mapping.status !== 'coming_soon') throw new Error(`Grape status must be 'coming_soon', got ${mapping.status}`);
      if (!mapping.grapeNotice) throw new Error(`Grape notice must be true for ${gc}`);

      // Verify 0 schemes evaluated (Never show fake schemes)
      const schemes = restricted22Service.evaluateSchemes({
        crop: mapping.crop,
        diseaseIdOrName: mapping.diseaseId,
        modelSeverity: 'severe',
        selectedState: 'TN',
      });
      if (schemes.totalCount !== 0) {
        throw new Error(`Grape must have 0 schemes, got ${schemes.totalCount}`);
      }
    }
    console.log(`[PASS] Grape classes strictly isolated to "coming soon" with 0 schemes.`);

    // 7. Verify Healthy Gating (0 Schemes)
    console.log('\n--- Test 6: Healthy Gating ---');
    const healthyClasses = ['corn_healthy', 'potato_healthy', 'tomato_healthy'];
    for (const hc of healthyClasses) {
      const mapping = mapModelClassName(hc);
      if (!mapping) throw new Error(`Missing mapping for ${hc}`);
      if (mapping.kind !== 'healthy' || mapping.status !== 'healthy') {
        throw new Error(`Expected kind 'healthy', got ${mapping.kind}`);
      }

      const schemes = restricted22Service.evaluateSchemes({
        crop: mapping.crop,
        diseaseIdOrName: mapping.diseaseId,
        modelSeverity: 'mild',
        selectedState: 'TN',
      });
      if (schemes.totalCount !== 0) {
        throw new Error(`Healthy crop must have 0 schemes, got ${schemes.totalCount}`);
      }
    }
    console.log(`[PASS] Healthy gating verified: 0 schemes for all healthy classes.`);

    // 8. Verify Pest Notice Flagging
    console.log('\n--- Test 7: Pest Notice Flagging ---');
    const pestClasses = [
      'pest_armyworm',
      'pest_asiatic_rice_borer',
      'pest_brown_planthopper',
      'pest_corn_borer',
      'pest_rice_leaf_roller',
    ];
    for (const pc of pestClasses) {
      const mapping = mapModelClassName(pc);
      if (!mapping) throw new Error(`Missing mapping for ${pc}`);
      if (mapping.kind !== 'pest' || mapping.status !== 'pest') {
        throw new Error(`Expected pest status, got ${mapping.status}`);
      }
      if (!mapping.pestNotice) {
        throw new Error(`pestNotice flag must be true for ${pc}`);
      }
    }
    console.log(`[PASS] All 5 pest classes correctly flagged with pestNotice.`);

    // 9. Verify Low Confidence Threshold (< 0.60)
    console.log('\n--- Test 8: Low Confidence Threshold (< 0.60) ---');
    const minConfidence = labelsConfig.min_confidence;
    if (minConfidence !== 0.6) {
      throw new Error(`Expected min_confidence 0.60 in labels.json, got ${minConfidence}`);
    }
    console.log(`[PASS] Minimum confidence gate confirmed at ${minConfidence * 100}% (${minConfidence}).`);

    // 10. Service Worker Precache Assets Verification
    console.log('\n--- Test 9: Service Worker Precache Configuration ---');
    const swContent = fs.readFileSync(path.resolve(__dirname, '../public/sw.js'), 'utf8');
    if (!swContent.includes('phyto-cache-v4')) {
      throw new Error('Service worker cache name must be bumped to phyto-cache-v4');
    }
    if (
      !swContent.includes('/models/tfjs_model/model.json') ||
      !swContent.includes('/models/tfjs_model/group1-shard1of1.bin') ||
      !swContent.includes('/models/tfjs_model/labels.json')
    ) {
      throw new Error('Service worker STATIC_ASSETS missing TF.js model files');
    }
    console.log(`[PASS] sw.js confirmed with phyto-cache-v4 and pre-cached model files.`);

    console.log('\n====================================================');
    console.log('ALL OFFLINE MODEL INTEGRATION VERIFICATIONS PASSED');
    console.log('====================================================');
  } finally {
    server.close();
  }
}

runModelVerification().catch((err) => {
  console.error('[FAIL]', err);
  process.exit(1);
});
