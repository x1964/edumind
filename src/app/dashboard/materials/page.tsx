import Link from "next/link";
import { ArrowLeft, ArrowRight, FileText, SearchX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { FileKindIcon } from "@/components/shared/file-icon";
import { MaterialsToolbar } from "@/components/materials/materials-toolbar";
import { UploadDialog } from "@/components/materials/upload-dialog";
import { getAppMessages } from "@/lib/i18n/app-server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteMaterialAction } from "@/lib/actions/materials";
import { formatBytes, formatDate } from "@/lib/format";
import type { MaterialSummaryRow } from "@/lib/types";
import type { AppMessages } from "@/lib/i18n/app";

export const instant = false;

export default async function MaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; sort?: string; upload?: string }>;
}) {
  const { dict, lang } = await getAppMessages();
  const params = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("materials")
    .select("id, file_name, file_type, file_size, status, created_at, last_opened_at")
    .eq("user_id", user.id)
    .limit(100);

  const search = (params.q ?? "").trim().slice(0, 80);
  if (search) query = query.ilike("file_name", `%${search.replace(/[%_]/g, "")}%`);
  if (params.type === "pdf" || params.type === "docx" || params.type === "txt") {
    query = query.eq("file_type", params.type);
  }
  if (params.sort === "oldest") {
    query = query.order("created_at", { ascending: true });
  } else if (params.sort === "name") {
    query = query.order("file_name", { ascending: true });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data } = await query;
  const materials = (data ?? []) as MaterialSummaryRow[];
  const hasFilters = Boolean(search || params.type);

  return (
    <div className="space-y-5">
      <PageHeader
        title={dict.materials.title}
        description={dict.materials.subtitle}
        action={<UploadDialog dict={dict} lang={lang} defaultOpen={params.upload === "1"} />}
      />

      <MaterialsToolbar dict={dict} />

      {materials.length === 0 ? (
        <EmptyState
          icon={hasFilters ? <SearchX className="size-5" /> : <FileText className="size-5" />}
          title={hasFilters ? dict.common.noData : dict.materials.empty}
          description={hasFilters ? dict.materials.searchPlaceholder : dict.materials.emptyBody}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="hidden border-b border-hairline px-4 py-2.5 text-[10.5px] font-medium uppercase tracking-wide text-ink-muted sm:grid sm:grid-cols-[minmax(0,1fr)_90px_120px_110px_92px] sm:items-center sm:gap-3">
              <span>{dict.common.file}</span>
              <span>{dict.common.size}</span>
              <span>{dict.common.status}</span>
              <span>{dict.common.date}</span>
              <span className="text-end">{dict.common.actions}</span>
            </div>
            <ul className="divide-y divide-hairline/70">
              {materials.map((material) => (
                <li
                  key={material.id}
                  className="group grid gap-2 px-4 py-3 transition-colors hover:bg-black/[0.02] sm:grid-cols-[minmax(0,1fr)_90px_120px_110px_92px] sm:items-center sm:gap-3"
                >
                  <Link
                    href={`/dashboard/materials/${material.id}`}
                    className="flex min-w-0 items-center gap-3"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-hairline bg-black/[0.03] text-ink-soft">
                      <FileKindIcon kind={material.file_type} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-ink" dir="ltr">
                        {material.file_name}
                      </span>
                      <span className="text-[10.5px] uppercase text-ink-muted">
                        {material.file_type}
                      </span>
                    </span>
                  </Link>
                  <span className="text-[11.5px] text-ink-muted" dir="ltr">
                    {formatBytes(material.file_size, lang)}
                  </span>
                  <span>
                    <StatusBadge status={material.status} dict={dict} />
                  </span>
                  <span className="text-[11.5px] text-ink-muted">
                    {formatDate(material.created_at, lang)}
                  </span>
                  <span className="flex items-center justify-end gap-1">
                    <Link
                      href={`/dashboard/materials/${material.id}`}
                      aria-label={dict.materials.open}
                      className="grid size-8 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-black/[0.05] hover:text-ink"
                    >
                      <ArrowRight className="size-3.5 rtl:hidden" aria-hidden="true" />
                      <ArrowLeft className="size-3.5 ltr:hidden" aria-hidden="true" />
                    </Link>
                    <ConfirmAction
                      action={deleteMaterialAction.bind(null, material.id)}
                      title={dict.materials.deleteTitle}
                      description={dict.materials.deleteBody}
                      confirmLabel={dict.materials.deleteConfirm}
                      cancelLabel={dict.common.cancel}
                      successMessage={dict.materials.deleteSuccess}
                      iconOnly
                    />
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusBadge({ status, dict }: { status: string; dict: AppMessages }) {
  if (status === "ready") return <Badge tone="brand">{dict.materials.ready}</Badge>;
  if (status === "failed") return <Badge tone="danger">{dict.materials.failed}</Badge>;
  return <Badge tone="warning">{dict.materials.processing}</Badge>;
}
