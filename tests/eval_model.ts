/**
 * Phyto Model Evaluation Suite
 * 
 * Reads a directory of labelled crop & pest images:
 *   eval_images/<model_class_name>/*.jpg (or .png, .jpeg)
 * 
 * Runs each image through:
 * 1. App Quality Check (evaluates whether image would be blocked before model execution)
 * 2. TensorFlow.js MobileNetV3 GraphModel with the EXACT same preprocessing as the app:
 *    - fromPixels().toFloat() [0-255 raw float32, no division by 255]
 *    - resizeBilinear([224, 224])
 *    - expandDims(0)
 * 
 * Produces:
 * - Markdown report: eval_results/eval_report.md
 * - CSV report: eval_results/eval_per_image.csv
 */

import * as tf from '@tensorflow/tfjs';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { fileURLToPath } from 'url';
// @ts-ignore
import jpeg from 'jpeg-js';
// @ts-ignore
import { PNG } from 'pngjs';

import defaultQualityConfig from '../src/ml/quality.config.json';
import {
  computeGrayscale,
  computeLaplacianVariance,
  computeTenengradAndMotion,
  computePhotometrics,
  computeImmerkaerNoise,
  computeGlareFraction,
  computeLeafCoverage,
  evaluateQualityVerdict,
} from '../src/ml/quality';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Polyfill browser ImageData for Node runtime
class NodeImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  constructor(data: Uint8ClampedArray | Uint8Array, width: number, height: number) {
    this.data =
      data instanceof Uint8ClampedArray
        ? data
        : new Uint8ClampedArray(data.buffer, data.byteOffset, data.length);
    this.width = width;
    this.height = height;
  }
}
// @ts-ignore
if (typeof globalThis.ImageData === 'undefined') {
  // @ts-ignore
  globalThis.ImageData = NodeImageData;
}

interface DecodedImage {
  width: number;
  height: number;
  data: Uint8ClampedArray; // RGBA
}

function decodeImageFile(filePath: string): DecodedImage {
  const buf = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.jpg' || ext === '.jpeg') {
    const raw = jpeg.decode(buf, { useTArray: true });
    return {
      width: raw.width,
      height: raw.height,
      data: new Uint8ClampedArray(raw.data.buffer, raw.data.byteOffset, raw.data.length),
    };
  } else if (ext === '.png') {
    const png = PNG.sync.read(buf);
    return {
      width: png.width,
      height: png.height,
      data: new Uint8ClampedArray(png.data.buffer, png.data.byteOffset, png.data.length),
    };
  } else {
    try {
      const raw = jpeg.decode(buf, { useTArray: true });
      return {
        width: raw.width,
        height: raw.height,
        data: new Uint8ClampedArray(raw.data.buffer, raw.data.byteOffset, raw.data.length),
      };
    } catch {
      const png = PNG.sync.read(buf);
      return {
        width: png.width,
        height: png.height,
        data: new Uint8ClampedArray(png.data.buffer, png.data.byteOffset, png.data.length),
      };
    }
  }
}

interface TopKPrediction {
  classIndex: number;
  className: string;
  probability: number;
}

interface PerImageResult {
  imagePath: string;
  fileName: string;
  trueClass: string;
  predictedClass: string;
  confidence: number;
  isCorrectTop1: boolean;
  isCorrectTop3: boolean;
  top3: TopKPrediction[];
  // Quality check details
  isBlockedByQuality: boolean;
  qualityVerdict: string;
  blurScore: number;
  tenengradScore: number;
  brightnessScore: number;
  coverageScore: number;
  blockedReasons: string[];
}

