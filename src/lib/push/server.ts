import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

const TRUSTED_PUSH_HOSTS = [
  "fcm.googleapis.com",
  "push.services.mozilla.com",
  "updates.push.services.mozilla.com",
  "web.push.apple.com",
  "notify.windows.com",
  "wns.windows.com",
];

export function isValidPushEndpoint(value: string): boolean {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || url.username || url.password || url.port) return false;
    if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname === "0.0.0.0")
      return false;
    if (
      /^(10|127)\.|^192\.168\.|^169\.254\.|^172\.(1[6-9]|2\d|3[0-1])\.|^::1$|^fc[0-9a-f]{2}:/i.test(
        hostname
      )
    )
      return false;
    return TRUSTED_PUSH_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

function getPushConfig() {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) return null;
  return { subject, publicKey, privateKey };
}

export function isPushConfigured() {
  return Boolean(getPushConfig());
}

export async function sendPushToUser(
  supabase: SupabaseClient,
  userId: string,
  payload: PushPayload
): Promise<void> {
  const config = getPushConfig();
  if (!config) return;
  try {
    webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("id, user_id, endpoint, p256dh, auth")
      .eq("user_id", userId);

    if (error || !subscriptions) return;

    await Promise.all(
      (subscriptions as PushSubscriptionRow[]).map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: { p256dh: subscription.p256dh, auth: subscription.auth },
            },
            JSON.stringify(payload),
            { TTL: 60 * 60 * 24 }
          );
        } catch (sendError) {
          const statusCode = (sendError as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("id", subscription.id)
              .eq("user_id", userId);
          }
        }
      })
    );
  } catch {
    // Push delivery must never block task creation or other planner flows.
  }
}
