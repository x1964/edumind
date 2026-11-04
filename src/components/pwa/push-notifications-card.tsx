"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, LoaderCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function decodeBase64Url(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

export function PushNotificationsCard() {
  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unknown">("unknown");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const isEnglish = typeof document !== "undefined" && document.documentElement.lang === "en";
  const supported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker.ready
      .then(async (registration) => {
        setPermission(Notification.permission);
        setEnabled(Boolean(await registration.pushManager.getSubscription()));
      })
      .catch(() => undefined);
  }, [supported]);

  async function toggle() {
    if (!supported) return;
    setPending(true);
    setMessage("");
    try {
      const registration = await navigator.serviceWorker.ready;
      const current = await registration.pushManager.getSubscription();
      if (current) {
        await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(current.endpoint)}`, {
          method: "DELETE",
        });
        await current.unsubscribe();
        setEnabled(false);
        setMessage(isEnglish ? "Notifications disabled." : "تم إيقاف الإشعارات.");
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        setMessage(
          isEnglish
            ? "Push notifications are not configured yet."
            : "إشعارات Push غير مهيأة على الخادم بعد."
        );
        return;
      }
      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);
      if (nextPermission !== "granted") {
        setMessage(
          isEnglish
            ? "Allow notifications in your browser settings."
            : "اسمح بالإشعارات من إعدادات المتصفح."
        );
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeBase64Url(publicKey),
      });
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!response.ok) {
        await subscription.unsubscribe();
        throw new Error("subscribe_failed");
      }
      setEnabled(true);
      setMessage(
        isEnglish
          ? "Notifications are enabled on this device."
          : "تم تفعيل الإشعارات على هذا الجهاز."
      );
    } catch {
      setMessage(
        isEnglish ? "Could not update notification settings." : "تعذّر تحديث إعدادات الإشعارات."
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          {enabled ? (
            <Bell className="size-4 text-brand-ink" aria-hidden="true" />
          ) : (
            <BellOff className="size-4 text-ink-muted" aria-hidden="true" />
          )}
          <CardTitle>{isEnglish ? "Push notifications" : "إشعارات Push"}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        <p className="text-[12px] leading-relaxed text-ink-muted">
          {isEnglish
            ? "Get a notification on this device when a new study task is created for your account."
            : "استقبل تنبيهًا على هذا الجهاز عند إنشاء مهمة مذاكرة جديدة لحسابك."}
        </p>
        {!supported ? (
          <p className="rounded-xl border border-hairline/70 bg-black/[0.015] p-3 text-[11px] leading-relaxed text-ink-muted">
            {isEnglish
              ? "Push notifications are not supported in this browser."
              : "إشعارات Push غير مدعومة في هذا المتصفح."}
          </p>
        ) : (
          <button
            type="button"
            onClick={toggle}
            disabled={pending || permission === "denied"}
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-brand px-3 text-[12.5px] font-semibold text-primary-foreground transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : enabled ? (
              <BellOff className="size-4" aria-hidden="true" />
            ) : (
              <Bell className="size-4" aria-hidden="true" />
            )}
            {enabled
              ? isEnglish
                ? "Disable notifications"
                : "إيقاف الإشعارات"
              : isEnglish
                ? "Enable notifications"
                : "تفعيل الإشعارات"}
          </button>
        )}
        {message ? <p className="text-[11px] text-ink-muted">{message}</p> : null}
      </CardContent>
    </Card>
  );
}
