"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  formatEventWhen,
  nycEventsThisWeek,
  type NycEvent,
} from "@/lib/events";

type CategoryFilter = "all" | NycEvent["category"];

const categoryTabs: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "This week" },
  { id: "concert", label: "Concerts" },
  { id: "sports", label: "Sports" },
  { id: "theatre", label: "Broadway" },
  { id: "festival", label: "Festivals" },
  { id: "nightlife", label: "Nightlife" },
];

export function EventsBoard({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    nycEventsThisWeek[0]?.slug ?? null,
  );

  const filtered = useMemo(() => {
    if (category === "all") return nycEventsThisWeek;
    return nycEventsThisWeek.filter((e) => e.category === category);
  }, [category]);

  const selected =
    filtered.find((e) => e.slug === selectedSlug) || filtered[0] || null;

  return (
    <section className="overflow-x-hidden text-white">
      {!embedded ? (
        <div className="mb-6 max-w-2xl">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-amber">
            Events · this week
          </p>
          <h2 className="mt-2 font-display text-3xl text-white sm:text-4xl">
            Home → event → home again
          </h2>
          <p className="mt-2 text-sm text-white/70 sm:text-base">
            Concerts, games, and Broadway — request Event Pickup & Return without
            leaving the board.
          </p>
        </div>
      ) : (
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.14em] text-white/55">
          NYC this week · {filtered.length} events · pickup & return
        </p>
      )}

      <div className="border border-amber/30 bg-amber/5 p-4 sm:p-5">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-amber">
          1 · What kind of event?
        </p>
        <div className="mt-3 flex gap-2 overflow-x-auto overscroll-x-contain pb-0.5 [touch-action:pan-x] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categoryTabs.map((tab) => {
            const active = category === tab.id;
            const count =
              tab.id === "all"
                ? nycEventsThisWeek.length
                : nycEventsThisWeek.filter((e) => e.category === tab.id)
                    .length;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setCategory(tab.id);
                  setSelectedSlug(null);
                }}
                className={`shrink-0 border px-3 py-2.5 text-left transition ${
                  active
                    ? "border-amber bg-amber text-ink"
                    : "border-white/15 text-white hover:border-white/35"
                }`}
              >
                <span className="block text-sm font-semibold">{tab.label}</span>
                <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wider opacity-70">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:mt-6 sm:gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
        <div className="order-2 min-w-0 border border-white/10 bg-white/[0.03] lg:order-1">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
              This week
            </p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">
              {filtered.length} shown
            </p>
          </div>
          <ul className="divide-y divide-white/10 lg:max-h-[34rem] lg:overflow-y-auto lg:overscroll-contain">
            {filtered.map((event) => {
              const active = selected?.slug === event.slug;
              return (
                <li key={event.slug}>
                  <button
                    type="button"
                    onClick={() => setSelectedSlug(event.slug)}
                    className={`flex w-full gap-3 px-4 py-3.5 text-left transition ${
                      active ? "bg-amber/15" : "hover:bg-white/[0.06]"
                    }`}
                  >
                    <span
                      className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-amber"
                      style={{ boxShadow: "0 0 10px #f5c54288" }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-amber">
                          {event.category}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">
                          {event.neighbourhood}
                        </span>
                      </span>
                      <span className="mt-0.5 block font-semibold text-white [overflow-wrap:anywhere]">
                        {event.name}
                      </span>
                      <span className="mt-0.5 block text-sm text-white/55">
                        {event.venue} · {formatEventWhen(event.startsAt)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 ? (
              <li className="px-4 py-10 text-center text-sm text-white/50">
                No events in this category this week.
              </li>
            ) : null}
          </ul>
        </div>

        <div className="order-1 min-w-0 lg:order-2">
          {selected ? (
            <div className="overflow-hidden border border-white/10 bg-[#0a1520]">
              <div className="relative aspect-[16/10]">
                <Image
                  src={selected.image}
                  alt={selected.imageAlt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,27,42,0.25)_0%,rgba(12,27,42,0.85)_100%)]" />
                <p className="absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-wider text-amber">
                  {selected.category} · {selected.neighbourhood}
                </p>
              </div>
              <div className="p-4 sm:p-5">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-amber">
                  2 · Request pickup & return
                </p>
                <h3 className="mt-2 font-display text-2xl text-white">
                  {selected.name}
                </h3>
                <p className="mt-1 text-sm text-white/55">
                  {selected.venue} · {formatEventWhen(selected.startsAt)} →{" "}
                  {formatEventWhen(selected.endsAt)}
                </p>
                <p className="mt-3 text-sm text-white/70">{selected.summary}</p>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-white/40">
                  Pickup · {selected.pickupHint}
                </p>
                <Link
                  href={`/events/ride?event=${selected.slug}`}
                  className="mt-5 inline-flex w-full items-center justify-center bg-amber px-4 py-3 text-sm font-semibold text-ink hover:bg-amber-deep"
                >
                  Request Event Pickup & Return
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
