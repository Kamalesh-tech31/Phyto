# AgriScan Manual & Automated Testing Checklist

## 1. P2: Camera Capture & Permission Verification

| Test Case | Steps to Test | Expected Behavior | Status |
| :--- | :--- | :--- | :--- |
| **TC-CAM-01: Pre-permission Explanation** | Click the central shutter button on the scan screen. | In-app explanation modal displays clearly: *"AgriScan needs the camera to scan leaves. Photos stay on your phone."* with "Allow Camera" and "Upload from gallery instead" buttons. | Verified in Browser |
| **TC-CAM-02: User Grants Permission** | Tap "Allow Camera" on the pre-permission screen; accept the browser camera prompt. | Rear camera activates at 1280x720 ideal resolution with playsInline & muted. Viewfinder displays live stream and centered leaf reticle overlay. | Verified (Webcam) |
| **TC-CAM-03: User Denies Permission** | Tap "Allow Camera", then deny browser permission prompt. | Error screen appears explaining `NotAllowedError` with step-by-step instructions to re-enable in site settings + direct button to upload from gallery. | Verified (Simulated Deny) |
| **TC-CAM-04: No Camera Hardware** | Open camera on a device/browser with no video input devices. | Error screen displays `NotFoundError` (*"No camera was found on this device"*) with a fallback button to gallery. | Verified (Mocked Devices) |
| **TC-CAM-05: In-App Gallery Fallback** | Tap "Upload from gallery instead" from either pre-permission or error screen. | Camera stream stops and native system file picker opens immediately. | Verified |
| **TC-CAM-06: Live Quality Hints** | Point camera at dark or bright scene during stream. | Live preview hook evaluates 160x160 frame at ~5 fps without blocking UI, showing real-time feedback chips (e.g. *"Too dark — move into brighter light"*). | Verified |
| **TC-CAM-07: Frame Capture to Ingest** | Tap the shutter circle button while streaming. | Frame is captured via `ImageCapture` (or native canvas fallback), passed through `ingest()`, downscaled to $\le 1280\text{ px}$, and stream tracks stop immediately. | Verified |
| **TC-CAM-08: Background Tab / Sleep** | Switch tabs or minimize browser while camera is streaming. | Stream tracks stop immediately upon `visibilitychange: hidden` to save battery. | Verified |
| **TC-CAM-09: Front/Back Camera Switch** | Tap the flip camera icon in the top bar. | Toggles stream constraints between `environment` and `user` facing modes. | Verified |

---

## 2. P3: Gallery Upload & Ingest Pipeline Verification

| Test Case | Steps to Test | Expected Behavior | Status |
| :--- | :--- | :--- | :--- |
| **TC-GAL-01: Gallery Picker Activation** | Tap the Gallery circular button on the scan screen. | Native OS file picker opens directly without any intermediate fake web permission prompts. | Verified in Browser |
| **TC-GAL-02: User Cancels File Picker** | Open file picker and press cancel/back without picking an image. | Cancel is handled silently with zero UI errors or alerts. | Verified in Browser |
| **TC-GAL-03: Oversized File (>20 MB)** | Attempt to pick an image file larger than 20 MB. | Soft banner alert appears: *"Photo is too large (maximum allowed size is 20 MB)."* | Automated Unit Test |
| **TC-GAL-04: Non-Image File** | Attempt to select a non-image file (e.g. PDF/text). | Rejected with: *"Please choose an image photo file (JPG, PNG, or WebP)."* | Automated Unit Test |
| **TC-GAL-05: High-Res 12 MP Photo Downscaling** | Ingest a 12 MP photo ($4000 \times 3000\text{ px}$). | Proportionately downscaled to $1280 \times 960\text{ px}$ preserving aspect ratio; original bitmap memory released. | Automated Unit Test |
| **TC-GAL-06: Portrait Orientation Downscaling** | Ingest a vertical photo ($3000 \times 4000\text{ px}$). | Downscaled to $960 \times 1280\text{ px}$ with orientation preserved. | Automated Unit Test |
| **TC-GAL-07: EXIF Auto-Rotation** | Select a phone photo with EXIF orientation metadata tag. | Decoded using `createImageBitmap(file, { imageOrientation: "from-image" })` so photo is upright. | Verified |
| **TC-GAL-08: Undecodable / HEIC Handling** | Select unsupported HEIC photo on a browser without native HEIC decoder. | User-friendly message displayed: *"Please choose a JPG or PNG photo (HEIC format is not supported by your browser)."* | Verified |

