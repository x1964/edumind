"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  closeLabel?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  closeLabel = "Close",
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  // Keep the latest callback available to event handlers without touching a
  // ref during render (React 19 discourages ref writes in render phase).
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const frame = requestAnimationFrame(() => {
      const node = dialogRef.current;
      if (!node) return;
      const first = node.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? node).focus();
    });

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const node = dialogRef.current;
      if (!node) return;
      const focusable = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null || element === document.activeElement
      );
      if (focusable.length === 0) {
        event.preventDefault();
        node.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === node)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      const target = restoreFocusRef.current;
      if (target && document.contains(target)) target.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label={closeLabel}
        onClick={() => onCloseRef.current()}
        className="animate-in fade-in-0 absolute inset-0 cursor-default bg-[#10231a]/45 backdrop-blur-[3px] duration-200"
        tabIndex={-1}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          "animate-in slide-in-from-bottom-6 sm:zoom-in-95 relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[26px] border border-hairline bg-surface-raised pb-[env(safe-area-inset-bottom)] shadow-pop outline-none duration-300 sm:rounded-3xl sm:pb-0",
          className
        )}
      >
        <span
          aria-hidden="true"
          className="mx-auto mt-2.5 block h-1.5 w-10 shrink-0 rounded-full bg-hairline-strong/70 sm:hidden"
        />
        <div className="flex items-start justify-between gap-4 border-b border-hairline px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-[15px] font-semibold text-ink">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1 text-[13px] leading-relaxed text-ink-muted">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onCloseRef.current()}
            aria-label={closeLabel}
            className="-me-1 grid size-8 shrink-0 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-black/[0.05] hover:text-ink"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-hairline px-5 py-4 max-sm:[&>*]:flex-1">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
