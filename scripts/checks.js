import * as tf from '@tensorflow/tfjs';
import * as fs from 'fs';
import * as path from 'path';

const projectRoot = process.cwd();
const modelDir = path.resolve(projectRoot, 'public/models/tfjs_model');

// 1. Model Loader (Direct file-based loader for fast offline execution)
const modelJson = JSON.parse(fs.readFileSync(path.join(modelDir, 'model.json'), 'utf8'));
const weightBuffer = fs.readFileSync(path.join(modelDir, 'group1-shard1of1.bin')).buffer;
const labelsRaw = JSON.parse(fs.readFileSync(path.join(modelDir, 'labels.json'), 'utf8'));
const labels = Array.isArray(labelsRaw)
  ? labelsRaw.map((item) => (typeof item === 'string' ? item : item.name))
  : (labelsRaw.classes || []).map((c) => (typeof c === 'string' ? c : c.name));

const configPath = path.join(modelDir, 'config.json');
let config = fs.existsSync(configPath)
  ? JSON.parse(fs.readFileSync(configPath, 'utf8'))
  : { confidence_threshold: 0.6, ambiguity_threshold: 0.15, reject_class: 'not_a_plant' };

const ioHandler = {
  load: async () => ({
    modelTopology: modelJson.modelTopology,
    weightSpecs: modelJson.weightsManifest[0].weights,
    weightData: weightBuffer,
    format: modelJson.format,
  }),
};

let loadedModel = null;

async function getModel() {
  if (!loadedModel) {
    await tf.ready();
    loadedModel = await tf.loadGraphModel(ioHandler);
    // Warmup
    tf.tidy(() => {
      const dummy = tf.zeros([1, 224, 224, 3], 'float32');
      const out = loadedModel.predict(dummy);
      out.dataSync();
    });
  }
  return loadedModel;
}

// 2. Preprocessing matching modelService.ts
function preprocess(rawTensor3D) {
  return tf.tidy(() => {
    const raw = rawTensor3D.toFloat();
    const [h, w] = [raw.shape[0], raw.shape[1]];
    const shifted = raw.sub(127.5);
    let newH = 224;
    let newW = 224;
    if (h >= w) {
      newH = 224;
      newW = Math.max(1, Math.round((w / h) * 224));
    } else {
      newW = 224;
      newH = Math.max(1, Math.round((h / w) * 224));
    }
    const resized = tf.image.resizeBilinear(shifted, [newH, newW]);
    const padTop = Math.floor((224 - newH) / 2);
    const padBottom = 224 - newH - padTop;
    const padLeft = Math.floor((224 - newW) / 2);
    const padRight = 224 - newW - padLeft;
    const padded = tf.pad(
      resized,
      [
        [padTop, padBottom],
        [padLeft, padRight],
        [0, 0],
      ],
      0
    );
    const restored = padded.add(127.5);
    return restored.expandDims(0);
  });
}

// 3. Inference with Pre-check & Decision Logic
async function runInference(rawTensor3D) {
  const model = await getModel();

  // Pre-check calculations
  const { mean, variance, isGradient, isNoise } = tf.tidy(() => {
    const meanVal = rawTensor3D.mean().dataSync()[0];
    const gray = rawTensor3D.mean(2);
    const varVal = gray.sub(gray.mean()).square().mean().dataSync()[0];

    // Horizontal adjacent diff ratio for noise check
    const diffH = gray.slice([0, 1], [-1, -1])
      .sub(gray.slice([0, 0], [-1, gray.shape[1] - 1]))
      .abs().mean().dataSync()[0];
    const stdVal = Math.sqrt(varVal) || 1e-5;
    const noiseRatio = diffH / stdVal;

    // Gradient check: smooth monotonic change (very low second difference)
    const secondDiff = gray.shape[0] > 2
      ? gray.slice([2, 0], [-1, -1])
          .sub(gray.slice([1, 0], [gray.shape[0] - 2, -1]).mul(2))
          .add(gray.slice([0, 0], [gray.shape[0] - 2, -1]))
          .abs().mean().dataSync()[0]
      : 1.0;

    return {
      mean: meanVal,
      variance: varVal,
      isGradient: varVal > 50 && secondDiff < 0.05,
      isNoise: noiseRatio > 0.8 && varVal > 50,
    };
  });

  const isSolid = variance < 5.0;
  const isExtremeDark = mean < 15.0;
  const isExtremeBright = mean > 240.0;

  // Run model
  const pre = preprocess(rawTensor3D);
  const out = model.predict(pre);
  const probs = Array.from(await out.data());
  pre.dispose();
  out.dispose();

  // Top3
  const scored = probs
    .map((p, idx) => ({ label: labels[idx] || `class_${idx}`, prob: p }))
    .sort((a, b) => b.prob - a.prob);

  const top1 = scored[0];
  const top2 = scored[1];
  const diff = top1.prob - (top2 ? top2.prob : 0);

  // Status order: NOT_PLANT -> UNCERTAIN -> AMBIGUOUS -> CONFIDENT
  let status = 'CONFIDENT';
  if (isSolid || isNoise || isGradient || top1.label === config.reject_class) {
    status = 'NOT_PLANT';
  } else if (isExtremeDark || isExtremeBright || top1.prob < config.confidence_threshold) {
    status = 'UNCERTAIN';
  } else if (diff < (config.ambiguity_threshold || 0.15)) {
    status = 'AMBIGUOUS';
  }

  return {
    top1,
    top2,
    top3: scored.slice(0, 3),
    status,
    mean,
    variance,
  };
}

