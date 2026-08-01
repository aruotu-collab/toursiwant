export type PulseCategory =
  | "tour"
  | "bus"
  | "pickup"
  | "cruise"
  | "event"
  | "forming"
  | "joinable";

export type PulseStatus =
  | "preparing"
  | "en_route"
  | "at_stop"
  | "returning"
  | "forming"
  | "departing_soon";

export type PulseZoneId =
  | "harbor"
  | "lower-manhattan"
  | "midtown"
  | "central-park"
  | "brooklyn"
  | "airports";

/** Approximate zones along the NYC tour spine (public, not exact addresses). */
export type PulseZone = {
  id: PulseZoneId;
  label: string;
  shortLabel: string;
  /** 0–1 along the corridor path */
  t: number;
  blurb: string;
};

export type PulseActivity = {
  id: string;
  zoneId: PulseZoneId;
  category: PulseCategory;
  status: PulseStatus;
  title: string;
  detail: string;
  travellers: number;
  joinable: boolean;
  tourSlug?: string;
  href?: string;
  minutesAgo: number;
};

export const pulseZones: PulseZone[] = [
  {
    id: "harbor",
    label: "Cruise terminals",
    shortLabel: "Harbor",
    t: 0.08,
    blurb: "Shore trips, return-to-ship buffers, terminal pickups.",
  },
  {
    id: "lower-manhattan",
    label: "Lower Manhattan",
    shortLabel: "Downtown",
    t: 0.24,
    blurb: "Battery Park, Liberty views, financial district walks.",
  },
  {
    id: "midtown",
    label: "Midtown",
    shortLabel: "Midtown",
    t: 0.42,
    blurb: "Times Square, Broadway, hotel pickups, event rides.",
  },
  {
    id: "central-park",
    label: "Central Park belt",
    shortLabel: "Park",
    t: 0.58,
    blurb: "Museum mornings, carriage/driver loops, Upper East.",
  },
  {
    id: "brooklyn",
    label: "Brooklyn waterfront",
    shortLabel: "Brooklyn",
    t: 0.76,
    blurb: "DUMBO crawls, street art, bridge views, food stops.",
  },
  {
    id: "airports",
    label: "Airports & transfers",
    shortLabel: "Airports",
    t: 0.92,
    blurb: "JFK / LGA shared vans rolling into Manhattan.",
  },
];

export const pulseFilterTabs: {
  id: "all" | PulseCategory;
  label: string;
}[] = [
  { id: "all", label: "All" },
  { id: "bus", label: "Bus tours" },
  { id: "tour", label: "Tours" },
  { id: "pickup", label: "Pickups" },
  { id: "cruise", label: "Cruise" },
  { id: "event", label: "Events" },
  { id: "forming", label: "Forming" },
  { id: "joinable", label: "Joinable" },
];

export const pulseCategoryColor: Record<PulseCategory, string> = {
  tour: "#5b9bd5",
  bus: "#f97316",
  pickup: "#d4a017",
  cruise: "#7dd3c0",
  event: "#c084fc",
  forming: "#f59e0b",
  joinable: "#86efac",
};

export const pulseStatusLabel: Record<PulseStatus, string> = {
  preparing: "Preparing pickup",
  en_route: "En route",
  at_stop: "At stop",
  returning: "Returning",
  forming: "Group forming",
  departing_soon: "Departing soon",
};

