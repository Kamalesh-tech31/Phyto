import * as tf from '@tensorflow/tfjs';
import {
  ClassMetadata,
  getClassMetadata,
  validateClassMappings,
} from './classMapping';

export type InferenceStatus = 'CONFIDENT' | 'AMBIGUOUS' | 'UNCERTAIN' | 'NOT_PLANT';

export interface ScoredPrediction {
  label: string;
  prob: number;
  classId: number;
  metadata: ClassMetadata;
}

export interface HardenedInferenceResult {
  status: InferenceStatus;
  top1: ScoredPrediction;
  top2?: ScoredPrediction;
  top3: ScoredPrediction[];
  inferenceMs: number;
  modelVersion: string;
}

export interface ModelConfig {
  input_size: number;
  confidence_threshold: number;
  ambiguity_threshold: number;
  reject_class: string;
  model_version: string;
}

/**
 * Preprocesses an image source to a [1, 224, 224, 3] float32 tensor:
 * 1. Read the image raw float32 pixels in 0-255 range (NO division by 255, NO mean subtraction)
 * 2. Subtract 127.5
 * 3. Resize keeping aspect ratio so the longer side = 224
 * 4. Pad the shorter side symmetrically with 0 (neutral grey after shift)
 * 5. Add 127.5 back
 * 6. expandDims(0)
 * Wrapped completely in tf.tidy() to prevent tensor leaks.
 */
export function preprocessImage(
  source: HTMLImageElement | HTMLCanvasElement | ImageBitmap | ImageData | tf.Tensor3D
): tf.Tensor4D {
  return tf.tidy(() => {
    // 1. Convert to float32 tensor [H, W, 3], range 0-255
    const rawTensor: tf.Tensor3D =
      source instanceof tf.Tensor
        ? (source.toFloat() as tf.Tensor3D)
        : (tf.browser.fromPixels(source).toFloat() as tf.Tensor3D);

    // 2. Subtract 127.5
    const shifted = tf.sub(rawTensor, 127.5) as tf.Tensor3D;

    // 3. Aspect-ratio preserving resize so longer side = 224
    const [h, w] = [rawTensor.shape[0], rawTensor.shape[1]];
    let targetH = 224;
    let targetW = 224;
    if (h >= w) {
      targetH = 224;
      targetW = Math.max(1, Math.round((w / h) * 224));
    } else {
      targetW = 224;
      targetH = Math.max(1, Math.round((h / w) * 224));
    }

    const resized = tf.image.resizeBilinear(shifted, [targetH, targetW]) as tf.Tensor3D;

    // 4. Pad shorter side symmetrically with 0 (neutral grey after shift)
    const padTop = Math.floor((224 - targetH) / 2);
    const padBottom = 224 - targetH - padTop;
    const padLeft = Math.floor((224 - targetW) / 2);
    const padRight = 224 - targetW - padLeft;

    const padded = tf.pad(
      resized,
      [
        [padTop, padBottom],
        [padLeft, padRight],
        [0, 0],
      ],
      0
    ) as tf.Tensor3D;

    // 5. Add 127.5 back
    const restored = tf.add(padded, 127.5);

    // 6. Expand batch dimension: [1, 224, 224, 3]
    return tf.expandDims(restored, 0) as tf.Tensor4D;
  });
}

/**
 * Extracts class labels from either a JSON array of strings/objects or an object with classes array.
 */
export function parseLabels(raw: any): string[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => (typeof item === 'string' ? item : item.name));
  }
  if (raw && Array.isArray(raw.classes)) {
    return raw.classes.map((item: any) => (typeof item === 'string' ? item : item.name));
  }
  throw new Error('Invalid labels.json format: expected an array or an object with a classes array.');
}

export class ModelService {
  private model: tf.GraphModel | null = null;
  private labels: string[] | null = null;
  private config: ModelConfig = {
    input_size: 224,
    confidence_threshold: 0.6,
    ambiguity_threshold: 0.15,
    reject_class: 'not_a_plant',
    model_version: 'mobilenet_v3_small_v1',
  };
  private loadPromise: Promise<void> | null = null;
  private loadTimeMs: number = 0;

  /**
   * Loads graph model, config, and labels from static assets.
   * Singleton pattern: loaded once and cached in memory.
   */
  public async loadModel(): Promise<void> {
    if (this.model && this.labels) {
      return;
    }
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = (async () => {
      const startTime = performance.now();
      try {
        await tf.ready();

        const modelUrl = '/models/tfjs_model/model.json';
        const labelsUrl = '/models/tfjs_model/labels.json';
        const configUrl = '/models/tfjs_model/config.json';

        const [loadedModel, labelsResponse, configResponse] = await Promise.all([
          tf.loadGraphModel(modelUrl),
          fetch(labelsUrl),
          fetch(configUrl).catch(() => null),
        ]);

        if (!labelsResponse.ok) {
          throw new Error(`Failed to fetch labels: HTTP ${labelsResponse.status}`);
        }

        const rawLabels = await labelsResponse.json();
        const parsedLabels = parseLabels(rawLabels);

        // Fail loudly at startup if any label lacks a mapping!
        validateClassMappings(parsedLabels);

        if (configResponse && configResponse.ok) {
          try {
            const configData = (await configResponse.json()) as ModelConfig;
            this.config = { ...this.config, ...configData };
          } catch (e) {
            console.warn('[ModelService] Using default config due to parse issue:', e);
          }
        }

        this.model = loadedModel;
        this.labels = parsedLabels;
        this.loadTimeMs = Math.round(performance.now() - startTime);

        console.log(
          `[ModelService] Model & ${this.labels.length} labels loaded in ${this.loadTimeMs}ms (Backend: ${tf.getBackend()})`
        );
      } catch (err) {
        this.loadPromise = null;
        console.error('[ModelService] Failed to load model:', err);
        throw err;
      }
    })();

    return this.loadPromise;
  }

