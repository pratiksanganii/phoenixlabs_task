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

export function EvaluationDashboard({
  result,
}: {
  result: EvaluationResult;
}) {
  const style = STYLES[result.outcome];
  const Icon = style.icon;
  return (
    <Card
      className={`${style.border} ${style.bg}`}
      data-testid="evaluation-dashboard"
    >
      <CardContent className="space-y-4 text-center">
        <Icon className="mx-auto h-12 w-12 text-slate-100" aria-hidden />
        <h2 className="text-2xl font-semibold text-slate-50">{style.heading}</h2>
        <p className="text-base text-slate-300">{result.reason}</p>
      </CardContent>
    </Card>
  );
}
