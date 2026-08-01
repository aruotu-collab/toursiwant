"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthGreeting, AuthNav } from "@/components/AuthNav";
import { EventsBoard } from "@/components/EventsBoard";
import { RequestDesk } from "@/components/RequestDesk";
import { TourPulseBoard } from "@/components/TourPulseBoard";
import { TourRushBoard } from "@/components/TourRushBoard";
import { ToursBrowser } from "@/components/ToursBrowser";

export type CommandTab =
  | "pulse"
  | "seats"
  | "tours"
  | "events"
  | "request"
  | "account"
  | "admin";

const BASE_MENU: { id: CommandTab; label: string; param: string }[] = [
  { id: "pulse", label: "Pulse", param: "pulse" },
  { id: "seats", label: "Live seats", param: "rush" },
  { id: "tours", label: "Find tours", param: "tours" },
  { id: "events", label: "Events", param: "events" },
  { id: "request", label: "Request", param: "request" },
  { id: "account", label: "Account", param: "account" },
];

const ADMIN_MENU_ITEM = {
  id: "admin" as const,
  label: "Admin",
  param: "admin",
};

const TAB_COPY: Record<
  CommandTab,
  { eyebrow: string; title: string; blurb: string }
> = {
  pulse: {
    eyebrow: "Near you · USA",
    title: "Start with where you’re staying",
    blurb:
      "Enter any US hotel — then choose bus tours, museums, pizza, Chinese food, and more. NYC uses the corridor map; other cities use a local walk map.",
  },
  seats: {
    eyebrow: "Tour Rush · live now",
    title: "Seats are filling. Timers are running.",
    blurb:
      "Filter ending-soon lots, pick a seat, then claim or request — same live-board feel as Pulse.",
  },
  tours: {
    eyebrow: "Find tours · USA",
    title: "Theme, state, then the tour.",
    blurb:
      "Religious, museum, beach… pick a state or city, search by name (e.g. Patterson), then request — from anywhere in the world.",
  },
  events: {
    eyebrow: "Events This Week",
    title: "Home → event → home again",
    blurb:
      "Filter by concert, sports, or Broadway — then request Event Pickup & Return from the board.",
  },
  request: {
    eyebrow: "Request desk",
    title: "Tell us what you want",
    blurb:
      "Custom tours, stays, event rides, or operator interest — stepped desk on the same dark board.",
  },
  account: {
    eyebrow: "Member area",
    title: "Your ToursIWant account",
    blurb:
      "Signed-in home for your requests. Use the menus above anytime — Pulse, seats, tours, events.",
  },
  admin: {
    eyebrow: "Admin · platform",
    title: "Monitor the marketplace",
    blurb:
      "Members, live requests, and site visits — plus shortcuts into traveller and operator tools.",
  },
};

function tabFromMenuParam(value: string | null | undefined): CommandTab | null {
  if (!value) return null;
  const raw = value.toLowerCase();
  if (raw === "rush" || raw === "seats") return "seats";
  if (raw === "market") return "pulse";
  if (raw === "admin") return "admin";
  const match = BASE_MENU.find((m) => m.param === raw || m.id === raw);
  return match?.id ?? null;
}

