"use client";

import { useEffect, useRef } from "react";
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

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeScreenId) return;
    const timer = setTimeout(() => {
      const input = containerRef.current?.querySelector("input");
      if (input) {
        input.focus();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [activeScreenId]);

  if (!activeScreenId || activeScreenId === ScreenId.FINAL_SCREEN) return null;

  const config = FORM_ENGINE_SCHEMA[activeScreenId];
  const prompt = config.prompt ?? "";

  let content = null;

  if (config.type === "number") {
    content = (
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
  } else if (config.type === "radio" && config.options) {
    content = (
      <div className="space-y-4">
        <RadioGroup
          name={activeScreenId}
          value={typeof draftAnswer === "string" ? draftAnswer : undefined}
          onChange={setDraftAnswer}
          legend={prompt}
        >
          {config.options.map((opt) => (
            <RadioOption key={opt} value={opt} label={opt} />
          ))}
        </RadioGroup>
        <p
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          data-testid={validationError ? "validation-error" : undefined}
          className={`text-sm text-brand-error transition-all duration-150 ${
            validationError ? "opacity-100 mt-2" : "h-0 overflow-hidden opacity-0"
          }`}
        >
          {validationError || ""}
        </p>
      </div>
    );
  } else if (config.type === "checkbox" && config.options) {
    const selected = Array.isArray(draftAnswer) ? (draftAnswer as string[]) : [];
    content = (
      <div className="space-y-4">
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
          legend={prompt}
        >
          {config.options.map((opt) => (
            <CheckboxOption key={opt} value={opt} label={opt} />
          ))}
        </CheckboxGroup>
        <p
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          data-testid={validationError ? "validation-error" : undefined}
          className={`text-sm text-brand-error transition-all duration-150 ${
            validationError ? "opacity-100 mt-2" : "h-0 overflow-hidden opacity-0"
          }`}
        >
          {validationError || ""}
        </p>
      </div>
    );
  }

  if (!content) return null;

  return <div ref={containerRef}>{content}</div>;
}
