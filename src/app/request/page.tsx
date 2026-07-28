import { Suspense } from "react";
import RequestForm from "@/components/RequestForm";

export const metadata = {
  title: "Request a tour",
  description:
    "Tell ToursIWant the New York tour you want. Local operators will send personalised quotes.",
};

export default function RequestPage() {
  return (
    <Suspense
      fallback={
        <main className="flex-1 px-5 py-28 text-ink-soft sm:px-8">
          Loading request form…
        </main>
      }
    >
      <RequestForm />
    </Suspense>
  );
}
