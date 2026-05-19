import { ScreenId, FormResponse } from './types';

export interface FormEngineScreenConfig {
  id: ScreenId;
  type: 'number' | 'radio' | 'checkbox' | 'computed';
  prompt: string | null;
  options?: string[];
  /**
   * Stateful Waterfall Resolver Method
   * Returns: The screen itself if its data is missing.
   * Returns: The targeted next ScreenId or ScreenId.FINAL_SCREEN if data is complete.
   */
  resolveProgress: (answers: Partial<FormResponse>) => ScreenId;
}

export const FORM_ENGINE_SCHEMA: Record<ScreenId, FormEngineScreenConfig> = {
  [ScreenId.AGE]: {
    id: ScreenId.AGE,
    type: 'number',
    prompt: 'What is your age?',
    resolveProgress: (answers) => {
      const age = answers[ScreenId.AGE];
      if (age === undefined) return ScreenId.AGE;
      return age < 18 ? ScreenId.FINAL_SCREEN : ScreenId.WEIGHT; // Hard stop or proceed
    },
  },
  [ScreenId.WEIGHT]: {
    id: ScreenId.WEIGHT,
    type: 'number',
    prompt: 'Enter your weight in kilograms.',
    resolveProgress: (answers) => {
      return answers[ScreenId.WEIGHT] === undefined ? ScreenId.WEIGHT : ScreenId.HEIGHT;
    },
  },
  [ScreenId.HEIGHT]: {
    id: ScreenId.HEIGHT,
    type: 'number',
    prompt: 'Enter your height in centimeters.',
    resolveProgress: (answers) => {
      return answers[ScreenId.HEIGHT] === undefined ? ScreenId.HEIGHT : ScreenId.BMI;
    },
  },
  [ScreenId.BMI]: {
    id: ScreenId.BMI,
    type: 'computed',
    prompt: null,
    resolveProgress: (answers) => {
      const weight = answers[ScreenId.WEIGHT] ?? 0;
      const height = answers[ScreenId.HEIGHT] ?? 0;
      const bmi = height > 0 ? weight / Math.pow(height / 100, 2) : 0;
      
      // Hard exclusion criteria for low BMI immediately jumps to results screen
      return (bmi > 0 && bmi < 25) ? ScreenId.FINAL_SCREEN : ScreenId.PREGNANCY_STATUS;
    },
  },
  [ScreenId.PREGNANCY_STATUS]: {
    id: ScreenId.PREGNANCY_STATUS,
    type: 'radio',
    prompt: 'Are you currently pregnant?',
    options: ['Yes', 'No'],
    resolveProgress: (answers) => {
      const status = answers[ScreenId.PREGNANCY_STATUS];
      if (status === undefined) return ScreenId.PREGNANCY_STATUS;
      return status === 'Yes' ? ScreenId.FINAL_SCREEN : ScreenId.COMORBID_CONDITIONS;
    },
  },
  [ScreenId.COMORBID_CONDITIONS]: {
    id: ScreenId.COMORBID_CONDITIONS,
    type: 'checkbox',
    prompt: 'Which chronic conditions have you been diagnosed with? (Select all that apply)',
    options: ['Hypertension', 'Dyslipidemia', 'Sleep Apnea', 'GERD', 'Thyroid Disorder'],
    resolveProgress: (answers) => {
      return answers[ScreenId.COMORBID_CONDITIONS] === undefined ? ScreenId.COMORBID_CONDITIONS : ScreenId.DIABETES_HISTORY;
    },
  },
  [ScreenId.DIABETES_HISTORY]: {
    id: ScreenId.DIABETES_HISTORY,
    type: 'radio',
    prompt: 'Have you ever been diagnosed with diabetes?',
    options: ['Yes', 'No'],
    resolveProgress: (answers) => {
      const status = answers[ScreenId.DIABETES_HISTORY];
      if (status === undefined) return ScreenId.DIABETES_HISTORY;
      return status === 'Yes' ? ScreenId.MOST_RECENT_HbA1c : ScreenId.BLOOD_PRESSURE_CATEGORIES;
    },
  },
  [ScreenId.MOST_RECENT_HbA1c]: {
    id: ScreenId.MOST_RECENT_HbA1c,
    type: 'number',
    prompt: 'Enter your latest HbA1c (%) result.',
    resolveProgress: (answers) => {
      // Defensive bypass guard: If diabetes history was updated to 'No' later, skip HbA1c verification entirely
      if (answers[ScreenId.DIABETES_HISTORY] === 'No') return ScreenId.BLOOD_PRESSURE_CATEGORIES;
      
      const hba1c = answers[ScreenId.MOST_RECENT_HbA1c];
      if (hba1c === undefined) return ScreenId.MOST_RECENT_HbA1c;
      return hba1c > 9.0 ? ScreenId.FINAL_SCREEN : ScreenId.BLOOD_PRESSURE_CATEGORIES;
    },
  },
  [ScreenId.BLOOD_PRESSURE_CATEGORIES]: {
    id: ScreenId.BLOOD_PRESSURE_CATEGORIES,
    type: 'checkbox',
    prompt: 'Check all that apply based on your most recent blood pressure reading',
    options: [
      'Normal (< 120/80)',
      'Elevated (120-129/<80)',
      'Stage 1 Hypertension (130-139/80-89)',
      'Stage 2 Hypertension (>=140/>=90)',
      'Hypertensive Crisis (>180/>120)'
    ],
    resolveProgress: (answers) => {
      return answers[ScreenId.BLOOD_PRESSURE_CATEGORIES] === undefined ? ScreenId.BLOOD_PRESSURE_CATEGORIES : ScreenId.CURRENT_MEDICATIONS;
    },
  },
  [ScreenId.CURRENT_MEDICATIONS]: {
    id: ScreenId.CURRENT_MEDICATIONS,
    type: 'checkbox',
    prompt: 'Which medications are you currently prescribed?',
    options: ['ACE inhibitors', 'Beta blockers', 'Statins', 'Thyroid medication', 'GLP-1 receptor agonist'],
    resolveProgress: (answers) => {
      const meds = answers[ScreenId.CURRENT_MEDICATIONS];
      if (meds === undefined) return ScreenId.CURRENT_MEDICATIONS;
      return meds.includes('GLP-1 receptor agonist') ? ScreenId.FINAL_SCREEN : ScreenId.SMOKING_STATUS;
    },
  },
  [ScreenId.SMOKING_STATUS]: {
    id: ScreenId.SMOKING_STATUS,
    type: 'radio',
    prompt: 'Do you currently smoke tobacco?',
    options: ['Yes', 'No'],
    resolveProgress: (answers) => {
      return answers[ScreenId.SMOKING_STATUS] === undefined ? ScreenId.SMOKING_STATUS : ScreenId.ALCOHOL_USE_FREQUENCY;
    },
  },
  [ScreenId.ALCOHOL_USE_FREQUENCY]: {
    id: ScreenId.ALCOHOL_USE_FREQUENCY,
    type: 'radio',
    prompt: 'How often do you consume alcohol?',
    options: ['Never', 'Monthly', 'Weekly', 'Daily'],
    resolveProgress: (answers) => {
      return answers[ScreenId.ALCOHOL_USE_FREQUENCY] === undefined ? ScreenId.ALCOHOL_USE_FREQUENCY : ScreenId.PHYSICAL_ACTIVITY_LEVEL;
    },
  },
  [ScreenId.PHYSICAL_ACTIVITY_LEVEL]: {
    id: ScreenId.PHYSICAL_ACTIVITY_LEVEL,
    type: 'radio',
    prompt: 'How would you describe your typical activity level?',
    options: ['Sedentary', 'Light (1-2x/week)', 'Moderate (3-4x/week)', 'Vigorous (5+x/week)'],
    resolveProgress: (answers) => {
      return answers[ScreenId.PHYSICAL_ACTIVITY_LEVEL] === undefined ? ScreenId.PHYSICAL_ACTIVITY_LEVEL : ScreenId.DIETARY_HABITS;
    },
  },
  [ScreenId.DIETARY_HABITS]: {
    id: ScreenId.DIETARY_HABITS,
    type: 'checkbox',
    prompt: 'Which best describes your diet? (Select all that apply)',
    options: ['High sugar intake', 'High processed foods', 'Frequent sugary beverages', 'High fiber diet', 'Balanced diet'],
    resolveProgress: (answers) => {
      return answers[ScreenId.DIETARY_HABITS] === undefined ? ScreenId.DIETARY_HABITS : ScreenId.FINAL_SCREEN;
    },
  },
  [ScreenId.FINAL_SCREEN]: {
    id: ScreenId.FINAL_SCREEN,
    type: 'computed',
    prompt: null,
    resolveProgress: () => ScreenId.FINAL_SCREEN,
  },
};

/**
 * Global Deterministic Navigation Router.
 * Cascades through screens sequentially starting from AGE (Screen 1).
 */
export function determineCurrentActiveScreen(answers: Partial<FormResponse>): ScreenId {
  const recursivelyCheckScreen = (
    screenId: ScreenId,
    answers: Partial<FormResponse>,
  ) => {
    const outputTarget = FORM_ENGINE_SCHEMA[screenId].resolveProgress(answers);
    // If the screen indicates it's incomplete or forces a redirect, stop here immediately!
    if (outputTarget === screenId || screenId === ScreenId.FINAL_SCREEN) {
      return outputTarget;
    }
    return recursivelyCheckScreen(outputTarget, answers);
  };

  return recursivelyCheckScreen(ScreenId.AGE, answers);
}