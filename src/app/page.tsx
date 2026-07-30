import { HomeCommandCenter } from "@/components/HomeCommandCenter";

export default function HomePage() {
  return (
    <main className="flex-1">
      <h1 className="sr-only">
        ToursIWant — New York tour pulse, live seats, tours, events, and requests
      </h1>
      <HomeCommandCenter />
    </main>
  );
}
