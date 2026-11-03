import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "w-full min-w-0 resize-y rounded-xl border border-hairline bg-surface-deep/70 px-3.5 py-2.5 text-base leading-relaxed text-ink transition-colors placeholder:text-ink-muted/70 focus:border-brand/50 focus:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm",
        className
      )}
      {...props}
    />
  );
}
