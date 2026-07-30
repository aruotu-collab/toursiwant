"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthGreeting, AuthNav } from "@/components/AuthNav";
import { TourPulseBoard } from "@/components/TourPulseBoard";
import { TourRushBoard } from "@/components/TourRushBoard";
import { formatEventWhen, nycEventsThisWeek } from "@/lib/events";
import {
  formatDisplayDate,
  getToursForDate,
  toDateKey,
} from "@/lib/sample-tours";

export type CommandTab =
  | "pulse"
  | "seats"
  | "tours"
  | "events"
  | "request"
  | "account";

const MENU: { id: CommandTab; label: string; hash: string }[] = [
  { id: "pulse", label: "Pulse", hash: "pulse" },
  { id: "seats", label: "Live seats", hash: "rush" },
  { id: "tours", label: "Find tours", hash: "tours" },
  { id: "events", label: "Events", hash: "events" },
  { id: "request", label: "Request", hash: "request" },
  { id: "account", label: "Account", hash: "account" },
];

const TAB_COPY: Record<
  CommandTab,
  { eyebrow: string; title: string; blurb: string }
> = {
  pulse: {
    eyebrow: "Tour Pulse · New York",
    title: "Where tours are happening now",
    blurb:
      "Live rhythm along the city spine — harbor to airports. Tap a pulse for zone activity, then join or request nearby.",
  },
  seats: {
    eyebrow: "Tour Rush · live now",
    title: "Seats are filling. Timers are running.",
    blurb:
      "Countdown, scarcity, and live interest — claim a New York seat before someone else does.",
  },
  tours: {
    eyebrow: "Find tours · by date",
    title: "Pick a date. See what’s running.",
    blurb:
      "Browse New York departures for today or months ahead, then open a listing or request something custom.",
  },
  events: {
    eyebrow: "Events This Week",
    title: "Home → event → home again",
    blurb:
      "Concerts, games, and Broadway — request Event Pickup & Return without leaving the board.",
  },
  request: {
    eyebrow: "Request desk",
    title: "Tell us what you want",
    blurb:
      "Custom tours, stay-near lodging, or operator interest — same capture loop, opened as menus on this board.",
  },
  account: {
    eyebrow: "Member area",
    title: "Your ToursIWant account",
    blurb:
      "Sign in with email to track requests, or open your full account page.",
  },
};

