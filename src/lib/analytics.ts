import { track } from "@vercel/analytics";

/**
 * Controlled list of analytics events that EduMind is allowed to emit.
 * Keep this list closed: arbitrary event names must never reach the tracker.
 */
export const ANALYTICS_EVENTS = [
  "signup_completed",
  "login_completed",
  "material_upload_started",
  "material_upload_completed",
  "material_deleted",
  "tutor_session_started",
  "summary_generation_started",
  "summary_generation_completed",
  "quiz_generation_started",
  "quiz_generation_completed",
  "quiz_completed",
  "mind_map_generation_started",
  "mind_map_generation_completed",
  "study_plan_created",
  "study_task_created",
  "study_task_completed",
  "global_search_used",
  "language_changed",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

/** Only flat, primitive values are allowed on tracked events. */
export type AnalyticsEventValue = string | number | boolean | null | undefined;

export type AnalyticsEventData = Record<string, AnalyticsEventValue>;

const MAX_EVENT_PROPERTY_VALUE_LENGTH = 32;
const ANALYTICS_EVENT_NAMES: ReadonlySet<string> = new Set<string>(ANALYTICS_EVENTS);

export function isAnalyticsEventName(value: unknown): value is AnalyticsEventName {
  return typeof value === "string" && ANALYTICS_EVENT_NAMES.has(value);
}

/**
 * Central, privacy-safe tracking entry point.
 *
 * - Only emits events from the closed `ANALYTICS_EVENTS` list.
 * - Only accepts flat primitive values (string | number | boolean | null).
 * - Never sends personal data (names, emails, ids, content, answers, grades…).
 * - Fails silently so analytics can never break product flows.
 */
export function trackEvent(name: AnalyticsEventName, data?: AnalyticsEventData): void {
  if (typeof window === "undefined") return;
  if (!isAnalyticsEventName(name)) return;

  const safeData: AnalyticsEventData = {};
  if (data) {
    for (const [key, value] of Object.entries(data)) {
      const isValidValue =
        value === null ||
        value === undefined ||
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean";
      if (!isValidValue) continue;
      if (typeof value === "string" && value.length > MAX_EVENT_PROPERTY_VALUE_LENGTH) continue;
      safeData[key] = value;
    }
  }

  try {
    if (Object.keys(safeData).length > 0) {
      track(name, safeData);
      return;
    }
    track(name);
  } catch {
    // Analytics must never interfere with the product experience.
  }
}
