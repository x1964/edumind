import Link from "next/link";
import { ArrowLeft, ArrowRight, NotebookPen, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { CreateSummaryDialog } from "@/components/summaries/create-summary-dialog";
import { getAppMessages } from "@/lib/i18n/app-server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAiConfigured } from "@/lib/ai/provider";
import { deleteSummaryAction } from "@/lib/actions/library";
import { formatDate } from "@/lib/format";
import type { Summary } from "@/lib/types";

export const instant = false;

export default async function SummariesPage({
  searchParams,
}: {
  searchParams: Promise<{ create?: string; material?: string }>;
}) {
  const { dict, lang } = await getAppMessages();
  const params = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const [{ data: summaryRows }, { data: materialRows }] = await Promise.all([
    supabase
      .from("summaries")
      .select("*, materials(file_name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("materials")
      .select("id, file_name")
      .eq("user_id", user.id)
      .eq("status", "ready")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const summaries = (summaryRows ?? []) as Summary[];
  const materials = (materialRows ?? []) as Array<{ id: string; file_name: string }>;
  const defaultMaterialId =
    params.material && materials.some((material) => material.id === params.material)
      ? params.material
      : null;

  return (
    <div className="space-y-5">
      <PageHeader
        title={dict.summaries.title}
        description={dict.summaries.subtitle}
        action={
          <CreateSummaryDialog
            dict={dict}
            materials={materials}
            aiConfigured={isAiConfigured()}
            defaultMaterialId={defaultMaterialId}
            defaultOpen={params.create === "1"}
          />
        }
      />

      {summaries.length === 0 ? (
        <EmptyState
          icon={<NotebookPen className="size-5" />}
          title={dict.summaries.empty}
          description={dict.summaries.emptyBody}
          action={
            materials.length > 0 ? (
              <CreateSummaryDialog
                dict={dict}
                materials={materials}
                aiConfigured={isAiConfigured()}
              />
            ) : (
              <Link
                href="/dashboard/materials?upload=1"
                className="inline-flex h-9 items-center rounded-xl bg-brand px-3.5 text-[12.5px] font-semibold text-[#04130c] hover:bg-[#10b981]"
              >
                {dict.nav.materials}
              </Link>
            )
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {summaries.map((summary) => (
            <Card key={summary.id} className="group flex flex-col">
              <CardContent className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-brand/20 bg-brand/[0.07] text-brand-ink">
                    <NotebookPen className="size-4" aria-hidden="true" />
                  </span>
                  <div className="flex items-center gap-1">
                    <Badge tone="neutral">{dict.summaries[`style_${summary.style}`]}</Badge>
                    <ConfirmAction
                      action={deleteSummaryAction.bind(null, summary.id)}
                      title={dict.summaries.deleteTitle}
                      description={dict.summaries.deleteBody}
                      confirmLabel={dict.common.delete}
                      cancelLabel={dict.common.cancel}
                      successMessage={dict.summaries.deleteSuccess}
                      iconOnly
                    />
                  </div>
                </div>

                <Link href={`/dashboard/summaries/${summary.id}`} className="mt-3 flex-1">
                  <h2 className="line-clamp-2 text-[14px] font-semibold leading-snug text-ink transition-colors group-hover:text-brand-ink">
                    {summary.title}
                  </h2>
                  <p className="mt-1.5 line-clamp-3 text-[11.5px] leading-relaxed text-ink-muted">
                    {summary.content.replace(/[#*_`>-]/g, "").slice(0, 180)}
                  </p>
                </Link>

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-hairline/60 pt-2.5">
                  <span className="min-w-0 truncate text-[10.5px] text-ink-muted" dir="ltr">
                    {summary.materials?.file_name ?? "—"}
                  </span>
                  <span className="shrink-0 text-[10.5px] text-ink-muted">
                    {formatDate(summary.created_at, lang)}
                  </span>
                </div>

                <Link
                  href={`/dashboard/summaries/${summary.id}`}
                  className="mt-2.5 inline-flex items-center gap-1 text-[11.5px] font-medium text-brand-ink hover:opacity-80"
                >
                  {dict.summaries.open}
                  <ArrowRight className="size-3 rtl:hidden" aria-hidden="true" />
                  <ArrowLeft className="size-3 ltr:hidden" aria-hidden="true" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {summaries.length === 0 ? null : (
        <p className="flex items-center justify-center gap-1.5 pb-2 text-[10.5px] text-ink-muted">
          <Sparkles className="size-3 text-brand-ink" aria-hidden="true" />
          {dict.progress.dataNote}
        </p>
      )}
    </div>
  );
}
