import { describe, it, expect } from 'vitest';
import { determineCurrentActiveScreen, evaluateEligibility } from './index';
import { ScreenId, FormResponse } from './types';

describe('📋 GLP-1 Form Engine - Stateful Waterfall Router', () => {
  it('should hold the user at Screen 1 (AGE) if no answers are supplied', () => {
    const activeScreen = determineCurrentActiveScreen({});
    expect(activeScreen).toBe(ScreenId.AGE);
  });

  it('should forward to Screen 2 (WEIGHT) if an eligible age is supplied', () => {
    const activeScreen = determineCurrentActiveScreen({ [ScreenId.AGE]: 25 });
    expect(activeScreen).toBe(ScreenId.WEIGHT);
  });

  it('should short-circuit straight to FINAL_SCREEN if the user is underage (< 18)', () => {
    const activeScreen = determineCurrentActiveScreen({ [ScreenId.AGE]: 16 });
    expect(activeScreen).toBe(ScreenId.FINAL_SCREEN);
  });

  it('should compute BMI and short-circuit to FINAL_SCREEN if BMI is lower than 25', () => {
    const activeScreen = determineCurrentActiveScreen({
      [ScreenId.AGE]: 30,
      [ScreenId.WEIGHT]: 50,
      [ScreenId.HEIGHT]: 175, // BMI is ~16.3
    });
    expect(activeScreen).toBe(ScreenId.FINAL_SCREEN);
  });

  it('should successfully bypass the HbA1c input screen if Diabetes History is "No"', () => {
    const activeScreen = determineCurrentActiveScreen({
      [ScreenId.AGE]: 30,
      [ScreenId.WEIGHT]: 95,
      [ScreenId.HEIGHT]: 175, // BMI is ~31.0 (Eligible)
      [ScreenId.PREGNANCY_STATUS]: 'No',
      [ScreenId.COMORBID_CONDITIONS]: [],
      [ScreenId.DIABETES_HISTORY]: 'No',
    });
    // Should skip Screen 8 (MOST_RECENT_HbA1c) and ask for Screen 9 (BLOOD_PRESSURE_CATEGORIES)
    expect(activeScreen).toBe(ScreenId.BLOOD_PRESSURE_CATEGORIES);
  });

  it('should route into the HbA1c input screen if Diabetes History is "Yes"', () => {
    const activeScreen = determineCurrentActiveScreen({
      [ScreenId.AGE]: 30,
      [ScreenId.WEIGHT]: 95,
      [ScreenId.HEIGHT]: 175,
      [ScreenId.PREGNANCY_STATUS]: 'No',
      [ScreenId.COMORBID_CONDITIONS]: [],
      [ScreenId.DIABETES_HISTORY]: 'Yes',
    });
    expect(activeScreen).toBe(ScreenId.MOST_RECENT_HbA1c);
  });
});

