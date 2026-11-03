import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label className={cn("block text-[13px] font-medium text-ink-soft", className)} {...props} />
  );
}
