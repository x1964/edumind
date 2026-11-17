"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Keeps server-rendered data fresh without a realtime connection.
 *
 * The room and listening views are collaborative: another student joining,
 * starting a challenge or submitting answers must appear without the user
 * guessing that they need to reload. We refresh on an interval only while the
 * tab is visible, and immediately when the user comes back to it.
 *
 * `useTransition` is intentionally used by the callers for the manual refresh
 * button so the spinner stays local to that button.
 */
export function useAutoRefresh(intervalMs: number, enabled = true): () => void {
  const router = useRouter();
  const inFlight = useRef(false);

  useEffect(() => {
    if (!enabled || intervalMs <= 0) return;

    const refreshIfVisible = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      if (inFlight.current) return;
      inFlight.current = true;
      router.refresh();
      window.setTimeout(() => {
        inFlight.current = false;
      }, 1000);
    };

    const timer = window.setInterval(refreshIfVisible, intervalMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshIfVisible();
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [enabled, intervalMs, router]);

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  return refresh;
}
