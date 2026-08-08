import type { Metadata } from "next";
import Link from "next/link";
import { GroupScoreboardClient } from "@/components/GroupScoreboardClient";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Group New York Scoreboard (${code})`,
    description:
      "Vote on what your group wants to do in New York — see live group rankings.",
    robots: { index: false, follow: false },
  };
}

export default async function GroupScoreboardPage({ params }: Props) {
  const { code } = await params;
  return (
    <main className="flex-1 bg-paper pt-24">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8 sm:py-14">
        <p className="text-sm text-ink-soft">
          <Link href="/new-york" className="hover:text-amber-deep">
            New York Scoreboard
          </Link>
          <span className="mx-2 text-stone">/</span>
          Group vote
        </p>
        <div className="mt-8">
          <GroupScoreboardClient code={code} />
        </div>
      </div>
    </main>
  );
}
