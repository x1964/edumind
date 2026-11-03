"use client";

import { buildExtraction, type ExtractedPage } from "@/lib/documents/text";

export interface ClientExtraction {
  pages: ExtractedPage[];
  pageCount: number;
  wordCount: number;
  textLength: number;
}

/**
 * Extracts text in the browser using the same libraries configured for the
 * project (PDF.js / Mammoth). The server still validates the file signature,
 * size, type and content before storing anything.
 */
export async function extractDocument(
  file: File,
  kind: "pdf" | "docx" | "txt"
): Promise<ClientExtraction> {
  let pages: ExtractedPage[] = [];

  if (kind === "txt") {
    const text = await file.text();
    pages = [{ page: 1, text }];
  } else if (kind === "docx") {
    const mammoth = await import("mammoth");
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    pages = [{ page: 1, text: result.value }];
  } else {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();

    const data = new Uint8Array(await file.arrayBuffer());
    const loadingTask = pdfjs.getDocument({ data });
    const doc = await loadingTask.promise;
    const collected: ExtractedPage[] = [];

    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
      const page = await doc.getPage(pageNumber);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (text) collected.push({ page: pageNumber, text });
      page.cleanup();
    }

    await loadingTask.destroy();
    pages = collected;
  }

  const extraction = buildExtraction(pages);
  return {
    pages: extraction.pages,
    pageCount: kind === "pdf" ? Math.max(extraction.pageCount, 1) : 1,
    wordCount: extraction.wordCount,
    textLength: extraction.text.length,
  };
}
