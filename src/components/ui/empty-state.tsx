import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-hairline-strong/70 bg-gradient-to-b from-surface-deep/60 to-white px-6 py-12 text-center sm:px-8 sm:py-16",
        className
      )}
    >
      {icon ? (
        <div className="mb-4 grid size-12 place-items-center rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/[0.16] to-brand/[0.04] text-brand-ink shadow-[0_10px_24px_-18px_rgba(0,201,80,0.8)]">
          {icon}
        </div>
      ) : null}
      <h3 className="text-[15px] font-semibold text-ink sm:text-[16px]">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-ink-muted sm:text-[14px]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
