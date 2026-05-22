"use client";

import {
  Button,
  Card,
  CardContent,
  CardFooter,
} from "@phoenixlabs/ui";
import {
  FormWizardProvider,
  useFormWizard,
} from "@/context/FormWizardContext";
import { getStepLabel } from "@/lib/screen-meta";
import { EvaluationDashboard } from "./EvaluationDashboard";
import { QuestionRenderer } from "./QuestionRenderer";
import { WizardSkeleton } from "./WizardSkeleton";

function WizardFrame() {
  const {
    phase,
    isHydrating,
    isSubmitting,
    activeScreenId,
    screenHistory,
    evaluationResult,
    beginSession,
    goToNextStep,
    goBackToPreviousStep,
  } = useFormWizard();

  if (isHydrating) {
    return (
      <main className="min-h-screen bg-brand-surface px-4 py-12">
        <WizardSkeleton />
      </main>
    );
  }

  if (phase === "landing") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-brand-surface px-4">
        <Card className="max-w-lg text-center">
          <CardContent className="space-y-4">
            <p className="text-sm uppercase tracking-widest text-brand-muted">
              PhoenixLabs Clinical Screening
            </p>
            <h1 className="text-3xl font-semibold text-slate-50">
              GLP-1 Eligibility Questionnaire
            </h1>
            <p className="text-slate-300">
              Anonymous, secure, and resumable on any device.
            </p>
            <Button
              onClick={beginSession}
              isLoading={isSubmitting}
              data-testid="start-session"
            >
              Begin Screening
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (phase === "terminal" && evaluationResult) {
    return (
      <main className="min-h-screen bg-brand-surface px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <EvaluationDashboard result={evaluationResult} />
        </div>
      </main>
    );
  }

  if (!activeScreenId) return null;

  const { step, total, title } = getStepLabel(
    activeScreenId,
    screenHistory.length
  );
  const canGoBack = screenHistory.length > 1;

  return (
    <main className="min-h-screen bg-brand-surface px-4 py-10">
      <div className="mx-auto max-w-xl">
        <p
          className="mb-2 text-sm text-brand-muted"
          data-testid="step-indicator"
        >
          Question {step} of {total}
        </p>
        <h1 className="mb-6 text-2xl font-semibold text-slate-50">{title}</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            goToNextStep();
          }}
        >
          <Card>
            <CardContent>
              <QuestionRenderer />
            </CardContent>
            <CardFooter>
              <Button
                type="button"
                variant="outline"
                onClick={goBackToPreviousStep}
                disabled={!canGoBack || isSubmitting}
                data-testid="wizard-back"
              >
                Back
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting}
                data-testid="wizard-next"
              >
                Next
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </main>
  );
}

export function FormWizardApp() {
  return (
    <FormWizardProvider>
      <WizardFrame />
    </FormWizardProvider>
  );
}
