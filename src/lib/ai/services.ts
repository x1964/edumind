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
    maxTokens: 2800,
  });

  const nodeIds = new Set(result.nodes.map((node) => node.id));
  const nodes = result.nodes.filter((node) => nodeIds.has(node.id)).slice(0, 40);
  const edges = result.edges.filter(
    (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target) && edge.source !== edge.target
  );

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
