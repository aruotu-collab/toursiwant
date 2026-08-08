/** Client-safe helpers for turning group votes into a plan shortlist. */

export type GroupRankLite = {
  slug: string;
  wantCount: number;
  votersTotal: number;
};

/**
 * Prefer places with ~50%+ “want” support; if still early, take top wanted.
 */
export function selectGroupPlanSlugs(ranks: GroupRankLite[]): string[] {
  const voters = Math.max(
    1,
    ranks.reduce((m, r) => Math.max(m, r.votersTotal), 1),
  );
  const majority = ranks.filter(
    (r) => r.wantCount > 0 && r.wantCount / voters >= 0.5,
  );
  const fallback = ranks.filter((r) => r.wantCount > 0).slice(0, 12);
  return (majority.length ? majority : fallback).map((r) => r.slug);
}

export function normalizeGroupCode(raw: string) {
  return raw.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}
