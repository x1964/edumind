"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { AppMessages } from "@/lib/i18n/app";
import type { MindMapEdge, MindMapNode } from "@/lib/types";

const MindMapCanvas = dynamic(
  () => import("@/components/mind-maps/mind-map-canvas").then((mod) => mod.MindMapCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3">
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-[60dvh] min-h-[380px] rounded-2xl" />
      </div>
    ),
  }
);

export function MindMapEditor(props: {
  mindMapId: string;
  initialTitle: string;
  initialNodes: MindMapNode[];
  initialEdges: MindMapEdge[];
  dict: AppMessages;
}) {
  return <MindMapCanvas {...props} />;
}
