import Link from "next/link";

export default function SessionPage() {
  return (
    <main className="min-h-screen bg-[#071126] px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl rounded-[24px] border border-cyan-400/20 bg-slate-950/70 p-8 shadow-[0_0_50px_rgba(0,229,255,0.16)]">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#00e5ff]">
          Session
        </p>
        <h1 className="mt-4 text-3xl font-semibold" style={{ fontFamily: "var(--font-space-grotesk)" }}>
          You’re signed in.
        </h1>
        <p className="mt-4 text-lg text-slate-300">
          Your authenticated workspace is ready. Continue with your practice plan or head back to the home experience.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-2xl bg-[#00e5ff] px-4 py-3 font-semibold text-[#071126] transition hover:brightness-110"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
