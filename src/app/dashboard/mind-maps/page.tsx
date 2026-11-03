import Link from "next/link";
import { ArrowLeft, ArrowRight, Network, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { CreateMindMapDialog } from "@/components/mind-maps/create-mind-map-dialog";
import { getAppMessages } from "@/lib/i18n/app-server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAiConfigured } from "@/lib/ai/provider";
import { deleteMindMapAction } from "@/lib/actions/library";
import { formatDate } from "@/lib/format";
import type { MindMap, MindMapEdge, MindMapNode } from "@/lib/types";

export const instant = false;

export default async function MindMapsPage({
  searchParams,
}: {
  searchParams: Promise<{ create?: string; material?: string }>;
}) {
  const { dict, lang } = await getAppMessages();
  const params = await searchParams;
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const [{ data: mapRows }, { data: materialRows }] = await Promise.all([
    supabase
      .from("mind_maps")
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

  const maps = (mapRows ?? []) as Array<MindMap & { materials?: { file_name: string } | null }>;
  const materials = (materialRows ?? []) as Array<{ id: string; file_name: string }>;
  const defaultMaterialId =
    params.material && materials.some((material) => material.id === params.material)
      ? params.material
      : null;

  return (
    <div className="space-y-5">
      <PageHeader
        title={dict.mindMaps.title}
        description={dict.mindMaps.subtitle}
        action={
          <CreateMindMapDialog
            dict={dict}
            materials={materials}
            aiConfigured={isAiConfigured()}
            defaultMaterialId={defaultMaterialId}
            defaultOpen={params.create === "1"}
          />
        }
      />

      {maps.length === 0 ? (
        <EmptyState
          icon={<Network className="size-5" />}
          title={dict.mindMaps.empty}
          description={dict.mindMaps.emptyBody}
          action={
            materials.length > 0 ? (
              <CreateMindMapDialog
                dict={dict}
                materials={materials}
                aiConfigured={isAiConfigured()}
              />
            ) : (
              <Link
                href="/dashboard/materials?upload=1"
                className="inline-flex h-9 items-center rounded-xl bg-brand px-3.5 text-[12.5px] font-semibold text-[#04130c] hover:bg-brand-deep"
              >
                {dict.nav.materials}
              </Link>
            )
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {maps.map((map) => {
            const nodes = Array.isArray(map.nodes) ? (map.nodes as MindMapNode[]) : [];
            const edges = Array.isArray(map.edges) ? (map.edges as MindMapEdge[]) : [];
            return (
              <Card key={map.id} className="group flex flex-col">
                <CardContent className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-brand/20 bg-brand/[0.07] text-brand-ink">
                      <Network className="size-4" aria-hidden="true" />
                    </span>
                    <ConfirmAction
                      action={deleteMindMapAction.bind(null, map.id)}
                      title={dict.mindMaps.deleteTitle}
                      description={dict.mindMaps.deleteBody}
                      confirmLabel={dict.common.delete}
                      cancelLabel={dict.common.cancel}
                      successMessage={dict.mindMaps.deleteSuccess}
                      iconOnly
                    />
                  </div>

                  <Link href={`/dashboard/mind-maps/${map.id}`} className="mt-3 flex-1">
                    <h2 className="line-clamp-2 text-[14px] font-semibold leading-snug text-ink transition-colors group-hover:text-brand-ink">
                      {map.title}
                    </h2>
                    <p className="mt-1 truncate text-[11px] text-ink-muted" dir="ltr">
                      {map.materials?.file_name ?? "—"}
                    </p>
                  </Link>

                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-hairline/60 bg-black/[0.015] p-2.5">
                    <div>
                      <p className="text-[9.5px] uppercase tracking-wide text-ink-muted">
                        {dict.mindMaps.nodes}
                      </p>
                      <p className="text-[13px] font-semibold text-ink" dir="ltr">
                        {nodes.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9.5px] uppercase tracking-wide text-ink-muted">
                        {dict.mindMaps.edges}
                      </p>
                      <p className="text-[13px] font-semibold text-brand-ink" dir="ltr">
                        {edges.length}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-hairline/60 pt-2.5">
                    <span className="text-[10.5px] text-ink-muted">
                      {formatDate(map.created_at, lang)}
                    </span>
                    <Link
                      href={`/dashboard/mind-maps/${map.id}`}
                      className="inline-flex items-center gap-1 text-[11.5px] font-medium text-brand-ink hover:opacity-80"
                    >
                      {dict.mindMaps.open}
                      <ArrowRight className="size-3 rtl:hidden" aria-hidden="true" />
                      <ArrowLeft className="size-3 ltr:hidden" aria-hidden="true" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {maps.length === 0 ? null : (
        <p className="flex items-center justify-center gap-1.5 pb-2 text-[10.5px] text-ink-muted">
          <Sparkles className="size-3 text-brand-ink" aria-hidden="true" />
          {dict.progress.dataNote}
        </p>
      )}
    </div>
  );
}
