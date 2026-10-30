# AGENTS.md - AgriScan (HackOrbital 2026, Team 22, PS 11.1)

## 1. What we are building
AgriScan is an offline-first mobile web app (PWA) for farmers. A farmer photographs a crop leaf, fruit or pest, or picks a photo from the phone gallery. The app diagnoses disease or pest damage ON THE DEVICE with no internet, shows top-3 results with confidence, then shows a treatment plan (organic and chemical options, dose, cost, safety interval) in English, Tamil and Hindi with voice. Scans sync to a backend later and become a village-level outbreak map for agri officers.
Problem statement: PS 11.1 "Offline AI Crop Disease & Pest Detection Mobile Platform". Users: smallholder farmers with cheap Android phones, weak or no signal, possibly low literacy. Judges test three things: offline works, accuracy on REAL field photos, honesty about uncertainty.
The full image-processing design is in docs/IMAGE_PIPELINE.md. Read it before touching image code. If this file and that file disagree, ask the user.

## 2. Architecture (who owns what)
- Frontend: Next.js PWA, service worker caches app shell, model and wasm. IndexedDB (Dexie) for scan history and sync queue.
- On-device AI: ONNX int8 model run with onnxruntime-web (wasm) inside a Web Worker.
- Backend: FastAPI + PostgreSQL for sync and outbreak aggregation. Advisor (online only): CrewAI + RAG + MongoDB vector search. Owned by teammates, not by the image-processing owner.
- Treatment knowledge base: treatments.json keyed by class label. Owned by teammates.
- Image processing (THIS SECTION): owned by the user (Tharun). Everything from "camera or gallery" to "AnalyzeResult" is in scope for him.
- Local-first rule: the core flow (capture or upload -> quality check -> diagnose -> treatment) must never need the network.

## 3. The user's work: image processing scope
1. Capture from the mobile camera with a proper permission flow.
2. Upload from the gallery (file picker).
3. Both sources feed ONE ingest pipeline (same output, same checks).
4. Image quality analysis: blur and sharpness, brightness, contrast, noise, glare, leaf coverage. Output a QualityReport and plain-language hints.
5. Optional mild enhancement for borderline photos (see section 6). Severe problems mean "retake", never silent fixing.
6. Model inference in a Web Worker, temperature softmax, decision gate (confident / uncertain / unknown / poor_quality).
7. Extras after the core works: severity estimate, second-photo averaging, occlusion explain map, pest mode.

## 4. Capture rules (camera)
- Use navigator.mediaDevices.getUserMedia with video only: facingMode { ideal: "environment" }, width ideal 1280, height ideal 720, audio false. Works only on HTTPS or localhost.
- Show a short in-app explanation screen BEFORE calling getUserMedia ("AgriScan needs the camera to scan leaves. Photos stay on your phone"). Then request.
- Handle errors by name and show a clear message with a next step: NotAllowedError (permission denied: show how to enable it in browser/site settings and offer gallery upload), NotFoundError (no camera: gallery), NotReadableError (camera busy), OverconstrainedError (retry with relaxed constraints), SecurityError (not HTTPS).
- Video element needs playsInline and muted (iOS Safari). Stop all tracks when leaving the screen or after capture.
- Capture a frame by drawing the video to a canvas at the stream's native size, then createImageBitmap. Use ImageCapture.takePhoto only if supported, with the canvas path as fallback.
- Live preview: run the cheap quality check on a 160x160 downscale about 5 times per second and show hints. Never block the UI thread.
- Do not call Permissions API for camera as the only source of truth (Safari support is incomplete). Treat getUserMedia success or failure as authoritative.

## 5. Gallery rules
- Use <input type="file" accept="image/*">. Browsers show the system picker; there is NO separate web permission API for the gallery. Do not invent one. If the picker is cancelled, do nothing.
- Validate: image MIME type, file size under 20 MB, decodable. If HEIC/HEIF cannot be decoded in this browser, show "Please choose a JPG or PNG photo".
- Decode with createImageBitmap(file, { imageOrientation: "from-image" }) so EXIF rotation is applied. Downscale so the long side is at most 1280 px before analysis (phones produce 12 MP images).
- Optional second input with capture="environment" as a fallback when getUserMedia is unavailable.
- Camera frames and gallery files must go through the same function: ingest(source) -> ImageBitmap (oriented, downscaled). Everything after ingest is source-agnostic.

