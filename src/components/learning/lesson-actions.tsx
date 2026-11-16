"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ListChecks, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { generateLessonAssessmentAction } from "@/lib/actions/learning";
import type { AppMessages } from "@/lib/i18n/app";

export function LessonActions({ lessonId, dict }: { lessonId: string; dict: AppMessages }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function generate() {
    setError(null);
    startTransition(async () => {
      const result = await generateLessonAssessmentAction(lessonId);
      if (result.ok && result.id) {
        toast.success(result.message ?? dict.learn.assessmentGenerated);
        router.push(`/dashboard/quizzes/${result.id}`);
      } else {
        setError(result.error ?? dict.errors.saveFailed);
      }
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={generate}
        disabled={isPending}
        className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-brand px-3.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-brand-deep disabled:opacity-50 sm:w-auto"
      >
        {isPending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <ListChecks className="size-4" aria-hidden="true" />
        )}
        {isPending ? dict.common.pleaseWait : dict.learn.takeAssessment}
      </button>
      {error ? (
        <p className="rounded-lg border border-danger/25 bg-danger/[0.06] px-3 py-2 text-[12px] text-danger">
          {error}
        </p>
      ) : null}
      <p className="text-[11px] text-ink-muted">{dict.learn.assessmentGenerated}</p>
    </div>
  );
}
