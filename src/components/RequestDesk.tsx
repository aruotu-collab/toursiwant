"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatDisplayDate, toDateKey } from "@/lib/sample-tours";

type DeskIntent =
  | "custom"
  | "stay"
  | "event"
  | "operator"
  | "tours"
  | "pulse";

const intents: {
  id: DeskIntent;
  title: string;
  copy: string;
  href?: string;
  menu?: "tours" | "pulse";
}[] = [
  {
    id: "custom",
    title: "Custom tour request",
    copy: "Describe the day — operators quote you.",
  },
  {
    id: "stay",
    title: "Stay Near Your Tour",
    copy: "Hotel or short stay close to the meetup.",
    href: "/request?intent=stay",
  },
  {
    id: "event",
    title: "Event Pickup & Return",
    copy: "Door-to-door for concerts, games, Broadway.",
    href: "/events/ride",
  },
  {
    id: "operator",
    title: "Operator interest",
    copy: "List US tours and receive the lead inbox.",
    href: "/request?intent=operator",
  },
  {
    id: "tours",
    title: "Find a listed tour",
    copy: "Theme, state, city — then request a seat.",
    menu: "tours",
  },
  {
    id: "pulse",
    title: "Near you",
    copy: "See what’s near your stay, then join or book.",
    menu: "pulse",
  },
];

export function RequestDesk({
  onSelectTab,
}: {
  onSelectTab?: (tab: "tours" | "pulse") => void;
}) {
  const [intent, setIntent] = useState<DeskIntent>("custom");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = toDateKey(new Date());

  const active = useMemo(
    () => intents.find((item) => item.id === intent) || intents[0],
    [intent],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "custom_request",
          name: String(data.get("name") || ""),
          email: String(data.get("email") || ""),
          phone: String(data.get("phone") || ""),
          travelDate: String(data.get("date") || today),
          pickup: String(data.get("pickup") || ""),
          details: String(data.get("details") || ""),
          groupSize: data.get("groupSize") || undefined,
          needAccommodation: false,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error || "Could not save your request.");
      }
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save your request.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="border border-amber/30 bg-amber/5 p-6 text-white">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-amber">
          Request desk
        </p>
        <h3 className="mt-2 font-display text-2xl">Your request is in</h3>
        <p className="mt-2 text-sm text-white/65">
          Operators will quote you by email. Track replies in Account when you
          sign in.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/?menu=account"
            className="bg-amber px-4 py-2.5 text-sm font-semibold text-ink hover:bg-amber-deep"
          >
            Open account
          </Link>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:border-white/40"
          >
            Send another
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="overflow-x-hidden text-white">
      <p className="mb-4 font-mono text-xs uppercase tracking-[0.14em] text-white/55">
        Request desk · tell us what you want
      </p>

      <div className="border border-amber/30 bg-amber/5 p-4 sm:p-5">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-amber">
          1 · What do you need?
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {intents.map((item) => {
            const selected = intent === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setIntent(item.id)}
                className={`border px-3 py-3 text-left transition ${
                  selected
                    ? "border-amber bg-amber text-ink"
                    : "border-white/15 text-white hover:border-white/35"
                }`}
              >
                <span className="block text-sm font-semibold">{item.title}</span>
                <span className="mt-1 block text-xs opacity-70">{item.copy}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-amber">
          2 · {active.title}
        </p>

        {intent === "custom" ? (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-white/80">
                  Your name
                </span>
                <input
                  name="name"
                  required
                  className="w-full border border-white/15 bg-ink/70 px-3 py-2.5 text-white outline-none focus:border-amber/50"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-white/80">
                  Email
                </span>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full border border-white/15 bg-ink/70 px-3 py-2.5 text-white outline-none focus:border-amber/50"
                />
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-white/80">
                  Phone
                </span>
                <input
                  name="phone"
                  type="tel"
                  className="w-full border border-white/15 bg-ink/70 px-3 py-2.5 text-white outline-none focus:border-amber/50"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-white/80">
                  Travel date
                </span>
                <input
                  name="date"
                  type="date"
                  defaultValue={today}
                  min={today}
                  required
                  className="w-full border border-white/15 bg-ink/70 px-3 py-2.5 text-white outline-none [color-scheme:dark] focus:border-amber/50"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-white/80">
                  Group size
                </span>
                <input
                  name="groupSize"
                  type="number"
                  min={1}
                  defaultValue={2}
                  className="w-full border border-white/15 bg-ink/70 px-3 py-2.5 text-white outline-none focus:border-amber/50"
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-white/80">
                Pickup / where staying
              </span>
              <input
                name="pickup"
                placeholder="Hotel, cruise terminal, city…"
                className="w-full border border-white/15 bg-ink/70 px-3 py-2.5 text-white outline-none placeholder:text-white/35 focus:border-amber/50"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-white/80">
                Describe the tour you want
              </span>
              <textarea
                name="details"
                required
                rows={4}
                placeholder="e.g. Patterson Bethel visitor tour from Midtown hotel, or religious tours in New York State…"
                className="w-full border border-white/15 bg-ink/70 px-3 py-2.5 text-white outline-none placeholder:text-white/35 focus:border-amber/50"
              />
            </label>
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-amber px-4 py-3 text-sm font-semibold text-ink hover:bg-amber-deep disabled:opacity-70"
            >
              {submitting ? "Sending…" : "Send my tour request"}
            </button>
            <p className="text-xs text-white/45">
              Prefer the full form?{" "}
              <Link href="/request" className="text-amber hover:underline">
                Open /request
              </Link>{" "}
              · Today is {formatDisplayDate(today)}.
            </p>
          </form>
        ) : active.menu ? (
          <div className="mt-4">
            <p className="text-sm text-white/65">{active.copy}</p>
            <button
              type="button"
              onClick={() => onSelectTab?.(active.menu!)}
              className="mt-4 inline-flex bg-amber px-4 py-3 text-sm font-semibold text-ink hover:bg-amber-deep"
            >
              Open {active.title} →
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <p className="text-sm text-white/65">{active.copy}</p>
            <Link
              href={active.href || "/request"}
              className="mt-4 inline-flex bg-amber px-4 py-3 text-sm font-semibold text-ink hover:bg-amber-deep"
            >
              Continue →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
