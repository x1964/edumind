import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-3 sm:gap-4", className)}>
      <div className="min-w-0 flex-1">
        <h1 className="text-balance text-[23px] font-semibold leading-[1.25] tracking-[-0.03em] text-ink sm:text-[30px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-ink-muted sm:text-[13.5px]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 max-sm:w-full">{action}</div>
      ) : null}
    </header>
  );
}
