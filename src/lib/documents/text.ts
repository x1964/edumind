export interface ExtractedPage {
  page: number;
  text: string;
}

export interface ExtractionResult {
  pages: ExtractedPage[];
  text: string;
  pageCount: number;
  wordCount: number;
}

export const MAX_EXTRACTED_CHARS = 600_000;

export function normalizeText(input: string): string {
  return input
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function buildExtraction(pages: ExtractedPage[]): ExtractionResult {
  const normalizedPages = pages
    .map((page) => ({ page: page.page, text: normalizeText(page.text) }))
    .filter((page) => page.text.length > 0);

  let text = normalizedPages.map((page) => page.text).join("\n\n");
  if (text.length > MAX_EXTRACTED_CHARS) text = text.slice(0, MAX_EXTRACTED_CHARS);

  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return {
    pages: normalizedPages,
    text,
    pageCount: normalizedPages.length,
    wordCount,
  };
}
