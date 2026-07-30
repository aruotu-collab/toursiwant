"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

const MENU: { id: CommandTab; label: string; param: string }[] = [
  { id: "pulse", label: "Pulse", param: "pulse" },
  { id: "seats", label: "Live seats", param: "rush" },
  { id: "tours", label: "Find tours", param: "tours" },
  { id: "events", label: "Events", param: "events" },
  { id: "request", label: "Request", param: "request" },
  { id: "account", label: "Account", param: "account" },
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
      "Signed-in home for your requests. Use the menus above anytime — Pulse, seats, tours, events.",
  },
};

function tabFromMenuParam(value: string | null | undefined): CommandTab | null {
  if (!value) return null;
  const raw = value.toLowerCase();
  if (raw === "rush" || raw === "seats") return "seats";
  if (raw === "market") return "pulse";
  const match = MENU.find((m) => m.param === raw || m.id === raw);
  return match?.id ?? null;
}

export function HomeCommandCenter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const menuParam = searchParams.get("menu");
  const [tab, setTabState] = useState<CommandTab>(
    () => tabFromMenuParam(menuParam) || "pulse",
  );

  useEffect(() => {
    const next = tabFromMenuParam(menuParam);
    if (next) setTabState(next);
  }, [menuParam]);

  const selectTab = useCallback(
    (next: CommandTab) => {
      setTabState(next);
      const menu = next === "seats" ? "rush" : next;
      router.replace(`/?menu=${menu}`, { scroll: false });
    },
    [router],
  );

  const copy = TAB_COPY[tab];

  return (
    <div className="min-h-full bg-ink text-white">
      <div className="sticky top-0 z-30 border-b border-white/10 bg-[#0a1520]/supports-[backdrop-filter]:bg-[#0a1520]/95 supports-[backdrop-filter]:backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[90rem] items-center gap-3 px-4 py-3 sm:px-8 sm:py-3.5">
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => selectTab("pulse")}
              className="text-left font-display text-lg leading-tight tracking-tight text-white sm:text-2xl"
            >
              Tours<span className="text-amber">I</span>Want
            </button>
            <AuthGreeting variant="dark" />
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <AuthNav variant="dark" />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[90rem] px-4 py-5 sm:px-8 sm:py-10">
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-amber sm:text-[11px] sm:tracking-[0.2em]">
            {copy.eyebrow}
          </p>
          <h1 className="mt-1.5 font-display text-[1.65rem] leading-tight text-white sm:mt-2 sm:text-4xl">
            {copy.title}
          </h1>
          <p className="mt-2 hidden max-w-xl text-sm text-white/70 sm:block sm:text-base">
            {copy.blurb}
          </p>
        </div>

        <div className="sticky top-[3.25rem] z-20 -mx-4 mt-4 border-b border-white/10 bg-ink/95 px-4 py-2.5 backdrop-blur-md sm:static sm:mx-0 sm:mt-6 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
          <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {MENU.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectTab(item.id)}
                  className={`shrink-0 border px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] transition active:scale-[0.98] ${
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
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-white/40 sm:hidden">
            Swipe menus →
          </p>
        </div>

        <div className="mt-4 sm:mt-6">
          {tab === "pulse" ? <TourPulseBoard embedded /> : null}
          {tab === "seats" ? <TourRushBoard embedded /> : null}
          {tab === "tours" ? <ToursPanel /> : null}
          {tab === "events" ? <EventsPanel /> : null}
          {tab === "request" ? <RequestPanel onSelectTab={selectTab} /> : null}
          {tab === "account" ? <AccountPanel onSelectTab={selectTab} /> : null}
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
      <div className="flex justify-stretch sm:justify-end">
        <Link
          href="/events/ride"
          className="w-full bg-amber px-4 py-3 text-center text-sm font-semibold text-ink hover:bg-amber-deep sm:w-auto sm:py-2"
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

function RequestPanel({
  onSelectTab,
}: {
  onSelectTab: (tab: CommandTab) => void;
}) {
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
          menu: "tours" as CommandTab,
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
          menu: "pulse" as CommandTab,
          cta: "Back to pulse",
        },
      ].map((card) =>
        "menu" in card && card.menu ? (
          <button
            key={card.title}
            type="button"
            onClick={() => onSelectTab(card.menu)}
            className="border border-white/10 bg-white/[0.03] p-5 text-left transition hover:border-amber/40 hover:bg-white/[0.06]"
          >
            <h3 className="font-display text-xl text-white">{card.title}</h3>
            <p className="mt-2 text-sm text-white/60">{card.copy}</p>
            <p className="mt-4 text-sm font-semibold text-amber">{card.cta} →</p>
          </button>
        ) : (
          <Link
            key={card.title}
            href={"href" in card && card.href ? card.href : "/"}
            className="border border-white/10 bg-white/[0.03] p-5 transition hover:border-amber/40 hover:bg-white/[0.06]"
          >
            <h3 className="font-display text-xl text-white">{card.title}</h3>
            <p className="mt-2 text-sm text-white/60">{card.copy}</p>
            <p className="mt-4 text-sm font-semibold text-amber">{card.cta} →</p>
          </Link>
        ),
      )}
    </div>
  );
}

function AccountPanel({
  onSelectTab,
}: {
  onSelectTab: (tab: CommandTab) => void;
}) {
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
            href={`/join?next=${encodeURIComponent("/?menu=account")}`}
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
    <div className="space-y-4">
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
          <button
            type="button"
            onClick={() => onSelectTab("pulse")}
            className="bg-amber px-5 py-3 text-sm font-semibold text-ink hover:bg-amber-deep"
          >
            Open live board
          </button>
          <Link
            href="/account"
            className="border border-white/25 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Full request history
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
      <p className="text-sm text-white/50">
        Tip: the menus above (Pulse, Live seats, Find tours…) stay with you on
        this board — tap ToursIWant anytime to jump back to Pulse.
      </p>
    </div>
  );
}
