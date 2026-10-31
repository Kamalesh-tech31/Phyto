export type ConditionCategory =
  | 'fungal'
  | 'bacterial'
  | 'viral'
  | 'pest'
  | 'healthy'
  | 'reject';

export interface ClassMetadata {
  plant: string;
  plantMl: string;
  condition: string;
  conditionMl: string;
  category: ConditionCategory;
  categoryDisplayName: string;
  categoryDisplayNameMl: string;
  diseaseId: string;
  isHealthy: boolean;
  isPest: boolean;
  isReject: boolean;
  isComingSoon?: boolean;
}

export const CLASS_MAPPINGS: Record<string, ClassMetadata> = {
  corn_common_rust: {
    plant: 'Corn',
    plantMl: 'ചോളം',
    condition: 'Common rust',
    conditionMl: 'കോമൺ റസ്റ്റ് (തുരുമ്പ് രോഗം)',
    category: 'fungal',
    categoryDisplayName: 'Fungal disease',
    categoryDisplayNameMl: 'ഫംഗസ് രോഗം',
    diseaseId: 'common_rust',
    isHealthy: false,
    isPest: false,
    isReject: false,
  },
  corn_gray_leaf_spot: {
    plant: 'Corn',
    plantMl: 'ചോളം',
    condition: 'Gray leaf spot',
    conditionMl: 'ഗ്രേ ലീഫ് സ്പോട്ട്',
    category: 'fungal',
    categoryDisplayName: 'Fungal disease',
    categoryDisplayNameMl: 'ഫംഗസ് രോഗം',
    diseaseId: 'gray_leaf_spot',
    isHealthy: false,
    isPest: false,
    isReject: false,
  },
  corn_healthy: {
    plant: 'Corn',
    plantMl: 'ചോളം',
    condition: 'Healthy leaf',
    conditionMl: 'ആരോഗ്യമുള്ള ഇല',
    category: 'healthy',
    categoryDisplayName: 'Normal crop',
    categoryDisplayNameMl: 'സാധാരണ വിളവ്',
    diseaseId: 'healthy',
    isHealthy: true,
    isPest: false,
    isReject: false,
  },
  corn_northern_leaf_blight: {
    plant: 'Corn',
    plantMl: 'ചോളം',
    condition: 'Northern leaf blight',
    conditionMl: 'നോർത്തേൺ ലീഫ് ബ്ലൈറ്റ്',
    category: 'fungal',
    categoryDisplayName: 'Fungal disease',
    categoryDisplayNameMl: 'ഫംഗസ് രോഗം',
    diseaseId: 'northern_leaf_blight',
    isHealthy: false,
    isPest: false,
    isReject: false,
  },
  grape_black_rot: {
    plant: 'Grape',
    plantMl: 'മുന്തിരി',
    condition: 'Black rot',
    conditionMl: 'ബ്ലാക്ക് റോട്ട് (കറുത്ത ചീയൽ)',
    category: 'fungal',
    categoryDisplayName: 'Fungal disease',
    categoryDisplayNameMl: 'ഫംഗസ് രോഗം',
    diseaseId: 'grape_black_rot',
    isHealthy: false,
    isPest: false,
    isReject: false,
    isComingSoon: true,
  },
  grape_esca: {
    plant: 'Grape',
    plantMl: 'മുന്തിരി',
    condition: 'Esca (Black Measles)',
    conditionMl: 'എസ്ക (ബ്ലാക്ക് മീസിൽസ്)',
    category: 'fungal',
    categoryDisplayName: 'Fungal disease',
    categoryDisplayNameMl: 'ഫംഗസ് രോഗം',
    diseaseId: 'grape_esca',
    isHealthy: false,
    isPest: false,
    isReject: false,
    isComingSoon: true,
  },
  grape_leaf_blight: {
    plant: 'Grape',
    plantMl: 'മുന്തിരി',
    condition: 'Leaf blight (Isariopsis)',
    conditionMl: 'ഇല കരിച്ചിൽ (ബ്ലൈറ്റ്)',
    category: 'fungal',
    categoryDisplayName: 'Fungal disease',
    categoryDisplayNameMl: 'ഫംഗസ് രോഗം',
    diseaseId: 'grape_leaf_blight',
    isHealthy: false,
    isPest: false,
    isReject: false,
    isComingSoon: true,
  },
  pest_armyworm: {
    plant: 'Corn',
    plantMl: 'ചോളം',
    condition: 'Fall Armyworm',
    conditionMl: 'പട്ടാളപ്പുഴു (Armyworm)',
    category: 'pest',
    categoryDisplayName: 'Insect Pest',
    categoryDisplayNameMl: 'കീടം',
    diseaseId: 'pest_armyworm',
    isHealthy: false,
    isPest: true,
    isReject: false,
  },
  pest_asiatic_rice_borer: {
    plant: 'Rice',
    plantMl: 'നെല്ല്',
    condition: 'Asiatic rice borer',
    conditionMl: 'തണ്ടുതുരപ്പൻ പുഴു (Rice Borer)',
    category: 'pest',
    categoryDisplayName: 'Insect Pest',
    categoryDisplayNameMl: 'കീടം',
    diseaseId: 'pest_asiatic_rice_borer',
    isHealthy: false,
    isPest: true,
    isReject: false,
  },
  pest_brown_planthopper: {
    plant: 'Rice',
    plantMl: 'നെല്ല്',
    condition: 'Brown planthopper',
    conditionMl: 'മുഞ്ഞ (Brown Planthopper)',
    category: 'pest',
    categoryDisplayName: 'Insect Pest',
    categoryDisplayNameMl: 'കീടം',
    diseaseId: 'pest_brown_planthopper',
    isHealthy: false,
    isPest: true,
    isReject: false,
  },
  pest_corn_borer: {
    plant: 'Corn',
    plantMl: 'ചോളം',
    condition: 'Corn borer',
    conditionMl: 'ചോളം തണ്ടുതുരപ്പൻ പുഴു',
    category: 'pest',
    categoryDisplayName: 'Insect Pest',
    categoryDisplayNameMl: 'കീടം',
    diseaseId: 'pest_corn_borer',
    isHealthy: false,
    isPest: true,
    isReject: false,
  },
  pest_rice_leaf_roller: {
    plant: 'Rice',
    plantMl: 'നെല്ല്',
    condition: 'Rice leaf roller',
    conditionMl: 'ഇലചുരുട്ടി പുഴു (Leaf Roller)',
    category: 'pest',
    categoryDisplayName: 'Insect Pest',
    categoryDisplayNameMl: 'കീടം',
    diseaseId: 'pest_rice_leaf_roller',
    isHealthy: false,
    isPest: true,
    isReject: false,
  },
  potato_early_blight: {
    plant: 'Potato',
    plantMl: 'ഉരുളക്കിഴങ്ങ്',
    condition: 'Early blight',
    conditionMl: 'ഏർലി ബ്ലൈറ്റ്',
    category: 'fungal',
    categoryDisplayName: 'Fungal disease',
    categoryDisplayNameMl: 'ഫംഗസ് രോഗം',
    diseaseId: 'early_blight',
    isHealthy: false,
    isPest: false,
    isReject: false,
  },
  potato_healthy: {
    plant: 'Potato',
    plantMl: 'ഉരുളക്കിഴങ്ങ്',
    condition: 'Healthy leaf',
    conditionMl: 'ആരോഗ്യമുള്ള ഇല',
    category: 'healthy',
    categoryDisplayName: 'Normal crop',
    categoryDisplayNameMl: 'സാധാരണ വിളവ്',
    diseaseId: 'healthy',
    isHealthy: true,
    isPest: false,
    isReject: false,
  },
  potato_late_blight: {
    plant: 'Potato',
    plantMl: 'ഉരുളക്കിഴങ്ങ്',
    condition: 'Late blight',
    conditionMl: 'ലേറ്റ് ബ്ലൈറ്റ്',
    category: 'fungal',
    categoryDisplayName: 'Oomycete / Water mold',
    categoryDisplayNameMl: 'പൂപ്പൽ രോഗം',
    diseaseId: 'late_blight',
    isHealthy: false,
    isPest: false,
    isReject: false,
  },
  tomato_bacterial_spot: {
    plant: 'Tomato',
    plantMl: 'തക്കാളി ഇല',
    condition: 'Bacterial spot',
    conditionMl: 'ബാക്ടീരിയൽ സ്പോട്ട്',
    category: 'bacterial',
    categoryDisplayName: 'Bacterial disease',
    categoryDisplayNameMl: 'ബാക്ടീരിയ രോഗം',
    diseaseId: 'bacterial_spot',
    isHealthy: false,
    isPest: false,
    isReject: false,
  },
  tomato_early_blight: {
    plant: 'Tomato',
    plantMl: 'തക്കാളി ഇല',
    condition: 'Early blight',
    conditionMl: 'ഏർലി ബ്ലൈറ്റ് (ഇലപ്പുള്ളി)',
    category: 'fungal',
    categoryDisplayName: 'Fungal disease',
    categoryDisplayNameMl: 'ഫംഗസ് രോഗം',
    diseaseId: 'early_blight',
    isHealthy: false,
    isPest: false,
    isReject: false,
  },
  tomato_healthy: {
    plant: 'Tomato',
    plantMl: 'തക്കാളി ഇല',
    condition: 'Healthy leaf',
    conditionMl: 'ആരോഗ്യമുള്ള ഇല',
    category: 'healthy',
    categoryDisplayName: 'Normal crop',
    categoryDisplayNameMl: 'സാധാരണ വിളവ്',
    diseaseId: 'healthy',
    isHealthy: true,
    isPest: false,
    isReject: false,
  },
  tomato_late_blight: {
    plant: 'Tomato',
    plantMl: 'തക്കാളി ഇല',
    condition: 'Late blight',
    conditionMl: 'ലേറ്റ് ബ്ലൈറ്റ് (കരിമ്പൻ)',
    category: 'fungal',
    categoryDisplayName: 'Oomycete / Water mold',
    categoryDisplayNameMl: 'പൂപ്പൽ രോഗം',
    diseaseId: 'late_blight',
    isHealthy: false,
    isPest: false,
    isReject: false,
  },
  tomato_leaf_mold: {
    plant: 'Tomato',
    plantMl: 'തക്കാളി ഇല',
    condition: 'Leaf mold',
    conditionMl: 'ലീഫ് മോൾഡ്',
    category: 'fungal',
    categoryDisplayName: 'Fungal disease',
    categoryDisplayNameMl: 'ഫംഗസ് രോഗം',
    diseaseId: 'leaf_mold',
    isHealthy: false,
    isPest: false,
    isReject: false,
  },
  tomato_septoria_leaf_spot: {
    plant: 'Tomato',
    plantMl: 'തക്കാളി ഇല',
    condition: 'Septoria leaf spot',
    conditionMl: 'സെപ്റ്റോറിയ ഇലപ്പുള്ളി',
    category: 'fungal',
    categoryDisplayName: 'Fungal disease',
    categoryDisplayNameMl: 'ഫംഗസ് രോഗം',
    diseaseId: 'septoria_leaf_spot',
    isHealthy: false,
    isPest: false,
    isReject: false,
  },
  tomato_yellow_leaf_curl: {
    plant: 'Tomato',
    plantMl: 'തക്കാളി ഇല',
    condition: 'Yellow leaf curl virus',
    conditionMl: 'ഇലച്ചുരുൾ വൈറസ് (TYLCV)',
    category: 'viral',
    categoryDisplayName: 'Viral disease',
    categoryDisplayNameMl: 'വൈറസ് രോഗം',
    diseaseId: 'yellow_leaf_curl',
    isHealthy: false,
    isPest: false,
    isReject: false,
  },
  not_a_plant: {
    plant: 'None',
    plantMl: 'വിളയല്ല',
    condition: 'Not a plant',
    conditionMl: 'സസ്യഭാഗമല്ല',
    category: 'reject',
    categoryDisplayName: 'Invalid subject',
    categoryDisplayNameMl: 'സാധുവല്ലാത്ത വിഷയം',
    diseaseId: 'not_a_plant',
    isHealthy: false,
    isPest: false,
    isReject: true,
  },
};

/**
 * Validates that every class name present in labels.json is defined in CLASS_MAPPINGS.
 * Throws immediately with full details if any label lacks a mapping.
 */
export function validateClassMappings(labels: string[]): void {
  const missing = labels.filter((lbl) => !CLASS_MAPPINGS[lbl]);
  if (missing.length > 0) {
    const errorMsg = `[ClassMapping] CRITICAL STARTUP ERROR: Missing metadata mapping for label(s): ${missing.join(
      ', '
    )}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
}

/**
 * Retrieves class metadata for a given label string. Throws if unknown.
 */
export function getClassMetadata(label: string): ClassMetadata {
  const meta = CLASS_MAPPINGS[label];
  if (!meta) {
    throw new Error(`[ClassMapping] Unknown label requested: "${label}". No mapping found!`);
  }
  return meta;
}
