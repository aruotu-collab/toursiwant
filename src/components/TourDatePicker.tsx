"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  BROWSE_MONTHS_AHEAD,
  formatDisplayDate,
  toDateKey,
} from "@/lib/sample-tours";

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

type TourDatePickerProps = {
  slug: string;
  travelDate: string;
  departsLabel: string;
};

export function TourDatePicker({
  slug,
  travelDate,
  departsLabel,
}: TourDatePickerProps) {
  const router = useRouter();
  const today = toDateKey(new Date());
  const maxDate = toDateKey(addMonths(new Date(), BROWSE_MONTHS_AHEAD));

  const shortcuts = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const daysUntilSaturday = (6 - day + 7) % 7 || 7;
    return [
      { label: "Today", date: today },
      { label: "Tomorrow", date: toDateKey(addDays(now, 1)) },
      {
        label: "This weekend",
        date: toDateKey(addDays(now, daysUntilSaturday)),
      },
    ];
  }, [today]);

  function goToDate(nextDate: string) {
    router.push(`/tours/${slug}?date=${nextDate}`, { scroll: false });
  }

  return (
    <div>
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-skyline">
        Choose your date
      </p>
      <p className="mt-2 text-sm text-ink-soft">
        Not locked to one day — pick when you want to go (today or months ahead).
      </p>

      <label className="mt-4 block">
        <span className="sr-only">Tour date</span>
        <input
          type="date"
          value={travelDate}
          min={today}
          max={maxDate}
          onChange={(e) => {
            if (e.target.value) goToDate(e.target.value);
          }}
          className="w-full border border-ink/15 bg-paper/60 px-3 py-2.5 text-ink outline-none transition focus:border-skyline"
        />
      </label>

      <div className="mt-3 flex flex-wrap gap-2">
        {shortcuts.map((item) => {
          const active = item.date === travelDate;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => goToDate(item.date)}
              className={`border px-2.5 py-1.5 text-xs font-semibold transition ${
                active
                  ? "border-ink bg-ink text-white"
                  : "border-ink/15 text-ink-soft hover:border-ink/35 hover:text-ink"
              }`}
            >
              {item.label}
            </button>
          );
        })}
        <Link
          href="/tours"
          className="border border-ink/15 px-2.5 py-1.5 text-xs font-semibold text-skyline hover:border-skyline/40"
        >
          Browse all dates
        </Link>
      </div>

      <p className="mt-4 font-display text-2xl text-ink">
        {formatDisplayDate(travelDate)}
      </p>
      <p className="mt-1 text-sm text-ink-soft">{departsLabel}</p>
    </div>
  );
}
