/**
 * Curated YouTube walkthroughs for place pages.
 * Prefer ambient / walking footage so visitors can feel the place
 * before they book. Missing slugs fall back to a YouTube search CTA.
 */
export type PlaceVideo = {
  youtubeId: string;
  /** Optional note under the embed */
  caption?: string;
};

const placeVideos: Record<string, PlaceVideo> = {
  "times-square": {
    youtubeId: "V_Go08UH9wM",
    caption: "Midtown walk through Times Square — lights, crowds, street energy.",
  },
  "bryant-park": {
    youtubeId: "V_Go08UH9wM",
    caption: "Same Midtown walk includes Bryant Park in spring.",
  },
  "new-york-public-library": {
    youtubeId: "V_Go08UH9wM",
    caption: "Ends at the NYPL on 42nd Street.",
  },
  "central-park": {
    youtubeId: "I6bGFxc4Wdg",
    caption: "Architectural Digest walking tour of Central Park.",
  },
  "brooklyn-bridge": {
    youtubeId: "ua-PWXBuD_Q",
    caption: "Brooklyn Bridge crossing into Manhattan.",
  },
  "brooklyn-bridge-park": {
    youtubeId: "ua-PWXBuD_Q",
    caption: "Approaches the bridge from the Brooklyn waterfront.",
  },
  "statue-of-liberty-ellis-island": {
    youtubeId: "j5S_JnSZ2ec",
    caption: "Statue of Liberty and Ellis Island visit.",
  },
  "statue-ferry-only": {
    youtubeId: "j5S_JnSZ2ec",
    caption: "Harbor views of Lady Liberty from the ferry route.",
  },
  "the-met": {
    youtubeId: "paN01mDDPj8",
    caption: "4K walkthrough of The Met’s grand halls and galleries.",
  },
  "rockefeller-center": {
    youtubeId: "EpghVY4AMw4",
    caption: "Midtown walk ending at Rockefeller Center.",
  },
  "top-of-the-rock": {
    youtubeId: "EpghVY4AMw4",
    caption: "Street-level Rockefeller Center — then head up for the view.",
  },
  "grand-central-terminal": {
    youtubeId: "HMWUygIW0o0",
    caption: "Morning rush through Grand Central and Midtown.",
  },
  "empire-state-building": {
    youtubeId: "EMxNPycOGtg",
    caption: "Inside and around the Empire State Building.",
  },
  "911-memorial-museum": {
    youtubeId: "_giAN2gTyEQ",
    caption: "A respectful look at the 9/11 Memorial & Museum.",
  },
  "one-world-observatory": {
    youtubeId: "-jYbxVXdXeI",
    caption: "Sunset views from One World Observatory.",
  },
  "high-line": {
    youtubeId: "2q6yYGmSlYs",
    caption: "High Line and Hudson River walk.",
  },
  "chelsea-market-high-line": {
    youtubeId: "2q6yYGmSlYs",
    caption: "High Line side — pair with Chelsea Market food stops.",
  },
  "little-island": {
    youtubeId: "2q6yYGmSlYs",
    caption: "Hudson waterfront walk near Little Island.",
  },
  "vessel-hudson-yards": {
    youtubeId: "2q6yYGmSlYs",
    caption: "Hudson Yards / High Line corridor energy.",
  },
  "the-vessel-shed": {
    youtubeId: "2q6yYGmSlYs",
    caption: "Hudson Yards area on foot.",
  },
};

export function getPlaceVideo(slug: string): PlaceVideo | null {
  return placeVideos[slug] ?? null;
}

export function youtubeSearchUrl(placeName: string): string {
  const q = encodeURIComponent(`${placeName} New York walking tour`);
  return `https://www.youtube.com/results?search_query=${q}`;
}

export function youtubeEmbedUrl(youtubeId: string): string {
  const params = new URLSearchParams({
    rel: "0",
    modestbranding: "1",
  });
  return `https://www.youtube-nocookie.com/embed/${youtubeId}?${params}`;
}
