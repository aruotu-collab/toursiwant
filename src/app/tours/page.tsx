import { launchCity } from "@/lib/cities";
import { ToursBrowser } from "@/components/ToursBrowser";

export const metadata = {
  title: "New York tours by date",
  description:
    "Browse New York tours happening today or months ahead. Pick your travel date and see what's available.",
};

export default function ToursPage() {
  return (
    <main className="flex-1 bg-paper">
      <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-8 lg:py-28">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-skyline">
          {launchCity.name} · Find tours
        </p>
        <h1 className="mt-3 max-w-2xl font-display text-4xl text-ink sm:text-5xl">
          Read the board. Pick your date. Get the tour.
        </h1>
        <p className="mt-4 max-w-2xl text-ink-soft">
          See live New York demand, then browse departures for today or months
          ahead. Claim a seat on a scheduled tour — or request a custom quote
          when you know exactly what you want.
        </p>

        <div className="mt-10">
          <ToursBrowser />
        </div>
      </div>
    </main>
  );
}