async function runEvaluation() {
  console.log('====================================================');
  console.log('PHYTO ON-DEVICE MODEL EVALUATION & BENCHMARK SUITE');
  console.log('====================================================\n');

  // Parse custom directory arguments
  const args = process.argv.slice(2);
  const customEvalDir = args.find((a) => !a.startsWith('--'));
  const isDemoRequested = args.includes('--demo') || args.includes('--synthetic');

  const projectRoot = path.resolve(__dirname, '..');
  const evalDir = customEvalDir
    ? path.resolve(process.cwd(), customEvalDir)
    : path.resolve(projectRoot, 'eval_images');
  const outDir = path.resolve(projectRoot, 'eval_results');

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Load Labels & Class Catalog
  const labelsJsonPath = path.resolve(projectRoot, 'public/models/tfjs_model/labels.json');
  if (!fs.existsSync(labelsJsonPath)) {
    throw new Error(`labels.json not found at ${labelsJsonPath}`);
  }
  const labelsConfig = JSON.parse(fs.readFileSync(labelsJsonPath, 'utf8'));
  const modelClasses: Array<{ id: number; name: string; crop: string }> = labelsConfig.classes;
  const classNamesList: string[] = modelClasses.map((c) => c.name);

  console.log(`Loaded ${modelClasses.length} class definitions from labels.json`);

  // 2. Discover Images in eval_images/<model_class_name>/*.jpg
  interface ImageItem {
    filePath: string;
    fileName: string;
    trueClass: string;
  }
  const imageItems: ImageItem[] = [];

  if (fs.existsSync(evalDir)) {
    const entries = fs.readdirSync(evalDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const className = entry.name.trim();
        const classFolder = path.join(evalDir, entry.name);
        const files = fs.readdirSync(classFolder);

        for (const file of files) {
          const ext = path.extname(file).toLowerCase();
          if (['.jpg', '.jpeg', '.png', '.webp', '.bmp'].includes(ext)) {
            imageItems.push({
              filePath: path.join(classFolder, file),
              fileName: file,
              trueClass: className,
            });
          }
        }
      }
    }
  }

  // If no images found, create synthetic evaluation samples to test the pipeline cleanly
  if (imageItems.length === 0) {
    console.log(`[INFO] No labelled evaluation images found in: ${evalDir}`);
    console.log(`Expected folder structure: ${evalDir}/<model_class_name>/*.jpg\n`);

    if (isDemoRequested || !fs.existsSync(evalDir)) {
      console.log(`[INFO] Generating synthetic verification suite to test evaluation pipeline...`);
      const sampleClasses = [
        'tomato_early_blight',
        'tomato_late_blight',
        'tomato_healthy',
        'potato_early_blight',
        'pest_armyworm',
      ];

      for (const cls of sampleClasses) {
        const demoFolder = path.join(evalDir, cls);
        if (!fs.existsSync(demoFolder)) fs.mkdirSync(demoFolder, { recursive: true });

        // Create 2 demo synthetic JPEGs per sample class
        for (let i = 1; i <= 2; i++) {
          const demoFilePath = path.join(demoFolder, `sample_${i}.jpg`);
          if (!fs.existsSync(demoFilePath)) {
            // Generate simple gradient leaf dummy image
            const width = 256;
            const height = 256;
            const buf = Buffer.alloc(width * height * 4);
            for (let y = 0; y < height; y++) {
              for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                buf[idx] = (x * y) % 200; // R
                buf[idx + 1] = 120 + ((x + y) % 100); // G (Greenish)
                buf[idx + 2] = (x + y) % 90; // B
                buf[idx + 3] = 255;
              }
            }
            const encoded = jpeg.encode({ data: buf, width, height }, 80);
            fs.writeFileSync(demoFilePath, encoded.data);
          }
          imageItems.push({
            filePath: demoFilePath,
            fileName: `sample_${i}.jpg`,
            trueClass: cls,
          });
        }
      }
      console.log(`[PASS] Created ${imageItems.length} test images across ${sampleClasses.length} classes for verification.\n`);
    } else {
      console.log(`To run evaluation, place image files in ${evalDir}/<model_class_name>/*.jpg and re-run.`);
      return;
    }
  }

  console.log(`Found ${imageItems.length} images to evaluate across categories.\n`);

  // 3. Start local offline HTTP server (exact same setup as verify_offline_flow)
  const modelDir = path.resolve(projectRoot, 'public/models/tfjs_model');
  const modelJsonPath = path.join(modelDir, 'model.json');
  const weightsBinPath = path.join(modelDir, 'group1-shard1of1.bin');

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

  const serverPort = 3096;
  await new Promise<void>((resolve) => server.listen(serverPort, '127.0.0.1', () => resolve()));

  let model: tf.GraphModel;
  try {
    const modelUrl = `http://127.0.0.1:${serverPort}/model.json`;
    console.log(`Loading TensorFlow.js GraphModel from ${modelUrl}...`);
    model = await tf.loadGraphModel(modelUrl);

    // Warm-up pass
    tf.tidy(() => {
      const dummy = tf.zeros([1, 224, 224, 3], 'float32');
      const out = model.predict(dummy) as tf.Tensor;
      out.dataSync();
    });
    console.log(`Model successfully warmed up and ready for inference.\n`);
  } catch (err) {
    server.close();
    throw err;
  }

  // 4. Process Each Image
  console.log('--- Running Image Inference & Quality Pre-Screening ---');
  const results: PerImageResult[] = [];
  let processed = 0;

  for (const item of imageItems) {
    processed++;
    process.stdout.write(`Evaluating [${processed}/${imageItems.length}] ${item.trueClass}/${item.fileName}\r`);

    let decoded: DecodedImage;
    try {
      decoded = decodeImageFile(item.filePath);
    } catch (e: any) {
      console.warn(`\n[WARN] Failed to decode ${item.filePath}: ${e.message}`);
      continue;
    }

    // A. Quality Check Screening (before model runs)
    // Downscale / prepare 256x256 buffer for standard quality analysis
    let qualityTensor4D: tf.Tensor3D | null = null;
    let resizedQualityTensor: tf.Tensor3D | null = null;
    let buffer256: Uint8ClampedArray;

    try {
      qualityTensor4D = tf.tensor3d(decoded.data as any, [decoded.height, decoded.width, 4], 'int32');
      resizedQualityTensor = tf.image.resizeBilinear(qualityTensor4D, [256, 256]);
      buffer256 = new Uint8ClampedArray(await resizedQualityTensor.data() as any);
    } finally {
      if (qualityTensor4D) qualityTensor4D.dispose();
      if (resizedQualityTensor) resizedQualityTensor.dispose();
    }

    const gray = computeGrayscale(buffer256, 256, 256);
    const blur = computeLaplacianVariance(gray, 256, 256);
    const { tenengrad, motionLikely } = computeTenengradAndMotion(
      gray,
      256,
      256,
      defaultQualityConfig.motionRatioThreshold
    );
    const { brightness, contrast, darkFraction, brightFraction } = computePhotometrics(
      gray,
      256,
      256
    );
    const noise = computeImmerkaerNoise(gray, 256, 256);
    const glare = computeGlareFraction(gray as any, 256, 256);
    const coverage = computeLeafCoverage(buffer256, 256, 256);

    const qualityReport = {
      blur,
      tenengrad,
      motionLikely,
      brightness,
      contrast,
      noise,
      glare,
      coverage,
      darkFraction,
      brightFraction,
      verdict: 'pass' as const,
      hints: [] as string[],
    };

    const verdictResult = evaluateQualityVerdict(qualityReport, defaultQualityConfig as any);

    const isBlurry =
      blur < defaultQualityConfig.blur.retakeThreshold ||
      tenengrad < defaultQualityConfig.tenengrad.retakeThreshold ||
      motionLikely;
    const isDim = brightness < defaultQualityConfig.brightness.minLuminance;
    const isBright = brightness > defaultQualityConfig.brightness.maxLuminance;
    const hasHeavyShadow = darkFraction > defaultQualityConfig.brightness.maxDarkFraction;
    const isLowCoverage = coverage < defaultQualityConfig.coverage.minCoverage;

    const sharpnessPass = !isBlurry;
    const isAcceptable = sharpnessPass && verdictResult.verdict !== 'retake';
    const isBlockedByQuality = !isAcceptable || !sharpnessPass;

    const blockedReasons: string[] = [];
    if (isBlurry) blockedReasons.push(motionLikely ? 'Motion blur' : 'Blurry');
    if (isDim) blockedReasons.push('Dim lighting');
    if (isBright) blockedReasons.push('Overexposed');
    if (hasHeavyShadow) blockedReasons.push('Heavy shadow');
    if (isLowCoverage) blockedReasons.push('Low coverage');
    if (glare > defaultQualityConfig.glare.maxGlareFraction) blockedReasons.push('Glare');

    // B. Model Inference (Exact same preprocessing as the app)
    // 1. fromPixels().toFloat() [0-255 raw float32]
    // 2. resizeBilinear([224, 224])
    // 3. expandDims(0)
    let inputTensor: tf.Tensor3D | null = null;
    let resizedTensor: tf.Tensor3D | null = null;
    let batchedTensor: tf.Tensor4D | null = null;
    let outputTensor: tf.Tensor | null = null;
    let probabilities: Float32Array;

    try {
      const imgObj = new NodeImageData(decoded.data, decoded.width, decoded.height);
      inputTensor = tf.browser.fromPixels(imgObj as any).toFloat();
      resizedTensor = tf.image.resizeBilinear(inputTensor, [224, 224]);
      batchedTensor = resizedTensor.expandDims(0);
      outputTensor = model.predict(batchedTensor) as tf.Tensor;
      probabilities = (await outputTensor.data()) as Float32Array;
    } finally {
      if (inputTensor) inputTensor.dispose();
      if (resizedTensor) resizedTensor.dispose();
      if (batchedTensor) batchedTensor.dispose();
      if (outputTensor) outputTensor.dispose();
    }

    // Sort predictions descending
    const indexedProbs: TopKPrediction[] = Array.from(probabilities).map((p, idx) => ({
      classIndex: idx,
      className: classNamesList[idx] || `class_${idx}`,
      probability: Number(p.toFixed(4)),
    }));
    indexedProbs.sort((a, b) => b.probability - a.probability);

    const top1 = indexedProbs[0];
    const top3 = indexedProbs.slice(0, 3);

    const isCorrectTop1 = top1.className === item.trueClass;
    const isCorrectTop3 = top3.some((t) => t.className === item.trueClass);

    results.push({
      imagePath: item.filePath,
      fileName: item.fileName,
      trueClass: item.trueClass,
      predictedClass: top1.className,
      confidence: top1.probability,
      isCorrectTop1,
      isCorrectTop3,
      top3,
      isBlockedByQuality,
      qualityVerdict: verdictResult.verdict,
      blurScore: Math.round(blur),
      tenengradScore: Math.round(tenengrad),
      brightnessScore: Math.round(brightness),
      coverageScore: Number(coverage.toFixed(3)),
      blockedReasons,
    });
  }

  server.close();
  console.log(`\nCompleted evaluation for ${results.length} images.\n`);

  // 5. Compute Aggregate Metrics
  const total = results.length;
  const correctTop1 = results.filter((r) => r.isCorrectTop1).length;
  const correctTop3 = results.filter((r) => r.isCorrectTop3).length;
  const top1Acc = total > 0 ? (correctTop1 / total) * 100 : 0;
  const top3Acc = total > 0 ? (correctTop3 / total) * 100 : 0;

  const correctPredictions = results.filter((r) => r.isCorrectTop1);
  const wrongPredictions = results.filter((r) => !r.isCorrectTop1);

  const avgConfCorrect =
    correctPredictions.length > 0
      ? correctPredictions.reduce((acc, r) => acc + r.confidence, 0) / correctPredictions.length
      : 0;
  const avgConfWrong =
    wrongPredictions.length > 0
      ? wrongPredictions.reduce((acc, r) => acc + r.confidence, 0) / wrongPredictions.length
      : 0;

  const wrongWithConfGte60 = wrongPredictions.filter((r) => r.confidence >= 0.6).length;
  const wrongWithConfGte85 = wrongPredictions.filter((r) => r.confidence >= 0.85).length;

  const blockedByQuality = results.filter((r) => r.isBlockedByQuality).length;
  const blockedByQualityPct = total > 0 ? (blockedByQuality / total) * 100 : 0;

  // Per-Class Metrics
  const uniqueTrueClasses = Array.from(new Set(results.map((r) => r.trueClass))).sort();
  interface ClassStats {
    className: string;
    total: number;
    correctTop1: number;
    accuracyTop1: number;
    correctTop3: number;
    accuracyTop3: number;
    avgConfidence: number;
  }
  const perClassStats: ClassStats[] = [];

  for (const cls of uniqueTrueClasses) {
    const classResults = results.filter((r) => r.trueClass === cls);
    const cTotal = classResults.length;
    const cCorrectTop1 = classResults.filter((r) => r.isCorrectTop1).length;
    const cCorrectTop3 = classResults.filter((r) => r.isCorrectTop3).length;
    const cAvgConf = classResults.reduce((acc, r) => acc + r.confidence, 0) / cTotal;

    perClassStats.push({
      className: cls,
      total: cTotal,
      correctTop1: cCorrectTop1,
      accuracyTop1: cTotal > 0 ? (cCorrectTop1 / cTotal) * 100 : 0,
      correctTop3: cCorrectTop3,
      accuracyTop3: cTotal > 0 ? (cCorrectTop3 / cTotal) * 100 : 0,
      avgConfidence: cAvgConf,
    });
  }

  // 22x22 Confusion Matrix
  // Map class name to index in modelClasses
  const confusionMatrix: number[][] = Array.from({ length: 22 }, () => Array(22).fill(0));
  const classNameToIndex = new Map<string, number>();
  classNamesList.forEach((name, idx) => classNameToIndex.set(name, idx));

  for (const r of results) {
    const trueIdx = classNameToIndex.get(r.trueClass);
    const predIdx = classNameToIndex.get(r.predictedClass);
    if (trueIdx !== undefined && predIdx !== undefined) {
      confusionMatrix[trueIdx][predIdx]++;
    }
  }

  // Extract Non-Zero Confusions
  interface ConfusionEntry {
    trueClass: string;
    predictedClass: string;
    count: number;
    isDiagonal: boolean;
  }
  const nonZeroConfusions: ConfusionEntry[] = [];
  for (let i = 0; i < 22; i++) {
    for (let j = 0; j < 22; j++) {
      if (confusionMatrix[i][j] > 0) {
        nonZeroConfusions.push({
          trueClass: classNamesList[i],
          predictedClass: classNamesList[j],
          count: confusionMatrix[i][j],
          isDiagonal: i === j,
        });
      }
    }
  }
  const misclassifications = nonZeroConfusions.filter((c) => !c.isDiagonal);

  // 6. Write CSV Report
  const csvPath = path.join(outDir, 'eval_per_image.csv');
  const csvHeaders = [
    'image_path',
    'file_name',
    'true_class',
    'predicted_class',
    'confidence',
    'is_correct_top1',
    'is_correct_top3',
    'top1_class',
    'top1_prob',
    'top2_class',
    'top2_prob',
    'top3_class',
    'top3_prob',
    'blocked_by_quality_check',
    'quality_verdict',
    'blur_score',
    'tenengrad_score',
    'brightness_score',
    'blocked_reasons',
  ];

  const csvRows = [csvHeaders.join(',')];
  for (const r of results) {
    const row = [
      `"${r.imagePath.replace(/\\/g, '/')}"`,
      `"${r.fileName}"`,
      `"${r.trueClass}"`,
      `"${r.predictedClass}"`,
      r.confidence.toFixed(4),
      r.isCorrectTop1 ? '1' : '0',
      r.isCorrectTop3 ? '1' : '0',
      `"${r.top3[0]?.className || ''}"`,
      (r.top3[0]?.probability || 0).toFixed(4),
      `"${r.top3[1]?.className || ''}"`,
      (r.top3[1]?.probability || 0).toFixed(4),
      `"${r.top3[2]?.className || ''}"`,
      (r.top3[2]?.probability || 0).toFixed(4),
      r.isBlockedByQuality ? '1' : '0',
      `"${r.qualityVerdict}"`,
      r.blurScore,
      r.tenengradScore,
      r.brightnessScore,
      `"${r.blockedReasons.join('; ')}"`,
    ];
    csvRows.push(row.join(','));
  }
  fs.writeFileSync(csvPath, csvRows.join('\n'), 'utf8');
  console.log(`[PASS] CSV report written to: ${csvPath}`);

  // 7. Write Markdown Report
  const mdPath = path.join(outDir, 'eval_report.md');
  const mdContent = `# Phyto On-Device Model Evaluation Report

**Generated on:** ${new Date().toISOString()}  
**Target Architecture:** MobileNetV3-Small (TensorFlow.js GraphModel, float16 weights)  
**Evaluation Set:** \`${evalDir}\`  
**Total Images Evaluated:** **${total}**

---

## 1. Executive Summary

| Metric | Measured Value | Target / Benchmark |
| :--- | :--- | :--- |
| **Overall Top-1 Accuracy** | **${top1Acc.toFixed(2)}%** (${correctTop1}/${total}) | Primary Classifier Target |
| **Overall Top-3 Accuracy** | **${top3Acc.toFixed(2)}%** (${correctTop3}/${total}) | Top-3 Candidate Availability |
| **Average Confidence (Correct)** | **${(avgConfCorrect * 100).toFixed(2)}%** | Healthy/Correct Model Confidence |
| **Average Confidence (Wrong)** | **${(avgConfWrong * 100).toFixed(2)}%** | Separation from Correct Confidence |
| **Wrong Predictions with Confidence ≥ 0.60** | **${wrongWithConfGte60}** | Bypass Confidence Retake Gate |
| **Wrong Predictions with Confidence ≥ 0.85** | **${wrongWithConfGte85}** | High Confidence False Alarms |
| **Images Blocked by Quality Check** | **${blockedByQuality}** (${blockedByQualityPct.toFixed(2)}%) | Screened BEFORE Model Execution |

---

## 2. Quality Gate Screening (Before Model Runs)

The app evaluates on-device neural edge quality (\`analyzeQuality\`) before executing model inference.
If an image fails sharpness or returns a retake verdict, the model inference is prevented and the farmer is advised to retake the photo.

- **Total Images Screened:** ${total}
- **Passed Quality Gate:** ${total - blockedByQuality} (${(100 - blockedByQualityPct).toFixed(2)}%)
- **Blocked Before Model:** ${blockedByQuality} (${blockedByQualityPct.toFixed(2)}%)

${
  blockedByQuality > 0
    ? `### Quality Failure Breakdown:\n` +
      Array.from(
        new Set(
          results.flatMap((r) => r.blockedReasons)
        )
      )
        .map(
          (reason) =>
            `- **${reason}**: ${
              results.filter((r) => r.blockedReasons.includes(reason)).length
            } images`
        )
        .join('\n')
    : `*All evaluated images passed the quality check.*`
}

