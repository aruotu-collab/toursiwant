/**
 * Deterministic sample “liked by” counts for scoreboard social proof.
 * Stable per place across reloads; live UI can tick upward from this base.
 */
export function sampleLikeBase(slug: string, tiwScore: number): number {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const spread = 380 + (h >>> 0) % 1600; // 380–1979
  const scoreBoost = Math.round((Math.max(0, Math.min(100, tiwScore)) / 100) * 1100);
  return spread + scoreBoost;
}

export function formatLikeCount(n: number): string {
  return Math.max(0, Math.round(n)).toLocaleString("en-US");
}
