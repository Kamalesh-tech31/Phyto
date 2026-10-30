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

### What Could Not Be Verified Automatically:
1. **Real Android Rear Camera Hardware Autofocus & Macro Lens:** Real phone physical focus distance and sensor sharpness require manual test on physical Android hardware.
2. **OEM-Specific Browser Site Permission Menus:** Text directions for resetting site permissions may slightly vary across MIUI/Chrome/Samsung Internet/Brave.
3. **Hardware HEIC Decoding on Safari vs Chrome:** Safari decodes HEIC natively in `createImageBitmap`, whereas Chromium on Android shows the fallback error prompt as expected.
