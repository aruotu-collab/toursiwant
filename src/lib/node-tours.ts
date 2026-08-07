import type { RouteNode } from "@/components/TemplateRouteLoop";
import type { TripTemplate } from "@/lib/trip-templates";

const cityCodeToViator: Record<string, string> = {
  NYC: "new-york",
  NIA: "new-york",
  BOS: "boston",
  DC: "washington-dc",
  LA: "los-angeles",
  SF: "san-francisco",
  CHI: "chicago",
  MIA: "miami",
  LAS: "las-vegas",
  ORL: "orlando",
  NOLA: "new-orleans",
  NASH: "nashville",
  PHL: "philadelphia",
  SD: "san-diego",
};

/** Primary + broader fallbacks so every stop can still show bookable options. */
export function queriesForLabel(label: string): string[] {
  return nodeTourQueries(label);
}

/** Primary + broader fallbacks so every stop can still show bookable options. */
export function nodeTourQueries(label: string): string[] {
  const l = label.toLowerCase().replace(/\s+\d+$/, "").trim();
  const bare = label.replace(/\s+\d+$/, "").trim();

  if (/hotel|aliz|stay|resort/.test(l)) {
    return ["Midtown", "hop-on", "SUMMIT", "observation"];
  }
  if (/museum|met\b|gallery|moma/.test(l)) {
    return [
      "MoMA",
      "Metropolitan Museum",
      "museum",
      "Natural History Museum",
      "Guggenheim",
    ];
  }
  if (/market/.test(l)) {
    return ["food", "market", "tasting"];
  }
  if (/restaurant|food hall|food/.test(l)) {
    return ["food", "tasting", "dinner"];
  }
  if (/park morning|morning/.test(l)) {
    return ["Central Park", "park"];
  }
  if (/park/.test(l)) {
    return ["Central Park", "park", "bike"];
  }
  if (/harbor|liberty|statue|ellis/.test(l)) {
    return ["Statue of Liberty", "Ellis", "harbor", "cruise"];
  }
  if (/broadway|show|theater|theatre/.test(l)) {
    return ["Broadway", "show", "theater"];
  }
  if (/shopping|shop/.test(l)) {
    return ["shopping", "Fifth Avenue", "hop-on"];
  }
  if (/viewpoint|view|skyline|empire|summit|edge/.test(l)) {
    return ["SUMMIT", "Edge", "observation", "Empire"];
  }
  if (/walkable|walk|midtown/.test(l)) {
    return ["hop-on", "Midtown", "walking", "SUMMIT"];
  }
  if (/downtown|leisure|choose/.test(l)) {
    return ["Statue of Liberty", "downtown", "harbor", "food"];
  }
  if (/chinatown/.test(l)) {
    return ["Chinatown", "food"];
  }
  if (/niagara|falls/.test(l)) {
    return ["Niagara", "Falls"];
  }
  if (/disney/.test(l)) {
    return ["Disney", "theme park"];
  }
  if (/beach/.test(l)) {
    return ["beach", "boat"];
  }

  // Generic: try the label, then first word, then empty (city popular) handled by caller
  const first = bare.split(/\s+/)[0] || bare;
  return [bare, first].filter(Boolean);
}

export function templateViatorCity(template: TripTemplate): string {
  const fromBlock = template.blocks.find((b) => b.viatorCitySlug)?.viatorCitySlug;
  if (fromBlock) return fromBlock;
  for (const code of template.cityCodes) {
    if (cityCodeToViator[code]) return cityCodeToViator[code];
  }
  return "new-york";
}

/**
 * Ordered search queries for a path node.
 * Empty string at the end = city bestsellers (always filled by API).
 */
export function queriesForRouteNode(
  node: RouteNode,
  template: TripTemplate,
): string[] {
  const list: string[] = [];

  if (node.blockId) {
    const block = template.blocks.find((b) => b.id === node.blockId);
    if (block?.viatorQuery) list.push(block.viatorQuery);
    for (const alt of block?.alternatives || []) {
      if (alt.viatorQuery) list.push(alt.viatorQuery);
    }
  }

  list.push(...nodeTourQueries(node.label));
  list.push(""); // city popular fallback

  // Dedupe, keep order
  const seen = new Set<string>();
  return list.filter((q) => {
    const key = q.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** @deprecated use queriesForRouteNode */
export function queryForRouteNode(
  node: RouteNode,
  template: TripTemplate,
): string {
  return queriesForRouteNode(node, template)[0] || node.label;
}

/** @deprecated use nodeTourQueries */
export function nodeTourQuery(label: string): string {
  return nodeTourQueries(label)[0] || label;
}
