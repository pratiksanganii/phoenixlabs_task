"use client";

import { createContext, useContext, ReactNode } from "react";
import { cn } from "../lib/cn";

type Ctx = {
  name: string;
  value: string | undefined;
  onChange: (value: string) => void;
};

const RadioCtx = createContext<Ctx | null>(null);

export function RadioGroup({
  name,
  value,
  onChange,
  children,
  className,
}: {
  name: string;
  value: string | undefined;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <RadioCtx.Provider value={{ name, value, onChange }}>
      <div role="radiogroup" className={cn("grid gap-3", className)}>
        {children}
      </div>
    </RadioCtx.Provider>
  );
}

export function RadioOption({
  value,
  label,
  "data-testid": testId,
}: {
  value: string;
  label: string;
  "data-testid"?: string;
}) {
  const ctx = useContext(RadioCtx);
  if (!ctx) throw new Error("RadioOption must be used within RadioGroup");
  const selected = ctx.value === value;
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors",
        selected
          ? "border-brand-primary bg-brand-primary/10 ring-1 ring-brand-primary/50"
          : "border-brand-border bg-brand-surface hover:border-slate-500"
      )}
    >
      <input
        type="radio"
        name={ctx.name}
        value={value}
        checked={selected}
        onChange={() => ctx.onChange(value)}
        data-testid={testId ?? `radio-${value}`}
        className="h-4 w-4 accent-brand-primary"
      />
      <span className="text-sm font-medium text-slate-100">{label}</span>
    </label>
  );
}
