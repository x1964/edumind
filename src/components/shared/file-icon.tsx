import { FileText, FileType2, Files } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FileKind } from "@/lib/types";

export function FileKindIcon({ kind, className }: { kind: FileKind | string; className?: string }) {
  const Icon = kind === "pdf" ? FileText : kind === "docx" ? FileType2 : Files;
  return <Icon className={cn("size-4", className)} aria-hidden="true" />;
}
