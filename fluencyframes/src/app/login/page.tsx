"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get("redirect") ?? "/app/session";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setStatus("Signing in...");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setStatus("");
      return;
    }

    setStatus("Signed in successfully.");
    router.replace(redirectTo);
  }

  return (
    <main className="min-h-screen bg-[#071126] px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col justify-center rounded-[32px] border border-cyan-400/20 bg-slate-950/70 p-6 shadow-[0_0_60px_rgba(0,229,255,0.16)] backdrop-blur sm:p-10 lg:flex-row lg:items-center lg:gap-10 lg:p-14">
        <section className="max-w-xl flex-1">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#00e5ff]">
            FluencyFrames
          </p>
          <h1 className="mt-4 text-4xl font-semibold sm:text-5xl" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Turn every practice session into momentum.
          </h1>
          <p className="mt-4 text-lg text-slate-300">
            Sign in to continue building your speaking routine with guided feedback and personalized review.
          </p>
        </section>

        <section className="mt-8 w-full max-w-md rounded-[24px] border border-cyan-400/20 bg-[#071126]/90 p-6 shadow-lg lg:mt-0">
          <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-slate-400">Enter your details to continue.</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm text-slate-200">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-cyan-400/20 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-[#00e5ff] focus:ring-2 focus:ring-[#00e5ff]/30"
                placeholder="you@example.com"
                required
              />
            </label>

            <label className="block text-sm text-slate-200">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-cyan-400/20 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-[#00e5ff] focus:ring-2 focus:ring-[#00e5ff]/30"
                placeholder="••••••••"
                required
              />
            </label>

            <button
              type="submit"
              className="w-full rounded-2xl bg-[#00e5ff] px-4 py-3 font-semibold text-[#071126] transition hover:brightness-110"
            >
              Sign in
            </button>
          </form>

          {status ? <p className="mt-4 text-sm text-cyan-300">{status}</p> : null}
          {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}
        </section>
      </div>
    </main>
  );
}
