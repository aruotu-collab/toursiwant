import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountLogoutButton } from "@/components/AccountLogoutButton";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

type AccountPageProps = {
  searchParams: Promise<{ welcome?: string }>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/join?next=${encodeURIComponent("/account")}`);
  }

  const { welcome } = await searchParams;
  if (welcome) {
    redirect("/");
  }

  const firstName = user.name?.split(" ")[0] || user.email.split("@")[0];

  return (
    <main className="flex-1 bg-[linear-gradient(180deg,var(--mist)_0%,var(--paper)_40%)]">
      <div className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-8 lg:py-28">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/"
              className="mb-4 inline-flex text-sm font-semibold text-skyline underline-offset-2 hover:underline"
            >
              ← Back to trips
            </Link>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-skyline">
              Member area
            </p>
            <h1 className="mt-3 font-display text-4xl text-ink sm:text-5xl">
              Welcome, {firstName}
            </h1>
            <p className="mt-3 max-w-xl text-ink-soft">
              Signed in as{" "}
              <span className="font-medium text-ink">{user.email}</span>
              {user.role === "admin" ? " · Admin" : ""}. Save and share trip
              templates with your group from any plan page.
            </p>
          </div>
          <AccountLogoutButton />
        </div>

        {user.role === "admin" ? (
          <div className="mt-8 flex flex-wrap gap-3 border border-skyline/20 bg-skyline/5 p-5">
            <p className="w-full text-sm text-ink-soft">
              Admin access — platform console only (not shown to travellers).
            </p>
            <Link
              href="/admin"
              className="bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-soft"
            >
              Admin console
            </Link>
          </div>
        ) : null}

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <Link
            href="/?door=explore"
            className="border border-ink/10 bg-white/70 px-5 py-5 transition hover:border-skyline/40"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-stone">
              Browse
            </p>
            <p className="mt-2 font-display text-xl text-ink">Explore trips →</p>
          </Link>
          <Link
            href="/?door=combine"
            className="border border-ink/10 bg-white/70 px-5 py-5 transition hover:border-skyline/40"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-stone">
              Multi-country
            </p>
            <p className="mt-2 font-display text-xl text-ink">
              Combine countries →
            </p>
          </Link>
          <Link
            href="/?door=here"
            className="border border-ink/10 bg-white/70 px-5 py-5 transition hover:border-skyline/40"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-stone">
              Right now
            </p>
            <p className="mt-2 font-display text-xl text-ink">
              I&apos;m here now →
            </p>
          </Link>
        </div>

        <section className="mt-12 border border-ink/10 bg-white/70 p-8">
          <h2 className="font-display text-2xl text-ink">How to use ToursIWant</h2>
          <ol className="mt-4 space-y-3 text-sm leading-relaxed text-ink-soft">
            <li>
              <span className="font-semibold text-ink">1.</span> Pick a proven
              template — country, multi-country, or from your hotel.
            </li>
            <li>
              <span className="font-semibold text-ink">2.</span> Personalize
              flexible days (faith, food, fun, free time) without rewriting the
              trip spine.
            </li>
            <li>
              <span className="font-semibold text-ink">3.</span> Share a link so
              your group can vote on slots, then book optional paid experiences
              when they fit.
            </li>
          </ol>
          <Link
            href="/"
            className="mt-6 inline-flex bg-amber px-4 py-2.5 text-sm font-semibold text-ink hover:bg-amber-deep"
          >
            Start with a trip
          </Link>
        </section>
      </div>
    </main>
  );
}
