import { EventsBoard } from "@/components/EventsBoard";

export const metadata = {
  title: "Events This Week · New York",
  description:
    "Concerts, sports, theatre, and festivals — request Event Pickup & Return with ToursIWant.",
};

export default function EventsPage() {
  return (
    <main className="flex-1 bg-ink text-white">
      <div className="mx-auto w-full max-w-[90rem] px-4 pb-16 pt-24 sm:px-8 sm:pb-20 sm:pt-28">
        <EventsBoard />
      </div>
    </main>
  );
}