  /**
   * Warms up the model with a dummy tensor of shape [1, 224, 224, 3]
   */
  public async warmup(): Promise<void> {
    await this.loadModel();
    if (!this.model) return;

    const start = performance.now();
    tf.tidy(() => {
      const dummy = tf.zeros([1, 224, 224, 3], 'float32');
      const out = this.model!.predict(dummy) as tf.Tensor;
      out.dataSync();
    });
    console.log(`[ModelService] Model warmup completed in ${Math.round(performance.now() - start)}ms`);
  }

  public async loadAndWarmup(): Promise<{ loadTimeMs: number }> {
    await this.loadModel();
    await this.warmup();
    return { loadTimeMs: this.loadTimeMs };
  }

  public getLoadTimeMs(): number {
    return this.loadTimeMs;
  }

  public getLabels(): string[] | null {
    return this.labels;
  }

  public getConfig(): ModelConfig {
    return this.config;
  }

  public isReady(): boolean {
    return Boolean(this.model && this.labels);
  }

  /**
   * Runs model inference on an image source:
   * Returns typed { status, top1, top2, top3, inferenceMs, modelVersion }
   */
  public async predict(
    imageSource: HTMLImageElement | HTMLCanvasElement | ImageBitmap | ImageData | tf.Tensor3D | string
  ): Promise<HardenedInferenceResult> {
    await this.loadModel();

    if (!this.model || !this.labels) {
      throw new Error('Model is not initialized.');
    }

    let source: HTMLImageElement | HTMLCanvasElement | ImageBitmap | ImageData | tf.Tensor3D;
    if (typeof imageSource === 'string') {
      source = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image for model inference.'));
        img.src = imageSource;
      });
    } else {
      source = imageSource;
    }

    const inferenceStart = performance.now();
    let preprocessed: tf.Tensor4D | null = null;
    let outputTensor: tf.Tensor | null = null;

    try {
      // 1. Aspect-ratio preserving letterbox preprocessing
      preprocessed = preprocessImage(source);

      // 2. Inference: model output is already softmax probabilities
      outputTensor = this.model.predict(preprocessed) as tf.Tensor;
      const probabilities = (await outputTensor.data()) as Float32Array;
      const inferenceMs = Math.round(performance.now() - inferenceStart);

      // 3. Build scored predictions from labels.json
      const scoredList: ScoredPrediction[] = [];
      const numOutputs = Math.min(probabilities.length, this.labels.length);

      for (let i = 0; i < numOutputs; i++) {
        const label = this.labels[i];
        const prob = Number(probabilities[i].toFixed(4));
        const metadata = getClassMetadata(label);
        scoredList.push({
          label,
          prob,
          classId: i,
          metadata,
        });
      }

      // Sort descending by probability
      scoredList.sort((a, b) => b.prob - a.prob);

      const top1 = scoredList[0];
      const top2 = scoredList[1];
      const top3 = scoredList.slice(0, 3);

      // 4. Decision logic:
      // - top1 == "not_a_plant" (or reject_class) -> NOT_PLANT
      // - top1.prob < confidence_threshold (0.60) -> UNCERTAIN
      // - top1.prob - top2.prob < ambiguity_threshold (0.15) -> AMBIGUOUS
      // - Otherwise -> CONFIDENT
      let status: InferenceStatus;
      if (top1.label === this.config.reject_class || top1.metadata.isReject) {
        status = 'NOT_PLANT';
      } else if (top1.prob < this.config.confidence_threshold) {
        status = 'UNCERTAIN';
      } else if (top2 && top1.prob - top2.prob < this.config.ambiguity_threshold) {
        status = 'AMBIGUOUS';
      } else {
        status = 'CONFIDENT';
      }

      return {
        status,
        top1,
        top2,
        top3,
        inferenceMs,
        modelVersion: this.config.model_version,
      };
    } finally {
      if (preprocessed) preprocessed.dispose();
      if (outputTensor) outputTensor.dispose();
    }
  }
}

export const modelService = new ModelService();

export function initModelWarmup(): void {
  if (typeof window === 'undefined') return;

  const trigger = () => {
    modelService.loadAndWarmup().catch((e) => {
      console.warn('[ModelService] Idle warm-up deferred or failed:', e);
    });
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(trigger, { timeout: 3500 });
  } else {
    setTimeout(trigger, 1500);
  }
}
