"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LoaderCircle, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { generateFlashcardsAction } from "@/lib/actions/ai";
import type { AppMessages } from "@/lib/i18n/app";
import type { Flashcard } from "@/lib/types";

export function FlashcardsPanel({
  materialId,
  cards,
  dict,
  aiConfigured,
}: {
  materialId: string;
  cards: Flashcard[];
  dict: AppMessages;
  aiConfigured: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const router = useRouter();

  function generate() {
    startTransition(async () => {
      const result = await generateFlashcardsAction(materialId);
      if (result.ok) {
        toast.success(result.message ?? dict.materials.flashcardsGenerated);
        router.refresh();
      } else {
        toast.error(result.error ?? dict.errors.generic);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-hairline bg-surface-raised/80 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-ink">{dict.materials.flashcardsTitle}</h2>
          <p className="mt-0.5 text-[11.5px] text-ink-muted">{dict.materials.previewNote}</p>
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={isPending || !aiConfigured}
          title={!aiConfigured ? dict.errors.aiNotConfigured : undefined}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-brand/30 bg-brand/[0.08] px-3 text-[12px] font-medium text-brand-ink transition-colors hover:bg-brand/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
            <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="size-3.5" aria-hidden="true" />
          )}
          {isPending ? dict.common.generating : dict.materials.generateFlashcards}
        </button>
      </div>

      {cards.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-hairline px-4 py-6 text-center text-[12px] text-ink-muted">
          {dict.materials.flashcardsEmpty}
        </p>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {cards.map((card) => {
            const isFlipped = Boolean(flipped[card.id]);
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => setFlipped((state) => ({ ...state, [card.id]: !state[card.id] }))}
                aria-label={dict.materials.flip}
                className="min-h-24 rounded-xl border border-hairline bg-surface-deep/60 p-3.5 text-start transition-colors hover:border-brand/30"
              >
                <p className="text-[12.5px] leading-relaxed text-ink">
                  {isFlipped ? card.back : card.front}
                </p>
                <span className="mt-2 flex items-center gap-1 text-[10px] text-ink-muted">
                  <RotateCcw className="size-3" aria-hidden="true" />
                  {dict.materials.flip}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
