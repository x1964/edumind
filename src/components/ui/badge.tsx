import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Tone = "brand" | "neutral" | "danger" | "warning" | "info";

const tones: Record<Tone, string> = {
  brand: "border-brand/25 bg-brand/10 text-brand-ink",
  neutral: "border-hairline bg-black/[0.03] text-ink-soft",
  danger: "border-[#ef4444]/25 bg-[#ef4444]/10 text-[#b91c1c]",
  warning: "border-amber-400/25 bg-amber-400/10 text-amber-200",
  info: "border-sky-400/25 bg-sky-400/10 text-sky-200",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
