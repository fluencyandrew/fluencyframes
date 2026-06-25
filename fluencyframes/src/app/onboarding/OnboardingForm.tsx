"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase/client";

const genderOptions = [
  { value: "he", label: "He" },
  { value: "she", label: "She" },
  { value: "they", label: "They" },
] as const;

type Gender = "he" | "she" | "they";

export default function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender>("they");
  const [role, setRole] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const initials = useMemo(() => {
    const parts = name.trim().split(" ").filter(Boolean);
    return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join("");
  }, [name]);

  async function handleNext() {
    setError("");

    if (step === 1) {
      if (!name.trim() || !gender) {
        setError("Please enter your name and gender.");
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!role.trim()) {
        setError("Please enter your professional role.");
        return;
      }
      setStep(3);
      return;
    }

    if (step === 3) {
      setLoading(true);
      try {
        const avatarUrl = await uploadAvatar();

        const response = await fetch("/app/onboarding/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            gender,
            role: role.trim(),
            avatarUrl,
          }),
        });

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result?.error ?? "Failed to complete onboarding.");
        }

        router.push("/app/session");
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    }
  }

  async function uploadAvatar() {
    if (!avatarFile) return null;

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      throw new Error("Unable to determine current user for avatar upload.");
    }

    const fileExt = avatarFile.name.split(".").pop() ?? "png";
    const fileName = `${userData.user.id}/${crypto.randomUUID()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, avatarFile, { upsert: true });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
    return data.publicUrl;
  }

  const stepLabel = step === 1 ? "Name & gender" : step === 2 ? "Professional role" : "Avatar";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto w-full max-w-xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <div className="mb-8 space-y-3 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Onboarding</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">Tell us a little about yourself</h1>
          <p className="text-sm leading-6 text-slate-600">Complete the 3-step setup to personalize your profile.</p>
        </div>

        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Step {step} of 3</p>
            <p className="text-sm text-slate-500">{stepLabel}</p>
          </div>
          <div className="grid gap-2 rounded-full bg-slate-100 p-1">
            {[1, 2, 3].map((activeStep) => (
              <div
                key={activeStep}
                className={`h-2 rounded-full ${activeStep <= step ? "bg-slate-900" : "bg-slate-300"}`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {step === 1 ? (
            <div className="space-y-6">
              <label className="block text-sm font-medium text-slate-700">
                Full name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  placeholder="Jane Doe"
                />
              </label>

              <div>
                <p className="mb-3 text-sm font-medium text-slate-700">Gender</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {genderOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setGender(option.value)}
                      className={`rounded-3xl border px-4 py-3 text-left transition ${
                        gender === option.value
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : step === 2 ? (
            <div className="space-y-6">
              <label className="block text-sm font-medium text-slate-700">
                Professional role
                <input
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  placeholder="Senior Engineer, Pharma"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-slate-200 text-3xl font-semibold text-slate-700">
                  {avatarFile ? initials : initials || "JD"}
                </div>
                <p className="text-sm text-slate-600">Upload a profile photo or skip to use initials.</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
                  className="w-full text-sm text-slate-700"
                />
                {avatarFile ? <p className="text-sm text-slate-500">Selected: {avatarFile.name}</p> : null}
              </div>
            </div>
          )}
        </div>

        {error ? <p className="mt-6 text-sm text-red-600">{error}</p> : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setStep((current) => Math.max(1, current - 1))}
            disabled={step === 1 || loading}
            className="rounded-3xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={loading}
            className="rounded-3xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {step < 3 ? "Next step" : loading ? "Completing..." : "Finish onboarding"}
          </button>
        </div>
      </div>
    </main>
  );
}
