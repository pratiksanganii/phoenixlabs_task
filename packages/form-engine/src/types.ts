export enum ScreenId {
  AGE = "AGE",
  WEIGHT = "WEIGHT",
  HEIGHT = "HEIGHT",
  BMI = "BMI",
  PREGNANCY_STATUS = "PREGNANCY_STATUS",
  COMORBID_CONDITIONS = "COMORBID_CONDITIONS",
  DIABETES_HISTORY = "DIABETES_HISTORY",
  MOST_RECENT_HbA1c = "MOST_RECENT_HbA1c",
  BLOOD_PRESSURE_CATEGORIES = "BLOOD_PRESSURE_CATEGORIES",
  CURRENT_MEDICATIONS = "CURRENT_MEDICATIONS",
  SMOKING_STATUS = "SMOKING_STATUS",
  ALCOHOL_USE_FREQUENCY = "ALCOHOL_USE_FREQUENCY",
  PHYSICAL_ACTIVITY_LEVEL = "PHYSICAL_ACTIVITY_LEVEL",
  DIETARY_HABITS = "DIETARY_HABITS",
  FINAL_SCREEN = "FINAL_SCREEN",
}

// ==========================================
// 🎯 Strict Option Subtypes
// ==========================================

export type ComorbidCondition =
  | "Hypertension"
  | "Dyslipidemia"
  | "Sleep Apnea"
  | "GERD"
  | "Thyroid Disorder";

export type BloodPressureCategory =
  | "Normal (< 120/80)"
  | "Elevated (120-129/<80)"
  | "Stage 1 Hypertension (130-139/80-89)"
  | "Stage 2 Hypertension (>=140/>=90)"
  | "Hypertensive Crisis (>180/>120)";

export type CurrentMedication =
  | "ACE inhibitors"
  | "Beta blockers"
  | "Statins"
  | "Thyroid medication"
  | "GLP-1 receptor agonist";

export type AlcoholFrequency = "Never" | "Monthly" | "Weekly" | "Daily";

export type PhysicalActivity =
  | "Sedentary"
  | "Light (1-2x/week)"
  | "Moderate (3-4x/week)"
  | "Vigorous (5+x/week)";

export type DietaryHabit =
  | "High sugar intake"
  | "High processed foods"
  | "Frequent sugary beverages"
  | "High fiber diet"
  | "Balanced diet";

// ==========================================
// 📑 Strongly Typed Form Responses
// ==========================================

export interface FormResponse {
  [ScreenId.AGE]: number;
  [ScreenId.WEIGHT]: number; // In kg
  [ScreenId.HEIGHT]: number; // In cm
  [ScreenId.BMI]: number; // Computed field
  [ScreenId.PREGNANCY_STATUS]: "Yes" | "No"; // Changed from boolean for exact matching with text labels
  [ScreenId.COMORBID_CONDITIONS]: ComorbidCondition[];
  [ScreenId.DIABETES_HISTORY]: "Yes" | "No";
  [ScreenId.MOST_RECENT_HbA1c]: number;
  [ScreenId.BLOOD_PRESSURE_CATEGORIES]: BloodPressureCategory[];
  [ScreenId.CURRENT_MEDICATIONS]: CurrentMedication[];
  [ScreenId.SMOKING_STATUS]: "Yes" | "No";
  [ScreenId.ALCOHOL_USE_FREQUENCY]: AlcoholFrequency;
  [ScreenId.PHYSICAL_ACTIVITY_LEVEL]: PhysicalActivity;
  [ScreenId.DIETARY_HABITS]: DietaryHabit[];
}

// =============================================
// 🏁 Evaluation & Session Status Engine Types
// =============================================

export type EligibilityOutcome =
  | "Eligible"
  | "Ineligible"
  | "Requires Clinical Review";

export interface EvaluationResult {
  outcome: EligibilityOutcome;
  reason: string;
}

/**
 * Shared Type for API Engine payloads.
 * This ensures NestJS return types explicitly match what Next.js expects.
 */
export interface SessionStateResponse {
  sessionId: string;
  currentScreenId: ScreenId | "COMPLETED";
  previousScreenId: ScreenId | null;
  savedAnswers: FormResponse;
  nextStep: {
    type: "QUESTION" | "END_STATE";
    screenId?: ScreenId;
    evaluation?: EvaluationResult;
  };
}
