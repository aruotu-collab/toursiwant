import { Suspense } from "react";
import { EventRideForm } from "@/components/EventRideForm";

export const metadata = {
  title: "Event Pickup & Return",
  description:
    "Request door-to-door transport to New York events and a safe return after.",
};

export default function EventRidePage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 px-5 py-28">
          <div className="mx-auto h-64 max-w-2xl animate-pulse bg-white/50" />
        </main>
      }
    >
      <EventRideForm />
    </Suspense>
  );
}