---

## 3. Per-Class Accuracy

| Class Name | Total Samples | Top-1 Correct | Top-1 Accuracy | Top-3 Correct | Top-3 Accuracy | Avg Confidence |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
${perClassStats
  .map(
    (c) =>
      `| \`${c.className}\` | ${c.total} | ${c.correctTop1} | ${c.accuracyTop1.toFixed(1)}% | ${c.correctTop3} | ${c.accuracyTop3.toFixed(1)}% | ${(c.avgConfidence * 100).toFixed(1)}% |`
  )
  .join('\n')}

---

## 4. Confusion Matrix (22 × 22)

### Non-Zero Confusions (Misclassifications Only)
${
  misclassifications.length > 0
    ? misclassifications
        .map(
          (m) =>
            `- **True:** \`${m.trueClass}\` ➔ **Predicted:** \`${m.predictedClass}\` (Count: **${m.count}**)`
        )
        .join('\n')
    : `*Zero misclassifications observed across all evaluated classes.*`
}

### Correct Predictions (Diagonal Entries)
${nonZeroConfusions
  .filter((c) => c.isDiagonal)
  .map((c) => `- \`${c.trueClass}\`: **${c.count}** correct`)
  .join('\n')}

---

## 5. Confidence Band Definition & Affected Leaf Area Methodology

