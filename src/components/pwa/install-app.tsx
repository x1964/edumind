"use client";

import { useState, useSyncExternalStore } from "react";
import { CheckCircle2, Download, LoaderCircle, Share2, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AppMessages } from "@/lib/i18n/app";
import { cn } from "@/lib/utils";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

declare global {
  interface Window {
    __edumindInstallPrompt?: InstallPromptEvent | null;
  }
}

interface InstallState {
  canInstall: boolean;
  installed: boolean;
  standalone: boolean;
  isIOS: boolean;
}

const INSTALL_AVAILABLE_EVENT = "edumind:install-available";

/**
 * The `beforeinstallprompt` event fires before hydration, so a tiny inline
 * script in the root layout stores it on `window.__edumindInstallPrompt` and
 * re-dispatches a custom event. This module-level store is the single source
 * of truth shared by the menu entry and the settings card.
 */
const EMPTY_STATE: InstallState = {
  canInstall: false,
  installed: false,
  standalone: false,
  isIOS: false,
};

let promptEvent: InstallPromptEvent | null = null;
let installedFlag = false;
let snapshot: InstallState = EMPTY_STATE;
let initialized = false;
const listeners = new Set<() => void>();

function readEnvironment(): InstallState {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  return {
    canInstall: Boolean(promptEvent) && !installedFlag && !standalone,
    installed: installedFlag,
    standalone,
    isIOS: /iphone|ipad|ipod/i.test(window.navigator.userAgent),
  };
}

function publish() {
  const next = readEnvironment();
  const changed =
    next.canInstall !== snapshot.canInstall ||
    next.installed !== snapshot.installed ||
    next.standalone !== snapshot.standalone ||
    next.isIOS !== snapshot.isIOS;

  if (!changed) return;
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function ensureInitialized() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  promptEvent = window.__edumindInstallPrompt ?? null;

  window.addEventListener(INSTALL_AVAILABLE_EVENT, () => {
    promptEvent = window.__edumindInstallPrompt ?? null;
    publish();
  });

  window.addEventListener("appinstalled", () => {
    installedFlag = true;
    promptEvent = null;
    window.__edumindInstallPrompt = null;
    publish();
  });

  publish();
}

function subscribe(listener: () => void) {
  ensureInitialized();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  ensureInitialized();
  return snapshot;
}

function getServerSnapshot() {
  return EMPTY_STATE;
}

function markInstalled() {
  installedFlag = true;
  promptEvent = null;
  if (typeof window !== "undefined") window.__edumindInstallPrompt = null;
  publish();
}

function useInstallState() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [pending, setPending] = useState(false);

  async function install() {
    const event =
      promptEvent ?? (typeof window !== "undefined" ? window.__edumindInstallPrompt : null);
    if (!event) return;

    setPending(true);
    try {
      await event.prompt();
      const choice = await event.userChoice;
      if (choice.outcome === "accepted") {
        markInstalled();
      } else {
        promptEvent = null;
        window.__edumindInstallPrompt = null;
        publish();
      }
    } catch {
      // The browser can reject the prompt if it was already used; nothing to do.
    } finally {
      setPending(false);
    }
  }

  return { ...state, pending, install };
}

/** Sidebar/menu entry — renders only while the browser offers an install prompt. */
export function InstallAppMenuItem({
  dict,
  className,
  iconClassName = "size-3.5",
}: {
  dict: AppMessages;
  className?: string;
  iconClassName?: string;
}) {
  const { canInstall, pending, install } = useInstallState();
  if (!canInstall) return null;

  return (
    <button
      type="button"
      onClick={install}
      disabled={pending}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start text-[12.5px] text-ink-soft transition-colors hover:bg-black/[0.05] hover:text-ink disabled:opacity-60",
        className
      )}
    >
      {pending ? (
        <LoaderCircle className={cn(iconClassName, "animate-spin")} aria-hidden="true" />
      ) : (
        <Download className={iconClassName} aria-hidden="true" />
      )}
      {dict.pwa.install}
    </button>
  );
}

/** Settings card with the full install story (button, iOS steps, installed state). */
export function InstallAppCard({ dict }: { dict: AppMessages }) {
  const { canInstall, installed, standalone, isIOS, pending, install } = useInstallState();
  const isDone = installed || standalone;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Smartphone className="size-4 text-brand-ink" aria-hidden="true" />
          <CardTitle>{dict.pwa.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-xl border",
                isDone
                  ? "border-brand/30 bg-brand/10 text-brand-ink"
                  : "border-hairline bg-black/[0.02] text-ink-soft"
              )}
            >
              {isDone ? (
                <CheckCircle2 className="size-4" aria-hidden="true" />
              ) : (
                <Download className="size-4" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-[12.5px] font-medium text-ink">
                {isDone ? dict.pwa.installed : dict.pwa.subtitle}
              </p>
              {isDone ? (
                <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
                  {dict.pwa.installedHint}
                </p>
              ) : null}
            </div>
          </div>

          {isDone ? null : canInstall ? (
            <button
              type="button"
              onClick={install}
              disabled={pending}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-brand px-3 text-[12.5px] font-semibold text-primary-foreground transition-colors hover:bg-[#10b981] disabled:opacity-60"
            >
              {pending ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="size-4" aria-hidden="true" />
              )}
              {pending ? dict.pwa.installing : dict.pwa.install}
            </button>
          ) : isIOS ? (
            <div className="space-y-2 rounded-xl border border-hairline/70 bg-black/[0.015] p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-ink-soft">
                <Share2 className="size-3.5 text-ink-muted" aria-hidden="true" />
                {dict.pwa.iosTitle}
              </p>
              <p className="text-[11px] leading-relaxed text-ink-muted">{dict.pwa.iosHint}</p>
            </div>
          ) : (
            <p className="rounded-xl border border-hairline/70 bg-black/[0.015] p-3 text-[11px] leading-relaxed text-ink-muted">
              {dict.pwa.manualHint}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
