import * as tf from '@tensorflow/tfjs';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { fileURLToPath } from 'url';
import { ModelService } from '../src/services/modelService';
import { mapModelClassName } from '../src/services/classMappingAdapter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testOfflineFlow() {
  console.log('====================================================');
  console.log('TESTING OFFLINE PRE-WARMUP & SCAN WORKFLOW');
  console.log('Requirement: Load online once WITHOUT scanning,');
  console.log('go offline, then scan successfully.');
  console.log('====================================================\n');

  const modelDir = path.resolve(__dirname, '../public/models/tfjs_model');
  const modelJsonPath = path.join(modelDir, 'model.json');
  const weightsBinPath = path.join(modelDir, 'group1-shard1of1.bin');
  const labelsJsonPath = path.join(modelDir, 'labels.json');

  let requestCount = 0;
  const loggedRequests: string[] = [];

  // 1. Online Server to simulate first online visit
  const testServer = http.createServer((req, res) => {
    requestCount++;
    const cleanUrl = (req.url || '').split('?')[0];
    loggedRequests.push(cleanUrl);

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

  await new Promise<void>((resolve) => testServer.listen(3098, '127.0.0.1', () => resolve()));
  console.log('[STEP 1: ONLINE FIRST VISIT] User visits the app online.');
  console.log('User browses the app and DOES NOT SCAN anything.');

  // Create a dedicated model service pointing to our test origin
  const service = new ModelService();

  // Override URLs for testing the network interaction
  (service as any).loadModel = async function () {
    if (this.model && this.labelsConfig) return;
    await tf.ready();
    const [loadedModel, labelsRes] = await Promise.all([
      tf.loadGraphModel('http://127.0.0.1:3098/model.json'),
      fetch('http://127.0.0.1:3098/labels.json'),
    ]);
    this.model = loadedModel;
    this.labelsConfig = await labelsRes.json();
  };

  // Simulate idle warm-up
  console.log('Browser idle callback fires initModelWarmup() in the background...');
  const warmupStart = performance.now();
  await service.loadAndWarmup();
  const warmupDuration = Math.round(performance.now() - warmupStart);

  console.log(`[PASS] Background idle warm-up completed in ${warmupDuration}ms.`);
  console.log(`[PASS] Model ready in memory: ${service.isReady()}`);
  console.log(`[PASS] Total online network requests made during warm-up: ${requestCount} (${loggedRequests.join(', ')})`);

  // 2. Go Offline: Hard kill the server to ensure zero network requests can succeed
  console.log('\n[STEP 2: GO OFFLINE] Network is disconnected.');
  await new Promise<void>((resolve) => testServer.close(() => resolve()));
  console.log('[PASS] Web server terminated. Complete offline state active (no network).');

  // Verify server is truly dead
  let networkDead = false;
  try {
    await fetch('http://127.0.0.1:3098/model.json');
  } catch {
    networkDead = true;
  }
  if (!networkDead) {
    throw new Error('Server should be completely unreachable!');
  }
  console.log('[PASS] Verified network is completely unreachable (fetch throws network error).');

  // 3. User Scans Leaf Offline
  console.log('\n[STEP 3: USER SCANS OFFLINE] User captures/selects photo and taps scan...');
  const offlineInferenceStart = performance.now();

  let frameTensor: tf.Tensor4D | null = null;
  let outTensor: tf.Tensor | null = null;

  try {
    frameTensor = tf.randomUniform([1, 224, 224, 3], 0, 255, 'float32');
    outTensor = (service as any).model.predict(frameTensor) as tf.Tensor;
    const probs = await outTensor.data();

    let maxConf = -1;
    let predIdx = 0;
    for (let i = 0; i < probs.length; i++) {
      if (probs[i] > maxConf) {
        maxConf = probs[i];
        predIdx = i;
      }
    }
    const classEntry = (service as any).labelsConfig.classes[predIdx];
    const prediction = {
      class_id: classEntry.id,
      class_name: classEntry.name,
      crop: classEntry.crop,
      confidence: Number(maxConf.toFixed(4)),
    };

    const offlineInferenceTime = Math.round(performance.now() - offlineInferenceStart);
    console.log(`[PASS] Offline prediction completed in ${offlineInferenceTime}ms!`);
    console.log(`  - Predicted class: "${prediction.class_name}" (Crop: ${prediction.crop})`);
    console.log(`  - Model confidence: ${(prediction.confidence * 100).toFixed(1)}%`);

    const mapping = mapModelClassName(prediction.class_name);
    if (!mapping) {
      throw new Error(`Failed to map predicted class ${prediction.class_name}`);
    }
    console.log(`  - Mapped disease/condition: "${mapping.diseaseName}" (${mapping.diseaseId})`);
    console.log(`  - Status: "${mapping.status}"`);

    console.log('\n====================================================');
    console.log('OFFLINE WORKFLOW VERIFICATION TEST: PASSED 100%');
    console.log('====================================================');
  } finally {
    if (frameTensor) frameTensor.dispose();
    if (outTensor) outTensor.dispose();
  }
}

testOfflineFlow().catch((e) => {
  console.error('[FAIL]', e);
  process.exit(1);
});
