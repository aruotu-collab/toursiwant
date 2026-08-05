import { NextResponse } from "next/server";
import {
  runComparison,
  type ComparePrefs,
  type ComparePriority,
  type CompareResult,
} from "@/lib/tour-compare";
import {
  searchViatorForCompare,
  viatorDestinationByCity,
  viatorEnvLabel,
} from "@/lib/viator";

export const dynamic = "force-dynamic";

type Body = {
  query?: string;
  citySlug?: string;
  date?: string;
  adults?: number;
  children?: number;
  budgetPerPerson?: number | null;
  priority?: ComparePriority;
  maxDurationHours?: number | null;
  minRating?: number | null;
};

export async function POST(request: Request) {
  const body = (await request.json()) as Body;
  const query = (body.query || "").trim();
  if (query.length < 2) {
    return NextResponse.json(
      { error: "Enter a destination or attraction (at least 2 characters)." },
      { status: 400 },
    );
  }

  const citySlug = body.citySlug || "new-york";
  const dest =
    viatorDestinationByCity[citySlug] || viatorDestinationByCity["new-york"];

  const prefs: ComparePrefs = {
    query,
    citySlug,
    date: body.date,
    adults: Math.max(1, Number(body.adults) || 2),
    children: Math.max(0, Number(body.children) || 0),
    budgetPerPerson:
      body.budgetPerPerson == null || body.budgetPerPerson === undefined
        ? undefined
        : Number(body.budgetPerPerson),
    priority: body.priority || "overall",
    maxDurationHours:
      body.maxDurationHours == null ? undefined : Number(body.maxDurationHours),
    minRating: body.minRating == null ? undefined : Number(body.minRating),
  };

  const live = await searchViatorForCompare({
    citySlug,
    query,
    count: 50,
  });

  if (!live.tours.length) {
    const empty: CompareResult = {
      query,
      citySlug,
      cityName: dest.cityName,
      funnel: {
        analysed: 0,
        afterBudget: 0,
        afterRating: 0,
        afterDuration: 0,
        afterPreferences: 0,
      },
      awards: [],
      shortlist: [],
      allScored: [],
      source: live.source,
      env: live.env || viatorEnvLabel(),
      error:
        live.error ||
        "No tours found for that search. Try another attraction or city.",
    };
    return NextResponse.json(empty);
  }

  const compared = runComparison(live.tours, prefs);
  const result: CompareResult = {
    ...compared,
    cityName: dest.cityName,
    source: live.source,
    env: live.env,
  };

  return NextResponse.json(result);
}
