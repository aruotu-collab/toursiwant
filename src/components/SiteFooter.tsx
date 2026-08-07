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
            Start with a trip that already works. Then make it yours — countries,
            multi-country routes, and right-now plans from your hotel.
          </p>
        </div>
        <div className="flex flex-wrap gap-5 text-sm text-white/75">
          <Link href="/" className="hover:text-white">
            Templates
          </Link>
          <Link href="/tours" className="hover:text-white">
            Bookable tours
          </Link>
          <Link href="/events" className="hover:text-white">
            Events
          </Link>
          <Link href="/request" className="hover:text-white">
            Request
          </Link>
          <Link href="/account" className="hover:text-white">
            Account
          </Link>
          <Link href="/operator" className="hover:text-white">
            Operator inbox
          </Link>
          <a href="mailto:hello@toursiwant.com" className="hover:text-white">
            hello@toursiwant.com
          </a>
        </div>
      </div>
    </footer>
  );
}
