"use client";

import { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../lib/cn";

type Variant = "primary" | "outline";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  isLoading?: boolean;
};

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand-primary text-slate-950 hover:bg-brand-primary-hover focus:ring-brand-primary",
  outline:
    "border border-brand-border bg-transparent text-slate-100 hover:bg-brand-surface-elevated focus:ring-brand-primary",
};

export function Button({
  className,
  children,
  variant = "primary",
  isLoading = false,
  disabled,
  ...props
}: Props) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-surface disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : null}
      {children}
    </button>
  );
}
