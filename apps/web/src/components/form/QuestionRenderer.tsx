"use client";

import {
  FORM_ENGINE_SCHEMA,
  ScreenId,
  type FormResponse,
} from "@phoenixlabs/form-engine";
import {
  CheckboxGroup,
  CheckboxOption,
  Input,
  RadioGroup,
  RadioOption,
} from "@phoenixlabs/ui";
import { useFormWizard } from "@/context/FormWizardContext";
import {
  BP_CONFLICT_MESSAGE,
  hasBloodPressureConflict,
} from "@/lib/blood-pressure-validation";

const NUMERIC_SUFFIX: Partial<Record<ScreenId, string>> = {
  [ScreenId.AGE]: "years",
  [ScreenId.WEIGHT]: "kg",
  [ScreenId.HEIGHT]: "cm",
  [ScreenId.MOST_RECENT_HbA1c]: "%",
};

export function QuestionRenderer() {
  const {
    activeScreenId,
    draftAnswer,
    setDraftAnswer,
    validationError,
    clearValidationError,
    reportValidationError,
  } = useFormWizard();

  if (!activeScreenId || activeScreenId === ScreenId.FINAL_SCREEN) return null;

  const config = FORM_ENGINE_SCHEMA[activeScreenId];
  const prompt = config.prompt ?? "";

  if (config.type === "number") {
    return (
      <Input
        id={activeScreenId}
        label={prompt}
        type="number"
        inputMode="decimal"
        suffix={NUMERIC_SUFFIX[activeScreenId]}
        value={draftAnswer === undefined ? "" : String(draftAnswer)}
        onChange={(e) =>
          setDraftAnswer(
            e.target.value === "" ? undefined : Number(e.target.value)
          )
        }
        error={validationError ?? undefined}
        data-testid={`question-${activeScreenId}`}
      />
    );
  }

  if (config.type === "radio" && config.options) {
    return (
      <div className="space-y-4">
        <p className="text-lg font-medium text-slate-100">{prompt}</p>
        <RadioGroup
          name={activeScreenId}
          value={typeof draftAnswer === "string" ? draftAnswer : undefined}
          onChange={setDraftAnswer}
        >
          {config.options.map((opt) => (
            <RadioOption key={opt} value={opt} label={opt} />
          ))}
        </RadioGroup>
        {validationError ? (
          <p
            role="alert"
            data-testid="validation-error"
            className="text-sm text-brand-error"
          >
            {validationError}
          </p>
        ) : null}
      </div>
    );
  }

  if (config.type === "checkbox" && config.options) {
    const selected = Array.isArray(draftAnswer) ? (draftAnswer as string[]) : [];
    return (
      <div className="space-y-4">
        <p className="text-lg font-medium text-slate-100">{prompt}</p>
        <CheckboxGroup
          value={selected}
          onChange={(vals) => {
            setDraftAnswer(vals as FormResponse[typeof activeScreenId]);
            if (activeScreenId === ScreenId.BLOOD_PRESSURE_CATEGORIES) {
              if (hasBloodPressureConflict(vals)) {
                reportValidationError(BP_CONFLICT_MESSAGE);
              } else {
                clearValidationError();
              }
            }
          }}
        >
          {config.options.map((opt) => (
            <CheckboxOption key={opt} value={opt} label={opt} />
          ))}
        </CheckboxGroup>
        {validationError ? (
          <p
            role="alert"
            data-testid="validation-error"
            className="text-sm text-brand-error"
          >
            {validationError}
          </p>
        ) : null}
      </div>
    );
  }

  return null;
}
