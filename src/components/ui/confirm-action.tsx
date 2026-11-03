"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

interface ConfirmActionProps {
  action: () => Promise<{ ok: boolean; error?: string; message?: string }>;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  triggerLabel?: string;
  iconOnly?: boolean;
  className?: string;
  successMessage?: string;
}

export function ConfirmAction({
  action,
  title,
  description,
  confirmLabel,
  cancelLabel,
  triggerLabel,
  iconOnly = false,
  className,
  successMessage,
}: ConfirmActionProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function confirm() {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(result.message ?? successMessage ?? "");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={triggerLabel ?? confirmLabel}
        title={triggerLabel ?? confirmLabel}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-lg text-[12px] font-medium text-ink-muted transition-colors hover:bg-[#ef4444]/10 hover:text-danger",
          iconOnly ? "size-8" : "h-8 px-2.5",
          className
        )}
      >
        <Trash2 className="size-3.5" aria-hidden="true" />
        {iconOnly ? null : <span>{triggerLabel ?? confirmLabel}</span>}
      </button>
      <Modal
        open={open}
        onClose={() => (isPending ? null : setOpen(false))}
        title={title}
        description={description}
        closeLabel={cancelLabel}
        footer={
          <>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="h-9 rounded-xl border border-hairline px-3.5 text-[13px] font-medium text-ink-soft transition-colors hover:bg-black/[0.04] disabled:opacity-60"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={isPending}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#ef4444]/15 px-3.5 text-[13px] font-semibold text-danger transition-colors hover:bg-[#ef4444]/25 disabled:opacity-60"
            >
              {isPending ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              {confirmLabel}
            </button>
          </>
        }
      />
    </>
  );
}
