import * as tf from '@tensorflow/tfjs';
import * as fs from 'fs';
import * as path from 'path';
import { modelService, preprocessImage, HardenedInferenceResult } from '../src/services/modelService';

interface ParityTestCase {
  name: string;
  type: 'color' | 'synthetic';
  rgb: [number, number, number];
  height: number;
  width: number;
  expectedLabel: string;
  expectedProb: number;
  tolerance: number;
}

async function runParityAndMemoryTests() {
  console.log('====================================================');
  console.log(' PHYTO MODEL INFERENCE: PARITY & MEMORY LEAK TEST');
  console.log('====================================================\n');

  const projectRoot = process.cwd();
  const modelDir = path.resolve(projectRoot, 'public/models/tfjs_model');
  const testsDir = path.resolve(projectRoot, 'tests');

  // Custom fetch polyfill for node testing
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    const urlStr = url.toString();
    const cleanUrl = urlStr.split('?')[0];

    let filePath: string | null = null;
    if (cleanUrl.endsWith('model.json')) filePath = path.join(modelDir, 'model.json');
    else if (cleanUrl.endsWith('group1-shard1of1.bin')) filePath = path.join(modelDir, 'group1-shard1of1.bin');
    else if (cleanUrl.endsWith('labels.json')) filePath = path.join(modelDir, 'labels.json');
    else if (cleanUrl.endsWith('config.json')) filePath = path.join(modelDir, 'config.json');

    if (filePath && fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      return new Response(buffer, {
        status: 200,
        headers: { 'Content-Type': cleanUrl.endsWith('.json') ? 'application/json' : 'application/octet-stream' },
      });
    }

    if (originalFetch) return originalFetch(url, init);
    throw new Error(`File not found: ${urlStr}`);
  }) as any;

  // 1. Initialize model
  console.log('[1/3] Loading model and config...');
  await modelService.loadModel();
  await modelService.warmup();

  // 2. Parity Test Cases
  const parityPath = path.resolve(testsDir, 'parity_check.json');
  let testCases: ParityTestCase[];

  if (fs.existsSync(parityPath)) {
    testCases = JSON.parse(fs.readFileSync(parityPath, 'utf8'));
  } else {
    // Generate baseline cases
    testCases = [
      {
        name: 'Vibrant Green Leaf Foliage (400x300)',
        type: 'color',
        rgb: [20, 180, 20],
        height: 400,
        width: 300,
        expectedLabel: 'corn_healthy',
        expectedProb: 0.9996,
        tolerance: 0.03,
      },
      {
        name: 'Dry Brown Foliage (300x500)',
        type: 'color',
        rgb: [139, 69, 19],
        height: 300,
        width: 500,
        expectedLabel: 'tomato_early_blight',
        expectedProb: 0.9994,
        tolerance: 0.03,
      },
      {
        name: 'Dark Shadow Foliage (224x224)',
        type: 'color',
        rgb: [5, 25, 5],
        height: 224,
        width: 224,
        expectedLabel: 'tomato_early_blight',
        expectedProb: 0.8173,
        tolerance: 0.03,
      },
    ];
    fs.writeFileSync(parityPath, JSON.stringify(testCases, null, 2), 'utf8');
    console.log(`Created baseline parity test suite at ${parityPath}`);
  }

  console.log('\n[2/3] Running Numerical Parity Tests against baseline...');
  let allParityPassed = true;

  for (const tc of testCases) {
    const rawTensor = tf.tidy(() => {
      const r = tf.fill([tc.height, tc.width, 1], tc.rgb[0]);
      const g = tf.fill([tc.height, tc.width, 1], tc.rgb[1]);
      const b = tf.fill([tc.height, tc.width, 1], tc.rgb[2]);
      return tf.concat([r, g, b], 2).toFloat() as tf.Tensor3D;
    });

    const result: HardenedInferenceResult = await modelService.predict(rawTensor);
    rawTensor.dispose();

    const topLabelMatches = result.top1.label === tc.expectedLabel;
    const probDiff = Math.abs(result.top1.prob - tc.expectedProb);
    const probWithinTolerance = probDiff <= tc.tolerance;
    const pass = topLabelMatches && probWithinTolerance;

    if (!pass) allParityPassed = false;

    console.log(`\nTest Case: "${tc.name}"`);
    console.log(`  Predicted Label: ${result.top1.label} (Expected: ${tc.expectedLabel}) -> ${topLabelMatches ? 'MATCH' : 'MISMATCH'}`);
    console.log(`  Predicted Prob:  ${result.top1.prob.toFixed(4)} (Expected: ${tc.expectedProb.toFixed(4)}, Diff: ${probDiff.toFixed(4)}, Max Tol: ${tc.tolerance})`);
    console.log(`  Status:          ${result.status}`);
    console.log(`  Verdict:         ${pass ? 'PASS' : 'FAIL'}`);
  }

  // 3. Memory Leak Guard: 20 consecutive scans
  console.log('\n[3/3] Running Memory Leak Guard (20 consecutive scans)...');
  const initialTensors = tf.memory().numTensors;
  console.log(`  Initial tensor count: ${initialTensors}`);

  const testTensor = tf.tidy(() => {
    return tf.fill([224, 224, 3], 128, 'float32') as tf.Tensor3D;
  });

  for (let scan = 1; scan <= 20; scan++) {
    await modelService.predict(testTensor);
    const currentTensors = tf.memory().numTensors;
    if (scan % 5 === 0 || scan === 20) {
      console.log(`  After scan #${scan}: ${currentTensors} tensors in memory`);
    }
  }

  testTensor.dispose();
  const finalTensors = tf.memory().numTensors;
  console.log(`  Final tensor count: ${finalTensors}`);

  const memoryPassed = finalTensors === initialTensors;
  console.log(`  Memory Leak Verdict: ${memoryPassed ? 'PASS (0 tensors leaked across 20 scans)' : 'FAIL'}`);

  console.log('\n====================================================');
  if (allParityPassed && memoryPassed) {
    console.log(' ALL SUITES PASSED (PARITY: PASS | MEMORY: PASS)');
    console.log('====================================================\n');
    process.exit(0);
  } else {
    console.error(' SUITE FAILED (PARITY: ' + (allParityPassed ? 'PASS' : 'FAIL') + ' | MEMORY: ' + (memoryPassed ? 'PASS' : 'FAIL') + ')');
    console.log('====================================================\n');
    process.exit(1);
  }
}

runParityAndMemoryTests().catch((err) => {
  console.error('Parity test execution error:', err);
  process.exit(1);
});
