# AgriScan - Antigravity Prompts (image-processing section)

HOW TO USE
1. Put AGENTS.md in the project root and the earlier AgriScan_Image_Processing_Guide.md at docs/IMAGE_PIPELINE.md. Save this file as docs/PROMPTS.md.
2. Run prompts IN ORDER (P0 first). Use Planning mode for P2 to P8, Fast mode for small fixes. Approve the plan before the agent writes code.
3. One prompt per agent. In Manager view you may run P2+P3, then P4+P5 in parallel; they touch different files.
4. Commit before and after every prompt. Paste the agent's "Done when" output back to me if something fails.
5. Prompts reference the rules in AGENTS.md. If the agent ignores a rule, point it to the section number.

======================================================================
P0 - PROJECT UNDERSTANDING CHECK (do this first, no code changes)
======================================================================
Read AGENTS.md and docs/IMAGE_PIPELINE.md fully. Then inspect the repository structure without changing any file.
Reply with: (1) a 10-line summary of what AgriScan is and what the image-processing section must do; (2) the contract between Python and the browser (files, preprocessing, decision rule, AnalyzeResult); (3) a table mapping each module in AGENTS.md section 10 to the real folder or file in this repo (mark "missing" where nothing exists yet); (4) the framework, language (JS/TS), router type, package manager and build tooling you detected; (5) any conflict or unclear point you found. Do not write code.
Done when: I can read your summary and it matches my project.

======================================================================
P1 - SKELETON ADAPTATION PLAN
======================================================================
Task: prepare the repo for the image-processing modules without restructuring it.
Using the P0 mapping, create only the missing folders and empty typed module stubs under the real paths for: ingest, camera, gallery, quality (+ quality.config.json), enhance, preprocess, decide, worker, client. Each stub exports its function signature and a TODO. Add the AnalyzeResult and QualityReport types in one shared types file. Install onnxruntime-web with a pinned version and add a script that copies its wasm files into public/ort/.
Done when: the project builds and runs with the stubs, `git diff` shows only additions, and you list every file you created.

======================================================================
P2 - CAMERA CAPTURE WITH PERMISSION FLOW
======================================================================
Task: implement mobile camera capture exactly per AGENTS.md section 4.
Files: camera.ts (logic), a CameraCapture component (UI), ingest.ts entry point.
Requirements:
- A pre-permission screen explaining why the camera is needed, with "Allow camera" and "Upload from gallery instead" buttons.
- getUserMedia with rear camera preference (ideal environment), video only, 1280x720 ideal. playsInline and muted on the video element.
- Typed error handling for NotAllowedError, NotFoundError, NotReadableError, OverconstrainedError, SecurityError, each with a clear message and a next step. Denied state shows how to re-enable the camera in browser site settings.
- Capture button draws the current frame to a canvas and returns an ImageBitmap through ingest(). Stop all tracks on capture, on unmount and when the tab is hidden.
- A live preview hook that downsizes a frame to 160x160 about 5 times per second and calls an onFrame callback (quality will plug in later). Must not block the UI.
- Mobile-first layout (360 px), large capture button, flip/retake controls.
Done when: on a real Android phone over HTTPS (or localhost via USB reverse), allow, deny and no-camera paths all behave correctly, and a captured frame reaches ingest(). Write a short manual test checklist in docs/TESTING.md and list what you could not verify.

======================================================================
P3 - GALLERY UPLOAD AND UNIFIED INGEST
======================================================================
Task: implement gallery upload per AGENTS.md section 5 and finish the single ingest pipeline.
Files: gallery.ts, a GalleryPicker component, ingest.ts.
Requirements:
- <input type="file" accept="image/*"> triggered by a button. No fake permission prompt; the picker is the system UI. Handle cancel silently.
- Validate type and size (under 20 MB). Decode with createImageBitmap(file, { imageOrientation: "from-image" }). If decode fails (for example HEIC), show a friendly message.
- Downscale so the long side is at most 1280 px.
- ingest(source: MediaFrame | File): Promise<ImageBitmap> is the ONLY way images enter the pipeline. Unit tests for validation and downscale maths.
Done when: choosing a 12 MP photo returns an oriented, downscaled ImageBitmap, a rotated phone photo displays upright, and unit tests pass.

======================================================================
P4 - IMAGE QUALITY ANALYSIS (BLUR AND OTHER FACTORS)
======================================================================
Task: implement quality.ts per AGENTS.md section 6.
Requirements:
- analyzeQuality(bitmap or ImageData): QualityReport using: variance of Laplacian and Tenengrad at a fixed 256 px analysis size (centre region and full frame), motion-blur likelihood from horizontal vs vertical gradient energy, mean brightness, dark and bright pixel fractions, luminance contrast, a noise estimate, a glare fraction, and a rough leaf-coverage estimate.
- All thresholds in quality.config.json (pass/enhance/retake bands for each metric). Verdict logic as in AGENTS.md. Produce plain-language hints in English with keys so Tamil and Hindi strings can be added later (i18n-ready).
- A cheap variant for the 160x160 live preview.
- A debug page /debug/quality: pick or capture an image and show every raw metric, the verdict and hints, plus a "label this photo: sharp / blurry / dark / glare" control that stores labelled samples in memory and shows the metric values side by side so I can calibrate thresholds on my own phone.
- Pure functions with unit tests using synthetic images (a sharp checkerboard vs the same blurred, a dark vs bright gradient, a noisy vs clean image).
Done when: unit tests show the sharp image scores higher than its blurred copy at several blur levels, dark and bright images are flagged correctly, and the debug page runs on a phone.

