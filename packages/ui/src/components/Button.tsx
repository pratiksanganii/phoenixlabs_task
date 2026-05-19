"use client";

import { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

type Props = ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  className,
  children,
  ...props
}: Props) {
  return (
    <button
      className={cn(
        "cursor inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}