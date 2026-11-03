"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, LoaderCircle, Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";
import { MarkdownMessage } from "@/components/tutor/markdown-message";
import { updateSummaryAction } from "@/lib/actions/library";
import type { AppMessages } from "@/lib/i18n/app";

export function SummaryViewer({
  summaryId,
  initialTitle,
  initialContent,
  dict,
}: {
  summaryId: string;
  initialTitle: string;
  initialContent: string;
  dict: AppMessages;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const result = await updateSummaryAction(summaryId, { title, content });
      if (result.ok) {
        toast.success(result.message ?? dict.summaries.saved);
        setEditing(false);
        router.refresh();
      } else {
        toast.error(result.error ?? dict.errors.saveFailed);
      }
    });
  }

  function cancel() {
    setTitle(initialTitle);
    setContent(initialContent);
    setEditing(false);
  }

  return (
    <div className="rounded-2xl border border-hairline bg-surface-raised/80">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline px-5 py-3">
        <div className="flex items-center gap-2">
          {editing ? (
            <Pencil className="size-4 text-brand-ink" aria-hidden="true" />
          ) : (
            <Eye className="size-4 text-brand-ink" aria-hidden="true" />
          )}
          <span className="text-[12px] font-medium text-ink-soft">
            {editing ? dict.summaries.edit : dict.summaries.preview}
          </span>
        </div>
        {editing ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancel}
              disabled={isPending}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-hairline px-2.5 text-[11.5px] font-medium text-ink-soft hover:bg-black/[0.04] disabled:opacity-50"
            >
              <X className="size-3.5" aria-hidden="true" />
              {dict.common.cancel}
            </button>
            <button
              type="button"
              onClick={save}
              disabled={isPending}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand px-3 text-[11.5px] font-semibold text-[#04130c] hover:bg-[#10b981] disabled:opacity-50"
            >
              {isPending ? (
                <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="size-3.5" aria-hidden="true" />
              )}
              {isPending ? dict.common.saving : dict.summaries.save}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-hairline px-2.5 text-[11.5px] font-medium text-ink-soft hover:bg-black/[0.04]"
          >
            <Pencil className="size-3.5" aria-hidden="true" />
            {dict.summaries.edit}
          </button>
        )}
      </div>

      <div className="p-5">
        {editing ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label
                htmlFor="summary-title"
                className="block text-[12px] font-medium text-ink-soft"
              >
                {dict.summaries.titleLabel}
              </label>
              <input
                id="summary-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={160}
                className="h-10 w-full rounded-xl border border-hairline bg-surface-deep px-3 text-[13px] text-ink focus:border-brand/50 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="summary-content"
                className="block text-[12px] font-medium text-ink-soft"
              >
                {dict.summaries.contentLabel}
              </label>
              <textarea
                id="summary-content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={22}
                dir="auto"
                className="w-full rounded-xl border border-hairline bg-surface-deep p-3 text-[12.5px] leading-relaxed text-ink focus:border-brand/50 focus:outline-none"
              />
              <p className="text-[10.5px] text-ink-muted">{dict.summaries.editHint}</p>
            </div>
          </div>
        ) : (
          <div dir="auto">
            <MarkdownMessage content={content} />
          </div>
        )}
      </div>
    </div>
  );
}
