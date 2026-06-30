"use server";

import { cookies } from "next/headers";
import { createServerSupabaseClient } from "../../lib/supabase/server";

export async function saveProgress({
  exerciseId,
  wordId,
  chosenWordId,
  isCorrect,
  mode,
}: {
  exerciseId: number;
  wordId: number;
  chosenWordId: number | null;
  isCorrect: boolean;
  mode: string;
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
  const now = new Date();

  const { error: logError } = await supabase.from("user_exercise_log").insert({
    user_id: userId,
    exercise_id: exerciseId,
    word_id: wordId,
    chosen_word_id: chosenWordId,
    is_correct: isCorrect,
    mode,
    created_at: now.toISOString(),
  });

  if (logError) {
    return { ok: false, error: logError.message };
  }

  const { data: existingProgress, error: fetchError } = await supabase
    .from("user_word_progress")
    .select("exposures, correct_score, spacing_gate, next_due, mastered")
    .eq("user_id", userId)
    .eq("word_id", wordId)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, error: fetchError.message };
  }

  const currentExposures = existingProgress?.exposures ?? 0;
  const currentCorrectScore = existingProgress?.correct_score ?? 0;
  const nextExposures = currentExposures + 1;
  const nextCorrectScore = Math.max(0, currentCorrectScore + (isCorrect ? 1.0 : -0.5));

  let nextGate = "24h";
  if (currentExposures === 0) {
    nextGate = "24h";
  } else if (currentExposures === 1) {
    nextGate = "48h";
  } else {
    nextGate = "72h";
  }

  if (!isCorrect) {
    nextGate = "24h";
  }

  const nextDue = new Date(
    now.getTime() +
      (() => {
        switch (nextGate) {
          case "48h":
            return 2 * 24 * 60 * 60 * 1000;
          case "72h":
            return 3 * 24 * 60 * 60 * 1000;
          default:
            return 24 * 60 * 60 * 1000;
        }
      })()
  ).toISOString();

  const { error: progressError } = await supabase.from("user_word_progress").upsert(
    {
      user_id: userId,
      word_id: wordId,
      exposures: nextExposures,
      correct_score: nextCorrectScore,
      spacing_gate: nextGate,
      next_due: nextDue,
      mastered: nextExposures >= 12,
      last_seen_at: now.toISOString(),
    },
    { onConflict: "user_id,word_id" }
  );

  if (progressError) {
    return { ok: false, error: progressError.message };
  }

  return { ok: true };
}
