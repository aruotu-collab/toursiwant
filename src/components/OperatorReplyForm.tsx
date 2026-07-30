"use client";

import { useState } from "react";

type OperatorReplyFormProps = {
  requestId: string;
  travellerName: string;
  alreadyReplied?: boolean;
  existingQuote?: string;
  existingReply?: string;
};

export function OperatorReplyForm({
  requestId,
  travellerName,
  alreadyReplied,
  existingQuote,
  existingReply,
}: OperatorReplyFormProps) {
  const [open, setOpen] = useState(false);
  const [quote, setQuote] = useState(existingQuote || "");
  const [message, setMessage] = useState(existingReply || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(Boolean(alreadyReplied && existingReply));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/requests/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          message,
          quote: quote || undefined,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        emailSent?: boolean;
      };
      if (!res.ok) {
        setError(data.error || "Could not send reply.");
        return;
      }
      setDone(true);
      setOpen(false);
      if (data.emailSent === false) {
        setError(
          "Reply saved, but email could not be sent. Traveller can still see it in Account.",
        );
      }
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done && !open) {
    return (
      <div className="mt-4 border border-skyline/25 bg-skyline/5 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-skyline">
          Reply sent
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          {travellerName} was emailed and can see this in their ToursIWant
          account.
        </p>
        {existingQuote || quote ? (
          <p className="mt-2 text-sm font-semibold text-ink">
            Quote: {existingQuote || quote}
          </p>
        ) : null}
        <p className="mt-2 whitespace-pre-wrap text-sm text-ink">
          {existingReply || message}
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 text-sm font-semibold text-skyline underline-offset-2 hover:underline"
        >
          Update reply
        </button>
        {error ? <p className="mt-2 text-sm text-amber-deep">{error}</p> : null}
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-amber px-4 py-2 text-sm font-semibold text-ink hover:bg-amber-deep"
      >
        {alreadyReplied ? "Update quote / reply" : "Send quote to traveller"}
      </button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-4 space-y-3 border border-ink/10 bg-paper/60 p-4"
    >
      <p className="text-sm text-ink-soft">
        This saves on ToursIWant and emails {travellerName} so they know you
        responded.
      </p>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone">
          Quote (optional)
        </span>
        <input
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          placeholder="e.g. $240 for 2 travellers"
          className="mt-1.5 w-full border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-skyline"
        />
      </label>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone">
          Message to traveller
        </span>
        <textarea
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Availability, pickup notes, what’s included…"
          className="mt-1.5 w-full border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-skyline"
        />
      </label>
      {error ? <p className="text-sm text-amber-deep">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={busy}
          className="bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink-soft disabled:opacity-60"
        >
          {busy ? "Sending…" : "Send & email traveller"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="border border-ink/20 px-4 py-2 text-sm font-semibold text-ink hover:bg-white"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
