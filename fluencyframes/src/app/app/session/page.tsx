import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Groundwork from "../../../components/Groundwork";
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

  const exerciseWordIds = exercises
    .map((exercise) => exercise.word_id)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  const groundworkItemsResult = await supabase
    .from("groundwork_items")
    .select(`
      id,
      word_id,
      image_url,
      bridge_sentence,
      words!word_id(id, text),
      distractor_ids
    `)
    .eq("needs_groundwork", true)
    .in("word_id", exerciseWordIds)
    .returns<any[]>();

  if (groundworkItemsResult.error) {
    throw new Error(groundworkItemsResult.error.message);
  }

  const groundworkItems = (groundworkItemsResult.data ?? []) as Array<{
    id: number;
    word_id: number;
    image_url: string | null;
    bridge_sentence: string | null;
    words?: { id: number; text: string | null } | null;
    distractor_ids?: number[] | null;
  }>;

  const { data: completedGroundworkRows, error: completedGroundworkError } = await supabase
    .from("user_groundwork_log")
    .select("word_id")
    .eq("user_id", userId)
    .in("word_id", exerciseWordIds);

  if (completedGroundworkError) {
    throw new Error(completedGroundworkError.message);
  }

  const completedGroundworkWordIds = new Set((completedGroundworkRows ?? []).map((row) => row.word_id));

  const filteredGroundworkItems = await Promise.all(
    groundworkItems
      .filter((item) => !completedGroundworkWordIds.has(item.word_id))
      .map(async (item) => {
        const distractorIds = (item.distractor_ids ?? []).filter((value): value is number => typeof value === "number");
        let distractorWords: Array<{ id: number; text: string | null }> = [];

        if (distractorIds.length > 0) {
          const { data: distractorRows, error: distractorError } = await supabase
            .from("words")
            .select("id, text")
            .in("id", distractorIds)
            .returns<Array<{ id: number; text: string | null }>>();

          if (distractorError) {
            throw new Error(distractorError.message);
          }

          distractorWords = distractorRows ?? [];
        }

        return {
          id: item.id,
          word_id: item.word_id,
          image_url: item.image_url,
          bridge_sentence: item.bridge_sentence,
          word: item.words ?? null,
          distractor_words: distractorWords,
        };
      })
  );

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
    <Groundwork items={filteredGroundworkItems}>
      <ExerciseShell
        session={session}
        profile={profile}
        situation={situation}
        dialogueTurns={dialogueTurns}
        exercises={exercisesWithOptions}
      />
    </Groundwork>
  );
}
