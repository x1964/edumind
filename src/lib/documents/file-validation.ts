import type { FileKind } from "@/lib/types";

export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_PAGES = 400;

export const MIME_BY_KIND: Record<FileKind, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
};

export const EXT_BY_KIND: Record<FileKind, string> = {
  pdf: "pdf",
  docx: "docx",
  txt: "txt",
};

export function kindFromName(name: string): FileKind | null {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "docx") return "docx";
  if (ext === "txt") return "txt";
  return null;
}

export async function validateFileContent(file: File, kind: FileKind): Promise<boolean> {
  const header = new Uint8Array(await file.slice(0, 8).arrayBuffer());

  if (kind === "pdf") {
    return header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46;
  }

  if (kind === "docx") {
    return header[0] === 0x50 && header[1] === 0x4b && header[2] === 0x03 && header[3] === 0x04;
  }

  // TXT must be valid UTF-8 without NUL bytes.
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.includes(0)) return false;
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "document";
  return (
    base
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .trim()
      .slice(0, 200) || "document"
  );
}