## 6. Quality analysis and enhancement rules
Computed on a grayscale 256-pixel version of the centre region plus the full frame. Thresholds live in web/src/ml/quality.config.json, never hard-coded.
- Blur / sharpness: variance of Laplacian (primary) and Tenengrad / Sobel gradient energy (secondary). Resolution-independent: always measure at a fixed analysis size.
- Motion vs focus blur hint: compare horizontal and vertical gradient energy; a strong imbalance suggests motion blur ("Hold steady").
- Brightness: mean luminance, fraction of near-black pixels, fraction of near-white pixels. Contrast: luminance standard deviation.
- Noise: simple estimator (for example Immerkaer) so night photos can be flagged.
- Glare: near-white, low-saturation blobs on the leaf.
- Leaf coverage: share of vegetation-coloured pixels in the centre area (rough hint only; soil can fool it).
- Result: QualityReport { blur, tenengrad, brightness, contrast, noise, glare, coverage, motionLikely, verdict: "pass" | "enhance" | "retake", hints: string[] }.
- Verdict logic: severe blur, severe darkness or glare, or very low coverage = retake. Borderline = enhance. Otherwise pass. The user can always choose "scan anyway".
Enhancement is allowed ONLY for borderline photos and must be mild and colour-safe, because lesion colour is diagnostic:
- Mild blur: unsharp mask (radius about 1 px, amount 0.5 to 1.0). Do not try to "fix" severe blur; ask for a retake. A model cannot recover lost detail.
- Dark or low contrast: gamma correction plus percentile (auto-levels) stretch applied to luminance only. Overexposed: gamma above 1.
- Do NOT boost saturation, shift hue or apply heavy denoising.
- Mark the result enhanced: true. Keep the original ImageBitmap too. Enhancement stays switchable (config flag) and must be proven to help on a blurred test set before it is enabled by default.
- Use small hand-written canvas/typed-array code first. Do not add OpenCV.js (large) unless the user approves.

## 7. Model and decision contract (do not break)
- Files: web/public/models/model_int8.onnx, labels.json, config.json. They are produced by Python in ml/. Never hand-edit, never reorder or rename classes.
- Preprocessing identical to training: centre-square crop, resize to 224, RGB, divide by 255, ImageNet mean/std, NCHW float32. The model outputs LOGITS.
- Softmax uses temperature T from config.json. Status rule: "unknown" if top class is unknown; "uncertain" if p1 < minConf or (p1 - p2) < minMargin or normalised entropy > maxEntropy; otherwise "confident". If the quality verdict is retake, status is "poor_quality" and inference is skipped unless the user chooses scan anyway.
- Inference runs in a Web Worker, ort.env.wasm.numThreads = 1, wasmPaths = "/ort/".
- Public result type (keep stable):
  AnalyzeResult { status: "confident"|"uncertain"|"unknown"|"poor_quality"; top3: {label,prob}[]; quality: QualityReport; enhanced: boolean; severity?: {pct, level}; needsSecondPhoto?: boolean; explainMap?: number[]; latencyMs: number }

## 8. Hard rules
- Never invent accuracy numbers or fake test results. Metrics come only from ml/src/evaluate.py on data/test_field.
- No network call may be added to the core flow. No cloud image uploads for inference. Photos stay on the device unless the user opts in to sync.
- Pin dependency versions. Before using a library API, check the installed version; if unsure, say so instead of guessing.
- Do not restructure the existing skeleton. First inspect the repo, then adapt to its folders and naming. Ask before deleting or moving files.
- Treatment text, KB, backend and dashboard code are other people's areas: do not change them except through the agreed label strings.
- Every UI state needs a message: permission prompt, denied, no camera, loading model, analysing, poor quality, uncertain, unknown, error. Mobile first (about 360 px wide), large tap targets, low-text UI.
- Accessibility: buttons have labels, hints are readable text (not colour only).

## 9. Workflow for the agent
- For any task touching more than 2 files, write a short plan first and wait for approval.
- After each task run the relevant test or script and show the real output. State clearly what you could NOT verify (for example real-phone behaviour).
- One task per commit with a clear message. Keep functions small, typed, and covered by unit tests where logic is pure (quality metrics, decide, preprocess).
- If requirements are ambiguous, make the smallest safe assumption, state it, and continue; do not stop to ask more than one question.

## 10. Layout (adapt to the real skeleton)
ml/ (Python: data, train, calibrate, export, evaluate)
web/src/ml/ (TypeScript: ingest.ts, camera.ts, gallery.ts, quality.ts, quality.config.json, enhance.ts, preprocess.ts, decide.ts, worker.ts, client.ts, severity.ts, explain.ts)
web/public/models/ and web/public/ort/ (model files and wasm, precached by the service worker)
docs/IMAGE_PIPELINE.md (full design). docs/PROMPTS.md (task prompts).

## 11. Definition of done for the image section
Camera and gallery both work on a real Android phone, including the denied-permission path. Blur, dark and glare photos are flagged with correct hints. Borderline photos are enhanced or retaken per config. The model runs offline (airplane mode) in under about 1 second per scan. Preprocessing parity test passes. Unit tests pass. A short manual test checklist is filled in.

## 12. Glossary
Disease: caused by fungi, bacteria or viruses (blight, rust, mildew). Pest: living organism that feeds on the crop (aphid, whitefly, caterpillar). Pesticide: product that controls pests or diseases. Fertiliser: nutrients for growth; a nutrient deficiency can look like disease. Unknown class: "not a plant or cannot tell". Honest AI: low confidence must say "consult an expert", never guess.
