"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import {
  Background,
  Controls,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { LoaderCircle, Save } from "lucide-react";
import { toast } from "sonner";
import { saveMindMapAction } from "@/lib/actions/library";
import type { AppMessages } from "@/lib/i18n/app";
import type { MindMapEdge, MindMapNode } from "@/lib/types";

const NODE_STYLE: Record<string, React.CSSProperties> = {
  root: {
    background: "rgba(5,150,105,0.12)",
    border: "1px solid rgba(5,150,105,0.45)",
    color: "#065f46",
    borderRadius: 14,
    padding: "12px 16px",
    fontWeight: 600,
    fontSize: 14,
    width: 200,
  },
  branch: {
    background: "#ffffff",
    border: "1px solid #d1d5db",
    color: "#1a1a1a",
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 12.5,
    width: 180,
  },
  leaf: {
    background: "#f8faf9",
    border: "1px solid #e5e7eb",
    color: "#4b5563",
    borderRadius: 10,
    padding: "8px 10px",
    fontSize: 11.5,
    width: 160,
  },
};

function buildLayout(nodes: MindMapNode[], edges: MindMapEdge[]): MindMapNode[] {
  const withPositions = nodes.map((node) => ({ ...node }));
  const root = withPositions.find((node) => node.kind === "root") ?? withPositions[0] ?? null;
  if (!root) return withPositions;

  const children = new Map<string, string[]>();
  for (const edge of edges) {
    if (!children.has(edge.source)) children.set(edge.source, []);
    children.get(edge.source)?.push(edge.target);
  }

  const positioned = new Set<string>();
  const place = (id: string, x: number, y: number) => {
    const node = withPositions.find((item) => item.id === id);
    if (!node || node.position) return;
    node.position = { x, y };
    positioned.add(id);
  };

  place(root.id, 0, 0);
  const branches = (children.get(root.id) ?? []).slice(0, 10);

  branches.forEach((branchId, index) => {
    const angle = (index / Math.max(branches.length, 1)) * Math.PI * 2;
    const bx = Math.cos(angle) * 280;
    const by = Math.sin(angle) * 240;
    place(branchId, bx, by);

    const leaves = (children.get(branchId) ?? []).slice(0, 6);
    leaves.forEach((leafId, leafIndex) => {
      const spread = (leafIndex - (leaves.length - 1) / 2) * 0.5;
      const lx = bx + Math.cos(angle + spread) * 220;
      const ly = by + Math.sin(angle + spread) * 180;
      place(leafId, lx, ly);
    });
  });

  let fallback = 0;
  for (const node of withPositions) {
    if (!node.position) {
      fallback += 1;
      node.position = {
        x: Math.cos(fallback) * (300 + fallback * 20),
        y: Math.sin(fallback) * (260 + fallback * 20),
      };
    }
  }

  return withPositions;
}

export function MindMapCanvas({
  mindMapId,
  initialTitle,
  initialNodes,
  initialEdges,
  dict,
}: {
  mindMapId: string;
  initialTitle: string;
  initialNodes: MindMapNode[];
  initialEdges: MindMapEdge[];
  dict: AppMessages;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [dirty, setDirty] = useState(false);
  const [isPending, startTransition] = useTransition();

  const laidOut = useMemo(
    () => buildLayout(initialNodes, initialEdges),
    [initialNodes, initialEdges]
  );

  const flowNodes = useMemo<Node[]>(
    () =>
      laidOut.map((node) => ({
        id: node.id,
        position: node.position ?? { x: 0, y: 0 },
        data: { label: node.label },
        style: NODE_STYLE[node.kind] ?? NODE_STYLE.leaf,
      })),
    [laidOut]
  );

  const flowEdges = useMemo<Edge[]>(
    () =>
      initialEdges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated: false,
        style: { stroke: "#059669", strokeOpacity: 0.45, strokeWidth: 1.4 },
      })),
    [initialEdges]
  );

  const [nodes, , onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((current) =>
        addEdge(
          {
            ...connection,
            id: `e-${connection.source}-${connection.target}`,
            style: { stroke: "#059669", strokeOpacity: 0.45, strokeWidth: 1.4 },
          },
          current
        )
      );
      setDirty(true);
    },
    [setEdges]
  );

  const kindById = useMemo(() => {
    const map = new Map<string, MindMapNode["kind"]>();
    for (const node of laidOut) map.set(node.id, node.kind);
    return map;
  }, [laidOut]);

  function save() {
    startTransition(async () => {
      const payloadNodes = nodes.map((node) => ({
        id: node.id,
        label:
          typeof node.data?.label === "string" ? node.data.label : String(node.data?.label ?? ""),
        kind: kindById.get(node.id) ?? "leaf",
        position: { x: Math.round(node.position.x), y: Math.round(node.position.y) },
      }));
      const payloadEdges = edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
      }));

      const result = await saveMindMapAction(mindMapId, {
        title,
        nodes: payloadNodes,
        edges: payloadEdges,
      });

      if (result.ok) {
        toast.success(result.message ?? dict.mindMaps.saved);
        setDirty(false);
        router.refresh();
      } else {
        toast.error(result.error ?? dict.errors.saveFailed);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-hairline bg-surface-raised/80 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <input
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setDirty(true);
            }}
            maxLength={160}
            aria-label={dict.mindMaps.titleLabel}
            className="h-9 min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 text-[14px] font-semibold text-ink transition-colors hover:border-hairline focus:border-brand/50 focus:bg-surface-deep focus:outline-none"
          />
          {dirty ? (
            <span className="shrink-0 rounded-full border border-amber-500/30 bg-amber-500/[0.12] px-2 py-0.5 text-[10px] font-medium text-amber-700">
              {dict.mindMaps.unsaved}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-[10.5px] text-ink-muted sm:inline">
            {dict.mindMaps.autosaveNote}
          </span>
          <button
            type="button"
            onClick={save}
            disabled={isPending}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand px-3.5 text-[12.5px] font-semibold text-primary-foreground transition-colors hover:bg-brand-deep disabled:opacity-50"
          >
            {isPending ? (
              <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="size-3.5" aria-hidden="true" />
            )}
            {isPending ? dict.mindMaps.saving : dict.mindMaps.save}
          </button>
        </div>
      </div>

      <div className="h-[68dvh] min-h-[420px] overflow-hidden rounded-2xl border border-hairline bg-surface-deep/70">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={(changes) => {
            onNodesChange(changes);
            if (changes.some((change) => change.type === "position" && change.dragging)) {
              setDirty(true);
            }
          }}
          onEdgesChange={(changes) => {
            onEdgesChange(changes);
            if (changes.some((change) => change.type === "remove")) setDirty(true);
          }}
          onConnect={onConnect}
          fitView
          minZoom={0.2}
          maxZoom={1.8}
          proOptions={{ hideAttribution: true }}
          className="[&_.react-flow__controls]:border-hairline [&_.react-flow__controls]:bg-surface-raised [&_.react-flow__controls-button]:border-hairline [&_.react-flow__controls-button]:bg-surface-raised [&_.react-flow__controls-button]:fill-ink-soft"
        >
          <Background color="#e5e7eb" gap={22} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      <p className="text-[10.5px] text-ink-muted">{dict.mindMaps.dragHint}</p>
    </div>
  );
}
