"use server";

import { cookies } from "next/headers";
import { createServerSupabaseClient } from "../supabase/server";

export async function logExerciseAttempt({
  exerciseIndex,
  selectedWord,
  targetWord,
  isCorrect,
  feedback,
}: {
  exerciseIndex: number;
  selectedWord: string | null;
  targetWord: string;
  isCorrect: boolean;
  feedback: string;
}) {
  const supabase = createServerSupabaseClient(cookies());

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return { ok: false, error: "No active session" };
  }

  const userId = session.user.id;

  const { error: logError } = await supabase.from("user_exercise_log").insert({
    user_id: userId,
    exercise_index: exerciseIndex,
    selected_word: selectedWord,
    target_word: targetWord,
    is_correct: isCorrect,
    feedback,
  });

  if (logError) {
    return { ok: false, error: logError.message };
  }

  const { error: progressError } = await supabase.from("user_word_progress").upsert(
    {
      user_id: userId,
      word_text: targetWord,
      exposure_count: 1,
      mastery_level: isCorrect ? "mastered" : "in_progress",
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "user_id,word_text" }
  );

  if (progressError) {
    return { ok: false, error: progressError.message };
  }

  return { ok: true };
}
