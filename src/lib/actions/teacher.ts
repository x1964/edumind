"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/types";

const studentSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  gradeLevel: z.string().trim().max(80).optional(),
});

export async function createTeacherStudentAction(input: unknown): Promise<ActionResult> {
  const parsed = studentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please enter a valid student name." };
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Unauthorized." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("teacher_students").insert({
    teacher_id: user.id,
    full_name: parsed.data.fullName,
    email: parsed.data.email || null,
    grade_level: parsed.data.gradeLevel || null,
  });
  if (error) return { ok: false, error: "Could not add the student." };
  revalidatePath("/dashboard/tutor");
  return { ok: true, message: "Student added." };
}
