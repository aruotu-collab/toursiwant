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
            Start with a trip that already works. Then make it yours.
          </p>
        </div>
        <div className="flex flex-wrap gap-5 text-sm text-white/75">
          <Link href="/?door=explore" className="hover:text-white">
            Explore trips
          </Link>
          <Link href="/?door=combine" className="hover:text-white">
            Combine countries
          </Link>
          <Link href="/?door=here" className="hover:text-white">
            I&apos;m here now
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
