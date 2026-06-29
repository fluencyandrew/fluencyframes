import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import ExerciseShell from "./ExerciseShell";

export const dynamic = "force-dynamic";

type ProfileRow = {
  avatar_url: string | null;
};

type SituationRow = {
  id: number;
  title: string | null;
  prompt: string | null;
  context: string | null;
};

type DialogueTurnRow = {
  id: number;
  turn_order: number;
  speaker: string | null;
  text: string | null;
};

type WordRow = {
  id: number;
  text: string | null;
  pos: string | null;
};

type ExerciseRow = {
  id: number;
  day_number: number | null;
  week_number: number | null;
  prompt: string | null;
  instruction: string | null;
  word_id: number | null;
  words?: {
    text: string | null;
    pos: string | null;
  } | null;
  option_word_ids?: number[] | null;
};

export default async function SessionPage() {
  const supabase = createServerSupabaseClient(cookies());
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [profileResult, situationResult, dialogueTurnsResult, exercisesResult] = await Promise.all([
    supabase.from("user_profiles").select("avatar_url").eq("user_id", userId).maybeSingle<ProfileRow>(),
    supabase.from("situations").select("id, title, prompt, context").eq("id", 1).maybeSingle<SituationRow>(),
    supabase
      .from("dialogue_turns")
      .select("id, turn_order, speaker, text")
      .eq("situation_id", 1)
      .order("turn_order", { ascending: true })
      .returns<DialogueTurnRow[]>(),
    supabase
      .from("exercises")
      .select("id, day_number, week_number, prompt, instruction, word_id, option_word_ids, words!word_id(text, pos)")
      .eq("day_number", 1)
      .eq("week_number", 1)
      .returns<ExerciseRow[]>(),
  ]);

  const profileError = profileResult.error;
  const situationError = situationResult.error;
  const dialogueTurnsError = dialogueTurnsResult.error;
  const exercisesError = exercisesResult.error;

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (situationError) {
    throw new Error(situationError.message);
  }

  if (dialogueTurnsError) {
    throw new Error(dialogueTurnsError.message);
  }

  if (exercisesError) {
    throw new Error(exercisesError.message);
  }

  const profile = profileResult.data;
  const situation = situationResult.data;
  const dialogueTurns = dialogueTurnsResult.data ?? [];
  const exercises = (exercisesResult.data ?? []) as ExerciseRow[];

  const exercisesWithOptions = await Promise.all(
    exercises.map(async (exercise) => {
      const optionWordIds = (exercise.option_word_ids ?? [])
        .filter((value): value is number => typeof value === "number")
        .filter((value) => Number.isFinite(value));

      let optionWords: WordRow[] = [];

      if (optionWordIds.length > 0) {
        const { data: optionWordRows, error: optionWordError } = await supabase
          .from("words")
          .select("id, text, pos")
          .in("id", optionWordIds)
          .returns<WordRow[]>();

        if (optionWordError) {
          throw new Error(optionWordError.message);
        }

        optionWords = optionWordRows ?? [];
      }

      return {
        ...exercise,
        word_text: exercise.words?.text ?? null,
        word_pos: exercise.words?.pos ?? null,
        option_words: optionWords,
      };
    })
  );

  return (
    <ExerciseShell
      session={session}
      profile={profile}
      situation={situation}
      dialogueTurns={dialogueTurns}
      exercises={exercisesWithOptions}
    />
  );
}
