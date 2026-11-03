"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FileText, LoaderCircle, NotebookPen, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { AiSetupNotice } from "@/components/shared/setup-notice";
import { generateSummaryAction } from "@/lib/actions/ai";
import type { AppMessages } from "@/lib/i18n/app";
import type { SummaryStyle } from "@/lib/types";
import { cn } from "@/lib/utils";

const STYLES: SummaryStyle[] = ["short", "detailed", "key_points", "exam_revision", "simplified"];

export function CreateSummaryDialog({
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
  const [materialId, setMaterialId] = useState(defaultMaterialId ?? materials[0]?.id ?? "");
  const [style, setStyle] = useState<SummaryStyle>("detailed");
  const [isPending, startTransition] = useTransition();

  function generate() {
    if (!materialId) return;
    startTransition(async () => {
      const result = await generateSummaryAction(materialId, style);
      if (result.ok && result.id) {
        toast.success(result.message ?? dict.summaries.generated);
        setOpen(false);
        router.push(`/dashboard/summaries/${result.id}`);
      } else {
        toast.error(result.error ?? dict.summaries.failed);
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
        {dict.summaries.create}
      </button>

      <Modal
        open={open}
        onClose={() => (isPending ? null : setOpen(false))}
        title={dict.summaries.create}
        description={dict.summaries.generatingNote}
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
              {isPending ? dict.summaries.generating : dict.summaries.generate}
            </button>
          </>
        }
      >
        {!aiConfigured ? (
          <AiSetupNotice
            title={dict.summaries.notConfigured}
            body={dict.summaries.notConfiguredBody}
          />
        ) : materials.length === 0 ? (
          <div className="rounded-xl border border-dashed border-hairline px-4 py-8 text-center">
            <FileText className="mx-auto size-6 text-ink-muted" aria-hidden="true" />
            <p className="mt-2 text-[13px] text-ink-muted">{dict.summaries.noMaterial}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="summary-material"
                className="block text-[13px] font-medium text-ink-soft"
              >
                {dict.summaries.chooseMaterial}
              </label>
              <select
                id="summary-material"
                value={materialId}
                onChange={(event) => setMaterialId(event.target.value)}
                className="h-10 w-full rounded-xl border border-hairline bg-surface-deep px-3 text-[13px] text-ink focus:border-brand/50 focus:outline-none"
              >
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.file_name}
                  </option>
                ))}
              </select>
            </div>

            <fieldset className="space-y-1.5">
              <legend className="mb-1.5 block text-[13px] font-medium text-ink-soft">
                {dict.summaries.style}
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {STYLES.map((option) => {
                  const active = style === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setStyle(option)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-start text-[12px] font-medium transition-colors",
                        active
                          ? "border-brand/50 bg-brand/[0.08] text-ink"
                          : "border-hairline bg-black/[0.02] text-ink-soft hover:border-hairline-strong"
                      )}
                    >
                      {dict.summaries[`style_${option}`]}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <p className="flex items-start gap-2 rounded-lg border border-hairline/70 bg-black/[0.015] p-2.5 text-[12px] leading-relaxed text-ink-muted">
              <NotebookPen className="mt-0.5 size-3.5 shrink-0 text-brand-ink" aria-hidden="true" />
              {dict.summaries.generatingNote}
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
