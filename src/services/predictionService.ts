import {
  ConfidenceLevel,
  PredictionResult,
  QualityCheckResult,
  SeverityLevel,
} from '../types';
import labelsMap from '../data/labels.json';

export const UNCERTAINTY_CONFIDENCE_THRESHOLD = 0.65;

export interface IPredictionEngine {
  checkQuality(imageUrl: string, presetType?: string): Promise<QualityCheckResult>;
  predict(imageUrl: string, presetType?: string): Promise<PredictionResult>;
}

class PredictionService implements IPredictionEngine {
  /**
   * Analyzes whether an image represents botanical leaf foliage or a non-leaf object.
   * Lenient thresholds ensure brown, chlorotic yellow, or necrotic diseased leaves pass.
   */
  public async analyzeLeafPixels(imageUrl: string): Promise<{ isLeaf: boolean; score: number }> {
    if (!imageUrl || imageUrl.startsWith('sample:')) {
      return { isLeaf: true, score: 0.85 };
    }

    return new Promise((resolve) => {
      if (typeof window === 'undefined' || typeof Image === 'undefined') {
        resolve({ isLeaf: true, score: 0.75 });
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const size = 64; // Fast, lightweight 64x64 sample grid
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });

          if (!ctx) {
            resolve({ isLeaf: true, score: 0.7 });
            return;
          }

          ctx.drawImage(img, 0, 0, size, size);
          const data = ctx.getImageData(0, 0, size, size).data;
          const totalPixels = size * size;

          let greenPixels = 0;
          let chloroticOrLesionPixels = 0;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i] / 255;
            const g = data[i + 1] / 255;
            const b = data[i + 2] / 255;

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const d = max - min;
            let h = 0;
            const s = max === 0 ? 0 : d / max;
            const v = max;

            if (d !== 0) {
              switch (max) {
                case r:
                  h = (g - b) / d + (g < b ? 6 : 0);
                  break;
                case g:
                  h = (b - r) / d + 2;
                  break;
                case b:
                  h = (r - g) / d + 4;
                  break;
              }
              h *= 60;
            }

            // 1. Definite Green foliage (Hue 65° to 175°, minimum saturation 0.15, brightness 0.12)
            if (h >= 65 && h <= 175 && s >= 0.15 && v >= 0.12) {
              greenPixels++;
            }
            // 2. Yellow-green chlorosis or olive lesion (Hue 42° to 65°, s >= 0.20, v >= 0.15)
            else if (h >= 42 && h < 65 && s >= 0.2 && v >= 0.15) {
              chloroticOrLesionPixels++;
            }
          }

          const greenFraction = greenPixels / totalPixels;
          const totalBotanicalFraction = (greenPixels + chloroticOrLesionPixels) / totalPixels;

          // Lenient botanical criteria:
          // - Healthy leaf has >= 5% clear green
          // - Diseased / blighted leaf has >= 2% green + chlorotic/lesion pixels totaling >= 12%
          // - Bread / toast / non-leaf has near 0% green and hue < 38°
          const isLeaf = greenFraction >= 0.05 || (greenFraction >= 0.02 && totalBotanicalFraction >= 0.12);
          const score = Math.round(totalBotanicalFraction * 100) / 100;

