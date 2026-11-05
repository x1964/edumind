import "server-only";
import type { Lang } from "@/lib/i18n";
import type { QuizDifficulty, SummaryStyle } from "@/lib/types";
import { generateStructured } from "@/lib/ai/provider";
import {
  flashcardOutputSchema,
  mindMapOutputSchema,
  quizOutputSchema,
  summaryOutputSchema,
  type FlashcardOutput,
  type MindMapOutput,
  type QuizOutput,
  type SummaryOutput,
} from "@/lib/ai/schemas";
import {
  flashcardsSystemPrompt,
  mindMapSystemPrompt,
  quizSystemPrompt,
  quizUserPrompt,
  summarySystemPrompt,
  summaryUserPrompt,
} from "@/lib/ai/prompts";

export async function generateSummary(
  lang: Lang,
  style: SummaryStyle,
  context: string
): Promise<SummaryOutput> {
  return generateStructured(summaryOutputSchema, {
    system: summarySystemPrompt(lang),
    prompt: summaryUserPrompt(style, context),
    maxTokens: 3200,
  });
}

export async function generateQuiz(
  lang: Lang,
  difficulty: QuizDifficulty,
  count: number,
  context: string
): Promise<QuizOutput> {
  const result = await generateStructured(quizOutputSchema, {
    system: quizSystemPrompt(lang, difficulty),
    prompt: quizUserPrompt(context, count),
    maxTokens: 3600,
  });

  const questions = result.questions
    .filter((question) => {
      if (question.type === "multiple_choice") {
        return question.options.length >= 2 && question.options.includes(question.correctAnswer);
      }
      if (question.type === "true_false") {
        return ["true", "false"].includes(question.correctAnswer.toLowerCase());
      }
      return question.correctAnswer.trim().length > 0;
    })
    .slice(0, count)
    .map((question) => ({
      ...question,
      correctAnswer:
        question.type === "true_false"
          ? question.correctAnswer.toLowerCase()
          : question.correctAnswer,
      options: question.type === "true_false" ? ["true", "false"] : question.options,
    }));

  return { title: result.title, questions };
}

export async function generateMindMap(lang: Lang, context: string): Promise<MindMapOutput> {
  const result = await generateStructured(mindMapOutputSchema, {
    system: mindMapSystemPrompt(lang),
    prompt: `<document>\n${context}\n</document>`,
    maxTokens: 4200,
  });

  // Normalize the provider output before persisting it. This protects the
  // editor from repeated ids, disconnected ideas, and non-mind-map links.
  const nodeById = new Map<string, MindMapOutput["nodes"][number]>();
  for (const node of result.nodes) {
    if (!nodeById.has(node.id)) nodeById.set(node.id, node);
  }

  const root = [...nodeById.values()].find((node) => node.kind === "root");
  if (!root) throw new Error("Mind map response has no root node");

  const mindMapTones = ["emerald", "sky", "violet", "amber", "rose", "cyan"] as const;
  const branches = result.edges
    .filter((edge) => edge.source === root.id)
    .map((edge) => nodeById.get(edge.target))
    .filter((node): node is MindMapOutput["nodes"][number] => node?.kind === "branch")
    .filter((node, index, items) => items.findIndex((item) => item.id === node.id) === index)
    .slice(0, 6)
    .map((node, index) => {
      const tone = mindMapTones.includes(node.tone as (typeof mindMapTones)[number])
        ? (node.tone as (typeof mindMapTones)[number])
        : (mindMapTones[index] ?? "emerald");
      return { ...node, tone };
    });

  const branchIds = new Set(branches.map((node) => node.id));
  const leaves = result.edges
    .filter((edge) => branchIds.has(edge.source))
    .map((edge) => ({ edge, node: nodeById.get(edge.target) }))
    .filter(
      (
        item
      ): item is { edge: MindMapOutput["edges"][number]; node: MindMapOutput["nodes"][number] } =>
        item.node?.kind === "leaf"
    )
    .filter(
      (item, index, items) =>
        items.findIndex((candidate) => candidate.node.id === item.node.id) === index
    )
    .slice(0, 24)
    .map(({ edge, node }) => ({
      ...node,
      tone: branches.find((branch) => branch.id === edge.source)?.tone ?? "emerald",
    }));

  const nodes: MindMapOutput["nodes"] = [{ ...root, tone: "emerald" }, ...branches, ...leaves];
  const edges = [
    ...branches.map((branch) => ({
      id: `e-${root.id}-${branch.id}`,
      source: root.id,
      target: branch.id,
    })),
    ...result.edges
      .filter(
        (edge) => branchIds.has(edge.source) && leaves.some((leaf) => leaf.id === edge.target)
      )
      .map((edge) => ({
        id: `e-${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
      })),
  ];

  return { title: result.title, nodes, edges };
}

export async function generateFlashcards(lang: Lang, context: string): Promise<FlashcardOutput> {
  const result = await generateStructured(flashcardOutputSchema, {
    system: flashcardsSystemPrompt(lang),
    prompt: `<document>\n${context}\n</document>`,
    maxTokens: 2800,
  });
  return result;
}
