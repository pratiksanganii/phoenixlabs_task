import { determineCurrentActiveScreen, evaluateEligibility } from './index';
import { ScreenId, FormResponse } from './types';

function runManualTest(testName: string, answers: Partial<FormResponse>) {
  console.log(`\n==================================================`);
  console.log(`🧪 TEST CASE: ${testName}`);
  console.log(`==================================================`);
  
  try {
    // 1. Run your deterministic waterfall router to see where the user lands
    const activeScreen = determineCurrentActiveScreen(answers);
    console.log(`📍 Router Decision  -> Next Screen: \x1b[36m${activeScreen}\x1b[0m`);

    // 2. Run your pure clinical evaluator to check the diagnostic outcome
    const assessment = evaluateEligibility(answers);
    
    let outcomeColor = '\x1b[32m'; // Green for Eligible
    if (assessment.outcome === 'Ineligible') outcomeColor = '\x1b[31m'; // Red
    if (assessment.outcome === 'Requires Clinical Review') outcomeColor = '\x1b[33m'; // Yellow

    console.log(`⚖️  Clinical Verdict -> Outcome: ${outcomeColor}${assessment.outcome}\x1b[0m`);
    console.log(`💬 Diagnostic Note  -> Reason: ${assessment.reason}`);
    
  } catch (error: any) {
    // Catch-block intercepts the validation errors cleanly and continues execution
    console.log(`❌ \x1b[31mValidation Catch -> Execution Halted:\x1b[0m`);
    console.log(`⚠️  \x1b[33mReason:\x1b[0m ${error.message}`);
  }
}

// ------------------------------------------------------------------
// 📊 SCENARIO 1: Incomplete Form (User is currently midway)
// ------------------------------------------------------------------
runManualTest('Mid-flow User (Completed up to Screen 3, Height)', {
  [ScreenId.AGE]: 28,
  [ScreenId.WEIGHT]: 80,
  [ScreenId.HEIGHT]: 175,
  // This will show NEXT SCREEN -> BMI, but evaluating it will throw an error
  // because downstream validation fields are missing.
});

// ------------------------------------------------------------------
// 📊 SCENARIO 2: Immediate Hard Exclusion (Underage Short-Circuit)
// ------------------------------------------------------------------
runManualTest('Underage Patient (Age 16 - Should resolve cleanly without errors)', {
  [ScreenId.AGE]: 16,
});

// ------------------------------------------------------------------
// 📊 SCENARIO 3: Conditional Routing Bypass (Diabetes vs No Diabetes)
// ------------------------------------------------------------------
runManualTest('Patient without Diabetes (Should completely bypass HbA1c screen validation)', {
  [ScreenId.AGE]: 45,
  [ScreenId.WEIGHT]: 90,
  [ScreenId.HEIGHT]: 170,
  [ScreenId.PREGNANCY_STATUS]: 'No',
  [ScreenId.COMORBID_CONDITIONS] : ['GERD'],
  [ScreenId.DIABETES_HISTORY]: 'No', // Causes the waterfall router to skip MOST_RECENT_HbA1c verification
});

// ------------------------------------------------------------------
// 📊 SCENARIO 4: Fully Eligible Complete Form Path
// ------------------------------------------------------------------
runManualTest('Healthy / Fully Eligible Patient Path', {
  [ScreenId.AGE]: 35,
  [ScreenId.WEIGHT]: 85,
  [ScreenId.HEIGHT]: 170,
  [ScreenId.PREGNANCY_STATUS]: 'No',
  [ScreenId.COMORBID_CONDITIONS]: ['GERD'],
  [ScreenId.DIABETES_HISTORY]: 'No',
  [ScreenId.BLOOD_PRESSURE_CATEGORIES]: ['Normal (< 120/80)'],
  [ScreenId.CURRENT_MEDICATIONS]: ['Statins'],
  [ScreenId.SMOKING_STATUS]: 'No',
  [ScreenId.ALCOHOL_USE_FREQUENCY]: 'Weekly',
  [ScreenId.PHYSICAL_ACTIVITY_LEVEL]: 'Moderate (3-4x/week)',
  [ScreenId.DIETARY_HABITS]: ['Balanced diet'],
});

// ------------------------------------------------------------------
// 📊 SCENARIO 5: Complex Custom Risk Variable Cluster
// ------------------------------------------------------------------
runManualTest('Complex Risk Factor (Stage 1 HTN + Sedentary + High Sugar)', {
  [ScreenId.AGE]: 40,
  [ScreenId.WEIGHT]: 88,
  [ScreenId.HEIGHT]: 172,
  [ScreenId.PREGNANCY_STATUS]: 'No',
  [ScreenId.COMORBID_CONDITIONS]: [],
  [ScreenId.DIABETES_HISTORY]: 'No',
  [ScreenId.BLOOD_PRESSURE_CATEGORIES]: ['Stage 1 Hypertension (130-139/80-89)'],
  [ScreenId.CURRENT_MEDICATIONS]: [],
  [ScreenId.SMOKING_STATUS]: 'No',
  [ScreenId.ALCOHOL_USE_FREQUENCY]: 'Never',
  [ScreenId.PHYSICAL_ACTIVITY_LEVEL]: 'Sedentary',
  [ScreenId.DIETARY_HABITS]: ['High sugar intake'],
});