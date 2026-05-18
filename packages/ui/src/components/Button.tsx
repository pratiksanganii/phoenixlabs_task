import { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

type Props = ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ className, ...props }: Props) {
  return (
    <button
      className={cn(
        "rounded-md bg-black px-4 py-2 text-white",
        "disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}