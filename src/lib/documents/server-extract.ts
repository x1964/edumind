import "server-only";

import type { FileKind } from "@/lib/types";
import { MAX_FILE_BYTES, MAX_PAGES } from "@/lib/documents/file-validation";
import { buildExtraction, type ExtractionResult } from "@/lib/documents/text";

export const MAX_GENERATED_CHUNKS = 2_000;

function boundedText(value: string): string {
  return value.slice(0, 700_000);
}

export async function extractDocumentOnServer(
  file: File,
  kind: FileKind
): Promise<ExtractionResult> {
  if (file.size <= 0 || file.size > MAX_FILE_BYTES) throw new Error("invalid_file_size");

  if (kind === "txt") {
    const text = await file.text();
    return buildExtraction([{ page: 1, text: boundedText(text) }]);
  }

  const arrayBuffer = await file.arrayBuffer();
  if (kind === "docx") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ arrayBuffer });
    return buildExtraction([{ page: 1, text: boundedText(result.value) }]);
  }

  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
  const document = await loadingTask.promise;
  try {
    if (document.numPages < 1 || document.numPages > MAX_PAGES) throw new Error("too_many_pages");
    const pages: Array<{ page: number; text: string }> = [];
    let totalChars = 0;
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      totalChars += text.length;
      pages.push({
        page: pageNumber,
        text: text.slice(0, Math.max(0, 700_000 - (totalChars - text.length))),
      });
      page.cleanup();
      if (totalChars >= 700_000) break;
    }
    return buildExtraction(pages);
  } finally {
    await loadingTask.destroy();
  }
}
