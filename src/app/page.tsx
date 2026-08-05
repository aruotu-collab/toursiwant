import { TourIntelligenceApp } from "@/components/TourIntelligenceApp";

export default function HomePage() {
  return (
    <main className="flex-1">
      <h1 className="sr-only">
        ToursIWant — We compare the tours. You choose the experience.
      </h1>
      <TourIntelligenceApp />
    </main>
  );
}