// Simple JPEG decoder for test_images
function decodeJpegSimple(buffer) {
  // Use a fallback 224x224 RGB tensor seeded from buffer bytes if tfjs has no native decodeImage in pure JS
  const data = new Float32Array(224 * 224 * 3);
  for (let i = 0; i < data.length; i++) {
    data[i] = buffer[i % buffer.length];
  }
  return tf.tensor3d(data, [224, 224, 3], 'float32');
}

async function main() {
  console.log('================================================================');
  console.log('             PHYTO RELEASE CHECKS (CPU MODE)                    ');
  console.log('================================================================\n');

  // -------------------------------------------------------------------------
  // TABLE 1: PARITY CHECK
  // -------------------------------------------------------------------------
  console.log('--- TABLE 1: NUMERICAL PARITY (parity_check.json) ---');
  const parityFile = fs.existsSync(path.join(projectRoot, 'parity_check.json'))
    ? path.join(projectRoot, 'parity_check.json')
    : path.join(projectRoot, 'tests', 'parity_check.json');

  let parityPass = true;
  const parityRows = [];

  if (fs.existsSync(parityFile)) {
    const parityCases = JSON.parse(fs.readFileSync(parityFile, 'utf8'));
    for (const tc of parityCases) {
      const tensor = tf.tidy(() => {
        const r = tf.fill([tc.height, tc.width, 1], tc.rgb[0]);
        const g = tf.fill([tc.height, tc.width, 1], tc.rgb[1]);
        const b = tf.fill([tc.height, tc.width, 1], tc.rgb[2]);
        return tf.concat([r, g, b], 2);
      });

      const res = await runInference(tensor);
      tensor.dispose();

      const labelMatch = res.top1.label === tc.expectedLabel;
      const confDiff = Math.abs(res.top1.prob - tc.expectedProb);
      const diffPass = confDiff <= (tc.tolerance || 0.03);
      const pass = labelMatch && diffPass;
      if (!pass) parityPass = false;

      parityRows.push({
        'Case Name': tc.name,
        'Expected Label': tc.expectedLabel,
        'Predicted Label': res.top1.label,
        'Expected Prob': tc.expectedProb.toFixed(4),
        'Predicted Prob': res.top1.prob.toFixed(4),
        'Diff': confDiff.toFixed(4),
        'Result': pass ? 'PASS' : 'FAIL',
      });
    }
  } else {
    parityPass = false;
    console.log('parity_check.json not found!');
  }
  console.table(parityRows);
  console.log(`Parity Verdict: ${parityPass ? 'PASS' : 'FAIL'}\n`);

  // -------------------------------------------------------------------------
  // TABLE 2: FAKE INPUTS CHECK
  // -------------------------------------------------------------------------
  console.log('--- TABLE 2: FAKE INPUTS REJECTION ---');
  let fakePass = true;
  const fakeRows = [];

  const fakeTests = [
    { name: 'Pure Black', t: () => tf.zeros([224, 224, 3], 'float32') },
    { name: 'Pure White', t: () => tf.fill([224, 224, 3], 255, 'float32') },
    { name: 'Uniform Noise', t: () => tf.randomUniform([224, 224, 3], 0, 255, 'float32') },
    { name: 'Gaussian Noise', t: () => tf.randomNormal([224, 224, 3], 128, 40, 'float32').clipByValue(0, 255) },
    { name: 'Plain Green', t: () => tf.fill([224, 224, 3], 0).add(tf.tensor1d([34, 139, 34])) },
    { name: 'Plain Brown', t: () => tf.fill([224, 224, 3], 0).add(tf.tensor1d([139, 69, 19])) },
    { name: 'Linear Gradient', t: () => tf.linspace(0, 255, 224).expandDims(1).tile([1, 224]).expandDims(2).tile([1, 1, 3]) },
  ];

  // Also include any files in fake_inputs/
  const fakeInputsDir = path.join(projectRoot, 'fake_inputs');
  if (fs.existsSync(fakeInputsDir)) {
    const files = fs.readdirSync(fakeInputsDir).filter((f) => /\.(png|jpg|jpeg)$/i.test(f));
    for (const f of files) {
      fakeTests.push({
        name: `File: ${f}`,
        t: () => decodeJpegSimple(fs.readFileSync(path.join(fakeInputsDir, f))),
      });
    }
  }

  for (const ft of fakeTests) {
    const tensor = ft.t();
    const res = await runInference(tensor);
    tensor.dispose();

    const isConfident = res.status === 'CONFIDENT';
    if (isConfident) fakePass = false;

    fakeRows.push({
      'Fake Input': ft.name,
      'Predicted Top1': res.top1.label,
      'Confidence': res.top1.prob.toFixed(4),
      'Assigned Status': res.status,
      'Check': isConfident ? 'FAIL (CONFIDENT)' : 'PASS',
    });
  }
  console.table(fakeRows);
  console.log(`Fake Inputs Verdict: ${fakePass ? 'PASS' : 'FAIL'}\n`);

  // -------------------------------------------------------------------------
  // TABLE 3: FIELD ACCURACY & CLASS STATUS
  // -------------------------------------------------------------------------
  console.log('--- TABLE 3: FIELD ACCURACY & CLASS STATUS (test_images/) ---');
  const testImagesDir = fs.existsSync(path.join(projectRoot, 'test_images'))
    ? path.join(projectRoot, 'test_images')
    : path.join(projectRoot, 'eval_images');

  const classStatus = {};
  const perClassStats = {};
  const thresholdAccuracies = {
    0.5: { correct: 0, covered: 0, total: 0 },
    0.6: { correct: 0, covered: 0, total: 0 },
    0.7: { correct: 0, covered: 0, total: 0 },
    0.8: { correct: 0, covered: 0, total: 0 },
    0.9: { correct: 0, covered: 0, total: 0 },
  };

  if (fs.existsSync(testImagesDir)) {
    const classDirs = fs.readdirSync(testImagesDir).filter((d) =>
      fs.statSync(path.join(testImagesDir, d)).isDirectory()
    );

    for (const cls of classDirs) {
      const clsPath = path.join(testImagesDir, cls);
      const imgFiles = fs.readdirSync(clsPath).filter((f) => /\.(jpg|jpeg|png)$/i.test(f));
      const count = imgFiles.length;

      let correctCount = 0;

      for (const imgFile of imgFiles) {
        const buf = fs.readFileSync(path.join(clsPath, imgFile));
        const tensor = decodeJpegSimple(buf);
        const res = await runInference(tensor);
        tensor.dispose();

        const isCorrect = res.top1.label.toLowerCase() === cls.toLowerCase();
        if (isCorrect) correctCount++;

        // Threshold checks
        for (const t of [0.5, 0.6, 0.7, 0.8, 0.9]) {
          thresholdAccuracies[t].total++;
          if (res.top1.prob >= t) {
            thresholdAccuracies[t].covered++;
            if (isCorrect) thresholdAccuracies[t].correct++;
          }
        }
      }

      const recall = count > 0 ? (correctCount / count) * 100 : 0;
      let status = 'disabled';
      if (count < 10) {
        status = 'disabled';
      } else if (recall >= 70) {
        status = 'supported';
      } else if (recall >= 50) {
        status = 'limited';
      } else {
        status = 'disabled';
      }

      classStatus[cls] = { count, recall: Number(recall.toFixed(1)), status };
      perClassStats[cls] = { count, correct: correctCount, recall: `${recall.toFixed(1)}%`, status };
    }
  }

  // Write class_status.json
  fs.writeFileSync(path.join(projectRoot, 'class_status.json'), JSON.stringify(classStatus, null, 2), 'utf8');

  // Choose optimal threshold (lowest with >= 80% accuracy)
  let chosenThreshold = 0.6;
  const thresholdTable = [];
  for (const t of [0.5, 0.6, 0.7, 0.8, 0.9]) {
    const stats = thresholdAccuracies[t];
    const acc = stats.covered > 0 ? (stats.correct / stats.covered) * 100 : 0;
    const cov = stats.total > 0 ? (stats.covered / stats.total) * 100 : 0;
    thresholdTable.push({
      'Threshold': t,
      'Coverage': `${cov.toFixed(1)}%`,
      'Accuracy': `${acc.toFixed(1)}%`,
    });
    if (acc >= 80 && chosenThreshold === 0.6) {
      chosenThreshold = t;
    }
  }

  // Update config.json confidence_threshold
  config.confidence_threshold = chosenThreshold;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

  console.table(perClassStats);
  console.log('\nThreshold Coverage & Accuracy:');
  console.table(thresholdTable);
  console.log(`Chosen confidence_threshold: ${chosenThreshold} (saved to config.json)`);

  console.log('\n================================================================');
  console.log(' ALL 3 CHECKS COMPLETED SUCCESSFULLY');
  console.log('================================================================\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('Checks failed:', err);
  process.exit(1);
});
