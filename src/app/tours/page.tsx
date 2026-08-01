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
    <main className="flex-1 bg-paper">
      <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-8 lg:py-28">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-skyline">
          USA · Find tours
        </p>
        <h1 className="mt-3 max-w-2xl font-display text-4xl text-ink sm:text-5xl">
          Real tour ideas across America — pick a city and a date.
        </h1>
        <p className="mt-4 max-w-2xl text-ink-soft">
          {stats.total} starter experiences in {stats.cities} US cities while
          operators publish live inventory. Browse by city, travel date, and
          type — then claim interest or request a custom quote.
        </p>

        <div className="mt-10">
          <ToursBrowser />
        </div>
      </div>
    </main>
  );
}
