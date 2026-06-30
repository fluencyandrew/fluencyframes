"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient } from "@supabase/supabase-js";

export type GroundworkItem = {
  id: number;
  word_id: number;
  image_url: string | null;
  bridge_sentence: string | null;
  word: {
    id: number;
    text: string | null;
  } | null;
  distractor_words: Array<{
    id: number;
    text: string | null;
  }>;
};

type GroundworkProps = {
  items: GroundworkItem[];
  children: ReactNode;
  onComplete?: () => void;
};

export default function Groundwork({ items, children, onComplete }: GroundworkProps) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(items.length > 0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentItem = items[index];
  const options = useMemo(() => {
    if (!currentItem) return [];
    const correct = currentItem.word?.text ?? "";
    const distractors = currentItem.distractor_words.map((word) => word.text ?? "").filter(Boolean);
    const combined = Array.from(new Set([correct, ...distractors].filter(Boolean)));
    return combined.slice(0, 3);
  }, [currentItem]);

  useEffect(() => {
    setSelected(null);
  }, [index]);

  async function handleSelect(option: string) {
    if (!currentItem || selected || isSaving) return;
    setSelected(option);

    if (option !== (currentItem.word?.text ?? "")) {
      return;
    }

    if (!currentItem.word) return;

    setIsSaving(true);
    setError(null);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      }
    );
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      setError("You need to be signed in to continue.");
      setIsSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from("user_groundwork_log").insert({
      user_id: session.user.id,
      word_id: currentItem.word.id,
      completed_at: new Date().toISOString(),
    });

    if (insertError) {
      setError(insertError.message);
      setIsSaving(false);
      return;
    }

    const nextIndex = index + 1;
    if (nextIndex >= items.length) {
      setIsOpen(false);
      setIsSaving(false);
      onComplete?.();
      return;
    }

    window.setTimeout(() => {
      setIndex(nextIndex);
      setSelected(null);
      setIsSaving(false);
    }, 900);
  }

  if (!isOpen || !items.length) {
    return <>{children}</>;
  }

  if (!currentItem) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071126]/90 px-4 py-8">
        <div className="w-full max-w-3xl rounded-[32px] border border-cyan-400/20 bg-slate-950/90 p-6 shadow-[0_0_80px_rgba(0,229,255,0.18)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#00e5ff]">Groundwork</p>
              <h2 className="mt-2 text-2xl font-semibold text-white" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                Strengthen the word before the exercise begins
              </h2>
            </div>
            <div className="rounded-full border border-cyan-400/20 bg-[#071126] px-3 py-1 text-sm text-slate-300">
              {index + 1} / {items.length}
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-[24px] border border-cyan-400/20 bg-[#071126]">
            {currentItem.image_url ? (
              <img src={currentItem.image_url} alt="Groundwork illustration" className="h-72 w-full object-cover" />
            ) : (
              <div className="flex h-72 items-center justify-center text-sm text-slate-400">No image provided</div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {options.map((option) => {
              const isCorrect = option === (currentItem.word?.text ?? "");
              const isSelected = selected === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    isSelected
                      ? isCorrect
                        ? "border-emerald-400 bg-emerald-500/10 text-emerald-300"
                        : "border-rose-400 bg-rose-500/10 text-rose-300"
                      : "border-cyan-400/20 bg-slate-900/80 text-slate-100 hover:border-[#00e5ff]"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {selected ? (
            <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-slate-900/70 p-4 text-sm text-slate-300">
              {selected === (currentItem.word?.text ?? "") ? (
                <>
                  <p className="font-semibold text-[#00e5ff]">Nice choice.</p>
                  <p className="mt-2">{currentItem.bridge_sentence ?? "That word is now ready for the exercise."}</p>
                </>
              ) : (
                <p>Try again. Choose the word that best fits the image.</p>
              )}
            </div>
          ) : null}

          {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}
          {isSaving ? <p className="mt-4 text-sm text-cyan-300">Saving your groundwork step…</p> : null}
        </div>
      </div>
      {children}
    </>
  );
}
