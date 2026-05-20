const NORMAL = "Normal (< 120/80)";

export const BP_CONFLICT_MESSAGE =
  "Normal blood pressure cannot be selected together with other categories.";

export function hasBloodPressureConflict(selected: string[]): boolean {
  if (!selected.includes(NORMAL)) return false;
  return selected.length > 1;
}