/** Seeded live-feeling activity along the NYC spine. */
export const seedPulseActivities: PulseActivity[] = [
  {
    id: "p1",
    zoneId: "harbor",
    category: "cruise",
    status: "preparing",
    title: "Cruise shore: Lower Manhattan express",
    detail: "Terminal pickup · must return by 3:45 p.m.",
    travellers: 7,
    joinable: true,
    tourSlug: "cruise-shore-lower-manhattan",
    minutesAgo: 4,
  },
  {
    id: "p2",
    zoneId: "harbor",
    category: "cruise",
    status: "returning",
    title: "Statue & Ellis half-day",
    detail: "2 groups returning to ship with buffer",
    travellers: 11,
    joinable: false,
    tourSlug: "statue-ellis-half-day",
    minutesAgo: 12,
  },
  {
    id: "p3",
    zoneId: "lower-manhattan",
    category: "tour",
    status: "at_stop",
    title: "Lower Manhattan highlights",
    detail: "Battery Park meetup · walking group",
    travellers: 8,
    joinable: true,
    tourSlug: "lower-manhattan-highlights",
    minutesAgo: 2,
  },
  {
    id: "p4",
    zoneId: "lower-manhattan",
    category: "forming",
    status: "forming",
    title: "Private Liberty photo walk",
    detail: "3 travellers waiting for a matching quote",
    travellers: 3,
    joinable: false,
    href: "/request?date=",
    minutesAgo: 18,
  },
  {
    id: "p5",
    zoneId: "midtown",
    category: "pickup",
    status: "preparing",
    title: "Hotel lobby pickups · Midtown",
    detail: "Drivers staging near Bryant Park belt",
    travellers: 14,
    joinable: false,
    minutesAgo: 1,
  },
  {
    id: "p6",
    zoneId: "midtown",
    category: "event",
    status: "departing_soon",
    title: "Broadway evening · Event Pickup & Return",
    detail: "Curtain in ~2 hrs · seats still open for vans",
    travellers: 9,
    joinable: true,
    href: "/events/ride?event=broadway-evening",
    minutesAgo: 7,
  },
  {
    id: "p7",
    zoneId: "midtown",
    category: "tour",
    status: "en_route",
    title: "Broadway lights & Times Square evening",
    detail: "Shared evening walk · Midtown hotels",
    travellers: 6,
    joinable: true,
    tourSlug: "broadway-night-lights",
    minutesAgo: 9,
  },
  {
    id: "p7b",
    zoneId: "midtown",
    category: "bus",
    status: "at_stop",
    title: "Hop-on hop-off · Midtown loop",
    detail: "Board at Port Authority / Times Square stop flags",
    travellers: 18,
    joinable: true,
    href: "/request?details=Hop-on%20hop-off%20bus%20near%20my%20hotel",
    minutesAgo: 5,
  },
  {
    id: "p7c",
    zoneId: "midtown",
    category: "bus",
    status: "departing_soon",
    title: "Top View style double-decker · next buses",
    detail: "8th Ave & Times Square boarding · day ticket loops",
    travellers: 22,
    joinable: true,
    href: "/request?details=Top%20View%20hop-on%20hop-off%20boarding%20point",
    minutesAgo: 11,
  },
  {
    id: "p7d",
    zoneId: "lower-manhattan",
    category: "bus",
    status: "en_route",
    title: "Hop-on Downtown / harbor loop",
    detail: "Battery Park stop · continue Midtown or Brooklyn",
    travellers: 12,
    joinable: true,
    href: "/request?details=Downtown%20hop-on%20bus%20Battery%20Park",
    minutesAgo: 16,
  },
  {
    id: "p8",
    zoneId: "central-park",
    category: "tour",
    status: "at_stop",
    title: "The Met Museum highlights tour",
    detail: "Inside gallery stop · morning pace",
    travellers: 5,
    joinable: true,
    tourSlug: "met-museum-highlights",
    minutesAgo: 15,
  },
  {
    id: "p9",
    zoneId: "central-park",
    category: "joinable",
    status: "departing_soon",
    title: "Private Midtown & Central Park driver",
    detail: "1 seat open if you share the car",
    travellers: 2,
    joinable: true,
    tourSlug: "midtown-central-park-driver",
    minutesAgo: 22,
  },
  {
    id: "p10",
    zoneId: "brooklyn",
    category: "tour",
    status: "en_route",
    title: "Brooklyn food crawl",
    detail: "DUMBO waterfront · tasting stops",
    travellers: 6,
    joinable: true,
    tourSlug: "brooklyn-food-crawl",
    minutesAgo: 3,
  },
  {
    id: "p11",
    zoneId: "brooklyn",
    category: "forming",
    status: "forming",
    title: "Williamsburg street art & coffee",
    detail: "4 interested · looking for 2 more",
    travellers: 4,
    joinable: true,
    tourSlug: "williamsburg-street-art",
    minutesAgo: 28,
  },
  {
    id: "p12",
    zoneId: "brooklyn",
    category: "event",
    status: "preparing",
    title: "Barclays Center arena night",
    detail: "Pickup windows opening · return after encore",
    travellers: 8,
    joinable: true,
    href: "/events/ride?event=barclays-arena-night",
    minutesAgo: 11,
  },
  {
    id: "p13",
    zoneId: "airports",
    category: "pickup",
    status: "en_route",
    title: "JFK → Manhattan shared transfer",
    detail: "Van rolling · Midtown drop belt",
    travellers: 5,
    joinable: true,
    tourSlug: "jfk-manhattan-transfer",
    minutesAgo: 6,
  },
  {
    id: "p14",
    zoneId: "airports",
    category: "pickup",
    status: "preparing",
    title: "LaGuardia → Manhattan shared transfer",
    detail: "Staging at LGA · next departure soon",
    travellers: 3,
    joinable: true,
    tourSlug: "lga-manhattan-transfer",
    minutesAgo: 14,
  },
  {
    id: "p15",
    zoneId: "midtown",
    category: "forming",
    status: "forming",
    title: "Stay near Midtown meetup",
    detail: "2 travellers need rooms near Times Square tours",
    travellers: 2,
    joinable: false,
    href: "/request?intent=stay",
    minutesAgo: 33,
  },
  {
    id: "p16",
    zoneId: "lower-manhattan",
    category: "cruise",
    status: "departing_soon",
    title: "Harbor yacht sunset prep",
    detail: "Boarding window opens this evening",
    travellers: 10,
    joinable: true,
    tourSlug: "yacht-sunset-harbor",
    minutesAgo: 41,
  },
];

export function activityHref(activity: PulseActivity, dateKey: string) {
  if (activity.href) {
    if (activity.href.endsWith("date=")) {
      return `${activity.href}${dateKey}`;
    }
    return activity.href;
  }
  if (activity.tourSlug) {
    return `/tours/${activity.tourSlug}?date=${dateKey}`;
  }
  return "/tours";
}

export function matchesPulseFilter(
  activity: PulseActivity,
  filter: "all" | PulseCategory,
) {
  if (filter === "all") return true;
  if (filter === "joinable") return activity.joinable;
  return activity.category === filter;
}

export function zoneActivityStats(
  activities: PulseActivity[],
  zoneId: PulseZoneId,
) {
  const inZone = activities.filter((a) => a.zoneId === zoneId);
  return {
    total: inZone.length,
    active: inZone.filter((a) =>
      ["en_route", "at_stop", "preparing", "departing_soon"].includes(a.status),
    ).length,
    forming: inZone.filter((a) => a.status === "forming").length,
    joinable: inZone.filter((a) => a.joinable).length,
    travellers: inZone.reduce((sum, a) => sum + a.travellers, 0),
  };
}
