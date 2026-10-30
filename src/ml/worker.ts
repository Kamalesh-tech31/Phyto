/**
 * Web Worker for on-device ONNX runtime inference.
 *
 * Implements AGENTS.md Section 7:
 * - Runs onnxruntime-web with WebAssembly backend.
 * - ort.env.wasm.numThreads = 1 (single-threaded for maximum mobile device compatibility).
 * - ort.env.wasm.wasmPaths = '/ort/'.
 * - Loads model_int8.onnx and executes inference without blocking UI thread.
 */

import * as ort from 'onnxruntime-web';

// Configure ONNX Runtime WebAssembly environment
ort.env.wasm.numThreads = 1;
ort.env.wasm.wasmPaths = '/ort/';

let session: ort.InferenceSession | null = null;
let currentModelPath = '/models/model_int8.onnx';

self.onmessage = async (event: MessageEvent) => {
  const { id, type, payload } = event.data;

  try {
    if (type === 'INIT') {
      const modelPath = payload?.modelPath || currentModelPath;
      currentModelPath = modelPath;

      // Load model into WASM session
      session = await ort.InferenceSession.create(modelPath, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
      });

      self.postMessage({
        id,
        type: 'INIT_SUCCESS',
        inputNames: session.inputNames,
        outputNames: session.outputNames,
      });
      return;
    }

    if (type === 'INFER') {
      if (!session) {
        // Auto-initialize session if not already loaded
        session = await ort.InferenceSession.create(currentModelPath, {
          executionProviders: ['wasm'],
          graphOptimizationLevel: 'all',
        });
      }

      const { tensorData, dims } = payload as { tensorData: Float32Array; dims: number[] };
      const start = performance.now();

      const inputName = session.inputNames[0] || 'input';
      const tensor = new ort.Tensor('float32', tensorData, dims);
      const feeds: Record<string, ort.Tensor> = { [inputName]: tensor };

      const results = await session.run(feeds);
      const outputName = session.outputNames[0] || 'logits';
      const outputTensor = results[outputName];

      const logits = Array.from(outputTensor.data as Float32Array);
      const latencyMs = Math.round(performance.now() - start);

      self.postMessage({
        id,
        type: 'INFER_SUCCESS',
        logits,
        latencyMs,
      });
      return;
    }

    throw new Error(`Unknown message type: ${type}`);
  } catch (err: any) {
    self.postMessage({
      id,
      type: `${type}_ERROR`,
      error: err?.message || String(err),
    });
  }
};
