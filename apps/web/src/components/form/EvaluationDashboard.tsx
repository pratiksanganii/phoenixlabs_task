"use client";

import type { EvaluationResult } from "@phoenixlabs/form-engine";
import { Card, CardContent } from "@phoenixlabs/ui";
import { Activity, AlertTriangle, CheckCircle2 } from "lucide-react";

const STYLES = {
  Eligible: {
    border: "border-brand-success/40",
    bg: "bg-brand-success/10",
    icon: CheckCircle2,
    heading: "Eligible for GLP-1 Therapy",
  },
  Ineligible: {
    border: "border-brand-error/40",
    bg: "bg-brand-error/10",
    icon: AlertTriangle,
    heading: "Not Eligible",
  },
  "Requires Clinical Review": {
    border: "border-brand-warning/40",
    bg: "bg-brand-warning/10",
    icon: Activity,
    heading: "Requires Clinical Review",
  },
} as const;

const OUTCOME_TEST_ID: Record<EvaluationResult["outcome"], string> = {
  Eligible: "status-eligible",
  Ineligible: "status-ineligible",
  "Requires Clinical Review": "status-requires-review",
};

export function EvaluationDashboard({
  result,
}: {
  result: EvaluationResult;
}) {
  const style = STYLES[result.outcome];
  const Icon = style.icon;
  return (
    <div data-testid="evaluation-dashboard">
      <Card
        className={`${style.border} ${style.bg}`}
        data-testid={OUTCOME_TEST_ID[result.outcome]}
      >
      <CardContent className="space-y-4 text-center">
        <Icon className="mx-auto h-12 w-12 text-slate-100" aria-hidden />
        <h2 className="text-2xl font-semibold text-slate-50">{style.heading}</h2>
        <p className="text-base text-slate-300">{result.reason}</p>
      </CardContent>
    </Card>
    </div>
  );
}
