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
            Tell us the tour you want. Get quotes from local operators.
            Tours across the USA — New York and 19 more cities.
          </p>
        </div>
        <div className="flex flex-wrap gap-5 text-sm text-white/75">
          <Link href="/?menu=near" className="hover:text-white">
            Near you
          </Link>
          <Link href="/?menu=rush" className="hover:text-white">
            Live seats
          </Link>
          <Link href="/?menu=tours" className="hover:text-white">
            Find tours
          </Link>
          <Link href="/?menu=events" className="hover:text-white">
            Events
          </Link>
          <Link href="/?menu=request" className="hover:text-white">
            Request
          </Link>
          <Link href="/?menu=account" className="hover:text-white">
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