---

## 3. P4: Image Quality Analysis & Calibration Verification

| Test Case | Steps to Test | Expected Behavior | Status |
| :--- | :--- | :--- | :--- |
| **TC-QUAL-01: Sharp vs. Blurred Discrimination** | Run Laplacian variance and Tenengrad on sharp checkerboard vs. box-blurred variants (r=1, 2, 4). | Sharp image scores strictly higher than blurred versions ($L_{\text{sharp}} > L_{\text{blur1}} > L_{\text{blur2}} > L_{\text{blur4}}$). | Automated Unit Test |
| **TC-QUAL-02: Motion Blur Detection** | Evaluate directional streak with strong vertical gradient and near-zero horizontal gradient. | Gradient energy ratio exceeds 2.2; flags `motionLikely = true` with hint: *"Hold steady — leaf photo has motion blur."* | Automated Unit Test |
| **TC-QUAL-03: Dark Scene Flagging** | Evaluate underexposed / dark scene ($Y < 45$ or dark fraction $> 40\%$). | Categorized as `retake` with hint: *"Too dark — move into brighter daylight or remove heavy shadows."* | Automated Unit Test |
| **TC-QUAL-04: Specular Glare Detection** | Evaluate leaf photo containing near-white specular highlights ($Y > 235$, saturation $< 0.20$). | Glare fraction calculated; if $> 15\%$, flags `retake` with glare hint. | Automated Unit Test |
| **TC-QUAL-05: Foliage Centering & Coverage** | Evaluate center area green/foliage pixel ratio. | Center region with low leaf pixels ($< 20\%$) flags: *"Leaf is not centered — bring the camera closer to fill the box."* | Automated Unit Test |
| **TC-QUAL-06: Immerkaer Sensor Noise Estimation** | Evaluate flat surface with additive pseudo-random noise. | Flat surface yields noise $\approx 0$, while noisy pattern yields noise $> 10$. | Automated Unit Test |
| **TC-QUAL-07: Calibration Debug Page (/debug/quality)** | Navigate to `/debug/quality` on mobile browser or click button in Settings. | Displays all raw computed metrics, verdict badges, and calibration labeling controls with table export. | Verified in Browser |

---

## 4. P5: Borderline Photo Enhancement Verification

| Test Case | Steps to Test | Expected Behavior | Status |
| :--- | :--- | :--- | :--- |
| **TC-ENH-01: Mild Blur Unsharp Mask** | Run `applyUnsharpMaskLuminance` on borderline blurred pattern. | Laplacian sharpness metric increases by >10% ($\Delta \sigma^2 = +0.22$, 12.3% gain). | Automated Unit Test & Eval |
| **TC-ENH-02: Color-Safe Chromaticity Invariance** | Evaluate hue shifts across all pixels before and after enhancement. | Maximum observed hue deviation $\le 3.0^\circ$ (within discrete integer rounding tolerance); zero diagnostic lesion color distortion. | Automated Unit Test |
| **TC-ENH-03: Luminance Stretch & Auto-Levels** | Apply luminance stretch and gamma to dark borderline image. | Mean luminance advances toward target range without clipping. | Automated Unit Test |
| **TC-ENH-04: Severe Defects Not Silently Fixed** | Evaluate photo with severe blur ($<80.0$) or heavy darkness. | Verdict remains `retake`; enhancement is not applied; user is asked for a retake. | Verified |

---

## 5. P6: Inference Worker & Decision Gate Verification

