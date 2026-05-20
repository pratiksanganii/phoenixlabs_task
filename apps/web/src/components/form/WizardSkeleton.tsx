import { Card, CardContent } from "@phoenixlabs/ui";

export function WizardSkeleton() {
  return (
    <Card
      className="mx-auto max-w-xl animate-pulse"
      data-testid="wizard-skeleton"
    >
      <CardContent className="space-y-4">
        <div className="h-4 w-1/3 rounded bg-brand-border" />
        <div className="h-10 rounded bg-brand-border" />
        <div className="h-10 rounded bg-brand-border" />
      </CardContent>
    </Card>
  );
}
