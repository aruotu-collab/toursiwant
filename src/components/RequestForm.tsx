"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { launchCity } from "@/lib/cities";
import {
  formatDisplayDate,
  getSampleTour,
  getTourDeparture,
  toDateKey,
} from "@/lib/sample-tours";
import { tourInterests, type TourInterest } from "@/lib/tour-types";

export default function RequestForm() {
  const searchParams = useSearchParams();
  const isOperator = searchParams.get("intent") === "operator";
  const tourSlug = searchParams.get("tour");
  const dateParam = searchParams.get("date");
  const travelDate = dateParam || toDateKey(new Date());

  const selectedTour = tourSlug
    ? getTourDeparture(tourSlug, travelDate) || getSampleTour(tourSlug)
    : undefined;
  const isSpecificTour = Boolean(selectedTour) && !isOperator;
  const hasAdvanceDate = Boolean(dateParam);

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [interests, setInterests] = useState<TourInterest[]>(
    selectedTour ? [selectedTour.interest] : [],
  );
  const [joinGroup, setJoinGroup] = useState(selectedTour?.joinable ?? true);

  const title = useMemo(() => {
    if (isOperator) return "Join ToursIWant as a New York operator";
    if (selectedTour) return `I want: ${selectedTour.title}`;
    if (hasAdvanceDate) return `Request a tour for ${formatDisplayDate(travelDate)}`;
    return "Request the New York tour you want";
  }, [hasAdvanceDate, isOperator, selectedTour, travelDate]);

  function toggleInterest(interest: TourInterest) {
    setInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest],
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    const form = event.currentTarget;
    const data = new FormData(form);

    const type = isOperator
      ? "operator_interest"
      : isSpecificTour
        ? "tour_interest"
        : "custom_request";

    const interestNote =
      interests.length > 0 ? `Interests: ${interests.join(", ")}. ` : "";
    const detailsFromForm = String(data.get("details") || "");

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          name: String(data.get("name") || ""),
          email: String(data.get("email") || ""),
          phone: String(data.get("phone") || ""),
          travelDate: String(data.get("date") || travelDate || ""),
          tourSlug: selectedTour?.slug,
          tourTitle: selectedTour?.title,
          groupSize: data.get("groupSize") || undefined,
          pickup: String(data.get("pickup") || ""),
          details: `${interestNote}${detailsFromForm}`.trim(),
          joinGroup,
          businessName: String(data.get("business") || ""),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error || "Could not save your request.");
      }

      setSubmitted(true);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Could not save your request. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const departureSummary = (() => {
    if (
      selectedTour &&
      "departsLabel" in selectedTour &&
      typeof selectedTour.departsLabel === "string"
    ) {
      return selectedTour.departsLabel;
    }
    if (hasAdvanceDate) return formatDisplayDate(travelDate);
    return selectedTour?.timeLabel || "Date flexible";
  })();

  if (submitted) {
    return (
      <main className="flex-1 bg-[linear-gradient(180deg,var(--mist)_0%,var(--paper)_40%)]">
        <div className="mx-auto max-w-2xl px-5 py-28 sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-skyline">
            {launchCity.name}
          </p>
          <h1 className="mt-3 font-display text-4xl text-ink">
            {isOperator
              ? "Operator interest received"
              : selectedTour
                ? `Interest sent for ${selectedTour.title}`
                : "Your request is in"}
          </h1>
          <p className="mt-4 text-ink-soft">
            {isOperator
              ? "Your operator interest is saved. We'll follow up about verification and New York listings."
              : selectedTour
                ? `Your interest is captured for ${formatDisplayDate(travelDate)}. It now feeds the live demand board as real traveller activity.`
                : `Your request for ${formatDisplayDate(travelDate)} is captured and will show up in live demand as travellers keep adding requests.`}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/tours"
              className="bg-amber px-5 py-3 text-sm font-semibold text-ink hover:bg-amber-deep"
            >
              Browse tours by date
            </Link>
            <Link
              href="/"
              className="border border-ink/20 px-5 py-3 text-sm font-semibold text-ink hover:bg-white"
            >
              Back home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-[linear-gradient(180deg,var(--mist)_0%,var(--paper)_35%)]">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-24 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:py-28">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-skyline">
            {launchCity.name} ·{" "}
            {isSpecificTour
              ? "Join this tour"
              : hasAdvanceDate
                ? "Plan ahead"
                : "Live"}
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-md text-ink-soft">
            {isOperator
              ? "Tell us about your tours, transfers, or shore excursions. We'll open operator onboarding as we verify New York providers."
              : isSpecificTour
                ? "Leave your details to claim a spot or get a quote for this listing on your chosen date."
                : "Planning months ahead is fine. Pick your date, describe what you want, and operators quote you."}
          </p>

          {selectedTour ? (
            <div className="mt-8 border border-ink/10 bg-white/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-deep">
                Selected listing
              </p>
              <p className="mt-2 font-display text-2xl text-ink">
                {selectedTour.title}
              </p>
              <p className="mt-2 text-sm text-ink-soft">
                {departureSummary} · {selectedTour.duration} · Meet at{" "}
                {selectedTour.meetup} · From {selectedTour.priceFrom}
              </p>
              <Link
                href={`/request?date=${travelDate}`}
                className="mt-4 inline-block text-sm font-medium text-skyline underline-offset-2 hover:underline"
              >
                Or request a different custom tour for this date
              </Link>
            </div>
          ) : null}
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 border border-ink/10 bg-white/80 p-6 shadow-[0_20px_60px_rgba(12,27,42,0.06)] sm:p-8"
        >
          {selectedTour ? (
            <input type="hidden" name="tourSlug" value={selectedTour.slug} />
          ) : null}
          <input type="hidden" name="travelDate" value={travelDate} />

          {isOperator ? (
            <>
              <Field label="Business name" name="business" required />
              <Field label="Contact name" name="name" required />
              <Field label="Email" name="email" type="email" required />
              <Field label="Phone / WhatsApp" name="phone" type="tel" required />
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink">
                  What do you offer?
                </span>
                <textarea
                  name="details"
                  required
                  rows={5}
                  className="w-full border border-ink/15 bg-paper/60 px-3 py-2.5 text-ink outline-none transition focus:border-skyline"
                  placeholder="Group tours, private drivers, airport transfers, cruise shore excursions…"
                />
              </label>
            </>
          ) : isSpecificTour && selectedTour ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Your name" name="name" required />
                <Field label="Email" name="email" type="email" required />
              </div>
              <Field label="Phone / WhatsApp" name="phone" type="tel" required />
              <Field
                label="Tour date"
                name="date"
                type="date"
                defaultValue={travelDate}
                required
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="How many people?"
                  name="groupSize"
                  type="number"
                  min={1}
                  defaultValue={1}
                  required
                />
                <Field
                  label="Pickup / where are you staying?"
                  name="pickup"
                  placeholder="Hotel name, cruise terminal, neighbourhood…"
                  required
                />
              </div>

              {selectedTour.joinable ? (
                <label className="flex items-start gap-3 text-sm text-ink-soft">
                  <input
                    type="checkbox"
                    checked={joinGroup}
                    onChange={(event) => setJoinGroup(event.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    Join the shared group for this tour if a seat is available.
                  </span>
                </label>
              ) : null}

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink">
                  Anything the operator should know?
                </span>
                <textarea
                  name="details"
                  rows={4}
                  defaultValue={`I'd like to join: ${selectedTour.title} on ${formatDisplayDate(travelDate)}. ${selectedTour.summary}`}
                  className="w-full border border-ink/15 bg-paper/60 px-3 py-2.5 text-ink outline-none transition focus:border-skyline"
                  placeholder="Accessibility needs, luggage, preferred language…"
                />
              </label>
            </>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Your name" name="name" required />
                <Field label="Email" name="email" type="email" required />
              </div>
              <Field label="Phone / WhatsApp" name="phone" type="tel" />
              <div className="grid gap-4 sm:grid-cols-3">
                <Field
                  label="Preferred date"
                  name="date"
                  type="date"
                  defaultValue={travelDate}
                  required
                />
                <Field
                  label="Group size"
                  name="groupSize"
                  type="number"
                  min={1}
                  defaultValue={2}
                  required
                />
                <Field
                  label="Hours available"
                  name="hoursAvailable"
                  type="number"
                  min={1}
                  defaultValue={4}
                  required
                />
              </div>
              <Field
                label="Must be back by (optional)"
                name="returnBy"
                type="time"
              />
              <Field
                label="Pickup point"
                name="pickup"
                placeholder="Hotel, cruise terminal, JFK, Midtown…"
                required
              />

              <fieldset>
                <legend className="mb-3 text-sm font-medium text-ink">
                  Interests
                </legend>
                <div className="flex flex-wrap gap-2">
                  {tourInterests.map((interest) => {
                    const active = interests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`border px-3 py-1.5 text-sm transition ${
                          active
                            ? "border-ink bg-ink text-white"
                            : "border-ink/20 bg-paper/50 text-ink-soft hover:border-ink/40"
                        }`}
                      >
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <label className="flex items-start gap-3 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={joinGroup}
                  onChange={(event) => setJoinGroup(event.target.checked)}
                  className="mt-1"
                />
                <span>
                  I&apos;m open to joining a shared group if it lowers the price
                  or fills seats.
                </span>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink">
                  Describe the tour you want
                </span>
                <textarea
                  name="details"
                  required
                  rows={5}
                  className="w-full border border-ink/15 bg-paper/60 px-3 py-2.5 text-ink outline-none transition focus:border-skyline"
                  placeholder="Example: Half-day Lower Manhattan walk, food stops welcome, back to hotel by 4pm."
                />
              </label>
            </>
          )}

          {submitError ? (
            <p className="text-sm text-rose-700">{submitError}</p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="group mt-2 flex w-full items-center justify-center gap-2 bg-amber px-6 py-4 text-base font-semibold tracking-wide text-ink shadow-[0_10px_24px_rgba(212,160,23,0.28)] transition duration-200 hover:-translate-y-0.5 hover:bg-amber-deep hover:shadow-[0_14px_28px_rgba(184,134,11,0.35)] active:translate-y-0 active:shadow-none disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            <span>
              {submitting
                ? "Saving your request…"
                : isOperator
                  ? "Submit operator interest"
                  : isSpecificTour
                    ? "Send interest for this tour"
                    : "Send my tour request"}
            </span>
            {!submitting ? (
              <span
                aria-hidden
                className="translate-x-0 transition duration-200 group-hover:translate-x-1"
              >
                →
              </span>
            ) : null}
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  min,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  min?: number;
  defaultValue?: string | number;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-ink">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        min={min}
        defaultValue={defaultValue}
        className="w-full border border-ink/15 bg-paper/60 px-3 py-2.5 text-ink outline-none transition focus:border-skyline"
      />
    </label>
  );
}