======================================================================
P5 - MILD ENHANCEMENT FOR BORDERLINE PHOTOS
======================================================================
Task: implement enhance.ts per AGENTS.md section 6 and the verdict flow.
Requirements:
- enhance(bitmap, report): { bitmap: ImageBitmap, applied: string[] } using small hand-written typed-array code: unsharp mask for mild blur (radius about 1 px, amount 0.5 to 1.0 from config), and for dark or low-contrast photos a luminance-only percentile stretch plus gamma. No saturation or hue changes. No OpenCV.js.
- Only runs when verdict is "enhance". Severe blur, darkness or glare stays "retake". Keep the original bitmap alongside the enhanced one.
- A config flag enhancement.enabled (default false until validated) and enhancement.strength.
- A script ml/src/enhance_eval.py (or a TS test harness) that takes a folder of test photos, creates blurred and darkened copies, runs the model with and without enhancement, and prints top-1 for each case, so we only enable enhancement if it measurably helps.
Done when: unit tests show sharpness metric improves on a mildly blurred image and mean luminance moves toward the target on a dark image, colour channels are not saturated or shifted beyond a stated tolerance, and the evaluation script runs (report real numbers, or say it needs the trained model).

======================================================================
P6 - INFERENCE WORKER AND DECISION GATE
======================================================================
Task: implement preprocess.ts, decide.ts, worker.ts, client.ts per AGENTS.md section 7.
Requirements:
- Load model_int8.onnx, labels.json and config.json with onnxruntime-web (wasm, numThreads 1, wasmPaths /ort/) inside a Web Worker.
- preprocess: centre-square crop, resize 224, RGB, /255, mean/std from config, NCHW float32.
- decide: temperature softmax, top-3, normalised entropy, status rule exactly as in AGENTS.md. Pure function with unit tests (confident, low confidence, small margin, high entropy, unknown top class).
- client.ts: init(), analyze(bitmap, {mode}), analyzeMany(bitmaps[]) which averages probabilities across photos, returns AnalyzeResult including quality and enhanced flag. If quality verdict is retake, return status "poor_quality" without running the model unless scanAnyway is true.
- Until the real model exists, use a tiny placeholder ONNX model (generate one with a Python script in ml/) so the whole path can be tested. Label it clearly as a placeholder.
- A parity script (ml/src/parity.py + a browser test page) that runs 50 images through PyTorch/ONNX and the browser and prints the max logit difference and top-1 agreement.
Done when: unit tests for decide pass, a photo flows end to end in the browser with the placeholder model, and latency is logged. State that accuracy is NOT meaningful with the placeholder.

======================================================================
P7 - USER FLOW AND SCREENS
======================================================================
Task: connect everything in one mobile screen flow.
Flow: Home (Scan / Upload) -> permission screen (camera only) -> live camera with quality hints -> capture or pick -> quality verdict screen (pass: continue; enhance: "We improved the photo" with before/after toggle; retake: reason + Retake / Scan anyway) -> analysing state -> result screen showing top-3 with confidence bars, honest message for uncertain/unknown, and a slot where the treatment component (owned by a teammate) renders using the top label.
Requirements: every state in AGENTS.md section 8 has a visible message; large tap targets; works at 360 px; i18n keys for all strings (English now, Tamil and Hindi later); no blocking of the camera preview.
Done when: I can walk through all states on a phone using the placeholder model and a mocked treatment slot, and you give me a state diagram of the flow.

======================================================================
P8 - OFFLINE / PWA CACHING
======================================================================
Task: make the image pipeline work in airplane mode.
Requirements: precache /models/*, /ort/*.wasm, the app shell and the quality config in the service worker; cache version tied to a model version string in config.json; show "model ready for offline use" in the UI after the first load; gracefully handle the first visit without network (clear message).
Done when: after one online load, airplane mode still allows camera or gallery -> quality -> inference -> result, and you document the exact steps you used to verify it.

======================================================================
P9 - TESTS AND VERIFICATION
======================================================================
Task: add automated tests and a manual checklist.
Unit tests: quality metrics, verdict logic, enhance, decide, preprocess shape and value ranges, ingest validation. A fixtures folder with a few small synthetic images.
Manual checklist (docs/TESTING.md): camera allow / deny / no camera, gallery pick / cancel / HEIC / huge file / rotated photo, blur / dark / glare / good photo, airplane mode, low-end phone latency, offline reload.
Done when: `npm test` passes and the checklist exists. Report any test you could not run.

======================================================================
CHANGE-REQUEST TEMPLATES (use these later)
======================================================================
FEATURE: "Add <feature> to the image section. Read AGENTS.md first. Plan first. Files you may touch: <list>. Contract: <inputs/outputs, config keys>. Do not change labels.json, config.json structure or the AnalyzeResult fields (add optional fields only). Done when: <command and expected output>."

THRESHOLD CHANGE: "Change <metric> thresholds in quality.config.json only (no code change). Use the debug page values I paste below: sharp photos = <...>, blurry photos = <...>. Propose new bands and explain how many of my sample photos each band classifies correctly."

BUG FIX: "Bug: <what happens>, on <device/browser>. Expected: <...>. Reproduce first and show the failing output, find the root cause, apply the smallest fix, add a regression test, and tell me what you could not verify."

NEW FEATURE IDEAS (in priority order after core is done): severity estimate; second-photo averaging UI; occlusion "Explain" button; pest mode toggle; Tamil/Hindi hint strings; spoken hints (Web Speech API).
