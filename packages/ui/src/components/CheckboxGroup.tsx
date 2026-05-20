"use client";

import { createContext, useContext, ReactNode } from "react";
import { cn } from "../lib/cn";

type Ctx = {
  value: string[];
  onChange: (value: string[]) => void;
};

const CheckboxCtx = createContext<Ctx | null>(null);

export function CheckboxGroup({
  value,
  onChange,
  children,
  className,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <CheckboxCtx.Provider value={{ value, onChange }}>
      <div className={cn("grid gap-3", className)}>{children}</div>
    </CheckboxCtx.Provider>
  );
}

export function CheckboxOption({
  value,
  label,
  "data-testid": testId,
}: {
  value: string;
  label: string;
  "data-testid"?: string;
}) {
  const ctx = useContext(CheckboxCtx);
  if (!ctx) throw new Error("CheckboxOption must be used within CheckboxGroup");
  const checked = ctx.value.includes(value);
  const toggle = () => {
    ctx.onChange(
      checked ? ctx.value.filter((v) => v !== value) : [...ctx.value, value]
    );
  };
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors",
        checked
          ? "border-brand-primary bg-brand-primary/10 ring-1 ring-brand-primary/50"
          : "border-brand-border bg-brand-surface hover:border-slate-500"
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={toggle}
        data-testid={testId ?? `checkbox-${value}`}
        className="h-4 w-4 rounded accent-brand-primary"
      />
      <span className="text-sm font-medium text-slate-100">{label}</span>
    </label>
  );
}
