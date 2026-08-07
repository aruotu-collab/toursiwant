"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  experienceCategoryLabel,
  personalizeOptions,
  personalizeTemplate,
  suggestAddCountry,
  type ExperienceCategory,
  type ExperienceOption,
  type TripTemplate,
} from "@/lib/trip-templates";

type Session = {
  id: string;
  shareCode: string;
  votes: Record<string, Record<string, number>>;
  voterNames: string[];
  specialEventRequests: Array<{
    id: string;
    kind: string;
    note: string;
    status: string;
  }>;
  travelledRating?: number;
};

type ViatorHit = {
  id: string;
  title: string;
  priceFrom?: string;
  partner?: string;
};

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

export function TemplateWorkspace({
  initial,
}: {
  initial: TripTemplate;
}) {
  const [template, setTemplate] = useState(initial);
  const [wants, setWants] = useState<ExperienceCategory[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const [tradeOffs, setTradeOffs] = useState<string[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [voterName, setVoterName] = useState("");
  const [busy, setBusy] = useState(false);
  const [viatorByBlock, setViatorByBlock] = useState<
    Record<string, ViatorHit[]>
  >({});
  const [addCountry, setAddCountry] = useState("KR");
  const [countryHint, setCountryHint] = useState<ReturnType<
    typeof suggestAddCountry
  > | null>(null);
  const [specialNote, setSpecialNote] = useState("");
  const [specialKind, setSpecialKind] = useState<
    "band" | "private_dinner" | "other"
  >("band");
  const [rating, setRating] = useState(5);
  const [ratingNote, setRatingNote] = useState("");
  const [status, setStatus] = useState("");

  const flexibleBlocks = useMemo(
    () => template.blocks.filter((b) => b.alternatives?.length),
    [template],
  );

  const runPersonalize = useCallback(() => {
    const result = personalizeTemplate(initial, wants);
    setTemplate(result.template);
    setMessages(result.messages);
    setTradeOffs(result.tradeOffs);
  }, [initial, wants]);

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

  async function createShare() {
    setBusy(true);
    setStatus("");
    try {
      const res = await fetch("/api/trip-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          templateSlug: template.slug,
          templateTitle: template.title,
          hotelName: template.hotelAnchor?.name,
          wants,
        }),
      });
      const data = (await res.json()) as { session?: Session; error?: string };
      if (!res.ok || !data.session) throw new Error(data.error || "Failed");
      setSession(data.session);
      const url = `${window.location.origin}/trips/${template.slug}?share=${data.session.shareCode}`;
      setShareUrl(url);
      await navigator.clipboard?.writeText(url).catch(() => undefined);
      setStatus("Share link created and copied.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not create share");
    } finally {
      setBusy(false);
    }
  }

  async function castVote(blockId: string, optionId: string) {
    if (!session) {
      setStatus("Create a share link first so the group can vote.");
      return;
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
          voterName: voterName || "Guest",
        }),
      });
      const data = (await res.json()) as { session?: Session };
      if (data.session) {
        setSession(data.session);
        const opt = template.blocks
          .find((b) => b.id === blockId)
          ?.alternatives?.find((a) => a.id === optionId);
        if (opt) {
          setTemplate((t) => applyOption(t, blockId, opt));
          if (opt.tradeOff) {
            setTradeOffs((prev) =>
              prev.includes(opt.tradeOff!) ? prev : [...prev, opt.tradeOff!],
            );
          }
        }
        setStatus("Vote recorded.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function requestSpecial() {
    if (!session) {
      setStatus("Create a share session first.");
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
        setStatus("Special experience requested — provider follow-up.");
        setSpecialNote("");
      }
    } finally {
      setBusy(false);
    }
  }

  async function submitRating() {
    if (!session) {
      setStatus("Create a share session to leave a travelled rating.");
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
        setStatus("Thanks — rating saved as “actually travelled” feedback.");
      }
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("share");
    if (!code) return;
    (async () => {
      const res = await fetch(`/api/trip-sessions?code=${encodeURIComponent(code)}`);
      if (!res.ok) return;
      const data = (await res.json()) as { session: Session };
      setSession(data.session);
      setShareUrl(`${window.location.origin}/trips/${template.slug}?share=${code}`);
    })();
  }, [template.slug]);

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
            href="/"
            className="font-mono text-xs uppercase tracking-[0.16em] text-white/50 hover:text-amber"
          >
            ← Templates
          </Link>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-amber">
              {template.scale.replace("_", " ")} · {template.days} days
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
            <div className="mt-5 flex flex-wrap gap-4 font-mono text-[11px] text-white/45">
              <span>{template.savedCount.toLocaleString()} saved</span>
              <span>{template.groupsUsed} groups used</span>
              <span>{template.recommendPercent}% recommend</span>
              <span>{template.keptOrderPercent}% kept this order</span>
              {template.travelledRating ? (
                <span>
                  ★ {template.travelledRating} from{" "}
                  {template.travelledReviews} who travelled
                </span>
              ) : null}
            </div>

            {template.hotelAnchor ? (
              <p className="mt-6 border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70">
                Hotel anchor: {template.hotelAnchor.name} (
                {template.hotelAnchor.area}). Walking times shown from this
                stay.
              </p>
            ) : null}

            <ol className="mt-10 space-y-4">
              {template.blocks.map((block) => (
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
                      {block.free === false ? (
                        <span className="border border-white/15 px-2 py-1">
                          Paid optional
                        </span>
                      ) : null}
                      {block.walking ? (
                        <span className="border border-white/15 px-2 py-1">
                          Walk: {block.walking}
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
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
                        Swap this slot
                      </p>
                      {block.alternatives.map((opt) => {
                        const votes =
                          session?.votes?.[block.id]?.[opt.id] || 0;
                        return (
                          <div
                            key={opt.id}
                            className="flex flex-col gap-2 border border-white/10 bg-black/20 p-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="text-sm text-white">
                                {opt.title}
                                <span className="ml-2 text-white/40">
                                  {experienceCategoryLabel[opt.category]}
                                </span>
                              </p>
                              <p className="mt-1 text-xs text-white/50">
                                {opt.summary}
                                {opt.tradeOff ? ` · ${opt.tradeOff}` : ""}
                              </p>
                              {votes > 0 ? (
                                <p className="mt-1 font-mono text-[10px] text-amber">
                                  {votes} group vote{votes === 1 ? "" : "s"}
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
                                  if (opt.tradeOff) {
                                    setTradeOffs((prev) =>
                                      prev.includes(opt.tradeOff!)
                                        ? prev
                                        : [...prev, opt.tradeOff!],
                                    );
                                  }
                                }}
                                className="border border-white/25 px-3 py-2 text-xs hover:border-amber"
                              >
                                Use
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => castVote(block.id, opt.id)}
                                className="border border-amber/40 bg-amber/10 px-3 py-2 text-xs text-amber hover:bg-amber/20"
                              >
                                Vote
                              </button>
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
                  ) : block.viatorQuery ? (
                    <p className="mt-3 text-xs text-white/40">
                      Bookable options load when Viator is available for “
                      {block.viatorQuery}”.
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
            <div className="border border-amber/30 bg-amber/10 p-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber">
                Make it yours
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/80">
                Anchors stay. Flexible days swap. Share one link so the group can
                vote — then book paid pieces only when they fit.
              </p>
            </div>

            <div className="border border-white/15 bg-white/[0.05] p-5">
              <h2 className="font-display text-xl">Personalize</h2>
              <p className="mt-2 text-sm text-white/55">
                Select what this group wants. Flexible days swap; anchors stay.
              </p>
              <div className="mt-4 space-y-2">
                {personalizeOptions.map((opt) => {
                  const on = wants.includes(opt.id);
                  return (
                    <label
                      key={opt.id}
                      className="flex cursor-pointer items-start gap-2 text-sm text-white/75"
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() =>
                          setWants((prev) =>
                            on
                              ? prev.filter((x) => x !== opt.id)
                              : [...prev, opt.id],
                          )
                        }
                        className="mt-1"
                      />
                      {opt.label}
                    </label>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={runPersonalize}
                className="mt-5 w-full bg-amber px-4 py-3 text-sm font-semibold text-ink hover:bg-amber-deep"
              >
                Apply to this trip
              </button>
              {messages.length ? (
                <ul className="mt-4 space-y-2 text-sm text-white/70">
                  {messages.map((m) => (
                    <li key={m}>· {m}</li>
                  ))}
                </ul>
              ) : null}
              {tradeOffs.length ? (
                <div className="mt-4 border border-amber/30 bg-amber/10 p-3 text-sm text-amber">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em]">
                    Trade-offs
                  </p>
                  <ul className="mt-2 space-y-1 text-white/80">
                    {tradeOffs.map((t) => (
                      <li key={t}>· {t}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <div className="border border-white/15 bg-white/[0.05] p-5">
              <h2 className="font-display text-xl">Group share & vote</h2>
              <p className="mt-2 text-sm text-white/55">
                Share one link. Everyone votes on flexible slots.
              </p>
              <input
                value={voterName}
                onChange={(e) => setVoterName(e.target.value)}
                placeholder="Your name"
                className="mt-3 w-full border border-white/20 bg-black/30 px-3 py-2 text-sm outline-none focus:border-amber"
              />
              <button
                type="button"
                disabled={busy}
                onClick={createShare}
                className="mt-3 w-full border border-white/25 px-4 py-3 text-sm hover:border-amber"
              >
                Create share link
              </button>
              {shareUrl ? (
                <p className="mt-3 break-all font-mono text-[11px] text-amber">
                  {shareUrl}
                </p>
              ) : null}
              {session?.voterNames?.length ? (
                <p className="mt-2 text-xs text-white/45">
                  Voters: {session.voterNames.join(", ")}
                </p>
              ) : null}
              {flexibleBlocks.length === 0 ? (
                <p className="mt-2 text-xs text-white/40">
                  This template has no flexible slots to vote on.
                </p>
              ) : null}
            </div>

            <div className="border border-white/15 bg-white/[0.05] p-5">
              <h2 className="font-display text-xl">Add another country</h2>
              <p className="mt-2 text-sm text-white/55">
                Suggested trip length if you extend this template.
              </p>
              <div className="mt-3 flex gap-2">
                {["KR", "TH", "JP", "US"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAddCountry(c)}
                    className={`border px-3 py-2 font-mono text-sm ${
                      addCountry === c
                        ? "border-amber bg-amber text-ink"
                        : "border-white/20"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setCountryHint(suggestAddCountry(template, addCountry))}
                className="mt-3 w-full border border-white/25 px-4 py-3 text-sm hover:border-amber"
              >
                Suggest length
              </button>
              {countryHint ? (
                <div className="mt-3 text-sm text-white/70">
                  <p>
                    Recommended total: {countryHint.recommendedDays[0]}–
                    {countryHint.recommendedDays[1]} days
                  </p>
                  <p className="mt-1 text-white/55">
                    Route: {countryHint.suggestedRoute}
                  </p>
                  {countryHint.relatedTemplates.length ? (
                    <ul className="mt-3 space-y-1">
                      {countryHint.relatedTemplates.slice(0, 4).map((t) => (
                        <li key={t.id}>
                          <Link
                            href={`/trips/${t.slug}`}
                            className="text-amber hover:underline"
                          >
                            {t.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="border border-white/15 bg-white/[0.05] p-5">
              <h2 className="font-display text-xl">Special experiences</h2>
              <p className="mt-2 text-sm text-white/55">
                Band evenings and private dinners may need a provider — we
                reserve the time block.
              </p>
              <select
                value={specialKind}
                onChange={(e) =>
                  setSpecialKind(e.target.value as typeof specialKind)
                }
                className="mt-3 w-full border border-white/20 bg-black/30 px-3 py-2 text-sm"
              >
                <option value="band">Live entertainment / band</option>
                <option value="private_dinner">Private group dinner</option>
                <option value="other">Other</option>
              </select>
              <textarea
                value={specialNote}
                onChange={(e) => setSpecialNote(e.target.value)}
                placeholder="Group size, date window, vibe…"
                rows={3}
                className="mt-2 w-full border border-white/20 bg-black/30 px-3 py-2 text-sm outline-none focus:border-amber"
              />
              <button
                type="button"
                disabled={busy}
                onClick={requestSpecial}
                className="mt-3 w-full border border-amber/40 bg-amber/10 px-4 py-3 text-sm text-amber"
              >
                Request provider
              </button>
              {session?.specialEventRequests?.length ? (
                <ul className="mt-3 space-y-1 text-xs text-white/50">
                  {session.specialEventRequests.map((r) => (
                    <li key={r.id}>
                      {r.kind} · {r.status}
                      {r.note ? ` — ${r.note}` : ""}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="border border-white/15 bg-white/[0.05] p-5">
              <h2 className="font-display text-xl">Actually travelled?</h2>
              <p className="mt-2 text-sm text-white/55">
                Rate this template after the trip — not just a wishlist.
              </p>
              <div className="mt-3 flex gap-2">
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
                className="mt-3 w-full border border-white/25 px-4 py-3 text-sm hover:border-amber"
              >
                Submit travelled rating
              </button>
              {session?.travelledRating ? (
                <p className="mt-2 text-xs text-amber">
                  You rated {session.travelledRating}/5
                </p>
              ) : null}
            </div>

            {status ? (
              <p className="text-sm text-amber">{status}</p>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
