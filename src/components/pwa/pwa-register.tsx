"use client";

import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";

/**
 * Registers the EduMind service worker and surfaces a small, non-intrusive
 * banner when a new version is ready to take over.
 *
 * Strategy: never auto-reload the page under the user. The banner asks first,
 * then the waiting worker calls skipWaiting() and the reload is triggered by
 * the `controllerchange` event.
 */
export function PwaRegister() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;
    let refreshing = false;
    const env = process.env.NODE_ENV === "production" ? "prod" : "dev";

    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    const watchInstalling = (registration: ServiceWorkerRegistration) => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        // `controller` exists only when an older version is already running,
        // which means this is an update and not the very first install.
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          setWaitingWorker(worker);
          setDismissed(false);
        }
      });
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    navigator.serviceWorker
      .register(`/sw.js?env=${env}`, { scope: "/" })
      .then((registration) => {
        if (cancelled) return;
        if (registration.waiting && navigator.serviceWorker.controller) {
          setWaitingWorker(registration.waiting);
        }
        registration.addEventListener("updatefound", () => watchInstalling(registration));
        // Check once per page load so long-lived tabs still notice releases.
        registration.update().catch(() => undefined);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  if (!waitingWorker || dismissed) return null;

  const isEnglish = document.documentElement.lang === "en";

  return (
    <div
      role="status"
      dir={isEnglish ? "ltr" : "rtl"}
      className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+84px)] z-[80] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-hairline bg-white p-3 shadow-[0_18px_50px_-20px_rgba(16,38,44,0.35)] sm:inset-x-auto sm:end-5 lg:bottom-5"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand-ink">
        <RefreshCw className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-semibold text-ink">
          {isEnglish ? "A new version is ready" : "فيه تحديث جديد جاهز"}
        </p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
          {isEnglish ? "Reload to get the latest update." : "أعد التحميل للحصول على آخر تحديث."}
        </p>
      </div>
      <button
        type="button"
        onClick={() => waitingWorker.postMessage({ type: "SKIP_WAITING" })}
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-brand px-3 text-[11.5px] font-semibold text-primary-foreground transition-colors hover:bg-[#10b981]"
      >
        {isEnglish ? "Update" : "تحديث"}
      </button>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={isEnglish ? "Later" : "لاحقاً"}
        className="grid size-7 shrink-0 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-black/[0.05] hover:text-ink"
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
