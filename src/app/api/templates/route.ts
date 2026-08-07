import { NextResponse } from "next/server";
import {
  combineCountryTemplates,
  getTemplateBySlug,
  listTemplates,
  personalizeTemplate,
  suggestAddCountry,
  type ExperienceCategory,
  type TemplateScale,
} from "@/lib/trip-templates";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (slug) {
    const template = getTemplateBySlug(slug);
    if (!template) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ template });
  }

  const scale = (searchParams.get("scale") || "all") as TemplateScale | "all";
  const countries = searchParams.getAll("country");
  const hotelId = searchParams.get("hotelId") || undefined;
  const timeBucket = searchParams.get("time") || undefined;
  const mood = searchParams.get("mood") || undefined;
  const combine = searchParams.get("combine") === "1";

  const templates = combine
    ? combineCountryTemplates(countries)
    : listTemplates({ scale, countries, hotelId, timeBucket, mood });

  return NextResponse.json({ templates });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    slug?: string;
    wants?: ExperienceCategory[];
    addCountry?: string;
  };
  const template = body.slug ? getTemplateBySlug(body.slug) : null;
  if (!template) {
    return NextResponse.json({ error: "Template required" }, { status: 400 });
  }

  if (body.addCountry) {
    return NextResponse.json({
      suggestion: suggestAddCountry(template, body.addCountry),
    });
  }

  const result = personalizeTemplate(template, body.wants || []);
  return NextResponse.json(result);
}
