/** Client-safe markers for saved trip kinds (no Node/db imports). */

export const NYC_PLAN_TEMPLATE_SLUG = "new-york-plan";

export function isNycPlanTrip(trip: { templateSlug: string }) {
  return trip.templateSlug === NYC_PLAN_TEMPLATE_SLUG;
}

export function openSavedTripHref(trip: {
  id: string;
  templateSlug: string;
}) {
  if (isNycPlanTrip(trip)) {
    return `/new-york/plan?saved=${encodeURIComponent(trip.id)}`;
  }
  return `/trips/${trip.templateSlug}?saved=${encodeURIComponent(trip.id)}`;
}
