import { ScreenId } from "@phoenixlabs/form-engine";

const USER_FACING_SCREENS: ScreenId[] = [
  ScreenId.AGE,
  ScreenId.WEIGHT,
  ScreenId.HEIGHT,
  ScreenId.PREGNANCY_STATUS,
  ScreenId.COMORBID_CONDITIONS,
  ScreenId.DIABETES_HISTORY,
  ScreenId.MOST_RECENT_HbA1c,
  ScreenId.BLOOD_PRESSURE_CATEGORIES,
  ScreenId.CURRENT_MEDICATIONS,
  ScreenId.SMOKING_STATUS,
  ScreenId.ALCOHOL_USE_FREQUENCY,
  ScreenId.PHYSICAL_ACTIVITY_LEVEL,
  ScreenId.DIETARY_HABITS,
];

const TITLE: Partial<Record<ScreenId, string>> = {
  [ScreenId.AGE]: "Age",
  [ScreenId.WEIGHT]: "Weight",
  [ScreenId.HEIGHT]: "Height",
  [ScreenId.PREGNANCY_STATUS]: "Pregnancy",
  [ScreenId.COMORBID_CONDITIONS]: "Comorbid conditions",
  [ScreenId.DIABETES_HISTORY]: "Diabetes history",
  [ScreenId.MOST_RECENT_HbA1c]: "HbA1c",
  [ScreenId.BLOOD_PRESSURE_CATEGORIES]: "Blood pressure",
  [ScreenId.CURRENT_MEDICATIONS]: "Medications",
  [ScreenId.SMOKING_STATUS]: "Smoking",
  [ScreenId.ALCOHOL_USE_FREQUENCY]: "Alcohol use",
  [ScreenId.PHYSICAL_ACTIVITY_LEVEL]: "Physical activity",
  [ScreenId.DIETARY_HABITS]: "Diet",
};

export function getStepLabel(activeScreenId: ScreenId, historyLength: number) {
  const index = USER_FACING_SCREENS.indexOf(activeScreenId);
  const step = index >= 0 ? index + 1 : historyLength;
  return {
    step,
    total: USER_FACING_SCREENS.length,
    title: TITLE[activeScreenId] ?? "Screening",
  };
}
