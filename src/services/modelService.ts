import * as tf from '@tensorflow/tfjs';

export interface ModelClassEntry {
  id: number;
  name: string;
  crop: string;
  kind: 'disease' | 'healthy' | 'pest';
}

export interface ModelLabelsConfig {
  input_size: number;
  input_range: string;
  resize: string;
  tfjs_loader: string;
  min_confidence: number;
  low_confidence_message: string;
  ui_notes: {
    pest: string;
    no_pest_classes_for: string[];
  };
  classes: ModelClassEntry[];
}

export interface ModelInferenceResult {
  class_id: number;
  class_name: string;
  crop: string;
  kind: 'disease' | 'healthy' | 'pest';
  confidence: number;
  inferenceTimeMs: number;
}

export class ModelService {
  private model: tf.GraphModel | null = null;
  private labelsConfig: ModelLabelsConfig | null = null;
  private loadPromise: Promise<void> | null = null;
  private loadTimeMs: number = 0;

  /**
   * Loads graph model and labels from local static assets (same-origin).
   * Lazy-loaded once and cached in memory.
   */
  public async loadModel(): Promise<void> {
    if (this.model && this.labelsConfig) {
      return;
    }
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = (async () => {
      const startTime = performance.now();
      try {
        // Ensure WebGL or CPU backend is ready
        await tf.ready();

        const modelUrl = '/models/tfjs_model/model.json';
        const labelsUrl = '/models/tfjs_model/labels.json';

        const [loadedModel, labelsResponse] = await Promise.all([
          tf.loadGraphModel(modelUrl),
          fetch(labelsUrl),
        ]);

        if (!labelsResponse.ok) {
          throw new Error(`Failed to fetch labels: HTTP ${labelsResponse.status}`);
        }

        this.model = loadedModel;
        this.labelsConfig = (await labelsResponse.json()) as ModelLabelsConfig;
        this.loadTimeMs = Math.round(performance.now() - startTime);

        console.log(`[ModelService] Model & labels loaded in ${this.loadTimeMs}ms (Backend: ${tf.getBackend()})`);
      } catch (err) {
        this.loadPromise = null;
        console.error('[ModelService] Failed to load model:', err);
        throw err;
      }
    })();

    return this.loadPromise;
  }

  /**
   * Warms up the model with a single dummy tensor of shape [1, 224, 224, 3]
   */
  public async warmup(): Promise<void> {
    await this.loadModel();
    if (!this.model) return;

    const start = performance.now();
    tf.tidy(() => {
      const dummy = tf.zeros([1, 224, 224, 3], 'float32');
      const out = this.model!.predict(dummy) as tf.Tensor;
      // Force evaluation of output tensor
      out.dataSync();
    });
    console.log(`[ModelService] Model warmup completed in ${Math.round(performance.now() - start)}ms`);
  }

  /**
   * Combined loader and warm up (used during idle callback)
   */
  public async loadAndWarmup(): Promise<{ loadTimeMs: number }> {
    await this.loadModel();
    await this.warmup();
    return { loadTimeMs: this.loadTimeMs };
  }

  public getLoadTimeMs(): number {
    return this.loadTimeMs;
  }

  public getLabelsConfig(): ModelLabelsConfig | null {
    return this.labelsConfig;
  }

  public isReady(): boolean {
    return Boolean(this.model && this.labelsConfig);
  }

  /**
   * Runs model inference on an image source:
   * 1. Converts image to float32 tensor via tf.browser.fromPixels().toFloat()
   * 2. Keeps raw 0-255 range (rescaling is handled inside the graph model)
   * 3. Resizes to 224x224 (no crop)
   * 4. Batches to [1, 224, 224, 3]
   * 5. Runs model.predict() -> [1, 22] softmax probabilities
   * 6. Cleanly disposes all created tensors
   */
  public async predict(
    imageSource: HTMLImageElement | HTMLCanvasElement | ImageBitmap | ImageData | string
  ): Promise<ModelInferenceResult> {
    await this.loadModel();

    if (!this.model || !this.labelsConfig) {
      throw new Error('Model is not initialized.');
    }

    // If source is a string URL / data URL, decode it to an HTMLImageElement
    let imageElement: HTMLImageElement | HTMLCanvasElement | ImageBitmap | ImageData;
    if (typeof imageSource === 'string') {
      imageElement = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image for model inference.'));
        img.src = imageSource;
      });
    } else {
      imageElement = imageSource;
    }

    const inferenceStart = performance.now();

    // Tensor execution with explicit disposal
    let inputTensor: tf.Tensor3D | null = null;
    let resizedTensor: tf.Tensor3D | null = null;
    let batchedTensor: tf.Tensor4D | null = null;
    let outputTensor: tf.Tensor | null = null;

    try {
      // 1. fromPixels and cast to float32, keeping raw 0-255 pixel range (NO division by 255)
      inputTensor = tf.browser.fromPixels(imageElement).toFloat();

      // 2. Resize to 224x224 with no crop
      resizedTensor = tf.image.resizeBilinear(inputTensor, [224, 224]);

      // 3. Expand batch dimension: [1, 224, 224, 3]
      batchedTensor = resizedTensor.expandDims(0);

      // 4. Model inference
      outputTensor = this.model.predict(batchedTensor) as tf.Tensor;

      // 5. Read softmax probabilities array
      const probabilities = await outputTensor.data();
      const inferenceTimeMs = Math.round(performance.now() - inferenceStart);

      // 6. Find argmax (predicted class index) and maximum probability (confidence)
      let maxConfidence = -1;
      let predictedIndex = 0;

      for (let i = 0; i < probabilities.length; i++) {
        if (probabilities[i] > maxConfidence) {
          maxConfidence = probabilities[i];
          predictedIndex = i;
        }
      }

      const classEntry = this.labelsConfig.classes[predictedIndex] || {
        id: predictedIndex,
        name: `class_${predictedIndex}`,
        crop: 'unknown',
        kind: 'disease' as const,
      };

      return {
        class_id: classEntry.id,
        class_name: classEntry.name,
        crop: classEntry.crop,
        kind: classEntry.kind,
        confidence: Number(maxConfidence.toFixed(4)),
        inferenceTimeMs,
      };
    } finally {
      // Clean up all GPU/CPU tensors
      if (inputTensor) inputTensor.dispose();
      if (resizedTensor) resizedTensor.dispose();
      if (batchedTensor) batchedTensor.dispose();
      if (outputTensor) outputTensor.dispose();
    }
  }
}

export const modelService = new ModelService();

/**
 * Automatically triggers model loading and warm-up during browser idle time
 * after the first online page load.
 */
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
