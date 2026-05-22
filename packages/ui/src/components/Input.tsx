"use client";

import { InputHTMLAttributes } from "react";
import { cn } from "../lib/cn";

type Props = {
  id: string;
  label: string;
  prefix?: string;
  suffix?: string;
  error?: string;
  "data-testid"?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function Input({
  id,
  label,
  prefix,
  suffix,
  error,
  className,
  "data-testid": dataTestId,
  ...props
}: Props) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-slate-200">
        {label}
      </label>
      <div
        className={cn(
          "flex items-center overflow-hidden rounded-lg border bg-brand-surface text-slate-100 shadow-inner transition-colors",
          error
            ? "border-brand-error ring-1 ring-brand-error/40"
            : "border-brand-border focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/30"
        )}
      >
        {prefix ? (
          <span className="border-r border-brand-border px-3 text-sm text-brand-muted">
            {prefix}
          </span>
        ) : null}
        <input
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          data-testid={dataTestId ?? `input-${id}`}
          className={cn(
            "w-full bg-transparent px-3 py-2.5 text-sm placeholder:text-brand-muted focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
        {suffix ? (
          <span className="border-l border-brand-border px-3 text-sm text-brand-muted">
            {suffix}
          </span>
        ) : null}
      </div>
      <p
        id={`${id}-error`}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        data-testid="validation-error"
        className={cn(
          "text-sm text-brand-error transition-all duration-150",
          error ? "opacity-100 mt-2" : "h-0 overflow-hidden opacity-0"
        )}
      >
        {error || ""}
      </p>
    </div>
  );
}
