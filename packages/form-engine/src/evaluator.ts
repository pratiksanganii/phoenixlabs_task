import { FormResponse, EvaluationResult } from './types';
import { ScreenId } from './types';

/**
 * Pure function that evaluates the screening inputs against cascading clinical parameters.
 * Validates data progressively to allow safe early-exit assessments without throwing errors.
 */
export function evaluateEligibility(answers: Partial<FormResponse>): EvaluationResult {
  // ==========================================================
  // 📍 STEP 1: Screen 1 - Age Verification Check
  // ==========================================================
  const age = answers[ScreenId.AGE];
  if (age === undefined) {
    throw new Error('Incomplete Clinical Data: Missing age entry.');
  }
  if (age < 18) {
    return { outcome: 'Ineligible', reason: 'Patient is underage (under 18).' };
  }

  // ==========================================================
  // 📍 STEP 2: Screens 2 to 4 - Body Mass Index (BMI) Verification
  // ==========================================================
  const weight = answers[ScreenId.WEIGHT];
  const height = answers[ScreenId.HEIGHT];
  
  if (weight === undefined || height === undefined) {
    throw new Error('Incomplete Clinical Data: Height and weight measurements are required.');
  }
  if (height <= 0) {
    throw new Error('Invalid Input Data: Height measurement must be a non-zero positive integer value.');
  }

  const bmi = weight / Math.pow(height / 100, 2);
  if (bmi < 25) {
    return { outcome: 'Ineligible', reason: 'Body Mass Index (BMI) is below eligible clinical thresholds (less than 25).' };
  }

  // ==========================================================
  // 📍 STEP 3: Screen 5 - Pregnancy Status Check
  // ==========================================================
  const pregnancy = answers[ScreenId.PREGNANCY_STATUS];
  if (pregnancy === undefined) {
    throw new Error('Incomplete Clinical Data: Pregnancy verification is required.');
  }
  if (pregnancy === 'Yes') {
    return { outcome: 'Ineligible', reason: 'GLP-1 medications are strictly contraindicated during pregnancy.' };
  }

  // ==========================================================
  // 📍 STEP 4: Screen 6 & 7 - Comorbidities & Diabetes History Setup
  // ==========================================================
  const comorbidities = answers[ScreenId.COMORBID_CONDITIONS] ?? [];
  const hasDiabetes = answers[ScreenId.DIABETES_HISTORY];
  
  if (hasDiabetes === undefined) {
    throw new Error('Incomplete Clinical Data: Diabetes status verification is required.');
  }

  // ==========================================================
  // 📍 STEP 5: Screen 8 - HbA1c Glycemic Evaluation (Conditional)
  // ==========================================================
  const hba1c = answers[ScreenId.MOST_RECENT_HbA1c];
  if (hasDiabetes === 'Yes') {
    if (hba1c === undefined) {
      throw new Error('Incomplete Clinical Data: Missing HbA1c percentage marker for confirmed diabetic sequence.');
    }
    if (hba1c > 9.0) {
      return { outcome: 'Ineligible', reason: 'Uncontrolled diabetes with HbA1c greater than 9.0% requires acute specialist management.' };
    }
  }

  // ==========================================================
  // 📍 STEP 6: Screen 9 & 10 - Blood Pressure & Medications Check
  // ==========================================================
  const bpCategories = answers[ScreenId.BLOOD_PRESSURE_CATEGORIES] ?? [];
  const medications = answers[ScreenId.CURRENT_MEDICATIONS] ?? [];

  if (medications.includes('GLP-1 receptor agonist')) {
    return { outcome: 'Requires Clinical Review', reason: 'Patient is already undergoing concurrent GLP-1 therapy.' };
  }

  // ==========================================================
  // 📍 STEP 7: Screens 11 to 14 - Downstream Behavioral Metrics
  // ==========================================================
  const smoking = answers[ScreenId.SMOKING_STATUS];
  const alcohol = answers[ScreenId.ALCOHOL_USE_FREQUENCY];
  const activity = answers[ScreenId.PHYSICAL_ACTIVITY_LEVEL];
  const diet = answers[ScreenId.DIETARY_HABITS] ?? [];

  if (smoking === undefined || alcohol === undefined || activity === undefined) {
    throw new Error('Incomplete Clinical Data: Finalizing screening requires behavioral health markers (Smoking, Alcohol, and Activity levels).');
  }

  // ==========================================================
  // ⚖️ STEP 8: Screen 15 - Complex Global Scoring Rules
  // ==========================================================
  
  // Automatic Review Rules
  if (age > 75) return { outcome: 'Requires Clinical Review', reason: 'Geriatric population limits (over 75) require individualized care reviews.' };
  if (bmi >= 40) return { outcome: 'Requires Clinical Review', reason: 'Class III severe obesity (BMI >= 40) warrants multi-disciplinary clinical evaluation.' };
  if (comorbidities.length >= 3) return { outcome: 'Requires Clinical Review', reason: 'High comorbidity saturation (3 or more active chronic diagnoses).' };
  if (bpCategories.includes('Hypertensive Crisis (>180/>120)')) return { outcome: 'Requires Clinical Review', reason: 'Hypertensive Crisis reading detected; immediate therapeutic monitoring needed.' };
  if (bpCategories.includes('Stage 2 Hypertension (>=140/>=90)') && hasDiabetes === 'Yes') {
    return { outcome: 'Requires Clinical Review', reason: 'High-risk cardiovascular intersect: Concurrent Stage 2 Hypertension and Diabetes.' };
  }

  // Conditional Review Matrix (Metabolic & Lifestyle Risk Clusters)
  const isStage1HTN = bpCategories.includes('Stage 1 Hypertension (130-139/80-89)');
  const isSedentary = activity === 'Sedentary';
  const hasHighSugar = diet.includes('High sugar intake');
  
  if (isStage1HTN && isSedentary && hasHighSugar) {
    return { outcome: 'Requires Clinical Review', reason: 'Metabolic syndrome risk cluster: Stage 1 Hypertension paired with low mobility and high glucose intake.' };
  }
  
  if (alcohol === 'Daily') {
    const hasSmokingRisk = smoking === 'Yes';
    const hasComorbidRisk = comorbidities.length > 0;
    const hasElevatedBPRisk = bpCategories.length > 0 && !bpCategories.includes('Normal (< 120/80)');
    
    if (hasSmokingRisk || hasComorbidRisk || hasElevatedBPRisk) {
      return { outcome: 'Requires Clinical Review', reason: 'Hepatic and metabolic risk variance: Daily alcohol intake combined with secondary risk vectors.' };
    }
  }

  // Clear Path Approval
  return { outcome: 'Eligible', reason: 'Patient meets baseline criteria for safe GLP-1 weight-loss therapy coordination.' };
}