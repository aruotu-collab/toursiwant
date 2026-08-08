"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function JoinContent() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const nextPath = searchParams.get("next") || undefined;
  const error = searchParams.get("error");
  const isOperator = roleParam === "operator";

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    emailed: boolean;
    magicUrl?: string;
    emailReason?: string;
  } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setResult(null);

    try {
      const response = await fetch("/api/auth/magic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: name || undefined,
          role: isOperator ? "operator" : "traveller",
          nextPath: nextPath || (isOperator ? "/operator" : "/"),
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        emailed?: boolean;
        magicUrl?: string;
        emailReason?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || "Could not send sign-in link.");
      }
      setResult({
        emailed: Boolean(payload.emailed),
        magicUrl: payload.magicUrl,
        emailReason: payload.emailReason,
      });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Could not send sign-in link.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-skyline">
          Join ToursIWant
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">
          {isOperator ? "Staff sign-in" : "Continue with email"}
        </h1>
        <p className="mt-4 max-w-md text-ink-soft">
          Use the Scorecard freely. Sign in when you want to save trips to My
          trips.
        </p>
        <div className="mt-8">
          <Link
            href="/scorecard"
            className="text-sm text-skyline underline-offset-2 hover:underline"
          >
            ← Back to Scorecard
          </Link>
        </div>
      </div>

      {result ? (
        <div className="border border-ink/10 bg-white/80 p-6 sm:p-8">
          <h2 className="font-display text-2xl text-ink">Check your email</h2>
          <p className="mt-3 text-ink-soft">
            {result.emailed
              ? `We sent a magic link to ${email}. Open it to join ToursIWant.`
              : `Email delivery isn’t configured yet — use the link below to continue as ${email}.`}
          </p>
          {result.magicUrl ? (
            <a
              href={result.magicUrl}
              className="mt-6 inline-flex bg-amber px-5 py-3 text-sm font-semibold text-ink hover:bg-amber-deep"
            >
              Continue with magic link →
            </a>
          ) : null}
          {!result.emailed && result.emailReason ? (
            <p className="mt-4 text-xs text-stone">{result.emailReason}</p>
          ) : null}
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-5 border border-ink/10 bg-white/80 p-6 sm:p-8"
        >
          {error === "expired" || error === "invalid" ? (
            <p className="text-sm text-rose-700">
              That sign-in link is invalid or expired. Request a new one below.
            </p>
          ) : null}

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink">
              Your name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex"
              className="w-full border border-ink/15 bg-paper/60 px-3 py-2.5 text-ink outline-none transition focus:border-skyline"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@email.com"
              className="w-full border border-ink/15 bg-paper/60 px-3 py-2.5 text-ink outline-none transition focus:border-skyline"
            />
          </label>

          {submitError ? (
            <p className="text-sm text-rose-700">{submitError}</p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-amber px-6 py-4 text-base font-semibold text-ink transition hover:bg-amber-deep disabled:opacity-70"
          >
            {submitting
              ? "Sending link…"
              : isOperator
                ? "Email me an operator sign-in link"
                : "Email me a sign-in link"}
          </button>
          <p className="text-xs text-stone">
            No password. One click from your inbox (or the on-screen link while
            email is being set up).
          </p>
        </form>
      )}
    </>
  );
}

export default function JoinPage() {
  return (
    <main className="flex-1 bg-[linear-gradient(180deg,var(--mist)_0%,var(--paper)_40%)]">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-24 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:py-28">
        <Suspense
          fallback={
            <>
              <div className="h-40 animate-pulse bg-white/40" />
              <div className="h-64 animate-pulse bg-white/50" />
            </>
          }
        >
          <JoinContent />
        </Suspense>
      </div>
    </main>
  );
}