function tabFromHash(hash: string): CommandTab | null {
  const raw = hash.replace(/^#/, "").toLowerCase();
  if (raw === "rush" || raw === "seats") return "seats";
  if (raw === "market") return "pulse";
  const match = MENU.find((m) => m.hash === raw || m.id === raw);
  return match?.id ?? null;
}

export function HomeCommandCenter() {
  const [tab, setTabState] = useState<CommandTab>("pulse");

  const selectTab = useCallback((next: CommandTab) => {
    setTabState(next);
    const hash = MENU.find((m) => m.id === next)?.hash || next;
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${hash}`);
    }
  }, []);

  useEffect(() => {
    const sync = () => {
      const fromHash = tabFromHash(window.location.hash);
      if (fromHash) setTabState(fromHash);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const copy = TAB_COPY[tab];

  return (
    <div className="min-h-full bg-ink text-white">
      {/* Slim top bar */}
      <div className="border-b border-white/10 bg-[#0a1520]/">
        <div className="mx-auto flex w-full max-w-[90rem] flex-wrap items-center gap-x-4 gap-y-3 px-5 py-3.5 sm:px-8">
          <div className="min-w-0 shrink-0">
            <p className="font-display text-xl tracking-tight text-white sm:text-2xl">
              Tours<span className="text-amber">I</span>Want
            </p>
            <AuthGreeting variant="dark" />
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <AuthNav variant="dark" />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[90rem] px-5 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-amber">
              {copy.eyebrow}
            </p>
            <h1 className="mt-2 font-display text-3xl text-white sm:text-4xl">
              {copy.title}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/70 sm:text-base">
              {copy.blurb}
            </p>
          </div>
        </div>

        {/* Feature menus */}
        <div className="mt-6 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {MENU.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectTab(item.id)}
                className={`shrink-0 border px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] transition ${
                  active
                    ? "border-amber bg-amber text-ink"
                    : "border-white/20 bg-white/5 text-white/70 hover:border-white/40 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          {tab === "pulse" ? <TourPulseBoard embedded /> : null}
          {tab === "seats" ? <TourRushBoard embedded /> : null}
          {tab === "tours" ? <ToursPanel /> : null}
          {tab === "events" ? <EventsPanel /> : null}
          {tab === "request" ? <RequestPanel /> : null}
          {tab === "account" ? <AccountPanel /> : null}
        </div>
      </div>
    </div>
  );
}

function ToursPanel() {
  const today = toDateKey(new Date());
  const [date, setDate] = useState(today);
  const tours = useMemo(() => getToursForDate(date), [date]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-white/45">
            Travel date
          </span>
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            className="border border-white/20 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-amber"
          />
        </label>
        <p className="pb-2 font-mono text-xs text-white/45">
          {tours.length} tours · {formatDisplayDate(date)}
        </p>
        <Link
          href="/tours"
          className="ml-auto pb-2 text-sm font-semibold text-amber hover:underline"
        >
          Full browse page →
        </Link>
      </div>

      <ul className="divide-y divide-white/10 border border-white/10 bg-white/[0.03]">
        {tours.slice(0, 14).map((tour) => (
          <li key={tour.slug}>
            <Link
              href={`/tours/${tour.slug}?date=${date}`}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-white/[0.06]"
            >
              <div className="min-w-0">
                <p className="font-semibold text-white">{tour.title}</p>
                <p className="mt-0.5 truncate text-sm text-white/55">
                  {tour.departsLabel} · {tour.duration} · {tour.meetup}
                  {tour.joinable ? " · joinable" : ""}
                </p>
              </div>
              <p className="shrink-0 font-mono text-sm text-amber">
                from {tour.priceFrom}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EventsPanel() {
  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Link
          href="/events/ride"
          className="bg-amber px-4 py-2 text-sm font-semibold text-ink hover:bg-amber-deep"
        >
          Request Event Pickup & Return
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {nycEventsThisWeek.map((event) => (
          <article
            key={event.slug}
            className="overflow-hidden border border-white/10 bg-white/[0.03]"
          >
            <div className="relative h-36">
              <Image
                src={event.image}
                alt={event.imageAlt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
              <p className="absolute bottom-2 left-3 font-mono text-[10px] uppercase tracking-wider text-amber">
                {event.category}
              </p>
            </div>
            <div className="p-4">
              <h3 className="font-display text-xl text-white">{event.name}</h3>
              <p className="mt-1 text-sm text-white/55">
                {event.venue} · {formatEventWhen(event.startsAt)}
              </p>
              <p className="mt-2 text-sm text-white/65">{event.summary}</p>
              <Link
                href={`/events/ride?event=${event.slug}`}
                className="mt-3 inline-flex text-sm font-semibold text-amber hover:underline"
              >
                Book pickup & return →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function RequestPanel() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[
        {
          title: "Custom tour request",
          copy: "Describe the day you want — operators quote you.",
          href: "/request",
          cta: "Open request form",
        },
        {
          title: "Stay Near Your Tour",
          copy: "Hotel or short stay close to the meetup point.",
          href: "/request?intent=stay",
          cta: "Request a stay",
        },
        {
          title: "Join a listed tour",
          copy: "Browse by date, then send interest on a listing.",
          href: "/#tours",
          cta: "Find tours menu",
        },
        {
          title: "Event Pickup & Return",
          copy: "Door-to-door for concerts, games, and Broadway.",
          href: "/events/ride",
          cta: "Book event transport",
        },
        {
          title: "Operator interest",
          copy: "List New York tours and receive the lead inbox.",
          href: "/request?intent=operator",
          cta: "Apply as operator",
        },
        {
          title: "Tour Pulse",
          copy: "See where activity is building, then join nearby.",
          href: "/#pulse",
          cta: "Back to pulse",
        },
      ].map((card) => (
        <Link
          key={card.href + card.title}
          href={card.href}
          onClick={(e) => {
            if (card.href.startsWith("/#")) {
              e.preventDefault();
              window.location.hash = card.href.slice(2);
            }
          }}
          className="border border-white/10 bg-white/[0.03] p-5 transition hover:border-amber/40 hover:bg-white/[0.06]"
        >
          <h3 className="font-display text-xl text-white">{card.title}</h3>
          <p className="mt-2 text-sm text-white/60">{card.copy}</p>
          <p className="mt-4 text-sm font-semibold text-amber">{card.cta} →</p>
        </Link>
      ))}
    </div>
  );
}

function AccountPanel() {
  const [user, setUser] = useState<{
    email: string;
    name?: string;
    role: string;
  } | null | undefined>(undefined);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: { user?: { email: string; name?: string; role: string } | null }) =>
        setUser(d.user ?? null),
      )
      .catch(() => setUser(null));
  }, []);

  if (user === undefined) {
    return (
      <div className="h-32 animate-pulse border border-white/10 bg-white/5" />
    );
  }

  if (!user) {
    return (
      <div className="border border-white/10 bg-white/[0.03] p-6 sm:p-8">
        <h3 className="font-display text-2xl text-white">Sign in to continue</h3>
        <p className="mt-2 max-w-lg text-white/65">
          Use an email magic link — no password. Track requests and open your
          member area.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/join?next=/account"
            className="bg-amber px-5 py-3 text-sm font-semibold text-ink hover:bg-amber-deep"
          >
            Continue with email
          </Link>
          <Link
            href="/join?role=operator&next=/operator"
            className="border border-white/25 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Operator sign-in
          </Link>
        </div>
      </div>
    );
  }

  const label = user.name?.split(" ")[0] || user.email.split("@")[0];

  return (
    <div className="border border-white/10 bg-white/[0.03] p-6 sm:p-8">
      <p className="font-mono text-[10px] uppercase tracking-wider text-amber">
        Signed in
      </p>
      <h3 className="mt-2 font-display text-3xl text-white">
        Welcome, {label}
      </h3>
      <p className="mt-2 text-white/65">
        {user.email}
        {user.role === "operator" || user.role === "admin"
          ? " · Operator"
          : " · Traveller"}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/account"
          className="bg-amber px-5 py-3 text-sm font-semibold text-ink hover:bg-amber-deep"
        >
          Open full account
        </Link>
        {user.role === "operator" || user.role === "admin" ? (
          <Link
            href="/operator"
            className="border border-white/25 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Lead inbox
          </Link>
        ) : null}
      </div>
    </div>
  );
}
