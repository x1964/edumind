import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "start" | "center";
  className?: string;
  titleClassName?: string;
  children?: ReactNode;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "start",
  className,
  titleClassName,
  children,
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <div
      className={cn(
        "flex max-w-2xl flex-col gap-4",
        centered && "mx-auto items-center text-center",
        className
      )}
    >
      <span className="inline-flex items-center gap-2.5 text-[11px] font-medium uppercase tracking-[0.22em] text-brand-ink/90">
        <span className="h-px w-6 bg-brand/60" aria-hidden="true" />
        {eyebrow}
      </span>
      <h2
        className={cn(
          "text-balance text-[clamp(1.9rem,4vw,3.1rem)] font-semibold leading-[1.14] tracking-[-0.035em] text-ink",
          titleClassName
        )}
      >
        {title}
      </h2>
      {description ? (
        <p className="max-w-xl text-pretty text-[15px] leading-7 text-ink-soft md:text-base md:leading-8">
          {description}
        </p>
      ) : null}
      {children}
    </div>
  );
}
