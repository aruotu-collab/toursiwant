import { Suspense } from "react";
import { HomeCommandCenter } from "@/components/HomeCommandCenter";

export default function HomePage() {
  return (
    <main className="flex-1">
      <h1 className="sr-only">
        ToursIWant — New York tour pulse, live seats, tours, events, and requests
      </h1>
      <Suspense
        fallback={
          <div className="min-h-[50vh] bg-ink px-4 py-10 text-white/50">
            Loading live board…
          </div>
        }
      >
        <HomeCommandCenter />
      </Suspense>
    </main>
  );
}
