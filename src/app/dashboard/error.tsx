"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error", error.digest ?? "unknown");
  }, [error.digest]);

  return (
    <div className="flex min-h-[50dvh] items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-hairline bg-surface-raised p-6 text-center">
        <div className="mx-auto grid size-11 place-items-center rounded-2xl border border-[#ef4444]/25 bg-[#ef4444]/10 text-danger">
          <AlertTriangle className="size-5" aria-hidden="true" />
        </div>
        <h2 className="mt-3 text-[15px] font-semibold text-ink">
          <span className="em-lang-ar">حدث خطأ غير متوقع. حاول مرة أخرى.</span>
          <span className="em-lang-en">Something went wrong. Please try again.</span>
        </h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
          <span className="em-lang-ar">
            عذرًا، تعذر تحميل صفحة لوحة التحكم. حاول مرة أخرى لاحقًا.
          </span>
          <span className="em-lang-en">
            We couldn&apos;t load your dashboard. Please try again later.
          </span>
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 h-9 rounded-xl bg-brand px-4 text-[13px] font-semibold text-primary-foreground hover:bg-brand-deep"
        >
          <span className="em-lang-ar">إعادة المحاولة</span>
          <span className="em-lang-en">Try again</span>
        </button>
      </div>
    </div>
  );
}
