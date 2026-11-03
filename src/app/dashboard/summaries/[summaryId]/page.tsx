import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, FileText, NotebookPen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SummaryViewer } from "@/components/summaries/summary-viewer";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { StudyTracker } from "@/components/dashboard/study-tracker";
import { getAppMessages } from "@/lib/i18n/app-server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteSummaryAction } from "@/lib/actions/library";
import { formatDate } from "@/lib/format";
import type { Summary } from "@/lib/types";

export const instant = false;

export default async function SummaryDetailPage({
  params,
}: {
  params: Promise<{ summaryId: string }>;
}) {
  const { dict, lang } = await getAppMessages();
  const { summaryId } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("summaries")
    .select("*, materials(file_name)")
    .eq("id", summaryId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) notFound();
  const summary = data as Summary;

  return (
    <div className="space-y-5">
      <StudyTracker materialId={summary.material_id} activity="summary" />

      <Link
        href="/dashboard/summaries"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5 rtl:hidden" aria-hidden="true" />
        <ArrowRight className="size-3.5 ltr:hidden" aria-hidden="true" />
        {dict.summaries.backToSummaries}
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl border border-brand/20 bg-brand/[0.07] text-brand-ink">
              <NotebookPen className="size-4" aria-hidden="true" />
            </span>
            <Badge tone="neutral">{dict.summaries[`style_${summary.style}`]}</Badge>
            {summary.edited ? <Badge tone="info">{dict.summaries.editedBadge}</Badge> : null}
          </div>
          <h1 className="mt-2.5 break-words text-[24px] font-semibold leading-snug tracking-[-0.03em] text-ink">
            {summary.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-muted">
            {summary.materials?.file_name ? (
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <FileText className="size-3 shrink-0" aria-hidden="true" />
                <span className="truncate" dir="ltr">
                  {summary.materials.file_name}
                </span>
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3" aria-hidden="true" />
              {formatDate(summary.updated_at, lang)}
            </span>
          </div>
        </div>

        <ConfirmAction
          action={deleteSummaryAction.bind(null, summary.id)}
          title={dict.summaries.deleteTitle}
          description={dict.summaries.deleteBody}
          confirmLabel={dict.common.delete}
          cancelLabel={dict.common.cancel}
          triggerLabel={dict.common.delete}
          successMessage={dict.summaries.deleteSuccess}
          className="h-9 border border-hairline px-3"
        />
      </header>

      <SummaryViewer
        summaryId={summary.id}
        initialTitle={summary.title}
        initialContent={summary.content}
        dict={dict}
      />
    </div>
  );
}
