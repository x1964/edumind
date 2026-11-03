import type { Lang } from "@/lib/i18n";

export function formatDate(value: string | null | undefined, lang: Lang): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value: string | null | undefined, lang: Lang): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatBytes(bytes: number, lang: Lang): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} ${lang === "ar" ? "ك.ب" : "KB"}`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} ${lang === "ar" ? "م.ب" : "MB"}`;
}

export function formatNumber(value: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-GB").format(value);
}

export function formatDuration(seconds: number, lang: Lang): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${formatNumber(minutes, lang)} ${lang === "ar" ? "دقيقة" : "min"}`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (lang === "ar") {
    return rest > 0
      ? `${formatNumber(hours, lang)} س ${formatNumber(rest, lang)} د`
      : `${formatNumber(hours, lang)} ساعة`;
  }
  return rest > 0 ? `${hours}h ${rest}m` : `${hours}h`;
}
