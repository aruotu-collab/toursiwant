import { TripsHome } from "@/components/TripsHome";

export default function HomePage() {
  return (
    <main className="flex-1">
      <h1 className="sr-only">
        ToursIWant — Start with a trip that already works. Then make it yours.
      </h1>
      <TripsHome />
    </main>
  );
}
