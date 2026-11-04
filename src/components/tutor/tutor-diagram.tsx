"use client";

import { useEffect, useState } from "react";
import mermaid from "mermaid";
import { Download, LoaderCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import type { AppMessages } from "@/lib/i18n/app";

interface TutorDiagramProps {
  code: string;
  open: boolean;
  onClose: () => void;
  dict: AppMessages;
}

export function TutorDiagram({ code, open, onClose, dict }: TutorDiagramProps) {
  if (!open) return null;
  return <TutorDiagramCanvas key={code} code={code} onClose={onClose} dict={dict} />;
}

interface TutorDiagramCanvasProps {
  code: string;
  onClose: () => void;
  dict: AppMessages;
}

function TutorDiagramCanvas({ code, onClose, dict }: TutorDiagramCanvasProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    mermaid.initialize({ startOnLoad: false });
    mermaid
      .render(`edumind-tutor-diagram-${Date.now()}`, code)
      .then((result) => {
        if (!cancelled) setSvg(result.svg);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [code]);

  async function downloadPng() {
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext("2d");
        if (context) {
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0);
          const pngUrl = canvas.toDataURL("image/png");
          const anchor = document.createElement("a");
          anchor.href = pngUrl;
          anchor.download = "edumind-tutor-diagram.png";
          anchor.click();
        }
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    image.onerror = () => URL.revokeObjectURL(url);
    image.src = url;
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={dict.tutor.diagramTitle}
      description={dict.tutor.diagramDescription}
      footer={
        <button
          type="button"
          onClick={() => void downloadPng()}
          disabled={!svg}
          className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand px-3.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download className="size-4" aria-hidden="true" />
          {dict.tutor.diagramDownload}
        </button>
      }
    >
      <div className="grid min-h-[220px] place-items-center rounded-xl border border-hairline bg-surface-deep p-4">
        {svg && !failed ? (
          <div
            className="w-full [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-h-[52dvh] [&_svg]:w-auto [&_svg]:overflow-visible"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <div className="flex items-center justify-center gap-2 text-[12px] text-ink-muted">
            {failed ? dict.tutor.diagramError : dict.tutor.diagramGenerating}
            {!failed ? <LoaderCircle className="size-4 animate-spin text-brand-ink" /> : null}
          </div>
        )}
      </div>
    </Modal>
  );
}
