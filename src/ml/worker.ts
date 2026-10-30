/**
 * Web Worker for running on-device ONNX runtime inference.
 * Conforms to AGENTS.md Section 7.
 */

import * as ort from 'onnxruntime-web';

// Configure WebAssembly execution per AGENTS.md Section 7
ort.env.wasm.numThreads = 1;
ort.env.wasm.wasmPaths = '/ort/';

export interface WorkerInferenceRequest {
  type: 'INFER';
  tensorData: Float32Array;
  dims: [number, number, number, number];
}

export interface WorkerInferenceResponse {
  type: 'INFER_SUCCESS' | 'INFER_ERROR';
  logits?: Float32Array;
  latencyMs?: number;
  error?: string;
}

// TODO: Implement model loading and inference handler inside Web Worker (P6)
self.onmessage = async (event: MessageEvent<WorkerInferenceRequest>) => {
  // TODO: Run session.run() and postMessage response
  console.log('[Worker] Message received:', event.data?.type);
};
