import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TourDatePicker } from "@/components/TourDatePicker";
import { TripUpsells } from "@/components/TripUpsells";
import { tripUpsellsForCity } from "@/lib/affiliate-products";
import { getTourDetailsAsync, weekdayLabels } from "@/lib/tour-details";
import { getTourDeparture, toDateKey } from "@/lib/sample-tours";

type TourPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string }>;
};

export async function generateMetadata({ params }: TourPageProps) {
  const { slug } = await params;
  const tour = await getTourDetailsAsync(slug);
  if (!tour) return { title: "Tour not found" };
  return {
    title: tour.title,
    description: tour.longDescription.slice(0, 160),
  };
}

export default async function TourDetailPage({
  params,
  searchParams,
}: TourPageProps) {
  const { slug } = await params;
  const { date: dateParam } = await searchParams;
  const tour = await getTourDetailsAsync(slug);
  if (!tour) notFound();

  const travelDate = dateParam || toDateKey(new Date());
  const departure = getTourDeparture(
    slug,
    travelDate,
    "all",
    tour.source === "operator" ? [tour] : [],
  );
  const requestHref = `/request?tour=${tour.slug}&suggested=${travelDate}`;

  return (
    <main className="flex-1 bg-paper">
      <section className="relative isolate min-h-[42svh] overflow-hidden sm:min-h-[48svh]">
        <Image
          src={tour.image}
          alt={tour.imageAlt}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,27,42,0.35)_0%,rgba(12,27,42,0.78)_100%)]" />
        <div className="relative mx-auto flex min-h-[42svh] w-full max-w-6xl flex-col justify-end px-5 pb-10 pt-24 sm:min-h-[48svh] sm:px-8">
          <Link
            href="/tours"
            className="mb-4 w-fit text-sm text-white/75 transition hover:text-white"
          >
            ← Back to tours
          </Link>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber">
            {tour.cityName}, {tour.stateCode} · {tour.interest}
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight text-white sm:text-5xl">
            {tour.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base text-white/85 sm:text-lg">
            {tour.summary}
          </p>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.35fr_0.85fr] lg:py-16">
        <div className="space-y-10">
          <div>
            <h2 className="font-display text-2xl text-ink sm:text-3xl">
              About this tour
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-soft">
              {tour.longDescription}
            </p>
          </div>

          <div>
            <h3 className="font-display text-xl text-ink">Highlights</h3>
            <ul className="mt-4 space-y-2">
              {tour.highlights.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-ink-soft before:mt-2 before:h-1.5 before:w-1.5 before:shrink-0 before:bg-amber before:content-['']"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <h3 className="font-display text-xl text-ink">What&apos;s included</h3>
              <ul className="mt-4 space-y-2 text-sm text-ink-soft">
                {tour.includes.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-display text-xl text-ink">Good to know</h3>
              <ul className="mt-4 space-y-2 text-sm text-ink-soft">
                {tour.goodToKnow.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border border-skyline/20 bg-mist/50 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-skyline">
              Stay Near Your Tour
            </p>
            <h3 className="mt-2 font-display text-2xl text-ink">
              Sleep close to {tour.meetup}
            </h3>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
              Pair this experience with a hotel or short stay near the meetup.
              Add Stay Near Your Tour when you send interest — partners quote
              nights that match your date.
            </p>
            <Link
              href={`${requestHref}&intent=stay`}
              className="mt-5 inline-flex text-sm font-semibold text-skyline underline-offset-2 hover:underline"
            >
              Request stay near this tour →
            </Link>
          </div>

          <TripUpsells
            products={tripUpsellsForCity(tour.citySlug)}
            title="Hotels, data, cars & bookable attractions nearby"
          />
        </div>

        <aside className="h-fit border border-ink/10 bg-white/80 p-5 sm:p-6 lg:sticky lg:top-8">
          <TourDatePicker
            slug={tour.slug}
            travelDate={travelDate}
            departsLabel={
              departure?.departsLabel ||
              `${tour.timeLabel} · ${weekdayLabels(tour.weekdays)}`
            }
          />

          <dl className="mt-6 space-y-3 border-y border-ink/10 py-5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">From</dt>
              <dd className="font-semibold text-ink">{tour.priceFrom}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Duration</dt>
              <dd className="text-ink">{tour.duration}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Meet at</dt>
              <dd className="text-right text-ink">{tour.meetup}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Runs</dt>
              <dd className="text-right text-ink">
                {weekdayLabels(tour.weekdays)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Spaces</dt>
              <dd className="text-ink">
                {departure ? `${departure.spaces} left` : "Check date"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Languages</dt>
              <dd className="text-right text-ink">
                {tour.languages.join(", ")}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Group</dt>
              <dd className="text-ink">
                {tour.joinable ? "Joinable shared" : "Private"}
              </dd>
            </div>
          </dl>

          <p className="mt-4 text-xs leading-relaxed text-ink-soft">
            {tour.cancellation}
          </p>
          <p className="mt-3 text-xs text-ink-soft">
            You can change the date above before sending interest — operators
            quote for the day you choose.
          </p>

          <Link
            href={requestHref}
            className="mt-6 flex w-full items-center justify-center gap-2 bg-amber px-5 py-3.5 text-sm font-semibold tracking-wide text-ink transition hover:bg-amber-deep"
          >
            {tour.joinable ? "I want this tour" : "Request a quote"}
            <span aria-hidden>→</span>
          </Link>
          <p className="mt-2 text-center text-[11px] text-ink-soft">
            Browse date shown above — you pick your travel day on the request
            form
          </p>
          <Link
            href={`/request?tour=${tour.slug}&suggested=${travelDate}&intent=stay`}
            className="mt-3 flex w-full items-center justify-center border border-ink/15 px-5 py-3 text-sm font-medium text-ink transition hover:bg-paper"
          >
            Stay Near Your Tour
          </Link>
          <Link
            href="/request"
            className="mt-3 flex w-full items-center justify-center px-5 py-2 text-sm font-medium text-ink-soft transition hover:text-ink"
          >
            Request something custom instead
          </Link>
        </aside>
      </section>
    </main>
  );
}