export function HomeCommandCenter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const menuParam = searchParams.get("menu");
  const [tab, setTabState] = useState<CommandTab>(
    () => tabFromMenuParam(menuParam) || "pulse",
  );
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const next = tabFromMenuParam(menuParam);
    if (next) setTabState(next);
  }, [menuParam]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: { user?: { role?: string } | null }) => {
        if (!cancelled) setIsAdmin(d.user?.role === "admin");
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const menu = useMemo(
    () => (isAdmin ? [...BASE_MENU, ADMIN_MENU_ITEM] : BASE_MENU),
    [isAdmin],
  );

  const selectTab = useCallback(
    (next: CommandTab) => {
      setTabState(next);
      const menuParamNext = next === "seats" ? "rush" : next;
      router.replace(`/?menu=${menuParamNext}`, { scroll: false });
    },
    [router],
  );

  // If someone lands on ?menu=admin without admin role, fall back
  useEffect(() => {
    if (tab === "admin" && !isAdmin) {
      setTabState("account");
    }
  }, [tab, isAdmin]);

  const copy = TAB_COPY[tab === "admin" ? "admin" : tab];

  return (
    <div className="min-h-dvh overflow-x-hidden overscroll-x-none bg-ink text-white">
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

      <div className="mx-auto w-full max-w-[90rem] overflow-x-hidden px-4 py-5 sm:px-8 sm:py-10">
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

        <div className="sticky top-[3.25rem] z-20 mt-4 border-b border-white/10 bg-ink/95 py-2.5 backdrop-blur-md sm:static sm:mt-6 sm:border-0 sm:bg-transparent sm:py-0 sm:backdrop-blur-none">
          <div className="flex gap-2 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [touch-action:pan-x] [&::-webkit-scrollbar]:hidden">
            {menu.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectTab(item.id)}
                  className={`shrink-0 border px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] transition ${
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
          {tab === "events" ? <EventsBoard embedded /> : null}
          {tab === "request" ? (
            <RequestDesk onSelectTab={(t) => selectTab(t)} />
          ) : null}
          {tab === "account" ? <AccountPanel onSelectTab={selectTab} /> : null}
          {tab === "admin" && isAdmin ? <AdminBoardPanel /> : null}
        </div>
      </div>
    </div>
  );
}

function ToursPanel() {
  return <ToursBrowser embedded />;
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
            ? user.role === "admin"
              ? " · Admin (traveller + operator + platform)"
              : " · Operator"
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
            Requests & operator replies
          </Link>
          {user.role === "operator" || user.role === "admin" ? (
            <Link
              href="/operator"
              className="border border-white/25 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Lead inbox
            </Link>
          ) : null}
          {user.role === "admin" ? (
            <Link
              href="/admin"
              className="border border-amber/50 bg-amber/15 px-5 py-3 text-sm font-semibold text-amber hover:bg-amber/25"
            >
              Admin console
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

function AdminBoardPanel() {
  const [data, setData] = useState<{
    members: { total: number; operators: number; admins: number };
    requests: { live: number; open: number };
    visitors: { last24h: number; last7d: number; uniqueSessions24h: number };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/overview")
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error || "Failed");
        setData(json);
      })
      .catch(() => setError("Could not load admin overview."));
  }, []);

  if (error) {
    return (
      <div className="border border-white/10 bg-white/[0.03] p-6 text-white/70">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-40 animate-pulse border border-white/10 bg-white/5" />
    );
  }

  const cards = [
    { label: "Members", value: data.members.total },
    { label: "Operators", value: data.members.operators },
    { label: "Live requests", value: data.requests.live },
    { label: "Awaiting reply", value: data.requests.open },
    { label: "Visits 24h", value: data.visitors.last24h },
    { label: "Visits 7d", value: data.visitors.last7d },
    { label: "Unique 24h", value: data.visitors.uniqueSessions24h },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="border border-white/10 bg-white/[0.03] px-4 py-4"
          >
            <p className="font-mono text-[10px] uppercase tracking-wider text-white/45">
              {card.label}
            </p>
            <p className="mt-2 font-display text-3xl text-white">{card.value}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 border border-white/10 bg-white/[0.03] p-5">
        <Link
          href="/admin"
          className="bg-amber px-5 py-3 text-sm font-semibold text-ink hover:bg-amber-deep"
        >
          Open full admin console →
        </Link>
        <Link
          href="/operator"
          className="border border-white/25 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
        >
          Operator inbox
        </Link>
        <Link
          href="/account"
          className="border border-white/25 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
        >
          Traveller account
        </Link>
      </div>
    </div>
  );
}
