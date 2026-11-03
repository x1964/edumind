"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error", error.digest ?? "unknown");
  }, [error.digest]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface px-5 py-16">
      <div className="w-full max-w-md rounded-2xl border border-hairline bg-surface-raised p-7 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl border border-[#ef4444]/25 bg-[#ef4444]/10 text-danger">
          <AlertTriangle className="size-5" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-ink">
          <span className="em-lang-ar">حدث خطأ غير متوقع</span>
          <span className="em-lang-en">Something went wrong</span>
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
          <span className="em-lang-ar">حدث خطأ غير متوقع. حاول مرة أخرى.</span>
          <span className="em-lang-en">An unexpected error occurred. Please try again.</span>
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="h-9 rounded-xl bg-brand px-4 text-[13px] font-semibold text-primary-foreground hover:bg-brand-deep"
          >
            <span className="em-lang-ar">إعادة المحاولة</span>
            <span className="em-lang-en">Try again</span>
          </button>
          <Link
            href="/"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-hairline px-4 text-[13px] font-medium text-ink-soft hover:bg-black/[0.04]"
          >
            <span className="em-lang-ar">الصفحة الرئيسية</span>
            <span className="em-lang-en">Go home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
