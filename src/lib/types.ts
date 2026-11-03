import type { Lang } from "@/lib/i18n";

export type MaterialStatus = "processing" | "ready" | "failed";
export type FileKind = "pdf" | "docx" | "txt";
export type SummaryStyle = "short" | "detailed" | "key_points" | "exam_revision" | "simplified";
export type QuizDifficulty = "easy" | "medium" | "hard";
export type QuestionType = "multiple_choice" | "true_false" | "short_answer";
export type TaskPriority = "low" | "medium" | "high";

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  education_level: "school" | "university" | "independent" | null;
  learning_interests: string[];
  learning_goals: string[];
  learning_language: Lang;
  theme: "dark" | "light" | "system";
  notifications: { email?: boolean; study_reminders?: boolean };
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Material {
  id: string;
  user_id: string;
  file_name: string;
  file_type: FileKind;
  mime_type: string;
  file_size: number;
  storage_path: string;
  status: MaterialStatus;
  error_message: string | null;
  extracted_text: string | null;
  page_count: number | null;
  word_count: number | null;
  last_opened_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaterialSummaryRow {
  id: string;
  file_name: string;
  file_type: FileKind;
  file_size: number;
  status: MaterialStatus;
  created_at: string;
  last_opened_at: string | null;
}

export interface TutorThread {
  id: string;
  user_id: string;
  material_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface TutorMessage {
  id: string;
  thread_id: string;
  user_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  citations: unknown;
  created_at: string;
}

export interface Summary {
  id: string;
  user_id: string;
  material_id: string;
  style: SummaryStyle;
  title: string;
  content: string;
  edited: boolean;
  created_at: string;
  updated_at: string;
  materials?: { file_name: string } | null;
}

export interface Quiz {
  id: string;
  user_id: string;
  material_id: string;
  title: string;
  difficulty: QuizDifficulty;
  created_at: string;
  materials?: { file_name: string } | null;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  user_id: string;
  position: number;
  type: QuestionType;
  prompt: string;
  options: string[] | null;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  answers: Record<string, string>;
  results: QuizResultItem[];
  score: number;
  correct_count: number;
  total_count: number;
  completed_at: string;
}

export interface QuizResultItem {
  questionId: string;
  given: string;
  correct: string;
  isCorrect: boolean;
  explanation: string | null;
}

export interface StudyTask {
  id: string;
  user_id: string;
  material_id: string | null;
  title: string;
  description: string | null;
  subject: string | null;
  due_date: string | null;
  priority: TaskPriority;
  estimated_minutes: number | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MindMap {
  id: string;
  user_id: string;
  material_id: string | null;
  title: string;
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  created_at: string;
  updated_at: string;
}

export interface MindMapNode {
  id: string;
  label: string;
  kind: "root" | "branch" | "leaf";
  position?: { x: number; y: number };
}

export interface MindMapEdge {
  id: string;
  source: string;
  target: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  material_id: string | null;
  activity: "material" | "tutor" | "quiz" | "summary" | "mind_map";
  duration_seconds: number;
  started_at: string;
  ended_at: string;
}

export interface Flashcard {
  id: string;
  user_id: string;
  material_id: string;
  front: string;
  back: string;
  position: number;
  created_at: string;
}
