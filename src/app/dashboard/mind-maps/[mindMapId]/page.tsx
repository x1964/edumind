import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, FileText, Network } from "lucide-react";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { MindMapEditor } from "@/components/mind-maps/mind-map-editor";
import { StudyTracker } from "@/components/dashboard/study-tracker";
import { getAppMessages } from "@/lib/i18n/app-server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteMindMapAction } from "@/lib/actions/library";
import type { MindMap, MindMapEdge, MindMapNode } from "@/lib/types";

export const instant = false;

export default async function MindMapDetailPage({
  params,
}: {
  params: Promise<{ mindMapId: string }>;
}) {
  const { dict } = await getAppMessages();
  const { mindMapId } = await params;
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("mind_maps")
    .select("*, materials(file_name)")
    .eq("id", mindMapId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) notFound();
  const map = data as MindMap & { materials?: { file_name: string } | null };
  const nodes = Array.isArray(map.nodes) ? (map.nodes as MindMapNode[]) : [];
  const edges = Array.isArray(map.edges) ? (map.edges as MindMapEdge[]) : [];

  return (
    <div className="space-y-4">
      <StudyTracker materialId={map.material_id} activity="mind_map" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard/mind-maps"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-3.5 rtl:hidden" aria-hidden="true" />
          <ArrowRight className="size-3.5 ltr:hidden" aria-hidden="true" />
          {dict.mindMaps.backToMaps}
        </Link>
        <div className="flex items-center gap-2">
          {map.materials?.file_name ? (
            <span className="inline-flex min-w-0 items-center gap-1.5 text-[12px] text-ink-muted">
              <FileText className="size-3 shrink-0" aria-hidden="true" />
              <span className="max-w-[220px] truncate" dir="auto">
                {map.materials.file_name}
              </span>
            </span>
          ) : null}
          <ConfirmAction
            action={deleteMindMapAction.bind(null, map.id)}
            title={dict.mindMaps.deleteTitle}
            description={dict.mindMaps.deleteBody}
            confirmLabel={dict.common.delete}
            cancelLabel={dict.common.cancel}
            triggerLabel={dict.common.delete}
            successMessage={dict.mindMaps.deleteSuccess}
            className="h-8 border border-hairline px-2.5"
          />
        </div>
      </div>

      <header className="flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-xl border border-brand/20 bg-brand/[0.07] text-brand-ink">
          <Network className="size-4" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-[15px] font-semibold text-ink">{dict.mindMaps.title}</h1>
          <p className="text-[12px] text-ink-muted">{dict.mindMaps.source}</p>
        </div>
      </header>

      <MindMapEditor
        mindMapId={map.id}
        initialTitle={map.title}
        initialNodes={nodes}
        initialEdges={edges}
        dict={dict}
      />
    </div>
  );
}
