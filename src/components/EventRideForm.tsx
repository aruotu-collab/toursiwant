"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  formatEventWhen,
  getEvent,
  nycEventsThisWeek,
} from "@/lib/events";

export function EventRideForm() {
  const searchParams = useSearchParams();
  const eventSlug = searchParams.get("event") || "";
  const selected = eventSlug ? getEvent(eventSlug) : undefined;

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [magicUrl, setMagicUrl] = useState<string | null>(null);
  const [saveAccount, setSaveAccount] = useState(true);

  const defaultEvent = useMemo(
    () => selected || nycEventsThisWeek[0],
    [selected],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const slug = String(data.get("eventSlug") || defaultEvent.slug);
    const evt = getEvent(slug) || defaultEvent;
    const name = String(data.get("name") || "");
    const email = String(data.get("email") || "");

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "event_ride",
          name,
          email,
          phone: String(data.get("phone") || ""),
          groupSize: data.get("groupSize") || 1,
          pickup: String(data.get("pickup") || ""),
          returnAddress: String(data.get("returnAddress") || ""),
          eventSlug: evt.slug,
          eventName: evt.name,
          eventStart: evt.startsAt,
          eventEnd: evt.endsAt,
          details: String(data.get("details") || ""),
          travelDate: evt.startsAt.slice(0, 10),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error || "Could not save your request.");
      }

      if (saveAccount && email) {
        const authRes = await fetch("/api/auth/magic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            name,
            role: "traveller",
            nextPath: "/events",
          }),
        });
        if (authRes.ok) {
          const authPayload = (await authRes.json()) as { magicUrl?: string };
          if (authPayload.magicUrl) setMagicUrl(authPayload.magicUrl);
        }
      }

      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Could not save your request.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="flex-1 bg-[linear-gradient(180deg,var(--mist)_0%,var(--paper)_40%)]">
        <div className="mx-auto max-w-2xl px-5 py-28 sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-skyline">
            Event transport
          </p>
          <h1 className="mt-3 font-display text-4xl text-ink">
            Pickup & return requested
          </h1>
          <p className="mt-4 text-ink-soft">
            Operators can now quote door-to-door for your event. Check your email
            if you asked to save the request to an account.
          </p>
          {magicUrl ? (
            <a
              href={magicUrl}
              className="mt-6 inline-flex bg-amber px-5 py-3 text-sm font-semibold text-ink hover:bg-amber-deep"
            >
              Activate account →
            </a>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/events"
              className="bg-amber px-5 py-3 text-sm font-semibold text-ink hover:bg-amber-deep"
            >
              Back to events
            </Link>
            <Link
              href="/"
              className="border border-ink/20 px-5 py-3 text-sm font-semibold text-ink hover:bg-white"
            >
              Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-[linear-gradient(180deg,var(--mist)_0%,var(--paper)_35%)]">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-24 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:py-28">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-skyline">
            Event Pickup & Return
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">
            Home → event → home again
          </h1>
          <p className="mt-4 max-w-md text-ink-soft">
            Tell us where you are, which event, and where to return. Operators
            quote fixed windows so you&apos;re not stranded after the show.
          </p>
          {selected ? (
            <div className="mt-8 border border-ink/10 bg-white/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-deep">
                Selected event
              </p>
              <p className="mt-2 font-display text-2xl text-ink">
                {selected.name}
              </p>
              <p className="mt-2 text-sm text-ink-soft">
                {selected.venue} · {formatEventWhen(selected.startsAt)}
              </p>
            </div>
          ) : null}
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 border border-ink/10 bg-white/80 p-6 sm:p-8"
        >
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink">
              Event
            </span>
            <select
              name="eventSlug"
              defaultValue={defaultEvent.slug}
              className="w-full border border-ink/15 bg-paper/60 px-3 py-2.5 text-ink outline-none focus:border-skyline"
            >
              {nycEventsThisWeek.map((evt) => (
                <option key={evt.slug} value={evt.slug}>
                  {evt.name} — {formatEventWhen(evt.startsAt)}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your name" name="name" required />
            <Field label="Email" name="email" type="email" required />
          </div>
          <Field label="Phone / WhatsApp" name="phone" type="tel" required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="How many people?"
              name="groupSize"
              type="number"
              min={1}
              defaultValue={2}
              required
            />
            <Field
              label="Pickup address"
              name="pickup"
              placeholder={defaultEvent.pickupHint}
              required
            />
          </div>
          <Field
            label="Return address"
            name="returnAddress"
            placeholder="Same as pickup, or different hotel / ship"
            required
          />
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink">
              Notes for the driver
            </span>
            <textarea
              name="details"
              rows={3}
              className="w-full border border-ink/15 bg-paper/60 px-3 py-2.5 text-ink outline-none focus:border-skyline"
              placeholder="Child seats, luggage, must return by a hard time…"
            />
          </label>

          <label className="flex items-start gap-3 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={saveAccount}
              onChange={(e) => setSaveAccount(e.target.checked)}
              className="mt-1"
            />
            <span>
              Save this request with a magic-link account so I can track quotes.
            </span>
          </label>

          {submitError ? (
            <p className="text-sm text-rose-700">{submitError}</p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-amber px-6 py-4 text-base font-semibold text-ink hover:bg-amber-deep disabled:opacity-70"
          >
            {submitting ? "Saving…" : "Request Event Pickup & Return"}
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  min,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  min?: number;
  defaultValue?: string | number;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-ink">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        min={min}
        defaultValue={defaultValue}
        className="w-full border border-ink/15 bg-paper/60 px-3 py-2.5 text-ink outline-none transition focus:border-skyline"
      />
    </label>
  );
}