          resolve({ isLeaf, score });
        } catch (err) {
          console.warn('Leaf pixel analysis fallback:', err);
          resolve({ isLeaf: true, score: 0.5 });
        }
      };

      img.onerror = () => {
        resolve({ isLeaf: true, score: 0.5 });
      };

      img.src = imageUrl;
    });
  }

  /**
   * Evaluates leaf image quality (sharpness, lighting, shadow, distance, and botanical leaf verification)
   */
  public async checkQuality(imageUrl: string, presetType?: string): Promise<QualityCheckResult> {
    await new Promise((r) => setTimeout(r, 200));

    // If preset is explicitly blurry
    if (presetType === 'blurry') {
      return {
        sharpness: 'blurry',
        sharpnessPass: false,
        light: 'dim',
        lightPass: false,
        shadow: 'heavy',
        shadowPass: false,
        distance: 'too_close',
        distancePass: false,
        isLeaf: true,
        isLeafPass: true,
        leafScore: 0.82,
        isAcceptable: false,
        adviceKey: 'photo_check_notice_blurry',
      };
    }

    // For custom uploaded photos, analyze pixels
    const leafCheck = await this.analyzeLeafPixels(imageUrl);

    if (!leafCheck.isLeaf) {
      return {
        sharpness: 'sharp',
        sharpnessPass: true,
        light: 'good',
        lightPass: true,
        shadow: 'none',
        shadowPass: true,
        distance: 'good',
        distancePass: true,
        isLeaf: false,
        isLeafPass: false,
        leafScore: leafCheck.score,
        isAcceptable: false,
        adviceKey: 'photo_check_notice_not_leaf',
      };
    }

    // Default reference quality check for valid leaf photos
    return {
      sharpness: 'sharp',
      sharpnessPass: true,
      light: 'good',
      lightPass: true,
      shadow: 'left_dark',
      shadowPass: false, // warning check
      distance: 'good',
      distancePass: true,
      isLeaf: true,
      isLeafPass: true,
      leafScore: leafCheck.score,
      isAcceptable: true,
      adviceKey: 'photo_check_notice',
    };
  }

  /**
   * Runs tomato disease diagnosis using simulated model output index + labels.json mapping.
   * Checks uncertainty against UNCERTAINTY_CONFIDENCE_THRESHOLD instead of treating -1 as model output.
   */
  public async predict(imageUrl: string, presetType?: string): Promise<PredictionResult> {
    await new Promise((r) => setTimeout(r, 900));

    const id = `scan_${Date.now()}`;
    const timestamp = Date.now();

    // Map presets to model class indices and scores
    let modelClassIndex: number = 0; // Default Early blight
    let confidenceScore: number = 0.94;
    let affectedAreaPercent: number = 18;
    let severity: SeverityLevel = 'mild';

    if (presetType === 'blurry') {
      modelClassIndex = 0;
      // Below the threshold 0.65 -> triggers uncertain case
      confidenceScore = 0.42;
      affectedAreaPercent = 0;
      severity = 'mild';
    } else if (presetType === 'late_blight') {
      modelClassIndex = 1;
      confidenceScore = 0.96;
      affectedAreaPercent = 42;
      severity = 'severe';
    } else if (presetType === 'healthy') {
      modelClassIndex = 2;
      confidenceScore = 0.98;
      affectedAreaPercent = 0;
      severity = 'mild';
    } else if (presetType === 'early_blight') {
      modelClassIndex = 0;
      confidenceScore = 0.94;
      affectedAreaPercent = 18;
      severity = 'mild';
    }

    // Map class index to class_id using labels.json
    const labelsRecord = labelsMap as Record<string, string>;
    const class_id = labelsRecord[String(modelClassIndex)] || 'tomato_healthy';

    // Uncertainty check based on confidence threshold
    const isUncertain = confidenceScore < UNCERTAINTY_CONFIDENCE_THRESHOLD;

    const confidence: ConfidenceLevel =
      confidenceScore >= 0.85 ? 'high' : confidenceScore >= UNCERTAINTY_CONFIDENCE_THRESHOLD ? 'medium' : 'low';

    return {
      id,
      timestamp,
      class_id,
      confidenceScore,
      confidence,
      affectedAreaPercent,
      severity,
      isUncertain,
      imageData: imageUrl,
      imageUrl,
      pestWarning:
        class_id === 'tomato_early_blight'
          ? {
              name: 'Aphids',
              severityLabel: 'Pest · moderate',
              details: 'Minor cluster of sap-sucking insects detected near lower stem base.',
            }
          : undefined,
    };
  }
}

export const predictionService = new PredictionService();
