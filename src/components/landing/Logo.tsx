import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative size-9 shrink-0 overflow-hidden rounded-[11px] shadow-[0_0_0_1px_rgba(67,224,177,0.28),0_6px_18px_-8px_rgba(67,224,177,0.75)]">
        <Image
          src="/favicon/icon-192.png"
          alt=""
          fill
          sizes="36px"
          className="object-cover"
          aria-hidden="true"
        />
      </span>
      {compact ? null : (
        <span className="text-[19px] font-semibold tracking-[-0.03em] text-ink">
          Edu<span className="text-brand-ink">Mind</span>
        </span>
      )}
    </span>
  );
}
