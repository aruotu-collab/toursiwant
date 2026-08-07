import { notFound } from "next/navigation";
import { TemplateWorkspace } from "@/components/TemplateWorkspace";
import { getTemplateBySlug, tripTemplates } from "@/lib/trip-templates";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return tripTemplates.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const template = getTemplateBySlug(slug);
  if (!template) return { title: "Trip template" };
  return {
    title: template.title,
    description: template.blurb,
  };
}

export default async function TripTemplatePage({ params }: PageProps) {
  const { slug } = await params;
  const template = getTemplateBySlug(slug);
  if (!template) notFound();
  return (
    <main className="flex-1">
      <TemplateWorkspace initial={template} />
    </main>
  );
}
