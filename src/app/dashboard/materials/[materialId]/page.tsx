import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  CalendarClock,
  Download,
  ListChecks,
  Network,
  NotebookPen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileKindIcon } from "@/components/shared/file-icon";
import { StudyTracker } from "@/components/dashboard/study-tracker";
import { FlashcardsPanel } from "@/components/materials/flashcards-panel";
import { getAppMessages } from "@/lib/i18n/app-server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAiConfigured } from "@/lib/ai/provider";
import { formatBytes, formatDate } from "@/lib/format";
import type { Flashcard, Material } from "@/lib/types";

export const instant = false;

const CONTENT_LIMIT = 60_000;

export default async function MaterialDetailPage({
  params,
}: {
  params: Promise<{ materialId: string }>;
}) {
  const { dict, lang } = await getAppMessages();
  const { materialId } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const [{ data: materialRow }, { data: flashcardRows }] = await Promise.all([
    supabase
      .from("materials")
      .select("*")
      .eq("id", materialId)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("flashcards")
      .select("*")
      .eq("material_id", materialId)
      .eq("user_id", user.id)
      .order("position", { ascending: true }),
  ]);

  if (!materialRow) notFound();
  const material = materialRow as Material;
  const flashcards = (flashcardRows ?? []) as Flashcard[];
  const content = material.extracted_text ?? "";
  const truncated = content.length > CONTENT_LIMIT;

  const actions = [
    {
      href: `/dashboard/tutor?material=${material.id}`,
      label: dict.materials.askTutor,
      icon: BrainCircuit,
    },
    {
      href: `/dashboard/summaries?material=${material.id}&create=1`,
      label: dict.materials.generateSummary,
      icon: NotebookPen,
    },
    {
      href: `/dashboard/quizzes?material=${material.id}&create=1`,
      label: dict.materials.generateQuiz,
      icon: ListChecks,
    },
    {
      href: `/dashboard/mind-maps?material=${material.id}&create=1`,
      label: dict.materials.createMindMap,
      icon: Network,
    },
  ];

  const status =
    material.status === "ready"
      ? { tone: "brand" as const, label: dict.materials.ready }
      : material.status === "failed"
        ? { tone: "danger" as const, label: dict.materials.failed }
        : { tone: "warning" as const, label: dict.materials.processing };

  return (
    <div className="space-y-5">
      <StudyTracker materialId={material.id} activity="material" />

      <Link
        href="/dashboard/materials"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5 rtl:hidden" aria-hidden="true" />
        <ArrowRight className="size-3.5 ltr:hidden" aria-hidden="true" />
        {dict.materials.backToMaterials}
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-brand/20 bg-brand/[0.07] text-brand-ink">
            <FileKindIcon kind={material.file_type} className="size-5" />
          </span>
          <div className="min-w-0">
            <h1
              className="break-words text-[24px] font-semibold tracking-[-0.03em] text-ink"
              dir="ltr"
            >
              {material.file_name}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Badge tone={status.tone}>{status.label}</Badge>
              <span className="text-[11px] text-ink-muted">
                {formatDate(material.created_at, lang)} · {formatBytes(material.file_size, lang)}
              </span>
            </div>
          </div>
        </div>

        <a
          href={`/api/materials/${material.id}/file`}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-hairline bg-black/[0.025] px-3.5 text-[12.5px] font-medium text-ink-soft transition-colors hover:bg-black/[0.05] hover:text-ink"
        >
          <Download className="size-4" aria-hidden="true" />
          {dict.common.openOriginal}
        </a>
      </header>

      {material.status === "failed" ? (
        <div className="rounded-xl border border-[#ef4444]/25 bg-[#ef4444]/[0.06] px-4 py-3 text-[12.5px] leading-relaxed text-[#b91c1c]">
          {material.error_message === "no_extractable_text"
            ? dict.materials.noText
            : dict.materials.extractionFailed}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>{dict.materials.content}</CardTitle>
              <span className="text-[10.5px] text-ink-muted">{dict.materials.previewNote}</span>
            </CardHeader>
            <CardContent className="pt-4">
              {content ? (
                <>
                  <div
                    dir="auto"
                    className="max-h-[36rem] overflow-y-auto whitespace-pre-wrap rounded-xl border border-hairline/70 bg-surface-deep/50 p-4 text-[12.5px] leading-[1.9] text-ink-soft"
                  >
                    {content.slice(0, CONTENT_LIMIT)}
                  </div>
                  {truncated ? (
                    <p className="mt-2 text-[10.5px] text-ink-muted">
                      {dict.materials.fileTooLargeForAi}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="rounded-xl border border-dashed border-hairline px-4 py-8 text-center text-[12.5px] text-ink-muted">
                  {material.status === "processing"
                    ? dict.materials.processingHint
                    : dict.materials.textEmpty}
                </p>
              )}
            </CardContent>
          </Card>

          <FlashcardsPanel
            materialId={material.id}
            cards={flashcards}
            dict={dict}
            aiConfigured={isAiConfigured()}
          />
        </div>

        <aside className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>{dict.materials.actions}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid gap-2">
                {actions.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-2.5 rounded-xl border border-hairline/70 bg-black/[0.015] px-3 py-2.5 text-[12.5px] font-medium text-ink-soft transition-colors hover:border-brand/30 hover:bg-brand/[0.05] hover:text-ink"
                  >
                    <Icon className="size-4 text-brand-ink" aria-hidden="true" />
                    {label}
                    <ArrowRight
                      className="ms-auto size-3.5 text-ink-muted rtl:hidden"
                      aria-hidden="true"
                    />
                    <ArrowLeft
                      className="ms-auto size-3.5 text-ink-muted ltr:hidden"
                      aria-hidden="true"
                    />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{dict.materials.fileInfo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <InfoRow label={dict.common.file} value={material.file_name} ltr />
              <InfoRow label={dict.common.status} value={status.label} />
              <InfoRow
                label={dict.materials.uploadedAt}
                value={formatDate(material.created_at, lang)}
              />
              <InfoRow
                label={dict.materials.pages}
                value={material.page_count ? String(material.page_count) : "—"}
              />
              <InfoRow
                label={dict.materials.words}
                value={material.word_count ? material.word_count.toLocaleString() : "—"}
              />
              <InfoRow label={dict.common.size} value={formatBytes(material.file_size, lang)} />
            </CardContent>
          </Card>

          <div className="flex items-start gap-2 rounded-xl border border-hairline/70 bg-black/[0.015] p-3 text-[11px] leading-relaxed text-ink-muted">
            <CalendarClock className="mt-0.5 size-3.5 shrink-0 text-brand-ink" aria-hidden="true" />
            {dict.quizzes.reviewNote}
          </div>
        </aside>
      </div>
    </div>
  );
}

function InfoRow({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-hairline/50 pb-2.5 last:border-0 last:pb-0">
      <span className="shrink-0 text-[11px] text-ink-muted">{label}</span>
      <span
        className="min-w-0 break-words text-end text-[11.5px] font-medium text-ink-soft"
        dir={ltr ? "ltr" : undefined}
      >
        {value}
      </span>
    </div>
  );
}
