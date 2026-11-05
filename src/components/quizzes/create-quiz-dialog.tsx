"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FileText, ListChecks, LoaderCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { AiSetupNotice } from "@/components/shared/setup-notice";
import { generateQuizAction } from "@/lib/actions/ai";
import { trackEvent } from "@/lib/analytics";
import type { AppMessages } from "@/lib/i18n/app";
import type { QuizDifficulty } from "@/lib/types";
import { cn } from "@/lib/utils";

const DIFFICULTIES: QuizDifficulty[] = ["easy", "medium", "hard"];
const COUNTS = [5, 8, 10, 15];

export function CreateQuizDialog({
  dict,
  materials,
  aiConfigured,
  defaultMaterialId,
  defaultOpen = false,
}: {
  dict: AppMessages;
  materials: Array<{ id: string; file_name: string }>;
  aiConfigured: boolean;
  defaultMaterialId?: string | null;
  defaultOpen?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [selectedMaterial, setSelectedMaterial] = useState(
    defaultMaterialId ?? materials[0]?.id ?? ""
  );
  const [difficulty, setDifficulty] = useState<QuizDifficulty>("medium");
  const [count, setCount] = useState(8);
  const [isPending, startTransition] = useTransition();

  // Never send a stale material id to the server (deleted material, refreshed
  // list, or account switch), which would produce "material not found".
  const materialId =
    selectedMaterial && materials.some((material) => material.id === selectedMaterial)
      ? selectedMaterial
      : (defaultMaterialId ?? materials[0]?.id ?? "");

  function generate() {
    if (!materialId) return;
    trackEvent("quiz_generation_started");
    startTransition(async () => {
      const result = await generateQuizAction(materialId, difficulty, count);
      if (result.ok && result.id) {
        trackEvent("quiz_generation_completed");
        toast.success(result.message ?? dict.quizzes.generated);
        setOpen(false);
        router.push(`/dashboard/quizzes/${result.id}`);
      } else {
        toast.error(result.error ?? dict.quizzes.failed);
        if (result.error === dict.materials.notFound) router.refresh();
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand px-3.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-brand-deep"
      >
        <Sparkles className="size-4" aria-hidden="true" />
        {dict.quizzes.create}
      </button>

      <Modal
        open={open}
        onClose={() => (isPending ? null : setOpen(false))}
        title={dict.quizzes.create}
        description={dict.quizzes.subtitle}
        closeLabel={dict.common.close}
        footer={
          <>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="h-9 rounded-xl border border-hairline px-3.5 text-[13px] font-medium text-ink-soft transition-colors hover:bg-black/[0.04] disabled:opacity-50"
            >
              {dict.common.cancel}
            </button>
            <button
              type="button"
              onClick={generate}
              disabled={isPending || !materialId || !aiConfigured}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand px-4 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isPending ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              {isPending ? dict.quizzes.generating : dict.quizzes.generate}
            </button>
          </>
        }
      >
        {!aiConfigured ? (
          <AiSetupNotice title={dict.quizzes.notConfigured} body={dict.quizzes.notConfiguredBody} />
        ) : materials.length === 0 ? (
          <div className="rounded-xl border border-dashed border-hairline px-4 py-8 text-center">
            <FileText className="mx-auto size-6 text-ink-muted" aria-hidden="true" />
            <p className="mt-2 text-[13px] text-ink-muted">{dict.quizzes.noMaterial}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="quiz-material"
                className="block text-[13px] font-medium text-ink-soft"
              >
                {dict.quizzes.chooseMaterial}
              </label>
              <select
                id="quiz-material"
                value={materialId}
                onChange={(event) => setSelectedMaterial(event.target.value)}
                className="h-10 w-full rounded-xl border border-hairline bg-surface-deep px-3 text-[13px] text-ink focus:border-brand/50 focus:outline-none"
              >
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.file_name}
                  </option>
                ))}
              </select>
            </div>

            <fieldset>
              <legend className="mb-1.5 block text-[13px] font-medium text-ink-soft">
                {dict.quizzes.difficulty}
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTIES.map((option) => {
                  const active = difficulty === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setDifficulty(option)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-[12px] font-medium capitalize transition-colors",
                        active
                          ? "border-brand/50 bg-brand/[0.08] text-ink"
                          : "border-hairline bg-black/[0.02] text-ink-soft hover:border-hairline-strong"
                      )}
                    >
                      {dict.common[option]}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-1.5 block text-[13px] font-medium text-ink-soft">
                {dict.quizzes.questionCount}
              </legend>
              <div className="grid grid-cols-4 gap-2">
                {COUNTS.map((option) => {
                  const active = count === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setCount(option)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-xl border px-2 py-2 text-[12px] font-medium transition-colors",
                        active
                          ? "border-brand/50 bg-brand/[0.08] text-ink"
                          : "border-hairline bg-black/[0.02] text-ink-soft hover:border-hairline-strong"
                      )}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <p className="flex items-start gap-2 rounded-lg border border-hairline/70 bg-black/[0.015] p-2.5 text-[12px] leading-relaxed text-ink-muted">
              <ListChecks className="mt-0.5 size-3.5 shrink-0 text-brand-ink" aria-hidden="true" />
              {dict.quizzes.reviewNote}
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
