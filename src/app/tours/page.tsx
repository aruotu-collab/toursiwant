import { ToursBrowser } from "@/components/ToursBrowser";
import { catalogStats } from "@/lib/us-tour-catalog";

const stats = catalogStats();

export const metadata = {
  title: "Find tours across the USA",
  description:
    "Browse starter tours in New York, Los Angeles, Las Vegas, Miami, Orlando, Chicago, and more — then request quotes from local operators.",
};

export default function ToursPage() {
  return (
    <main className="flex-1 bg-ink text-white">
      <div className="mx-auto w-full max-w-[90rem] px-4 pb-16 pt-24 sm:px-8 sm:pb-20 sm:pt-28">
        <div className="max-w-2xl">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-amber sm:text-[11px] sm:tracking-[0.2em]">
            Find tours · USA
          </p>
          <h1 className="mt-1.5 font-display text-[1.65rem] leading-tight text-white sm:mt-2 sm:text-4xl">
            Pick a city and a date.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/70 sm:text-base">
            {stats.total} starter experiences in {stats.cities} US cities —
            same live-board feel as Pulse. Filter by city, date, and type, then
            open a listing or request a custom quote.
          </p>
        </div>

        <div className="mt-6 sm:mt-8">
          <ToursBrowser />
        </div>
      </div>
    </main>
  );
}
