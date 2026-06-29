"use client";

import Image from "next/image";

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
  word_text: string | null;
  word_pos: string | null;
  option_words: WordRow[];
};

type ExerciseShellProps = {
  session: {
    user: {
      id: string;
      email?: string | null;
    };
  } | null;
  profile: ProfileRow | null;
  situation: SituationRow | null;
  dialogueTurns: DialogueTurnRow[];
  exercises: ExerciseRow[];
};

export default function ExerciseShell({
  session,
  profile,
  situation,
  dialogueTurns,
  exercises,
}: ExerciseShellProps) {
  return (
    <main className="min-h-screen bg-[#071126] px-6 py-10 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-[24px] border border-cyan-400/20 bg-slate-950/70 p-6 shadow-[0_0_40px_rgba(0,229,255,0.12)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#00e5ff]">
                Practice Session
              </p>
              <h1 className="mt-2 text-3xl font-semibold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                Welcome back, {session?.user?.email ?? "learner"}
              </h1>
            </div>
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt="Profile avatar"
                width={56}
                height={56}
                className="h-14 w-14 rounded-full border border-cyan-400/20 object-cover"
              />
            ) : null}
          </div>

          {situation ? (
            <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-[#071126]/70 p-4">
              <p className="text-sm font-semibold text-[#00e5ff]">Current Situation</p>
              <h2 className="mt-2 text-xl font-semibold">{situation.title ?? "Active scenario"}</h2>
              <p className="mt-2 text-slate-300">{situation.prompt ?? situation.context}</p>
            </div>
          ) : null}
        </section>

        <section className="rounded-[24px] border border-cyan-400/20 bg-slate-950/70 p-6 shadow-[0_0_40px_rgba(0,229,255,0.12)]">
          <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Dialogue turns
          </h2>
          <div className="mt-4 space-y-3">
            {dialogueTurns.map((turn) => (
              <div key={turn.id} className="rounded-2xl border border-cyan-400/20 bg-[#071126]/70 p-4">
                <p className="text-sm font-medium text-[#00e5ff]">
                  {turn.speaker ?? "Turn"} • #{turn.turn_order}
                </p>
                <p className="mt-2 text-slate-200">{turn.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-cyan-400/20 bg-slate-950/70 p-6 shadow-[0_0_40px_rgba(0,229,255,0.12)]">
          <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Exercises
          </h2>
          <div className="mt-4 space-y-4">
            {exercises.map((exercise) => (
              <div key={exercise.id} className="rounded-2xl border border-cyan-400/20 bg-[#071126]/70 p-4">
                <p className="text-sm font-semibold text-[#00e5ff]">Exercise #{exercise.id}</p>
                <p className="mt-2 text-slate-200">{exercise.prompt}</p>
                {exercise.instruction ? <p className="mt-2 text-sm text-slate-400">{exercise.instruction}</p> : null}
                <div className="mt-3 rounded-xl border border-cyan-400/20 bg-slate-900/70 p-3 text-sm text-slate-300">
                  <p>
                    Target word: <span className="font-semibold text-white">{exercise.word_text ?? "—"}</span>
                  </p>
                  <p className="mt-1">POS: {exercise.word_pos ?? "—"}</p>
                </div>
                {exercise.option_words.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {exercise.option_words.map((word) => (
                      <span key={word.id} className="rounded-full border border-cyan-400/20 bg-slate-900/70 px-3 py-1 text-sm text-slate-200">
                        {word.text} ({word.pos})
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
