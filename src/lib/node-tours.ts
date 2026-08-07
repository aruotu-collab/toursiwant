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

/** Map a path-node label to a Viator search query for that stop type. */
export function nodeTourQuery(label: string): string {
  const l = label.toLowerCase().replace(/\s+\d+$/, "").trim();

  if (/hotel|aliz|stay|resort/.test(l)) return "Midtown Manhattan tours";
  if (/museum|met\b|gallery/.test(l)) return "museum";
  if (/market/.test(l)) return "market food tour";
  if (/restaurant|food hall|food/.test(l)) return "food tour";
  if (/park/.test(l)) return "Central Park";
  if (/harbor|liberty|statue/.test(l)) return "Statue of Liberty";
  if (/broadway|show|theater|theatre/.test(l)) return "Broadway";
  if (/shopping|shop/.test(l)) return "shopping";
  if (/viewpoint|view|skyline|empire/.test(l)) return "Empire State";
  if (/walk|midtown/.test(l)) return "walking tour Midtown";
  if (/downtown|leisure/.test(l)) return "downtown Manhattan";
  if (/morning/.test(l)) return "Central Park morning";
  if (/chinatown/.test(l)) return "Chinatown food tour";
  if (/niagara|falls/.test(l)) return "Niagara Falls";
  if (/disney/.test(l)) return "Disney";
  if (/beach/.test(l)) return "beach";

  // Fallback: use the label itself as the search
  return label.replace(/\s+\d+$/, "").trim() || "tours";
}

export function templateViatorCity(template: TripTemplate): string {
  const fromBlock = template.blocks.find((b) => b.viatorCitySlug)?.viatorCitySlug;
  if (fromBlock) return fromBlock;
  for (const code of template.cityCodes) {
    if (cityCodeToViator[code]) return cityCodeToViator[code];
  }
  return "new-york";
}

/** Prefer linked block's viatorQuery when the node came from the itinerary. */
export function queryForRouteNode(
  node: RouteNode,
  template: TripTemplate,
): string {
  if (node.blockId) {
    const block = template.blocks.find((b) => b.id === node.blockId);
    if (block?.viatorQuery) return block.viatorQuery;
    const alt = block?.alternatives?.find((a) => a.viatorQuery);
    if (alt?.viatorQuery) return alt.viatorQuery;
  }
  return nodeTourQuery(node.label);
}
