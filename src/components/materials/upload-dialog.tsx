"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { CheckCircle2, FileUp, LoaderCircle, Plus, UploadCloud, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { extractDocument } from "@/lib/documents/client-extract";
import { MAX_FILE_BYTES, kindFromName } from "@/lib/documents/file-validation";
import { formatBytes } from "@/lib/format";
import type { AppMessages } from "@/lib/i18n/app";
import type { Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type Stage = "idle" | "extracting" | "ready" | "uploading" | "processing" | "failed";

export function UploadDialog({
  dict,
  lang,
  defaultOpen = false,
}: {
  dict: AppMessages;
  lang: Lang;
  defaultOpen?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(defaultOpen);
  const [stage, setStage] = useState<Stage>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<Array<{ page: number; text: string }>>([]);
  const [wordCount, setWordCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function reset() {
    setStage("idle");
    setFile(null);
    setPages([]);
    setWordCount(0);
    setProgress(0);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function close() {
    if (stage === "uploading" || stage === "processing" || stage === "extracting") return;
    setOpen(false);
    reset();
  }

  async function handleFile(selected: File | null) {
    if (!selected) return;
    setError(null);
    const kind = kindFromName(selected.name);
    if (!kind) {
      setError(dict.materials.invalidType);
      return;
    }
    if (selected.size <= 0) {
      setError(dict.materials.emptyFile);
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      setError(dict.materials.tooLarge);
      return;
    }

    setFile(selected);
    setStage("extracting");
    try {
      const extraction = await extractDocument(selected, kind);
      setPages(extraction.pages);
      setWordCount(extraction.wordCount);
      if (extraction.textLength < 20) {
        setError(dict.materials.noText);
        setStage("failed");
        return;
      }
      setStage("ready");
    } catch {
      setError(dict.materials.extractionFailed);
      setStage("failed");
    }
  }

  function upload() {
    if (!file) return;
    setError(null);
    setStage("uploading");
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("pages", JSON.stringify(pages));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/materials/upload");
    xhr.timeout = 120_000;
    xhr.responseType = "json";

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
      }
    };
    xhr.upload.onload = () => {
      setProgress(100);
      setStage("processing");
    };
    xhr.onerror = () => {
      setError(dict.materials.uploadFailed);
      setStage("failed");
    };
    xhr.ontimeout = () => {
      setError(dict.materials.uploadFailed);
      setStage("failed");
    };
    xhr.onload = () => {
      const response = (xhr.response ?? {}) as { error?: string; status?: string };
      if (xhr.status >= 200 && xhr.status < 300) {
        if (response.status === "failed") {
          toast.info(dict.materials.noText);
        } else {
          toast.success(dict.materials.uploadSuccess);
        }
        setOpen(false);
        reset();
        router.refresh();
      } else {
        setError(
          response.error === "too_large"
            ? dict.materials.tooLarge
            : response.error === "invalid_type" || response.error === "invalid_content"
              ? dict.materials.invalidType
              : response.error === "rate_limited"
                ? dict.errors.rateLimited
                : dict.materials.uploadFailed
        );
        setStage("failed");
      }
    };

    xhr.send(formData);
  }

  const busy = stage === "extracting" || stage === "uploading" || stage === "processing";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand px-3.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-brand-deep"
      >
        <Plus className="size-4" aria-hidden="true" />
        {dict.materials.upload}
      </button>

      <Modal
        open={open}
        onClose={close}
        title={dict.materials.upload}
        description={dict.materials.supported + " · " + dict.materials.maxSize}
        closeLabel={dict.common.close}
        footer={
          <>
            <button
              type="button"
              onClick={close}
              disabled={busy}
              className="h-9 rounded-xl border border-hairline px-3.5 text-[13px] font-medium text-ink-soft transition-colors hover:bg-black/[0.04] disabled:opacity-50"
            >
              {dict.common.cancel}
            </button>
            <button
              type="button"
              onClick={upload}
              disabled={!file || stage !== "ready"}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand px-4 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
              {stage === "uploading"
                ? dict.materials.uploading
                : stage === "processing"
                  ? dict.materials.processing
                  : dict.materials.upload}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div
            onDragOver={(event) => {
              event.preventDefault();
              if (!busy) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              if (!busy) void handleFile(event.dataTransfer.files?.[0] ?? null);
            }}
            className={cn(
              "relative flex flex-col items-center justify-center rounded-2xl border border-dashed px-5 py-9 text-center transition-colors",
              dragging
                ? "border-brand/60 bg-brand/[0.06]"
                : "border-hairline-strong bg-surface-deep/50"
            )}
          >
            <div className="grid size-11 place-items-center rounded-2xl border border-brand/20 bg-brand/[0.07] text-brand-ink">
              <UploadCloud className="size-5" aria-hidden="true" />
            </div>
            <p className="mt-3 text-[13.5px] font-medium text-ink">{dict.materials.dropTitle}</p>
            <p className="mt-1 text-[11.5px] text-ink-muted">{dict.materials.dropBody}</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg border border-hairline bg-black/[0.03] px-3 text-[12px] font-medium text-ink-soft hover:bg-black/[0.05] disabled:opacity-50"
            >
              <FileUp className="size-3.5" aria-hidden="true" />
              {dict.materials.browse}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              className="sr-only"
              onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
            />
          </div>

          {file ? (
            <div className="rounded-xl border border-hairline bg-black/[0.02] px-3.5 py-3">
              <div className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-hairline bg-black/[0.03] text-ink-soft">
                  <FileUp className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-medium text-ink" dir="ltr">
                    {file.name}
                  </p>
                  <p className="text-[10.5px] text-ink-muted">
                    {formatBytes(file.size, lang)}
                    {stage === "ready"
                      ? ` · ${wordCount.toLocaleString()} ${dict.common.words}`
                      : ""}
                  </p>
                </div>
                {stage === "extracting" ? (
                  <LoaderCircle className="size-4 animate-spin text-brand-ink" aria-hidden="true" />
                ) : stage === "failed" ? (
                  <XCircle className="size-4 text-danger" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="size-4 text-brand-ink" aria-hidden="true" />
                )}
              </div>

              {stage === "extracting" ? (
                <p className="mt-2 text-[11px] text-ink-muted">{dict.materials.processing}</p>
              ) : null}

              {stage === "uploading" ? (
                <div className="mt-2.5">
                  <div className="h-1 overflow-hidden rounded-full bg-black/[0.08]">
                    <div
                      className="h-full rounded-full bg-brand transition-[width] duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-ink-muted" dir="ltr">
                    {progress}% · {dict.materials.uploading}
                  </p>
                </div>
              ) : null}

              {stage === "processing" ? (
                <p className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-muted">
                  <LoaderCircle className="size-3 animate-spin text-brand-ink" aria-hidden="true" />
                  {dict.materials.processing}
                </p>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <div
              role="alert"
              className="rounded-xl border border-[#ef4444]/25 bg-[#ef4444]/[0.07] px-3.5 py-2.5 text-[12px] text-danger"
            >
              {error}
            </div>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