describe('⚖️  GLP-1 Form Engine - Clinical Eligibility Evaluator', () => {
  
  describe('⛔ Category A: Immediate Ineligibility Constraints', () => {
    it('should accurately reject an underage profile', () => {
      const res = evaluateEligibility({ [ScreenId.AGE]: 17 });
      expect(res.outcome).toBe('Ineligible');
      expect(res.reason).toContain('underage');
    });

    it('should accurately reject a profile with a BMI under 25', () => {
      const res = evaluateEligibility({
        [ScreenId.AGE]: 25,
        [ScreenId.WEIGHT]: 55,
        [ScreenId.HEIGHT]: 170, // BMI ~19
      });
      expect(res.outcome).toBe('Ineligible');
      expect(res.reason).toContain('Body Mass Index');
    });

    it('should accurately reject a profile due to pregnancy contraindication', () => {
      const res = evaluateEligibility({
        [ScreenId.AGE]: 25,
        [ScreenId.WEIGHT]: 90,
        [ScreenId.HEIGHT]: 170,
        [ScreenId.PREGNANCY_STATUS]: 'Yes',
      });
      expect(res.outcome).toBe('Ineligible');
      expect(res.reason).toContain('pregnancy');
    });

    it('should accurately reject a diabetic profile with an HbA1c greater than 9.0%', () => {
      const res = evaluateEligibility({
        [ScreenId.AGE]: 35,
        [ScreenId.WEIGHT]: 95,
        [ScreenId.HEIGHT]: 170,
        [ScreenId.PREGNANCY_STATUS]: 'No',
        [ScreenId.COMORBID_CONDITIONS]: [],
        [ScreenId.DIABETES_HISTORY]: 'Yes',
        [ScreenId.MOST_RECENT_HbA1c]: 9.5,
      });
      expect(res.outcome).toBe('Ineligible');
      expect(res.reason).toContain('Uncontrolled diabetes');
    });
  });

  describe('⚠️ Category B: Automatic Clinical Review Triggers', () => {
    it('should flag a clinical review if the user is already on a concurrent GLP-1 agonist', () => {
      const res = evaluateEligibility({
        [ScreenId.AGE]: 35,
        [ScreenId.WEIGHT]: 95,
        [ScreenId.HEIGHT]: 170,
        [ScreenId.PREGNANCY_STATUS]: 'No',
        [ScreenId.COMORBID_CONDITIONS]: [],
        [ScreenId.DIABETES_HISTORY]: 'No',
        [ScreenId.BLOOD_PRESSURE_CATEGORIES]: [],
        [ScreenId.CURRENT_MEDICATIONS]: ['GLP-1 receptor agonist'],
      });
      expect(res.outcome).toBe('Requires Clinical Review');
      expect(res.reason).toContain('concurrent GLP-1 therapy');
    });

    it('should flag a clinical review for geriatric profiles (> 75)', () => {
      const res = evaluateEligibility({
        [ScreenId.AGE]: 78,
        [ScreenId.WEIGHT]: 90,
        [ScreenId.HEIGHT]: 170,
        [ScreenId.PREGNANCY_STATUS]: 'No',
        [ScreenId.COMORBID_CONDITIONS]: [],
        [ScreenId.DIABETES_HISTORY]: 'No',
        [ScreenId.BLOOD_PRESSURE_CATEGORIES]: [],
        [ScreenId.CURRENT_MEDICATIONS]: [],
        [ScreenId.SMOKING_STATUS]: 'No',
        [ScreenId.ALCOHOL_USE_FREQUENCY]: 'Never',
        [ScreenId.PHYSICAL_ACTIVITY_LEVEL]: 'Moderate (3-4x/week)',
      });
      expect(res.outcome).toBe('Requires Clinical Review');
      expect(res.reason).toContain('Geriatric population');
    });

    it('should flag a clinical review for high-risk intersecting conditions (Stage 2 HTN + Diabetes)', () => {
      const res = evaluateEligibility({
        [ScreenId.AGE]: 40,
        [ScreenId.WEIGHT]: 95,
        [ScreenId.HEIGHT]: 170,
        [ScreenId.PREGNANCY_STATUS]: 'No',
        [ScreenId.COMORBID_CONDITIONS]: [],
        [ScreenId.DIABETES_HISTORY]: 'Yes',
        [ScreenId.MOST_RECENT_HbA1c]: 7.0, // Stable diabetes
        [ScreenId.BLOOD_PRESSURE_CATEGORIES]: ['Stage 2 Hypertension (>=140/>=90)'],
        [ScreenId.CURRENT_MEDICATIONS]: [],
        [ScreenId.SMOKING_STATUS]: 'No',
        [ScreenId.ALCOHOL_USE_FREQUENCY]: 'Never',
        [ScreenId.PHYSICAL_ACTIVITY_LEVEL]: 'Moderate (3-4x/week)',
      });
      expect(res.outcome).toBe('Requires Clinical Review');
      expect(res.reason).toContain('cardiovascular intersect');
    });
  });

  describe('🔬 Category C: Complex Downstream Lifestyle Risk Clusters', () => {
    it('should trigger clinical review for metabolic risk cluster (Stage 1 HTN + Sedentary + Sugar Diet)', () => {
      const res = evaluateEligibility({
        [ScreenId.AGE]: 32,
        [ScreenId.WEIGHT]: 88,
        [ScreenId.HEIGHT]: 170,
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
      expect(res.outcome).toBe('Requires Clinical Review');
      expect(res.reason).toContain('Metabolic syndrome risk cluster');
    });
  });

  describe('🛡️ Data Integrity Defensiveness', () => {
    it('should throw an explicit error if critical upstream inputs are evaluated with missing fields', () => {
      expect(() => evaluateEligibility({ [ScreenId.AGE]: 25 })).toThrowError(
        'Height and weight measurements are required'
      );
    });
  });
});