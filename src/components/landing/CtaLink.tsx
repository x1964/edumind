import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CtaVariant = "primary" | "secondary" | "ghost";
type CtaSize = "md" | "lg";

interface CtaLinkProps {
  href: string;
  children: ReactNode;
  variant?: CtaVariant;
  size?: CtaSize;
  className?: string;
  withArrow?: boolean;
  ariaLabel?: string;
}

export function CtaLink({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
  withArrow = false,
  ariaLabel,
}: CtaLinkProps) {
  return (
    <a
      href={href}
      aria-label={ariaLabel}
      className={cn(
        "group/cta inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300",
        size === "lg" ? "h-12 px-6 text-[15px]" : "h-10 px-5 text-sm",
        variant === "primary" &&
          "bg-brand text-primary-foreground shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_14px_34px_-16px_rgba(5,150,105,0.75)] hover:bg-[#10b981] hover:shadow-[0_1px_0_rgba(255,255,255,0.3)_inset,0_18px_40px_-14px_rgba(5,150,105,0.8)] active:translate-y-px",
        variant === "secondary" &&
          "border border-hairline-strong bg-black/[0.025] text-ink hover:border-brand/40 hover:bg-black/[0.05] active:translate-y-px",
        variant === "ghost" && "text-ink-soft hover:bg-black/[0.04] hover:text-ink",
        className
      )}
    >
      {children}
      {withArrow ? (
        <>
          <ArrowRight className="size-4 transition-transform duration-300 group-hover/cta:translate-x-0.5 rtl:hidden" />
          <ArrowLeft className="size-4 transition-transform duration-300 group-hover/cta:-translate-x-0.5 ltr:hidden" />
        </>
      ) : null}
    </a>
  );
}