### A. Confidence Bands (File & Thresholds)
- **File:** \`src/services/predictionService.ts\` (Lines 321–375) and \`public/models/tfjs_model/labels.json\` (Lines 6–7)
- **Low Confidence Band (< 0.60)**:
  - If \`inference.confidence < 0.60\`, the app triggers the inconclusive / uncertain state.
  - Gated by \`min_confidence: 0.60\` from \`labels.json\`.
  - Displays localized notice: *"Not sure. Please retake the photo in good light."* (\`t('not_sure_retake')\`).
- **Medium Confidence Band (0.60 ≤ Confidence < 0.85)**:
  - \`confidence = 'medium'\`.
  - Allows result display with 2-bar confidence indicator.
- **High Confidence Band (Confidence ≥ 0.85)**:
  - \`confidence = 'high'\`.
  - Displays green high-confidence pill and 3-bar confidence indicator.

### B. Affected Leaf Area Calculation (File & Method)
- **File:** \`src/services/predictionService.ts\` (Lines 377–395)
- **Method:**
  - **Healthy classes** (\`*_healthy\`): \`0%\` affected leaf area, \`mild\` severity.
  - **Pest detections** (\`pest_*\`): \`15%\` affected area, \`moderate\` severity (localized foliage damage).
  - **Late blight** (\`*_late_blight\`): \`42%\` affected area, \`severe\` severity (water-soaked rapid necrosis).
  - **Other disease classes**: Default baseline \`20%\` affected area, \`mild\` severity.
  - **Reference Demo Presets**: Curated deterministic baselines matching agronomic UI designs (Early blight: 18%, Late blight: 42%, Healthy: 0%).

---
`;

  fs.writeFileSync(mdPath, mdContent, 'utf8');
  console.log(`[PASS] Markdown report written to: ${mdPath}\n`);

  // 8. Output Terminal Summary
  console.log('====================================================');
  console.log('EVALUATION COMPLETE - SUMMARY REPORT');
  console.log('====================================================');
  console.log(`Total Samples:           ${total}`);
  console.log(`Top-1 Accuracy:          ${top1Acc.toFixed(2)}% (${correctTop1}/${total})`);
  console.log(`Top-3 Accuracy:          ${top3Acc.toFixed(2)}% (${correctTop3}/${total})`);
  console.log(`Avg Conf (Correct):      ${(avgConfCorrect * 100).toFixed(2)}%`);
  console.log(`Avg Conf (Wrong):        ${(avgConfWrong * 100).toFixed(2)}%`);
  console.log(`Wrong with Conf >= 0.60: ${wrongWithConfGte60}`);
  console.log(`Wrong with Conf >= 0.85: ${wrongWithConfGte85}`);
  console.log(`Blocked by Quality Check:${blockedByQuality} (${blockedByQualityPct.toFixed(2)}%)`);
  console.log('====================================================\n');
}

runEvaluation().catch((err) => {
  console.error('[EVALUATION ERROR]', err);
  process.exit(1);
});
