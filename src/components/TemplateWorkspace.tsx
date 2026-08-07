"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  experienceCategoryLabel,
  personalizeAvailability,
  personalizeTemplate,
  suggestAddDestination,
  usCityOptions,
  type ExperienceCategory,
  type ExperienceOption,
  type PersonalizeResult,
  type TripTemplate,
} from "@/lib/trip-templates";

type Session = {
  id: string;
  shareCode: string;
  votes: Record<string, Record<string, number>>;
  voters?: Array<{
    key: string;
    name: string;
    votes: Record<string, string>;
  }>;
  voterNames: string[];
  wants?: ExperienceCategory[];
  selections?: Record<string, string>;
  openToJoin?: boolean;
  joinNote?: string;
  specialEventRequests: Array<{
    id: string;
    kind: string;
    note: string;
    status: string;
  }>;
  travelledRating?: number;
};

type Winners = Record<string, { optionId: string; count: number }>;

type ViatorHit = {
  id: string;
  title: string;
  priceFrom?: string;
};

function voterStorageKey() {
  return "tiw_voter_key";
}

function voterNameStorageKey() {
  return "tiw_voter_name";
}

function ensureVoterKey() {
  if (typeof window === "undefined") return "server";
  let key = localStorage.getItem(voterStorageKey());
  if (!key) {
    key = `v_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(voterStorageKey(), key);
  }
  return key;
}

function applyOption(
  template: TripTemplate,
  blockId: string,
  option: ExperienceOption,
): TripTemplate {
  return {
    ...template,
    blocks: template.blocks.map((b) =>
      b.id !== blockId
        ? b
        : {
            ...b,
            title: option.title,
            summary: option.summary,
            category: option.category,
            viatorQuery: option.viatorQuery || b.viatorQuery,
            specialProviderRequired: option.specialProviderRequired,
          },
    ),
  };
}

function applySelections(
  base: TripTemplate,
  selections: Record<string, string>,
): TripTemplate {
  let next = base;
  for (const [blockId, optionId] of Object.entries(selections)) {
    const opt = base.blocks
      .find((b) => b.id === blockId)
      ?.alternatives?.find((a) => a.id === optionId);
    if (opt) next = applyOption(next, blockId, opt);
  }
  return next;
}

export function TemplateWorkspace({
  initial,
}: {
  initial: TripTemplate;
}) {
  const [template, setTemplate] = useState(initial);
  const [wants, setWants] = useState<ExperienceCategory[]>([]);
  const [personalizeResult, setPersonalizeResult] =
    useState<PersonalizeResult | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [winners, setWinners] = useState<Winners>({});
  const [shareUrl, setShareUrl] = useState("");
  const [voterName, setVoterName] = useState("");
  const [voterKey, setVoterKey] = useState("");
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);
  const [viatorByBlock, setViatorByBlock] = useState<
    Record<string, ViatorHit[]>
  >({});
  const [addCity, setAddCity] = useState(() => {
    const first = usCityOptions.find((c) => !initial.cityCodes.includes(c.code));
    return first?.code || "DC";
  });
  const [specialNote, setSpecialNote] = useState("");
  const [specialKind, setSpecialKind] = useState<
    "band" | "private_dinner" | "other"
  >("band");
  const [rating, setRating] = useState(5);
  const [ratingNote, setRatingNote] = useState("");
  const [status, setStatus] = useState("");
  const [asideTab, setAsideTab] = useState<
    "personalize" | "share" | "city"
  >("personalize");
  const [openToJoin, setOpenToJoin] = useState(true);
  const [joinNote, setJoinNote] = useState("");
  const [pendingJoin, setPendingJoin] = useState(false);
  const [savedTripId, setSavedTripId] = useState<string | null>(null);
  const [savedTripTitle, setSavedTripTitle] = useState("");
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  const availability = useMemo(
    () => personalizeAvailability(initial),
    [initial],
  );

  const flexibleBlocks = useMemo(
    () => initial.blocks.filter((b) => b.alternatives?.length),
    [initial],
  );

  const preview = useMemo(
    () => (wants.length ? personalizeTemplate(initial, wants) : null),
    [initial, wants],
  );

  const cityHint = useMemo(
    () => suggestAddDestination(initial, addCity),
    [initial, addCity],
  );

  const addableCities = useMemo(
    () => usCityOptions.filter((c) => !initial.cityCodes.includes(c.code)),
    [initial.cityCodes],
  );

  const myVotes = useMemo(() => {
    if (!session?.voters || !voterKey) return {} as Record<string, string>;
    return session.voters.find((v) => v.key === voterKey)?.votes || {};
  }, [session, voterKey]);

  useEffect(() => {
    setVoterKey(ensureVoterKey());
    const saved = localStorage.getItem(voterNameStorageKey());
    if (saved) setVoterName(saved);
  }, []);

  useEffect(() => {
    if (voterName.trim()) {
      localStorage.setItem(voterNameStorageKey(), voterName.trim());
    }
  }, [voterName]);

  const runPersonalize = useCallback(() => {
    const result = personalizeTemplate(initial, wants);
    setTemplate(result.template);
    setPersonalizeResult(result);
    setStatus(
      result.applied.length
        ? `Applied ${result.applied.length} change${result.applied.length === 1 ? "" : "s"}.`
        : "Nothing to apply yet — pick what the group wants.",
    );
  }, [initial, wants]);

  const resetPersonalize = useCallback(() => {
    setWants([]);
    setPersonalizeResult(null);
    setTemplate(initial);
    setStatus("Trip reset to the original template.");
  }, [initial]);

  useEffect(() => {
    const blocks = template.blocks.filter((b) => b.viatorQuery);
    let cancelled = false;
    (async () => {
      const next: Record<string, ViatorHit[]> = {};
      for (const block of blocks) {
        try {
          const city = block.viatorCitySlug || "new-york";
          const q = encodeURIComponent(block.viatorQuery || "");
          const res = await fetch(
            `/api/affiliates/viator/search?city=${city}&q=${q}&count=3`,
          );
          if (!res.ok) continue;
          const data = (await res.json()) as { products?: ViatorHit[] };
          next[block.id] = (data.products || []).slice(0, 3);
        } catch {
          // ignore
        }
      }
      if (!cancelled) setViatorByBlock(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [template]);

  async function refreshSession(code: string) {
    const res = await fetch(
      `/api/trip-sessions?code=${encodeURIComponent(code)}`,
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      session: Session;
      winners?: Winners;
    };
    setSession(data.session);
    setWinners(data.winners || {});
    return data;
  }

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: { user?: { id: string } | null }) => {
        setSignedIn(Boolean(d.user));
      })
      .catch(() => setSignedIn(false));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("share");
    const wantJoin = params.get("join") === "1";
    const savedId = params.get("saved");
    if (savedId) {
      setSavedTripId(savedId);
      (async () => {
        const res = await fetch(
          `/api/saved-trips?id=${encodeURIComponent(savedId)}`,
        );
        if (!res.ok) {
          setStatus("Could not load your saved trip — sign in and try again.");
          return;
        }
        const data = (await res.json()) as {
          trip?: {
            id: string;
            title: string;
            selections?: Record<string, string>;
            wants?: ExperienceCategory[];
          };
        };
        if (!data.trip) return;
        setSavedTripTitle(data.trip.title);
        if (data.trip.wants?.length) setWants(data.trip.wants);
        if (data.trip.selections) {
          setTemplate(applySelections(initial, data.trip.selections));
        }
        setStatus(`Opened your saved trip: ${data.trip.title}`);
        setAsideTab("personalize");
      })();
    }
    if (!code) return;
    (async () => {
      const data = await refreshSession(code);
      if (!data) return;
      setShareUrl(
        `${window.location.origin}/trips/${initial.slug}?share=${code}`,
      );
      setAsideTab("share");
      if (wantJoin) setPendingJoin(true);
      if (data.session.wants?.length) setWants(data.session.wants);
      if (data.session.selections) {
        setTemplate(applySelections(initial, data.session.selections));
      }
    })();
  }, [initial]);

  // Live poll while a share session is open
  useEffect(() => {
    if (!session?.shareCode) return;
    const id = window.setInterval(() => {
      void refreshSession(session.shareCode);
    }, 4000);
    return () => window.clearInterval(id);
  }, [session?.shareCode]);

  async function createShare() {
    const name = voterName.trim() || "Host";
    if (!voterName.trim()) {
      setVoterName("Host");
    }
    setBusy(true);
    setStatus("");
    try {
      const key = voterKey || ensureVoterKey();
      setVoterKey(key);
      const selections: Record<string, string> = {};
      for (const swap of personalizeResult?.applied || []) {
        selections[swap.blockId] = swap.optionId;
      }
      const res = await fetch("/api/trip-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          templateSlug: initial.slug,
          templateTitle: initial.title,
          hotelName: initial.hotelAnchor?.name,
          route: initial.route,
          region: initial.region,
          cityCodes: initial.cityCodes,
          openToJoin,
          joinNote: joinNote.trim() || undefined,
          wants,
          selections,
          hostName: name,
          hostKey: key,
          voterName: name,
          voterKey: key,
        }),
      });
      const data = (await res.json()) as {
        session?: Session;
        winners?: Winners;
        error?: string;
      };
      if (!res.ok || !data.session) {
        throw new Error(data.error || `Could not create share (${res.status})`);
      }
      setSession(data.session);
      setWinners(data.winners || {});
      setJoined(true);
      const url = `${window.location.origin}/trips/${initial.slug}?share=${data.session.shareCode}`;
      setShareUrl(url);
      window.history.replaceState(null, "", `?share=${data.session.shareCode}`);
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // clipboard may be blocked — link still shown
      }
      setStatus(
        openToJoin
          ? "Share link created — listed on Join a group so others can find you."
          : "Share link created. Send it privately, or list it later so others can join.",
      );
      setAsideTab("share");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not create share");
    } finally {
      setBusy(false);
    }
  }

  async function joinShare() {
    if (!session || !voterName.trim()) {
      setStatus("Enter your name to join the group vote.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/trip-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "join",
          shareCode: session.shareCode,
          voterName: voterName.trim(),
          voterKey: voterKey || ensureVoterKey(),
        }),
      });
      const data = (await res.json()) as {
        session?: Session;
        winners?: Winners;
      };
      if (data.session) {
        setSession(data.session);
        setWinners(data.winners || {});
        setJoined(true);
        setStatus(`Joined as ${voterName.trim()}. Vote on flexible days below.`);
      }
    } finally {
      setBusy(false);
    }
  }

  async function castVote(blockId: string, optionId: string) {
    if (!session) {
      setStatus("Create or open a share link first.");
      setAsideTab("share");
      return;
    }
    if (!voterName.trim()) {
      setStatus("Enter your name, then vote.");
      setAsideTab("share");
      return;
    }
    if (!joined) {
      await joinShare();
    }
    setBusy(true);
    try {
      const res = await fetch("/api/trip-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "vote",
          shareCode: session.shareCode,
          blockId,
          optionId,
          voterName: voterName.trim(),
          voterKey: voterKey || ensureVoterKey(),
        }),
      });
      const data = (await res.json()) as {
        session?: Session;
        winners?: Winners;
      };
      if (data.session) {
        setSession(data.session);
        setWinners(data.winners || {});
        setJoined(true);
        const opt = initial.blocks
          .find((b) => b.id === blockId)
          ?.alternatives?.find((a) => a.id === optionId);
        if (opt) setTemplate((t) => applyOption(t, blockId, opt));
        setStatus("Vote saved — you can change it anytime.");
      }
    } finally {
      setBusy(false);
    }
  }

  function applyWinners() {
    if (!Object.keys(winners).length) {
      setStatus("No votes yet.");
      return;
    }
    let next = initial;
    const tradeOffs: string[] = [];
    for (const [blockId, win] of Object.entries(winners)) {
      const opt = initial.blocks
        .find((b) => b.id === blockId)
        ?.alternatives?.find((a) => a.id === win.optionId);
      if (opt) {
        next = applyOption(next, blockId, opt);
        if (opt.tradeOff) tradeOffs.push(opt.tradeOff);
      }
    }
    setTemplate(next);
    setStatus(
      tradeOffs.length
        ? `Applied group winners. Trade-offs: ${tradeOffs.join(" · ")}`
        : "Applied the group's winning choices to this trip.",
    );
  }

  async function requestSpecial() {
    if (!session) {
      setStatus("Create a share session first.");
      setAsideTab("share");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/trip-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "special",
          shareCode: session.shareCode,
          kind: specialKind,
          note: specialNote,
        }),
      });
      const data = (await res.json()) as { session?: Session };
      if (data.session) {
        setSession(data.session);
        setStatus("Special experience requested.");
        setSpecialNote("");
      }
    } finally {
      setBusy(false);
    }
  }

  async function submitRating() {
    if (!session) {
      setStatus("Create a share session to leave a travelled rating.");
      setAsideTab("share");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/trip-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rate",
          shareCode: session.shareCode,
          rating,
          note: ratingNote,
        }),
      });
      const data = (await res.json()) as { session?: Session };
      if (data.session) {
        setSession(data.session);
        setStatus("Travelled rating saved.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function saveAsMyTrip() {
    if (signedIn === false) {
      const next = encodeURIComponent(
        `${window.location.pathname}${window.location.search}`,
      );
      window.location.href = `/join?next=${next}`;
      return;
    }
    setBusy(true);
    setStatus("");
    try {
      const selections: Record<string, string> = {
        ...(session?.selections || {}),
      };
      for (const swap of personalizeResult?.applied || []) {
        selections[swap.blockId] = swap.optionId;
      }
      // Prefer current block titles if user used "Use" without personalize apply
      for (const block of template.blocks) {
        const original = initial.blocks.find((b) => b.id === block.id);
        if (
          original?.alternatives &&
          block.title !== original.title
        ) {
          const match = original.alternatives.find((a) => a.title === block.title);
          if (match) selections[block.id] = match.id;
        }
      }

      const res = await fetch("/api/saved-trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          templateSlug: initial.slug,
          templateTitle: initial.title,
          title: savedTripTitle.trim() || `${initial.title} — ours`,
          route: initial.route,
          region: initial.region,
          cityCodes: initial.cityCodes,
          hotelName: initial.hotelAnchor?.name,
          selections,
          wants,
          sourceShareCode: session?.shareCode,
        }),
      });
      const data = (await res.json()) as {
        trip?: { id: string; title: string };
        error?: string;
      };
      if (!res.ok || !data.trip) {
        if (res.status === 401) {
          const next = encodeURIComponent(
            `${window.location.pathname}${window.location.search}`,
          );
          window.location.href = `/join?next=${next}`;
          return;
        }
        throw new Error(data.error || "Could not save trip");
      }
      setSavedTripId(data.trip.id);
      setSavedTripTitle(data.trip.title);
      window.history.replaceState(
        null,
        "",
        `?saved=${data.trip.id}${session?.shareCode ? `&share=${session.shareCode}` : ""}`,
      );
      setStatus(
        `Saved as your trip. Find it anytime under Account → My trips.`,
      );
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not save trip");
    } finally {
      setBusy(false);
    }
  }

  async function updateMySavedTrip() {
    if (!savedTripId) return;
    setBusy(true);
    try {
      const selections: Record<string, string> = {};
      for (const swap of personalizeResult?.applied || []) {
        selections[swap.blockId] = swap.optionId;
      }
      for (const block of template.blocks) {
        const original = initial.blocks.find((b) => b.id === block.id);
        if (original?.alternatives && block.title !== original.title) {
          const match = original.alternatives.find((a) => a.title === block.title);
          if (match) selections[block.id] = match.id;
        }
      }
      const res = await fetch("/api/saved-trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          id: savedTripId,
          title: savedTripTitle.trim() || undefined,
          selections,
          wants,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not update");
      setStatus("Your saved trip was updated.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not update trip");
    } finally {
      setBusy(false);
    }
  }

  async function copyShare() {
    if (!shareUrl) return;
    await navigator.clipboard?.writeText(shareUrl).catch(() => undefined);
    setStatus("Link copied.");
  }

  return (
    <div className="relative min-h-screen bg-[#071018] text-white">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 40% at 80% 0%, rgba(212,160,23,0.12), transparent), linear-gradient(180deg,#071018,#0c1b2a 40%,#071018)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="font-display text-xl tracking-tight text-white"
          >
            Tours<span className="text-amber">I</span>Want
          </Link>
          <Link
            href="/?door=explore"
            className="font-mono text-xs uppercase tracking-[0.16em] text-white/50 hover:text-amber"
          >
            ← USA templates
          </Link>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-amber">
              {template.scale.replace("_", " ")} · {template.days} days
              {template.region ? ` · ${template.region}` : ""}
              {template.hotelAnchor
                ? ` · from ${template.hotelAnchor.name}`
                : ""}
            </p>
            <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
              {template.title}
            </h1>
            <p className="mt-3 text-lg text-white/70">{template.route}</p>
            <p className="mt-4 max-w-2xl leading-relaxed text-white/65">
              {template.blurb}
            </p>

            {session ? (
              <div className="mt-5 flex flex-wrap items-center gap-3 border border-amber/30 bg-amber/10 px-4 py-3 text-sm">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber">
                  Group live
                </span>
                <span className="text-white/75">
                  {(session.voters || []).length} in room · code{" "}
                  <span className="font-mono text-amber">{session.shareCode}</span>
                  {session.openToJoin ? " · open to joiners" : ""}
                </span>
                <button
                  type="button"
                  onClick={applyWinners}
                  className="border border-amber/50 px-3 py-1.5 text-xs text-amber hover:bg-amber/20"
                >
                  Apply winning votes
                </button>
              </div>
            ) : null}

            {pendingJoin && session && !joined ? (
              <div className="mt-5 border border-white/20 bg-white/[0.05] px-4 py-4">
                <p className="font-display text-xl text-white">
                  Join this group&apos;s trip
                </p>
                <p className="mt-2 text-sm text-white/65">
                  You&apos;ll keep this template spine. Enter your name, join the
                  room, then personalize flexible days or vote with the group.
                </p>
                {session.joinNote ? (
                  <p className="mt-2 text-sm text-amber">{session.joinNote}</p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <input
                    value={voterName}
                    onChange={(e) => setVoterName(e.target.value)}
                    placeholder="Your name"
                    className="min-w-[12rem] flex-1 border border-white/20 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-amber"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      await joinShare();
                      setPendingJoin(false);
                      setAsideTab("personalize");
                      setStatus(
                        "Joined. Personalize flexible days, or vote with the group.",
                      );
                    }}
                    className="bg-amber px-4 py-2.5 text-sm font-semibold text-ink hover:bg-amber-deep"
                  >
                    Join & personalize
                  </button>
                </div>
              </div>
            ) : null}

            {personalizeResult?.applied.length ? (
              <div className="mt-5 border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white/70">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber">
                  Personalized
                </p>
                <ul className="mt-2 space-y-1">
                  {personalizeResult.applied.map((a) => (
                    <li key={a.blockId}>
                      {a.dayLabel}: {a.toTitle}
                      {a.tradeOff ? (
                        <span className="text-white/45"> — {a.tradeOff}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <ol className="mt-10 space-y-4">
              {template.blocks.map((block) => {
                const blockVotes = session?.votes?.[block.id] || {};
                const totalVotes = Object.values(blockVotes).reduce(
                  (s, n) => s + n,
                  0,
                );
                const winnerId = winners[block.id]?.optionId;
                const myPick = myVotes[block.id];

                return (
                  <li
                    key={block.id}
                    className="border border-white/15 bg-white/[0.04] p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber">
                          {block.dayLabel}
                          {block.kind !== "anchor" ? ` · ${block.kind}` : ""}
                        </p>
                        <h2 className="mt-2 font-display text-2xl">
                          {block.title}
                        </h2>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[11px] text-white/50">
                        {typeof block.fromHotelMinutes === "number" ? (
                          <span className="border border-white/15 px-2 py-1">
                            ~{block.fromHotelMinutes} min from hotel
                          </span>
                        ) : null}
                        {block.free === true ? (
                          <span className="border border-white/15 px-2 py-1">
                            Free
                          </span>
                        ) : null}
                        {block.specialProviderRequired ? (
                          <span className="border border-amber/40 px-2 py-1 text-amber">
                            Provider required
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-white/65">{block.summary}</p>

                    {block.alternatives?.length ? (
                      <div className="mt-4 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
                            Group vote on this slot
                          </p>
                          {totalVotes > 0 ? (
                            <p className="font-mono text-[10px] text-white/40">
                              {totalVotes} vote{totalVotes === 1 ? "" : "s"}
                            </p>
                          ) : null}
                        </div>
                        {block.alternatives.map((opt) => {
                          const votes = blockVotes[opt.id] || 0;
                          const pct =
                            totalVotes > 0
                              ? Math.round((votes / totalVotes) * 100)
                              : 0;
                          const isMine = myPick === opt.id;
                          const isWinner = winnerId === opt.id && votes > 0;
                          return (
                            <div
                              key={opt.id}
                              className={`relative overflow-hidden border p-3 ${
                                isWinner
                                  ? "border-amber/50 bg-amber/10"
                                  : isMine
                                    ? "border-white/40 bg-white/[0.06]"
                                    : "border-white/10 bg-black/20"
                              }`}
                            >
                              {totalVotes > 0 ? (
                                <div
                                  className="pointer-events-none absolute inset-y-0 left-0 bg-amber/15"
                                  style={{ width: `${pct}%` }}
                                />
                              ) : null}
                              <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="text-sm text-white">
                                    {opt.title}
                                    <span className="ml-2 text-white/40">
                                      {experienceCategoryLabel[opt.category]}
                                    </span>
                                    {isWinner ? (
                                      <span className="ml-2 font-mono text-[10px] text-amber">
                                        LEADING
                                      </span>
                                    ) : null}
                                    {isMine ? (
                                      <span className="ml-2 font-mono text-[10px] text-white/50">
                                        YOUR VOTE
                                      </span>
                                    ) : null}
                                  </p>
                                  <p className="mt-1 text-xs text-white/50">
                                    {opt.summary}
                                    {opt.tradeOff ? ` · ${opt.tradeOff}` : ""}
                                  </p>
                                  {votes > 0 ? (
                                    <p className="mt-1 font-mono text-[10px] text-amber">
                                      {votes} · {pct}%
                                    </p>
                                  ) : null}
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => {
                                      setTemplate((t) =>
                                        applyOption(t, block.id, opt),
                                      );
                                      setStatus(`Using “${opt.title}” for now.`);
                                    }}
                                    className="border border-white/25 px-3 py-2 text-xs hover:border-amber"
                                  >
                                    Use
                                  </button>
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => castVote(block.id, opt.id)}
                                    className={`px-3 py-2 text-xs ${
                                      isMine
                                        ? "bg-amber text-ink"
                                        : "border border-amber/40 bg-amber/10 text-amber hover:bg-amber/20"
                                    }`}
                                  >
                                    {isMine ? "Voted" : "Vote"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}

                    {viatorByBlock[block.id]?.length ? (
                      <div className="mt-4">
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
                          Optional bookable (Viator)
                        </p>
                        <ul className="mt-2 space-y-2">
                          {viatorByBlock[block.id].map((p) => (
                            <li key={p.id}>
                              <a
                                href={`/go/viator/${encodeURIComponent(p.id)}`}
                                className="flex items-center justify-between gap-3 border border-white/10 px-3 py-2 text-sm hover:border-amber/50"
                              >
                                <span className="line-clamp-1">{p.title}</span>
                                <span className="shrink-0 font-mono text-[11px] text-amber">
                                  {p.priceFrom || "View"}
                                </span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
            <div className="grid grid-cols-3 border border-white/15">
              {(
                [
                  ["personalize", "Personalize"],
                  ["share", "Share & vote"],
                  ["city", "Add city"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAsideTab(id)}
                  className={`px-2 py-3 text-xs font-semibold transition sm:text-sm ${
                    asideTab === id
                      ? "bg-amber text-ink"
                      : "bg-white/[0.03] text-white/65 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {asideTab === "personalize" ? (
              <div className="border border-white/15 bg-white/[0.05] p-5">
                <h2 className="font-display text-xl">Personalize</h2>
                <p className="mt-2 text-sm text-white/55">
                  Tell us what this group wants. We map it onto flexible days —
                  anchors stay put.
                </p>

                {flexibleBlocks.length === 0 ? (
                  <p className="mt-4 text-sm text-white/50">
                    This template has no flexible slots yet.
                  </p>
                ) : (
                  <>
                    <div className="mt-4 space-y-2">
                      {availability.map((opt) => {
                        const on = wants.includes(opt.id);
                        return (
                          <label
                            key={opt.id}
                            className={`flex cursor-pointer items-start gap-2 border px-3 py-2 text-sm ${
                              !opt.available
                                ? "border-white/5 text-white/30"
                                : on
                                  ? "border-amber/40 bg-amber/10 text-white"
                                  : "border-white/10 text-white/75"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={on}
                              disabled={!opt.available}
                              onChange={() =>
                                setWants((prev) =>
                                  on
                                    ? prev.filter((x) => x !== opt.id)
                                    : [...prev, opt.id],
                                )
                              }
                              className="mt-1"
                            />
                            <span>
                              {opt.label}
                              {opt.available ? (
                                <span className="mt-0.5 block text-[11px] text-white/40">
                                  Fits: {opt.slots.join(", ")}
                                </span>
                              ) : (
                                <span className="mt-0.5 block text-[11px] text-white/30">
                                  No flexible day for this on this template
                                </span>
                              )}
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    {preview && wants.length > 0 ? (
                      <div className="mt-4 border border-white/10 bg-black/20 p-3 text-sm">
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
                          Preview
                        </p>
                        {preview.canFitWithoutExtend ? (
                          <p className="mt-2 text-amber">
                            Fits without extending the trip.
                          </p>
                        ) : null}
                        <ul className="mt-2 space-y-1 text-white/70">
                          {preview.applied.map((a) => (
                            <li key={a.blockId}>
                              {a.dayLabel}: {a.fromTitle} → {a.toTitle}
                            </li>
                          ))}
                          {preview.unfit.map((u) => (
                            <li key={u} className="text-white/45">
                              Can&apos;t auto-fit {experienceCategoryLabel[u]}
                            </li>
                          ))}
                        </ul>
                        {preview.tradeOffs.length ? (
                          <div className="mt-3 border-t border-white/10 pt-2 text-amber">
                            <p className="font-mono text-[10px] uppercase tracking-[0.14em]">
                              Trade-offs
                            </p>
                            <ul className="mt-1 space-y-1 text-white/75">
                              {preview.tradeOffs.map((t) => (
                                <li key={t}>· {t}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={runPersonalize}
                        className="bg-amber px-4 py-3 text-sm font-semibold text-ink hover:bg-amber-deep"
                      >
                        Apply
                      </button>
                      <button
                        type="button"
                        onClick={resetPersonalize}
                        className="border border-white/25 px-4 py-3 text-sm hover:border-amber"
                      >
                        Reset
                      </button>
                    </div>
                  </>
                )}

                <div className="mt-5 border border-amber/30 bg-amber/10 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber">
                    Save as my trip
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-white/75">
                    Like this template? Fork it as your own — separate from
                    joining someone else&apos;s group room.
                  </p>
                  <input
                    value={savedTripTitle}
                    onChange={(e) => setSavedTripTitle(e.target.value)}
                    placeholder={`${initial.title} — ours`}
                    className="mt-3 w-full border border-amber/30 bg-black/20 px-3 py-2.5 text-sm outline-none focus:border-amber"
                  />
                  {savedTripId ? (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-amber">
                        Saved ·{" "}
                        <Link href="/account" className="underline">
                          My trips
                        </Link>
                      </p>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={updateMySavedTrip}
                        className="w-full border border-amber/50 bg-amber/15 px-4 py-3 text-sm text-amber hover:bg-amber/25 disabled:opacity-60"
                      >
                        Update my saved trip
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={saveAsMyTrip}
                      className="mt-3 w-full bg-amber px-4 py-3 text-sm font-semibold text-ink hover:bg-amber-deep disabled:opacity-60"
                    >
                      {signedIn === false
                        ? "Sign in to save as my trip"
                        : "Save as my trip"}
                    </button>
                  )}
                </div>
              </div>
            ) : null}

            {asideTab === "share" ? (
              <div className="border border-white/15 bg-white/[0.05] p-5">
                <h2 className="font-display text-xl">Group share & vote</h2>
                <p className="mt-2 text-sm text-white/55">
                  One link for the group. Everyone enters a name, votes once per
                  flexible day, and can change their mind.
                </p>

                <label className="mt-4 block">
                  <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
                    Your name
                  </span>
                  <input
                    value={voterName}
                    onChange={(e) => setVoterName(e.target.value)}
                    placeholder="Alex"
                    className="w-full border border-white/20 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-amber"
                  />
                </label>

                {!session ? (
                  <>
                    <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-white/75">
                      <input
                        type="checkbox"
                        checked={openToJoin}
                        onChange={(e) => setOpenToJoin(e.target.checked)}
                        className="mt-1"
                      />
                      <span>
                        List on <strong className="text-white">Join a group</strong>{" "}
                        so travellers who like this template can find and join you
                      </span>
                    </label>
                    {openToJoin ? (
                      <input
                        value={joinNote}
                        onChange={(e) => setJoinNote(e.target.value)}
                        placeholder="Optional note — e.g. Times Square stay, open to 2 more"
                        className="mt-3 w-full border border-white/20 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-amber"
                      />
                    ) : null}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={createShare}
                      className="mt-4 w-full bg-amber px-4 py-3 text-sm font-semibold text-ink hover:bg-amber-deep disabled:opacity-60"
                    >
                      Create share link
                    </button>
                  </>
                ) : (
                  <div className="mt-4 space-y-3">
                    {!joined ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={joinShare}
                        className="w-full bg-amber px-4 py-3 text-sm font-semibold text-ink hover:bg-amber-deep"
                      >
                        Join this group vote
                      </button>
                    ) : (
                      <p className="text-sm text-amber">
                        You&apos;re in as {voterName || "Guest"}. Vote on slots
                        in the itinerary, or use Personalize for your swaps.
                      </p>
                    )}
                    <div className="border border-white/10 bg-black/20 p-3">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
                        Share link
                      </p>
                      <p className="mt-2 break-all font-mono text-[11px] text-amber">
                        {shareUrl}
                      </p>
                      <button
                        type="button"
                        onClick={copyShare}
                        className="mt-3 border border-white/25 px-3 py-2 text-xs hover:border-amber"
                      >
                        Copy link
                      </button>
                    </div>
                    <label className="flex cursor-pointer items-start gap-2 text-sm text-white/75">
                      <input
                        type="checkbox"
                        checked={Boolean(session.openToJoin)}
                        onChange={async (e) => {
                          const next = e.target.checked;
                          setBusy(true);
                          try {
                            const res = await fetch("/api/trip-sessions", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                action: "list",
                                shareCode: session.shareCode,
                                openToJoin: next,
                                joinNote: joinNote.trim() || session.joinNote,
                              }),
                            });
                            const data = (await res.json()) as {
                              session?: Session;
                            };
                            if (data.session) {
                              setSession(data.session);
                              setStatus(
                                next
                                  ? "Listed on Join a group."
                                  : "Removed from public Join a group list.",
                              );
                            }
                          } finally {
                            setBusy(false);
                          }
                        }}
                        className="mt-1"
                      />
                      <span>Show on Join a group board</span>
                    </label>
                    {(session.voters || []).length ? (
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
                          In the room
                        </p>
                        <ul className="mt-2 flex flex-wrap gap-2">
                          {(session.voters || []).map((v) => (
                            <li
                              key={v.key}
                              className="border border-white/15 px-2 py-1 text-xs text-white/70"
                            >
                              {v.name}
                              {Object.keys(v.votes).length
                                ? ` · ${Object.keys(v.votes).length} vote${Object.keys(v.votes).length === 1 ? "" : "s"}`
                                : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {flexibleBlocks.length ? (
                      <button
                        type="button"
                        onClick={applyWinners}
                        className="w-full border border-amber/40 bg-amber/10 px-4 py-3 text-sm text-amber"
                      >
                        Apply winning votes to trip
                      </button>
                    ) : (
                      <p className="text-xs text-white/40">
                        No flexible slots to vote on for this template.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : null}

            {asideTab === "city" ? (
              <div className="border border-white/15 bg-white/[0.05] p-5">
                <h2 className="font-display text-xl">Add another city</h2>
                <p className="mt-2 text-sm text-white/55">
                  Currently {initial.days} days · {initial.route}
                </p>
                <p className="mt-1 font-mono text-[11px] text-white/40">
                  On this trip: {initial.cityCodes.join(" · ")}
                </p>

                <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
                  Add
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {addableCities.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setAddCity(c.code)}
                      className={`border px-3 py-2 text-left text-sm transition ${
                        addCity === c.code
                          ? "border-amber bg-amber text-ink"
                          : "border-white/20 text-white/70"
                      }`}
                    >
                      <span className="font-mono">{c.code}</span>
                      <span className="ml-1.5 opacity-80">{c.label}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-5 border border-amber/30 bg-amber/10 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber">
                    Suggested length
                  </p>
                  <p className="mt-2 font-display text-2xl text-white">
                    {cityHint.recommendedDays[0]}–{cityHint.recommendedDays[1]}{" "}
                    days
                  </p>
                  <p className="mt-1 text-sm text-white/65">
                    +{cityHint.extraDays[0]}–{cityHint.extraDays[1]} days to add{" "}
                    {cityHint.label}
                  </p>
                  <p className="mt-3 text-sm text-white/70">
                    Route: {cityHint.suggestedRoute}
                  </p>
                </div>

                {cityHint.relatedTemplates.length ? (
                  <div className="mt-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
                      Ready-made templates that include this
                    </p>
                    <ul className="mt-3 space-y-2">
                      {cityHint.relatedTemplates.slice(0, 5).map((t) => (
                        <li key={t.id}>
                          <Link
                            href={`/trips/${t.slug}`}
                            className="block border border-white/15 px-3 py-3 transition hover:border-amber/50"
                          >
                            <p className="font-display text-lg text-white">
                              {t.title}
                            </p>
                            <p className="mt-1 text-xs text-white/50">
                              {t.days} days · {t.route}
                            </p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-white/50">
                    No multi-city template covers this combo yet. Use the length
                    suggestion above, or{" "}
                    <Link href="/?door=combine" className="text-amber underline">
                      combine cities
                    </Link>{" "}
                    from the home page.
                  </p>
                )}
              </div>
            ) : null}

            <details className="border border-white/10 bg-white/[0.03] p-4">
              <summary className="cursor-pointer font-display text-base text-white/70">
                Special experiences & travelled rating
              </summary>
              <div className="mt-4 space-y-4">
                <div>
                  <select
                    value={specialKind}
                    onChange={(e) =>
                      setSpecialKind(e.target.value as typeof specialKind)
                    }
                    className="w-full border border-white/20 bg-black/30 px-3 py-2 text-sm"
                  >
                    <option value="band">Live entertainment / band</option>
                    <option value="private_dinner">Private group dinner</option>
                    <option value="other">Other</option>
                  </select>
                  <textarea
                    value={specialNote}
                    onChange={(e) => setSpecialNote(e.target.value)}
                    placeholder="Group size, date window, vibe…"
                    rows={2}
                    className="mt-2 w-full border border-white/20 bg-black/30 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={requestSpecial}
                    className="mt-2 w-full border border-amber/40 px-3 py-2 text-sm text-amber"
                  >
                    Request provider
                  </button>
                </div>
                <div>
                  <div className="flex gap-2">
                    {[5, 4, 3, 2, 1].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        className={`border px-3 py-2 text-sm ${
                          rating === n
                            ? "border-amber bg-amber text-ink"
                            : "border-white/20"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={ratingNote}
                    onChange={(e) => setRatingNote(e.target.value)}
                    placeholder="What worked / what you’d change"
                    rows={2}
                    className="mt-2 w-full border border-white/20 bg-black/30 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={submitRating}
                    className="mt-2 w-full border border-white/25 px-3 py-2 text-sm"
                  >
                    Submit travelled rating
                  </button>
                </div>
              </div>
            </details>

            {status ? (
              <p className="border border-amber/20 bg-amber/5 px-3 py-2 text-sm text-amber">
                {status}
              </p>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
