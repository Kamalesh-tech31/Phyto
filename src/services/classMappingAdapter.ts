import { FrozenCrop } from '../types/restricted_22';

export interface FrozenClassDefinition {
  classId: number;
  crop: FrozenCrop;
  className: string;
  type: 'disease' | 'healthy' | 'pest';
  aliases: string[];
}

export interface ModelClassMapping {
  modelClassName: string;
  crop: FrozenCrop;
  cropDisplayName: string;
  cropDisplayNameMl: string;
  diseaseId: string;
  diseaseName: string;
  diseaseNameMl: string;
  category: string;
  categoryMl: string;
  kind: 'disease' | 'healthy' | 'pest';
  status: 'supported' | 'healthy' | 'pest' | 'coming_soon';
  ashwinClassName: string;
  pestNotice?: boolean;
  grapeNotice?: boolean;
}

/**
 * Exact mapping of all 22 classes output by the TensorFlow.js MobileNetV3 model
 * Sorted alphabetically by class name as defined in labels.json
 */
export const MODEL_22_CLASSES: Record<string, ModelClassMapping> = {
  corn_common_rust: {
    modelClassName: 'corn_common_rust',
    crop: 'corn',
    cropDisplayName: 'Corn',
    cropDisplayNameMl: 'ചോളം',
    diseaseId: 'common_rust',
    diseaseName: 'Common rust',
    diseaseNameMl: 'കോമൺ റസ്റ്റ് (തുരുമ്പ് രോഗം)',
    category: 'Fungal disease',
    categoryMl: 'ഫംഗസ് രോഗം',
    kind: 'disease',
    status: 'supported',
    ashwinClassName: 'Common rust',
  },
  corn_gray_leaf_spot: {
    modelClassName: 'corn_gray_leaf_spot',
    crop: 'corn',
    cropDisplayName: 'Corn',
    cropDisplayNameMl: 'ചോളം',
    diseaseId: 'gray_leaf_spot',
    diseaseName: 'Gray leaf spot',
    diseaseNameMl: 'ഗ്രേ ലീഫ് സ്പോട്ട്',
    category: 'Fungal disease',
    categoryMl: 'ഫംഗസ് രോഗം',
    kind: 'disease',
    status: 'supported',
    ashwinClassName: 'Gray leaf spot',
  },
  corn_healthy: {
    modelClassName: 'corn_healthy',
    crop: 'corn',
    cropDisplayName: 'Corn',
    cropDisplayNameMl: 'ചോളം',
    diseaseId: 'healthy',
    diseaseName: 'Healthy leaf',
    diseaseNameMl: 'ആരോഗ്യമുള്ള ഇല',
    category: 'Normal crop',
    categoryMl: 'സാധാരണ വിളവ്',
    kind: 'healthy',
    status: 'healthy',
    ashwinClassName: 'Healthy',
  },
  corn_northern_leaf_blight: {
    modelClassName: 'corn_northern_leaf_blight',
    crop: 'corn',
    cropDisplayName: 'Corn',
    cropDisplayNameMl: 'ചോളം',
    diseaseId: 'northern_leaf_blight',
    diseaseName: 'Northern leaf blight',
    diseaseNameMl: 'നോർത്തേൺ ലീഫ് ബ്ലൈറ്റ്',
    category: 'Fungal disease',
    categoryMl: 'ഫംഗസ് രോഗം',
    kind: 'disease',
    status: 'supported',
    ashwinClassName: 'Northern leaf blight',
  },
  grape_black_rot: {
    modelClassName: 'grape_black_rot',
    crop: 'grape',
    cropDisplayName: 'Grape',
    cropDisplayNameMl: 'മുന്തിരി',
    diseaseId: 'grape_black_rot',
    diseaseName: 'Black rot',
    diseaseNameMl: 'ബ്ലാക്ക് റോട്ട് (കറുത്ത ചീയൽ)',
    category: 'Fungal disease',
    categoryMl: 'ഫംഗസ് രോഗം',
    kind: 'disease',
    status: 'coming_soon',
    ashwinClassName: 'Black rot',
    grapeNotice: true,
  },
  grape_esca: {
    modelClassName: 'grape_esca',
    crop: 'grape',
    cropDisplayName: 'Grape',
    cropDisplayNameMl: 'മുന്തിരി',
    diseaseId: 'grape_esca',
    diseaseName: 'Esca (Black Measles)',
    diseaseNameMl: 'എസ്ക (ബ്ലാക്ക് മീസിൽസ്)',
    category: 'Fungal disease',
    categoryMl: 'ഫംഗസ് രോഗം',
    kind: 'disease',
    status: 'coming_soon',
    ashwinClassName: 'Esca',
    grapeNotice: true,
  },
  grape_leaf_blight: {
    modelClassName: 'grape_leaf_blight',
    crop: 'grape',
    cropDisplayName: 'Grape',
    cropDisplayNameMl: 'മുന്തിരി',
    diseaseId: 'grape_leaf_blight',
    diseaseName: 'Leaf blight (Isariopsis)',
    diseaseNameMl: 'ഇല കരിച്ചിൽ (ബ്ലൈറ്റ്)',
    category: 'Fungal disease',
    categoryMl: 'ഫംഗസ് രോഗം',
    kind: 'disease',
    status: 'coming_soon',
    ashwinClassName: 'Leaf blight',
    grapeNotice: true,
  },
  pest_armyworm: {
    modelClassName: 'pest_armyworm',
    crop: 'corn',
    cropDisplayName: 'Corn',
    cropDisplayNameMl: 'ചോളം',
    diseaseId: 'pest_armyworm',
    diseaseName: 'Fall Armyworm',
    diseaseNameMl: 'പട്ടാളപ്പുഴു (Armyworm)',
    category: 'Insect Pest',
    categoryMl: 'കീടം',
    kind: 'pest',
    status: 'pest',
    ashwinClassName: 'Armyworm',
    pestNotice: true,
  },
  pest_asiatic_rice_borer: {
    modelClassName: 'pest_asiatic_rice_borer',
    crop: 'rice',
    cropDisplayName: 'Rice',
    cropDisplayNameMl: 'നെല്ല്',
    diseaseId: 'pest_asiatic_rice_borer',
    diseaseName: 'Asiatic rice borer',
    diseaseNameMl: 'തണ്ടുതുരപ്പൻ പുഴു (Rice Borer)',
    category: 'Insect Pest',
    categoryMl: 'കീടം',
    kind: 'pest',
    status: 'pest',
    ashwinClassName: 'Asiatic rice borer',
    pestNotice: true,
  },
  pest_brown_planthopper: {
    modelClassName: 'pest_brown_planthopper',
    crop: 'rice',
    cropDisplayName: 'Rice',
    cropDisplayNameMl: 'നെല്ല്',
    diseaseId: 'pest_brown_planthopper',
    diseaseName: 'Brown planthopper',
    diseaseNameMl: 'മുഞ്ഞ (Brown Planthopper)',
    category: 'Insect Pest',
    categoryMl: 'കീടം',
    kind: 'pest',
    status: 'pest',
    ashwinClassName: 'Brown planthopper',
    pestNotice: true,
  },
  pest_corn_borer: {
    modelClassName: 'pest_corn_borer',
    crop: 'corn',
    cropDisplayName: 'Corn',
    cropDisplayNameMl: 'ചോളം',
    diseaseId: 'pest_corn_borer',
    diseaseName: 'Corn borer',
    diseaseNameMl: 'ചോളം തണ്ടുതുരപ്പൻ പുഴു',
    category: 'Insect Pest',
    categoryMl: 'കീടം',
    kind: 'pest',
    status: 'pest',
    ashwinClassName: 'Corn borer',
    pestNotice: true,
  },
  pest_rice_leaf_roller: {
    modelClassName: 'pest_rice_leaf_roller',
    crop: 'rice',
    cropDisplayName: 'Rice',
    cropDisplayNameMl: 'നെല്ല്',
    diseaseId: 'pest_rice_leaf_roller',
    diseaseName: 'Rice leaf roller',
    diseaseNameMl: 'ഇലചുരുട്ടി പുഴു (Leaf Roller)',
    category: 'Insect Pest',
    categoryMl: 'കീടം',
    kind: 'pest',
    status: 'pest',
    ashwinClassName: 'Rice leaf roller',
    pestNotice: true,
  },
  potato_early_blight: {
    modelClassName: 'potato_early_blight',
    crop: 'potato',
    cropDisplayName: 'Potato',
    cropDisplayNameMl: 'ഉരുളക്കിഴങ്ങ്',
    diseaseId: 'early_blight',
    diseaseName: 'Early blight',
    diseaseNameMl: 'ഏർലി ബ്ലൈറ്റ്',
    category: 'Fungal disease',
    categoryMl: 'ഫംഗസ് രോഗം',
    kind: 'disease',
    status: 'supported',
    ashwinClassName: 'Early blight',
  },
  potato_healthy: {
    modelClassName: 'potato_healthy',
    crop: 'potato',
    cropDisplayName: 'Potato',
    cropDisplayNameMl: 'ഉരുളക്കിഴങ്ങ്',
    diseaseId: 'healthy',
    diseaseName: 'Healthy leaf',
    diseaseNameMl: 'ആരോഗ്യമുള്ള ഇല',
    category: 'Normal crop',
    categoryMl: 'സാധാരണ വിളവ്',
    kind: 'healthy',
    status: 'healthy',
    ashwinClassName: 'Healthy',
  },
  potato_late_blight: {
    modelClassName: 'potato_late_blight',
    crop: 'potato',
    cropDisplayName: 'Potato',
    cropDisplayNameMl: 'ഉരുളക്കിഴങ്ങ്',
    diseaseId: 'late_blight',
    diseaseName: 'Late blight',
    diseaseNameMl: 'ലേറ്റ് ബ്ലൈറ്റ്',
    category: 'Oomycete / Water mold',
    categoryMl: 'പൂപ്പൽ രോഗം',
    kind: 'disease',
    status: 'supported',
    ashwinClassName: 'Late blight',
  },
  tomato_bacterial_spot: {
    modelClassName: 'tomato_bacterial_spot',
    crop: 'tomato',
    cropDisplayName: 'Tomato leaf',
    cropDisplayNameMl: 'തക്കാളി ഇല',
    diseaseId: 'bacterial_spot',
    diseaseName: 'Bacterial spot',
    diseaseNameMl: 'ബാക്ടീരിയൽ സ്പോട്ട്',
    category: 'Bacterial disease',
    categoryMl: 'ബാക്ടീരിയ രോഗം',
    kind: 'disease',
    status: 'supported',
    ashwinClassName: 'Bacterial spot',
  },
  tomato_early_blight: {
    modelClassName: 'tomato_early_blight',
    crop: 'tomato',
    cropDisplayName: 'Tomato leaf',
    cropDisplayNameMl: 'തക്കാളി ഇല',
    diseaseId: 'early_blight',
    diseaseName: 'Early blight',
    diseaseNameMl: 'ഏർലി ബ്ലൈറ്റ് (ഇലപ്പുള്ളി)',
    category: 'Fungal disease',
    categoryMl: 'ഫംഗസ് രോഗം',
    kind: 'disease',
    status: 'supported',
    ashwinClassName: 'Early blight',
  },
  tomato_healthy: {
    modelClassName: 'tomato_healthy',
    crop: 'tomato',
    cropDisplayName: 'Tomato leaf',
    cropDisplayNameMl: 'തക്കാളി ഇല',
    diseaseId: 'healthy',
    diseaseName: 'Healthy leaf',
    diseaseNameMl: 'ആരോഗ്യമുള്ള ഇല',
    category: 'Normal crop',
    categoryMl: 'സാധാരണ വിളവ്',
    kind: 'healthy',
    status: 'healthy',
    ashwinClassName: 'Healthy',
  },
  tomato_late_blight: {
    modelClassName: 'tomato_late_blight',
    crop: 'tomato',
    cropDisplayName: 'Tomato leaf',
    cropDisplayNameMl: 'തക്കാളി ഇല',
    diseaseId: 'late_blight',
    diseaseName: 'Late blight',
    diseaseNameMl: 'ലേറ്റ് ബ്ലൈറ്റ് (കരിമ്പൻ)',
    category: 'Oomycete / Water mold',
    categoryMl: 'പൂപ്പൽ രോഗം',
    kind: 'disease',
    status: 'supported',
    ashwinClassName: 'Late blight',
  },
  tomato_leaf_mold: {
    modelClassName: 'tomato_leaf_mold',
    crop: 'tomato',
    cropDisplayName: 'Tomato leaf',
    cropDisplayNameMl: 'തക്കാളി ഇല',
    diseaseId: 'leaf_mold',
    diseaseName: 'Leaf mold',
    diseaseNameMl: 'ലീഫ് മോൾഡ്',
    category: 'Fungal disease',
    categoryMl: 'ഫംഗസ് രോഗം',
    kind: 'disease',
    status: 'supported',
    ashwinClassName: 'Leaf mold',
  },
  tomato_septoria_leaf_spot: {
    modelClassName: 'tomato_septoria_leaf_spot',
    crop: 'tomato',
    cropDisplayName: 'Tomato leaf',
    cropDisplayNameMl: 'തക്കാളി ഇല',
    diseaseId: 'septoria_leaf_spot',
    diseaseName: 'Septoria leaf spot',
    diseaseNameMl: 'സെപ്റ്റോറിയ ഇലപ്പുള്ളി',
    category: 'Fungal disease',
    categoryMl: 'ഫംഗസ് രോഗം',
    kind: 'disease',
    status: 'supported',
    ashwinClassName: 'Septoria leaf spot',
  },
  tomato_yellow_leaf_curl: {
    modelClassName: 'tomato_yellow_leaf_curl',
    crop: 'tomato',
    cropDisplayName: 'Tomato leaf',
    cropDisplayNameMl: 'തക്കാളി ഇല',
    diseaseId: 'yellow_leaf_curl',
    diseaseName: 'Yellow leaf curl virus',
    diseaseNameMl: 'ഇലച്ചുരുൾ വൈറസ് (TYLCV)',
    category: 'Viral disease',
    categoryMl: 'വൈറസ് രോഗം',
    kind: 'disease',
    status: 'supported',
    ashwinClassName: 'Yellow leaf curl virus',
  },
};

