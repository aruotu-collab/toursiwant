import { Suspense } from "react";
import { TripsHome } from "@/components/TripsHome";

export default function HomePage() {
  return (
    <main className="flex-1">
      <h1 className="sr-only">
        ToursIWant — Start with a trip that already works. Then make it yours.
      </h1>
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#071018] px-5 py-10 text-white/50">
            Loading trips…
          </div>
        }
      >
        <TripsHome />
      </Suspense>
    </main>
  );
}
