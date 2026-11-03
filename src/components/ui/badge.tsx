import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Tone = "brand" | "neutral" | "danger" | "warning" | "info";

const tones: Record<Tone, string> = {
  brand: "border-brand/25 bg-brand/10 text-brand-ink",
  neutral: "border-hairline bg-black/[0.03] text-ink-soft",
  danger: "border-danger/25 bg-danger/[0.08] text-danger",
  warning: "border-amber-500/30 bg-amber-500/[0.12] text-amber-700",
  info: "border-sky-500/30 bg-sky-500/[0.1] text-sky-700",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12px] font-medium",
        tones[tone],
        className
      )}
      role="status"
      {...props}
    />
  );
}
