"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FileText, LoaderCircle, Network, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { AiSetupNotice } from "@/components/shared/setup-notice";
import { generateMindMapAction } from "@/lib/actions/ai";
import type { AppMessages } from "@/lib/i18n/app";

export function CreateMindMapDialog({
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
  const [isPending, startTransition] = useTransition();

  function generate() {
    if (!materialId) return;
    startTransition(async () => {
      const result = await generateMindMapAction(materialId);
      if (result.ok && result.id) {
        toast.success(result.message ?? dict.mindMaps.generated);
        setOpen(false);
        router.push(`/dashboard/mind-maps/${result.id}`);
      } else {
        toast.error(result.error ?? dict.mindMaps.failed);
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
        {dict.mindMaps.create}
      </button>

      <Modal
        open={open}
        onClose={() => (isPending ? null : setOpen(false))}
        title={dict.mindMaps.create}
        description={dict.mindMaps.subtitle}
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
              {isPending ? dict.mindMaps.generating : dict.mindMaps.generate}
            </button>
          </>
        }
      >
        {!aiConfigured ? (
          <AiSetupNotice
            title={dict.mindMaps.notConfigured}
            body={dict.mindMaps.notConfiguredBody}
          />
        ) : materials.length === 0 ? (
          <div className="rounded-xl border border-dashed border-hairline px-4 py-8 text-center">
            <FileText className="mx-auto size-6 text-ink-muted" aria-hidden="true" />
            <p className="mt-2 text-[12.5px] text-ink-muted">{dict.mindMaps.noMaterial}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="map-material"
                className="block text-[12.5px] font-medium text-ink-soft"
              >
                {dict.mindMaps.chooseMaterial}
              </label>
              <select
                id="map-material"
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
            <p className="flex items-start gap-2 rounded-lg border border-hairline/70 bg-black/[0.015] p-2.5 text-[11px] leading-relaxed text-ink-muted">
              <Network className="mt-0.5 size-3.5 shrink-0 text-brand-ink" aria-hidden="true" />
              {dict.mindMaps.dragHint}
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
