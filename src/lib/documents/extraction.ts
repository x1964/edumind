import "server-only";

import { type ExtractedPage } from "@/lib/documents/text";

export type { ExtractedPage, ExtractionResult } from "@/lib/documents/text";
export { MAX_EXTRACTED_CHARS, buildExtraction, normalizeText } from "@/lib/documents/text";

export interface Chunk {
  index: number;
  page: number | null;
  content: string;
}

/**
 * Splits extracted pages into overlapping chunks suitable for retrieval and
 * prompt context. Pages are preserved so citations can reference them.
 */
export function chunkPages(pages: ExtractedPage[], target = 1400, overlap = 160): Chunk[] {
  const chunks: Chunk[] = [];
  let index = 0;

  for (const page of pages) {
    const text = page.text;
    if (!text) continue;
    if (text.length <= target) {
      chunks.push({ index: index++, page: page.page, content: text });
      continue;
    }

    let start = 0;
    while (start < text.length) {
      let end = Math.min(start + target, text.length);
      if (end < text.length) {
        const boundary = text.lastIndexOf("\n", end);
        if (boundary > start + target / 2) end = boundary;
      }
      const content = text.slice(start, end).trim();
      if (content) chunks.push({ index: index++, page: page.page, content });
      if (end >= text.length) break;
      start = Math.max(end - overlap, start + 1);
    }
  }

  return chunks;
}

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "are",
  "was",
  "were",
  "have",
  "has",
  "had",
  "not",
  "but",
  "you",
  "your",
  "can",
  "will",
  "would",
  "there",
  "their",
  "about",
  "into",
  "than",
  "then",
  "they",
  "them",
  "what",
  "when",
  "which",
  "how",
  "في",
  "من",
  "على",
  "إلى",
  "عن",
  "أن",
  "إن",
  "هذا",
  "هذه",
  "ذلك",
  "التي",
  "الذي",
  "مع",
  "كان",
  "كانت",
  "هو",
  "هي",
  "ما",
  "لم",
  "لا",
  "قد",
  "كل",
  "بين",
  "بعد",
  "قبل",
]);

function keywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

/**
 * Selects the most relevant chunks with a lightweight keyword score. This is
 * deterministic, requires no external service, and never invents content.
 */
export function selectContext(
  chunks: Array<{ page: number | null; content: string }>,
  query: string,
  maxChars = 12_000
): { text: string; pages: number[] } {
  const terms = new Set(keywords(query));
  const scored = chunks.map((chunk, position) => {
    const content = chunk.content.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (content.includes(term)) score += 1;
    }
    return { ...chunk, position, score };
  });

  const ordered =
    terms.size === 0
      ? scored
      : [...scored].sort((a, b) => b.score - a.score || a.position - b.position);

  const selected: typeof ordered = [];
  let used = 0;
  for (const chunk of ordered) {
    if (used + chunk.content.length > maxChars && selected.length > 0) continue;
    selected.push(chunk);
    used += chunk.content.length;
  }

  selected.sort((a, b) => a.position - b.position);
  const pages = Array.from(
    new Set(selected.map((chunk) => chunk.page).filter((p): p is number => typeof p === "number"))
  );

  const text = selected
    .map((chunk) => (chunk.page ? `[Page ${chunk.page}]\n${chunk.content}` : chunk.content))
    .join("\n\n---\n\n");

  return { text, pages };
}
