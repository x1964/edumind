"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const MIN_VISIBLE_MS = 950;
const MAX_VISIBLE_MS = 3500;
const FADE_MS = 480;

type Phase = "booting" | "hiding" | "gone";

/**
 * Branded launch screen for the installed app (PWA) and mobile cold starts.
 * The `.em-booting` class is added by an inline bootstrap in the root layout
 * before first paint, so this renders instantly without a flash of the app.
 */
export function PwaLaunchScreen() {
  const [phase, setPhase] = useState<Phase>("booting");

  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains("em-booting")) return;

    const startedAt = Date.now();
    let finished = false;
    let safetyTimer: number | undefined;

    const finish = () => {
      if (finished) return;
      finished = true;
      if (safetyTimer) window.clearTimeout(safetyTimer);

      const remaining = Math.max(0, MIN_VISIBLE_MS - (Date.now() - startedAt));
      window.setTimeout(() => {
        setPhase("hiding");
        window.setTimeout(() => {
          root.classList.remove("em-booting");
          setPhase("gone");
        }, FADE_MS);
      }, remaining);
    };

    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish, { once: true });
      safetyTimer = window.setTimeout(finish, MAX_VISIBLE_MS);
    }

    return () => {
      window.removeEventListener("load", finish);
      if (safetyTimer) window.clearTimeout(safetyTimer);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "em-launch fixed inset-0 z-[100] flex-col items-center justify-center overflow-hidden bg-surface transition-opacity duration-500 ease-out",
        phase === "hiding" && "pointer-events-none opacity-0"
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <span className="absolute left-1/2 top-1/2 size-[560px] -translate-x-1/2 -translate-y-[58%] rounded-full bg-brand/[0.13] blur-[90px]" />
        <span className="absolute left-1/2 top-1/2 size-[260px] -translate-x-1/2 -translate-y-[56%] rounded-full bg-brand/[0.16] blur-[60px]" />
        <span className="em-grid-lines absolute inset-0 opacity-35" />
      </div>

      <div className="relative flex flex-col items-center">
        <div className="relative">
          <span className="absolute inset-0 -z-10 animate-[em-pulse-soft_2.6s_ease-in-out_infinite] rounded-full bg-brand/25 blur-xl" />
          <span className="absolute -inset-3 -z-10 rounded-[34px] border border-brand/25 opacity-70" />
          <span className="relative block size-[84px] overflow-hidden rounded-[26px] shadow-[0_18px_40px_-18px_rgba(16,38,44,0.55)] ring-1 ring-black/5">
            <Image
              src="/favicon/icon-192.png"
              alt=""
              fill
              priority
              sizes="84px"
              className="object-cover"
            />
          </span>
        </div>

        <p className="mt-5 text-[25px] font-semibold tracking-[-0.04em] text-ink">
          Edu<span className="text-brand-ink">Mind</span>
        </p>

        <p className="mt-1.5 text-[12px] font-medium text-ink-muted">
          <span className="em-launch-copy-ar">تعلّم أذكى، مش أكتر</span>
          <span className="em-launch-copy-en">Study smarter with AI</span>
        </p>

        <span className="mt-7 block h-[3px] w-32 overflow-hidden rounded-full bg-black/[0.07]">
          <span className="block h-full w-1/2 animate-[em-launch-bar_1.1s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-brand/40 via-brand to-brand/40" />
        </span>
      </div>

      <p className="absolute bottom-[calc(env(safe-area-inset-bottom)+26px)] text-[10px] font-medium uppercase tracking-[0.22em] text-ink-muted/70">
        <span className="em-launch-copy-ar">بوابة تعلّمك الذكي</span>
        <span className="em-launch-copy-en">Your AI learning space</span>
      </p>
    </div>
  );
}
