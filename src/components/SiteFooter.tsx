import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/10 bg-ink text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div>
          <p className="font-display text-2xl tracking-tight">
            Tours<span className="text-amber">I</span>Want
          </p>
          <p className="mt-2 max-w-md text-sm text-white/70">
            Tell us the tour you want. Get quotes from local operators.
            Launching in New York, expanding city by city.
          </p>
        </div>
        <div className="flex flex-wrap gap-5 text-sm text-white/75">
          <Link href="/request" className="hover:text-white">
            Request a tour
          </Link>
          <Link href="/tours" className="hover:text-white">
            Find tours
          </Link>
          <a href="mailto:hello@toursiwant.com" className="hover:text-white">
            hello@toursiwant.com
          </a>
        </div>
      </div>
    </footer>
  );
}
