import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "h-10 w-full min-w-0 rounded-xl border border-hairline bg-surface-deep/70 px-3.5 text-sm text-ink shadow-[0_1px_0_rgba(255,255,255,0.02)_inset] transition-colors placeholder:text-ink-muted/70 focus:border-brand/50 focus:bg-surface-deep focus:outline-none focus:ring-2 focus:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}
