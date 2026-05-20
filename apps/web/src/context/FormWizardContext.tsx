"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  FORM_ENGINE_SCHEMA,
  ScreenId,
  type EvaluationResult,
  type FormResponse,
} from "@phoenixlabs/form-engine";
import { getSession, startSession, submitAnswer } from "@/lib/session-api";
import { rebuildScreenHistory } from "@/lib/screen-history";
import {
  SESSION_STORAGE_KEY,
  type SessionStateResponse,
} from "@/lib/session-types";

type Phase = "landing" | "wizard" | "terminal";

type WizardContextValue = {
  phase: Phase;
  isHydrating: boolean;
  isSubmitting: boolean;
  sessionId: string | null;
  activeScreenId: ScreenId | null;
  answers: Partial<FormResponse>;
  screenHistory: ScreenId[];
  evaluationResult: EvaluationResult | null;
  validationError: string | null;
  draftAnswer: unknown;
  setDraftAnswer: (value: unknown) => void;
  beginSession: () => Promise<void>;
  goToNextStep: () => Promise<void>;
  goBackToPreviousStep: () => void;
};

const WizardContext = createContext<WizardContextValue | null>(null);

function applyServerState(
  res: SessionStateResponse,
  setters: {
    setSessionId: (id: string) => void;
    setAnswers: (a: Partial<FormResponse>) => void;
    setActiveScreenId: (id: ScreenId) => void;
    setScreenHistory: (h: ScreenId[]) => void;
    setEvaluationResult: (e: EvaluationResult | null) => void;
    setPhase: (p: Phase) => void;
  }
) {
  localStorage.setItem(SESSION_STORAGE_KEY, res.sessionId);
  setters.setSessionId(res.sessionId);
  setters.setAnswers(res.savedAnswers);
  setters.setActiveScreenId(res.currentScreenId);
  setters.setScreenHistory(
    rebuildScreenHistory(res.savedAnswers, res.currentScreenId)
  );
  setters.setEvaluationResult(res.evaluationResult);
  setters.setPhase(
    res.currentScreenId === ScreenId.FINAL_SCREEN ? "terminal" : "wizard"
  );
}

export function FormWizardProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("landing");
  const [isHydrating, setIsHydrating] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeScreenId, setActiveScreenId] = useState<ScreenId | null>(null);
  const [answers, setAnswers] = useState<Partial<FormResponse>>({});
  const [screenHistory, setScreenHistory] = useState<ScreenId[]>([]);
  const [evaluationResult, setEvaluationResult] =
    useState<EvaluationResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [draftAnswer, setDraftAnswer] = useState<unknown>(undefined);

  const syncDraftFromActiveScreen = useCallback(
    (screenId: ScreenId, saved: Partial<FormResponse>) => {
      setDraftAnswer(saved[screenId as keyof FormResponse]);
    },
    []
  );

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) {
      setIsHydrating(false);
      return;
    }
    getSession(stored)
      .then((res) =>
        applyServerState(res, {
          setSessionId,
          setAnswers,
          setActiveScreenId,
          setScreenHistory,
          setEvaluationResult,
          setPhase,
        })
      )
      .catch(() => localStorage.removeItem(SESSION_STORAGE_KEY))
      .finally(() => setIsHydrating(false));
  }, []);

  useEffect(() => {
    if (activeScreenId && activeScreenId !== ScreenId.FINAL_SCREEN) {
      syncDraftFromActiveScreen(activeScreenId, answers);
    }
  }, [activeScreenId, answers, syncDraftFromActiveScreen]);

  const beginSession = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const res = await startSession();
      applyServerState(res, {
        setSessionId,
        setAnswers,
        setActiveScreenId,
        setScreenHistory,
        setEvaluationResult,
        setPhase,
      });
      syncDraftFromActiveScreen(res.currentScreenId, res.savedAnswers);
    } finally {
      setIsSubmitting(false);
    }
  }, [syncDraftFromActiveScreen]);

  const goBackToPreviousStep = useCallback(() => {
    if (screenHistory.length <= 1 || !activeScreenId) return;
    const nextHistory = [...screenHistory];
    nextHistory.pop();
    const previous = nextHistory[nextHistory.length - 1]!;
    setScreenHistory(nextHistory);
    setActiveScreenId(previous);
    setPhase(previous === ScreenId.FINAL_SCREEN ? "terminal" : "wizard");
    setValidationError(null);
    syncDraftFromActiveScreen(previous, answers);
  }, [screenHistory, activeScreenId, answers, syncDraftFromActiveScreen]);

  const goToNextStep = useCallback(async () => {
    if (!sessionId || !activeScreenId || activeScreenId === ScreenId.FINAL_SCREEN)
      return;

    setValidationError(null);
    const normalized =
      FORM_ENGINE_SCHEMA[activeScreenId].type === "checkbox"
        ? Array.isArray(draftAnswer)
          ? draftAnswer
          : []
        : draftAnswer;

    if (
      normalized === undefined ||
      normalized === "" ||
      (typeof normalized === "number" && Number.isNaN(normalized))
    ) {
      setValidationError("Please complete this question before continuing.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitAnswer({
        sessionId,
        screenId: activeScreenId,
        answer: normalized,
      });
      applyServerState(res, {
        setSessionId,
        setAnswers: setAnswers,
        setActiveScreenId,
        setScreenHistory,
        setEvaluationResult,
        setPhase,
      });
      if (res.currentScreenId !== ScreenId.FINAL_SCREEN) {
        syncDraftFromActiveScreen(res.currentScreenId, res.savedAnswers);
      }
    } catch {
      setValidationError("Unable to save your answer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [sessionId, activeScreenId, draftAnswer, syncDraftFromActiveScreen]);

  const value = useMemo<WizardContextValue>(
    () => ({
      phase,
      isHydrating,
      isSubmitting,
      sessionId,
      activeScreenId,
      answers,
      screenHistory,
      evaluationResult,
      validationError,
      draftAnswer,
      setDraftAnswer,
      beginSession,
      goToNextStep,
      goBackToPreviousStep,
    }),
    [
      phase,
      isHydrating,
      isSubmitting,
      sessionId,
      activeScreenId,
      answers,
      screenHistory,
      evaluationResult,
      validationError,
      draftAnswer,
      beginSession,
      goToNextStep,
      goBackToPreviousStep,
    ]
  );

  return (
    <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
  );
}

export function useFormWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) {
    throw new Error("useFormWizard must be used within FormWizardProvider");
  }
  return ctx;
}