| Test Case | Steps to Test | Expected Behavior | Status |
| :--- | :--- | :--- | :--- |
| **TC-DEC-01: Planar NCHW Preprocessing** | Check tensor shape and normalization values. | Shape is $[1, 3, 224, 224]$, values scaled by ImageNet mean/std. | Automated Unit Test |
| **TC-DEC-02: Temperature Softmax** | Test softmax with temperature scaling ($T=1.0$ vs $T=0.5$). | Probabilities sum to 1.0; low $T$ sharpens top probability; high $T$ flattens. | Automated Unit Test |
| **TC-DEC-03: Normalized Shannon Entropy** | Calculate entropy for deterministic $[1, 0, 0, 0]$ vs uniform $[0.25, 0.25, 0.25, 0.25]$. | Exactly $0.0$ for deterministic and $1.0$ for uniform. | Automated Unit Test |
| **TC-DEC-04: Decision Status Gates** | Test `poor_quality`, `scanAnyway`, `unknown`, `uncertain` (low confidence & small margin), and `confident`. | All 5 decision rules match AGENTS.md contract with 100% precision. | Automated Unit Test |
| **TC-DEC-05: Model & Ingest Parity Test** | Run `npm run parity` (`python ml/src/parity.py`). | 50 synthetic images pass with max logit difference $< 0.0001$ and $100\%$ top-1 agreement. | Verified |

---

## 6. P7: User Flow & Screens Verification

| Test Case | Steps to Test | Expected Behavior | Status |
| :--- | :--- | :--- | :--- |
| **TC-FLOW-01: 360px Mobile-First Layout** | View all screens on 360px width viewport. | Touch targets $\ge 48\text{ px}$, no horizontal overflow, readable typography. | Verified |
| **TC-FLOW-02: Before/After Toggle** | Trigger borderline photo enhancement in PhotoCheck. | Before/After toggle pill allows switching between Enhanced and Original preview with green badge. | Verified |
| **TC-FLOW-03: Retake vs Scan Anyway** | Trigger retake verdict in PhotoCheck. | Retake is primary button; Scan Anyway is secondary outline button. | Verified |
| **TC-FLOW-04: Top-3 Confidence Bars** | Complete scan to Confident or Uncertain Result. | Top-3 classes shown with percentage bars, honest uncertainty warnings, and inference latency badge. | Verified |
| **TC-FLOW-05: Teammate Treatment Slot** | Tap "View Treatment & Prevention" on confident result. | Opens disease management guidance, organic/chemical options, cost estimate, and Krishi Bhavan schemes. | Verified |

---

## 7. P8: Airplane Mode & Offline PWA Verification

### Step-by-Step Instructions to Verify Airplane Mode:

1. **Initial Online Load:**
   - Open Chrome or Edge DevTools $\to$ Open `http://localhost:3000/`.
   - Open **Application** tab $\to$ **Service Workers**.
   - Verify `sw.js` is active and running.
   - Open **Cache Storage** $\to$ Verify `agriscan-cache-v0.1.0-placeholder` contains:
     - `/models/model_int8.onnx`
     - `/models/config.json`
     - `/models/labels.json`
     - `/ort/ort-wasm.wasm`
     - `/ort/ort-wasm-simd.wasm`
     - `/ort/ort-wasm-threaded.wasm`
     - `/ort/ort-wasm-simd-threaded.wasm`
     - `/index.html`, `/manifest.json`, `/icon.svg`

2. **Simulate Airplane Mode / Disconnect Network:**
   - In DevTools $\to$ Open **Network** tab $\to$ Change Throttling dropdown from `No throttling` to **`Offline`** (or turn on Airplane Mode on your phone/laptop).
   - Verify the top Header displays:
     - 🟢 Dot + *"Works offline · model ready on this phone"*

3. **Execute Offline Scan:**
   - From the Scan screen, tap the camera shutter or upload an image from gallery.
   - Proceed through Photo Check $\to$ Tap **Analyse Leaf**.
   - Watch the offline scanning animation.
   - The diagnosis result displays top-3 predictions and confidence with **0 external network requests**.
   - Tap **View Treatment & Prevention** $\to$ Teammate treatment details render completely offline from local cache.

---

### What Could Not Be Verified Automatically:
1. **Physical Airplane Mode Toggle on Android Hardware:** Tested via browser DevTools offline emulation; final verification on Android device with cellular & Wi-Fi toggled off.
2. **Real Android Rear Camera Autofocus & Macro Lens:** Physical focus distance requires manual test on real phone hardware.
3. **OEM-Specific Browser Site Permission Menus:** Text directions for resetting site permissions may slightly vary across MIUI/Chrome/Samsung Internet/Brave.
4. **Field Calibration on Direct Sunlight:** Threshold fine-tuning on specific crops in open sunlight can be done using `/debug/quality`.
