"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log a safe digest only — never user content or file data.
    console.error("Application error", error.digest ?? "unknown");
  }, [error.digest]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface px-5 py-16">
      <div className="w-full max-w-md rounded-2xl border border-hairline bg-surface-raised p-7 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl border border-[#ef4444]/25 bg-[#ef4444]/10 text-danger">
          <AlertTriangle className="size-5" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-ink">حدث خطأ غير متوقع</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
          تعذّر تحميل هذه الصفحة. يمكنك إعادة المحاولة أو العودة إلى الصفحة الرئيسية.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="h-9 rounded-xl bg-brand px-4 text-[13px] font-semibold text-primary-foreground hover:bg-brand-deep"
          >
            إعادة المحاولة
          </button>
          <Link
            href="/"
            className="inline-flex h-9 items-center rounded-xl border border-hairline px-4 text-[13px] font-medium text-ink-soft hover:bg-black/[0.04]"
          >
            الصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
