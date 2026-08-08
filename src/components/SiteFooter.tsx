import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#070f18] text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div>
          <p className="font-display text-2xl tracking-tight">
            Tours<span className="text-amber">I</span>Want
          </p>
          <p className="mt-2 max-w-md text-sm text-white/70">
            The scorecard for things to do — rank places, shortlist what you
            want, and build your trip.
          </p>
        </div>
        <div className="flex flex-wrap gap-5 text-sm text-white/75">
          <Link href="/scorecard" className="hover:text-white">
            Scorecard
          </Link>
          <Link href="/account#my-trips" className="hover:text-white">
            My trips
          </Link>
          <Link href="/account" className="hover:text-white">
            Account
          </Link>
          <a href="mailto:hello@toursiwant.com" className="hover:text-white">
            hello@toursiwant.com
          </a>
        </div>
      </div>
    </footer>
  );
}