/**
 * Maps a real model class name (e.g. 'tomato_early_blight') to full UI & content metadata.
 * Warns in dev if unmapped, returns null safely.
 */
export function mapModelClassName(className: string): ModelClassMapping | null {
  const normalized = (className || '').trim().toLowerCase();
  const match = MODEL_22_CLASSES[normalized];

  if (match) {
    return match;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[ClassMappingAdapter] Unmapped model class name: "${className}"`);
  }

  return null;
}

// ---------------------------------------------------------------------------
// Backward compatibility catalog for existing test suites and KB lookups
// ---------------------------------------------------------------------------
export const FROZEN_22_CLASSES: FrozenClassDefinition[] = [
  // Tomato (0 - 6)
  {
    classId: 0,
    crop: 'tomato',
    className: 'Early blight',
    type: 'disease',
    aliases: ['early_blight', 'early blight', 'tomato early blight', 'bullseye spots'],
  },
  {
    classId: 1,
    crop: 'tomato',
    className: 'Late blight',
    type: 'disease',
    aliases: ['late_blight', 'late blight', 'tomato late blight', 'water-soaked patches'],
  },
  {
    classId: 2,
    crop: 'tomato',
    className: 'Leaf mold',
    type: 'disease',
    aliases: ['leaf_mold', 'leaf mold', 'leaf mould', 'tomato leaf mold'],
  },
  {
    classId: 3,
    crop: 'tomato',
    className: 'Septoria leaf spot',
    type: 'disease',
    aliases: ['septoria', 'septoria_leaf_spot', 'septoria leaf spot'],
  },
  {
    classId: 4,
    crop: 'tomato',
    className: 'Bacterial spot',
    type: 'disease',
    aliases: ['bacterial_spot', 'bacterial spot', 'tomato bacterial spot'],
  },
  {
    classId: 5,
    crop: 'tomato',
    className: 'Yellow leaf curl virus',
    type: 'disease',
    aliases: ['yellow_leaf_curl_virus', 'yellow leaf curl', 'curl virus', 'tylcv', 'leaf curl'],
  },
  {
    classId: 6,
    crop: 'tomato',
    className: 'Healthy',
    type: 'healthy',
    aliases: ['healthy', 'tomato healthy', 'healthy leaf', 'clean green foliage'],
  },

  // Potato (7 - 9)
  {
    classId: 7,
    crop: 'potato',
    className: 'Early blight',
    type: 'disease',
    aliases: ['early_blight', 'early blight', 'potato early blight'],
  },
  {
    classId: 8,
    crop: 'potato',
    className: 'Late blight',
    type: 'disease',
    aliases: ['late_blight', 'late blight', 'potato late blight'],
  },
  {
    classId: 9,
    crop: 'potato',
    className: 'Healthy',
    type: 'healthy',
    aliases: ['healthy', 'potato healthy'],
  },

  // Corn (10 - 13)
  {
    classId: 10,
    crop: 'corn',
    className: 'Gray leaf spot',
    type: 'disease',
    aliases: ['gray_leaf_spot', 'gray leaf spot', 'grey leaf spot'],
  },
  {
    classId: 11,
    crop: 'corn',
    className: 'Common rust',
    type: 'disease',
    aliases: ['common_rust', 'common rust', 'corn rust', 'rust'],
  },
  {
    classId: 12,
    crop: 'corn',
    className: 'Northern leaf blight',
    type: 'disease',
    aliases: ['northern_leaf_blight', 'northern leaf blight', 'nlb'],
  },
  {
    classId: 13,
    crop: 'corn',
    className: 'Healthy',
    type: 'healthy',
    aliases: ['healthy', 'corn healthy', 'maize healthy'],
  },

  // Rice (14 - 16)
  {
    classId: 14,
    crop: 'rice',
    className: 'Bacterial leaf blight',
    type: 'disease',
    aliases: ['bacterial_leaf_blight', 'bacterial blight', 'rice bacterial leaf blight', 'blb', 'rice_bacterial_blight'],
  },
  {
    classId: 15,
    crop: 'rice',
    className: 'Brown spot',
    type: 'disease',
    aliases: ['brown_spot', 'brown spot', 'rice brown spot'],
  },
  {
    classId: 16,
    crop: 'rice',
    className: 'Leaf smut',
    type: 'disease',
    aliases: ['leaf_smut', 'leaf smut', 'smut'],
  },

  // Pests (17 - 21)
  {
    classId: 17,
    crop: 'rice',
    className: 'Brown planthopper',
    type: 'pest',
    aliases: ['brown_planthopper', 'brown planthopper', 'bph', 'planthopper'],
  },
  {
    classId: 18,
    crop: 'rice',
    className: 'Asiatic rice borer',
    type: 'pest',
    aliases: ['asiatic_rice_borer', 'rice borer', 'stem borer', 'stem_borer', 'rice stem borer'],
  },
  {
    classId: 19,
    crop: 'rice',
    className: 'Rice leaf roller',
    type: 'pest',
    aliases: ['rice_leaf_roller', 'leaf roller', 'leaf_roller', 'leaf folder'],
  },
  {
    classId: 20,
    crop: 'corn',
    className: 'Corn borer',
    type: 'pest',
    aliases: ['corn_borer', 'corn borer', 'european corn borer'],
  },
  {
    classId: 21,
    crop: 'corn',
    className: 'Armyworm',
    type: 'pest',
    aliases: ['armyworm', 'fall armyworm', 'faw', 'spodoptera'],
  },
];

export function normalizeCrop(rawCrop?: string, rawDisease?: string): FrozenCrop | null {
  const cropStr = (rawCrop || '').toLowerCase();
  const diseaseStr = (rawDisease || '').toLowerCase();

  if (cropStr.includes('tomato')) return 'tomato';
  if (cropStr.includes('potato')) return 'potato';
  if (cropStr.includes('corn') || cropStr.includes('maize')) return 'corn';
  if (cropStr.includes('rice') || cropStr.includes('paddy')) return 'rice';
  if (cropStr.includes('grape')) return 'grape';

  // Check disease string for clues
  if (diseaseStr.includes('grape') || diseaseStr.includes('black rot') || diseaseStr.includes('esca')) return 'grape';
  if (diseaseStr.includes('rice') || diseaseStr.includes('planthopper') || diseaseStr.includes('leaf roller') || diseaseStr.includes('rice borer')) {
    return 'rice';
  }
  if (diseaseStr.includes('corn') || diseaseStr.includes('maize') || diseaseStr.includes('corn borer') || diseaseStr.includes('common rust') || diseaseStr.includes('gray leaf') || diseaseStr.includes('northern leaf')) {
    return 'corn';
  }
  if (diseaseStr.includes('potato')) return 'potato';
  if (diseaseStr.includes('tomato') || diseaseStr.includes('septoria') || diseaseStr.includes('leaf mold')) return 'tomato';
  if (diseaseStr.includes('armyworm')) return 'corn';

  return null;
}

export function mapToFrozenClass(
  rawCrop?: string,
  rawDiseaseIdOrName?: string
): FrozenClassDefinition | null {
  const crop = normalizeCrop(rawCrop, rawDiseaseIdOrName);
  if (!crop) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[ClassMappingAdapter] Unable to resolve crop from:', { rawCrop, rawDiseaseIdOrName });
    }
    return null;
  }

  const query = (rawDiseaseIdOrName || '').toLowerCase().trim();
  if (!query) {
    return {
      classId: -1,
      crop,
      className: `${crop.charAt(0).toUpperCase() + crop.slice(1)} condition`,
      type: 'disease',
      aliases: [],
    };
  }

  // 1. Direct search by crop and alias
  const match = FROZEN_22_CLASSES.find((item) => {
    if (item.crop !== crop) return false;
    if (item.className.toLowerCase() === query) return true;
    return item.aliases.some((alias) => query.includes(alias) || alias.includes(query));
  });

  if (match) {
    return match;
  }

  // 2. Global search for unique pest or disease name
  const globalMatch = FROZEN_22_CLASSES.find((item) => {
    if (item.className.toLowerCase() === query) return true;
    return item.aliases.some((alias) => alias === query);
  });

  if (globalMatch) {
    return globalMatch;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.warn('[ClassMappingAdapter] Unmapped disease class for crop:', { crop, query, rawDiseaseIdOrName });
  }

  return null;
}
