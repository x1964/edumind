"use client";

import { useEffect } from "react";

/**
 * Records a real study session: marks the material as opened, then reports the
 * elapsed foreground time when the page is hidden or left.
 */
export function StudyTracker({
  materialId,
  activity = "material",
}: {
  materialId: string | null;
  activity?: "material" | "tutor" | "quiz" | "summary" | "mind_map";
}) {
  useEffect(() => {
    const started = Date.now();
    let sent = false;

    void fetch("/api/study-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ materialId, activity, seconds: 0 }),
      keepalive: true,
    }).catch(() => {});

    function flush() {
      if (sent) return;
      const seconds = Math.round((Date.now() - started) / 1000);
      if (seconds < 5) return;
      sent = true;
      const payload = JSON.stringify({ materialId, activity, seconds });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/study-sessions",
          new Blob([payload], { type: "application/json" })
        );
      } else {
        void fetch("/api/study-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    }

    function onVisibility() {
      if (document.visibilityState === "hidden") flush();
    }

    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      flush();
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [materialId, activity]);

  return null;
}
