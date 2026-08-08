import {
  buildPlanFromSelections,
  pinPlanDays,
  type DayAssignments,
} from "@/lib/scoreboard-plan";
import { NYC_PLAN_TEMPLATE_SLUG } from "@/lib/saved-trip-kinds";

export async function saveNycPlanTrip(input: {
  title: string;
  placeSlugs: string[];
  planDays: number;
  dayAssignments?: DayAssignments;
  sourceShareCode?: string;
}): Promise<{ id: string; title: string }> {
  const plan = buildPlanFromSelections(
    input.placeSlugs,
    input.planDays,
    input.dayAssignments,
  );
  const filledDays = plan.days.filter((d) => d.stops.length > 0).length;
  const routeNodes = plan.days
    .filter((d) => d.stops.length > 0)
    .map((d) => ({
      id: `day-${d.dayIndex}`,
      label: d.title,
      kind: "day" as const,
      dayIndex: d.dayIndex,
      dayLabel: d.title,
      stops: d.stops.map((s) => ({ id: s.slug, label: s.name })),
    }));

  const title =
    input.title.trim() ||
    `New York · ${filledDays || input.planDays} day${
      (filledDays || input.planDays) === 1 ? "" : "s"
    }`;

  const res = await fetch("/api/saved-trips", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "create",
      templateSlug: NYC_PLAN_TEMPLATE_SLUG,
      templateTitle: "New York scoreboard plan",
      title,
      route: `${filledDays || input.planDays} days · ${input.placeSlugs.length} places`,
      region: "New York",
      cityCodes: ["NYC"],
      placeSlugs: input.placeSlugs,
      planDays: input.planDays,
      dayAssignments: {
        ...pinPlanDays(plan),
        ...(input.dayAssignments || {}),
      },
      routeNodes,
      sourceShareCode: input.sourceShareCode,
    }),
  });

  const data = (await res.json()) as {
    trip?: { id: string; title: string };
    error?: string;
  };

  if (res.status === 401) {
    const err = new Error("SIGN_IN_REQUIRED");
    throw err;
  }
  if (!res.ok || !data.trip) {
    throw new Error(data.error || "Could not save trip");
  }
  return data.trip;
}
