import {
  FORM_ENGINE_SCHEMA,
  ScreenId,
  type FormResponse,
} from "@phoenixlabs/form-engine";

const MAX_GUARD = 32;

export function rebuildScreenHistory(
  savedAnswers: Partial<FormResponse>,
  currentScreenId: ScreenId
): ScreenId[] {
  const history: ScreenId[] = [];
  let screen: ScreenId = ScreenId.AGE;
  let guard = 0;

  while (guard++ < MAX_GUARD) {
    history.push(screen);
    if (screen === currentScreenId) break;
    const next = FORM_ENGINE_SCHEMA[screen].resolveProgress(savedAnswers);
    if (next === screen) break;
    screen = next;
  }

  return history;
}
