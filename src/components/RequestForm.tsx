"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { launchCity } from "@/lib/cities";
import {
  formatDisplayDate,
  getSampleTour,
  getTourDeparture,
  toDateKey,
  type SampleTour,
} from "@/lib/sample-tours";
import { tourInterests, type TourInterest } from "@/lib/tour-types";
import type { CatalogTour } from "@/lib/us-tour-catalog";

export default function RequestForm() {
  const searchParams = useSearchParams();
  const isOperator = searchParams.get("intent") === "operator";
  const stayIntent = searchParams.get("intent") === "stay";
  const tourSlug = searchParams.get("tour");
  const dateParam = searchParams.get("date");
  const suggestedParam = searchParams.get("suggested");
  const todayKey = toDateKey(new Date());
  const initialDate = dateParam || suggestedParam || todayKey;

  const starterTour = tourSlug
    ? getTourDeparture(tourSlug, initialDate) || getSampleTour(tourSlug)
    : undefined;

  const [operatorTour, setOperatorTour] = useState<CatalogTour | null>(null);

  useEffect(() => {
    if (!tourSlug || starterTour) {
      setOperatorTour(null);
      return;
    }
    let cancelled = false;
    fetch("/api/listings")
      .then((r) => r.json())
      .then((data: { tours?: CatalogTour[] }) => {
        if (cancelled) return;
        setOperatorTour(
          (data.tours || []).find((tour) => tour.slug === tourSlug) || null,
        );
      })
      .catch(() => {
        if (!cancelled) setOperatorTour(null);
      });
    return () => {
      cancelled = true;
    };
  }, [tourSlug, starterTour]);

  const selectedTour: SampleTour | CatalogTour | undefined =
    starterTour || operatorTour || undefined;
  const isSpecificTour = Boolean(selectedTour) && !isOperator;
  const hasLockedBrowseDate = Boolean(dateParam) && !suggestedParam;
  const suggestedFromBrowse = Boolean(suggestedParam) || Boolean(dateParam);

  const [chosenDate, setChosenDate] = useState(initialDate);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [interests, setInterests] = useState<TourInterest[]>(
    starterTour ? [starterTour.interest] : [],
  );
  const [joinGroup, setJoinGroup] = useState(starterTour?.joinable ?? true);
  const [needStay, setNeedStay] = useState(stayIntent);
  const [saveAccount, setSaveAccount] = useState(true);
  const [magicUrl, setMagicUrl] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState("");

  useEffect(() => {
    if (!selectedTour) return;
    setInterests((current) =>
      current.length ? current : [selectedTour.interest as TourInterest],
    );
    setJoinGroup(selectedTour.joinable);
  }, [selectedTour]);

  const title = useMemo(() => {
    if (isOperator) return "Join ToursIWant as a US tour operator";
    if (stayIntent && !selectedTour) return "Stay Near Your Tour";
    if (selectedTour) return `I want: ${selectedTour.title}`;
    if (hasLockedBrowseDate)
      return `Request a tour for ${formatDisplayDate(chosenDate)}`;
    return "Request the tour you want";
  }, [
    chosenDate,
    hasLockedBrowseDate,
    isOperator,
    selectedTour,
    stayIntent,
  ]);

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
    const name = String(data.get("name") || "");
    const email = String(data.get("email") || "");

    const type = isOperator
      ? "operator_interest"
      : stayIntent && !isSpecificTour
        ? "accommodation_request"
        : isSpecificTour
          ? "tour_interest"
          : "custom_request";

    const interestNote =
      interests.length > 0 ? `Interests: ${interests.join(", ")}. ` : "";
    const detailsFromForm = String(data.get("details") || "");
    const accommodationNotes = String(data.get("accommodationNotes") || "");

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          name,
          email,
          phone: String(data.get("phone") || ""),
          travelDate: String(data.get("date") || chosenDate || ""),
          tourSlug: selectedTour?.slug,
          tourTitle: selectedTour?.title,
          groupSize: data.get("groupSize") || undefined,
          pickup: String(data.get("pickup") || ""),
          details: `${interestNote}${detailsFromForm}`.trim(),
          joinGroup,
          businessName: String(data.get("business") || ""),
          needAccommodation: needStay || type === "accommodation_request",
          accommodationNotes,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error || "Could not save your request.");
      }

      setSubmittedEmail(email);

      if (!isOperator && saveAccount && email) {
        const authRes = await fetch("/api/auth/magic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            name,
            role: "traveller",
            nextPath: "/?menu=account",
          }),
        });
        if (authRes.ok) {
          const authPayload = (await authRes.json()) as {
            magicUrl?: string;
            emailed?: boolean;
          };
          if (authPayload.magicUrl) setMagicUrl(authPayload.magicUrl);
        }
      }

      if (isOperator && email) {
        const authRes = await fetch("/api/auth/magic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            name,
            role: "operator",
            nextPath: "/operator",
          }),
        });
        if (authRes.ok) {
          const authPayload = (await authRes.json()) as { magicUrl?: string };
          if (authPayload.magicUrl) setMagicUrl(authPayload.magicUrl);
        }
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
    return selectedTour?.timeLabel || "Schedule confirmed with operator";
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
                : stayIntent
                  ? "Stay request received"
                  : "Your request is in"}
          </h1>
          <p className="mt-4 text-ink-soft">
            {isOperator
              ? "Your operator interest is saved. Use the magic link below (or your email) to open the lead inbox."
              : selectedTour
                ? `Your interest is captured for ${formatDisplayDate(chosenDate)}.${needStay ? " We also noted that you need a stay near the tour." : ""} When an operator replies, you’ll get an email — and you’ll see it in Account.`
                : `Your request for ${formatDisplayDate(chosenDate)} is captured.${needStay ? " Accommodation interest is included." : ""} When an operator replies, you’ll get an email — and you’ll see it in Account.`}
          </p>

          {saveAccount || isOperator ? (
            <div className="mt-6 border border-ink/10 bg-white/70 p-5">
              <p className="font-display text-xl text-ink">
                {isOperator ? "Open your operator inbox" : "Save & track this request"}
              </p>
              <p className="mt-2 text-sm text-ink-soft">
                {magicUrl
                  ? `Click to activate your account for ${submittedEmail}.`
                  : `If email is configured, check ${submittedEmail || "your inbox"} for a magic link.`}
              </p>
              {magicUrl ? (
                <a
                  href={magicUrl}
                  className="mt-4 inline-flex bg-amber px-5 py-3 text-sm font-semibold text-ink hover:bg-amber-deep"
                >
                  {isOperator ? "Enter operator dashboard →" : "Activate account →"}
                </a>
              ) : (
                <Link
                  href={isOperator ? "/join?role=operator" : "/join"}
                  className="mt-4 inline-flex border border-ink/20 px-5 py-3 text-sm font-semibold text-ink hover:bg-white"
                >
                  Get a new sign-in link
                </Link>
              )}
            </div>
          ) : null}

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
              : stayIntent
                ? "Stay near"
                : suggestedFromBrowse
                  ? "Plan ahead"
                  : "Live"}
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-md text-ink-soft">
            {isOperator
              ? "Tell us about your tours, transfers, or shore excursions. After you submit, open the lead inbox with a magic link."
              : stayIntent
                ? "Need a hotel or short stay close to your meetup point? Tell us dates and neighbourhood — partners quote stays near the experience."
                : isSpecificTour
                  ? "Leave your details to claim a spot or get a quote. Optionally add Stay Near Your Tour in one step."
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
                href={`/request?tour=${tourSlug || ""}`}
                className="mt-4 inline-block text-sm font-medium text-skyline underline-offset-2 hover:underline"
              >
                Or request a different custom tour
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
          <input type="hidden" name="travelDate" value={chosenDate} />

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
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink">
                  Your travel date
                </span>
                <span className="mb-2 block text-xs text-ink-soft">
                  {suggestedFromBrowse
                    ? `Suggested from browse (${formatDisplayDate(initialDate)}) — change freely to any day you want.`
                    : "Pick the day you actually want to go. Not locked to the browse filter."}
                </span>
                <input
                  name="date"
                  type="date"
                  required
                  min={todayKey}
                  value={chosenDate}
                  onChange={(e) => setChosenDate(e.target.value)}
                  className="w-full border border-amber/40 bg-amber/10 px-3 py-2.5 text-ink outline-none transition focus:border-amber-deep"
                />
              </label>
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

              <StayNearFields
                needStay={needStay}
                setNeedStay={setNeedStay}
                meetup={selectedTour.meetup}
              />

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink">
                  Anything the operator should know?
                </span>
                <textarea
                  name="details"
                  rows={4}
                  key={chosenDate}
                  defaultValue={`I'd like to join: ${selectedTour.title} on ${formatDisplayDate(chosenDate)}. ${selectedTour.summary}`}
                  className="w-full border border-ink/15 bg-paper/60 px-3 py-2.5 text-ink outline-none transition focus:border-skyline"
                  placeholder="Accessibility needs, luggage, preferred language…"
                />
              </label>
            </>
          ) : stayIntent ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Your name" name="name" required />
                <Field label="Email" name="email" type="email" required />
              </div>
              <Field label="Phone / WhatsApp" name="phone" type="tel" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Check-in / tour date"
                  name="date"
                  type="date"
                  defaultValue={chosenDate}
                  required
                />
                <Field
                  label="Guests"
                  name="groupSize"
                  type="number"
                  min={1}
                  defaultValue={2}
                  required
                />
              </div>
              <Field
                label="Preferred neighbourhood / meetup"
                name="pickup"
                placeholder="Near Battery Park, Midtown, Brooklyn Bridge…"
                required
              />
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink">
                  Stay preferences
                </span>
                <textarea
                  name="accommodationNotes"
                  required
                  rows={4}
                  className="w-full border border-ink/15 bg-paper/60 px-3 py-2.5 text-ink outline-none transition focus:border-skyline"
                  placeholder="Hotel vs apartment, budget, nights, walk to meetup…"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink">
                  Related tour (optional)
                </span>
                <textarea
                  name="details"
                  rows={3}
                  className="w-full border border-ink/15 bg-paper/60 px-3 py-2.5 text-ink outline-none transition focus:border-skyline"
                  placeholder="Which tour or experience you’re pairing with the stay…"
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
                  defaultValue={chosenDate}
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

              <StayNearFields needStay={needStay} setNeedStay={setNeedStay} />

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

          {!isOperator ? (
            <label className="flex items-start gap-3 border-t border-ink/10 pt-5 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={saveAccount}
                onChange={(e) => setSaveAccount(e.target.checked)}
                className="mt-1"
              />
              <span>
                <strong className="font-semibold text-ink">
                  Save with email magic link
                </strong>{" "}
                — track quotes without a password. Browse stays free; sign in
                after you send the request.
              </span>
            </label>
          ) : null}

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
                  : stayIntent
                    ? "Request stay near tour"
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

function StayNearFields({
  needStay,
  setNeedStay,
  meetup,
}: {
  needStay: boolean;
  setNeedStay: (value: boolean) => void;
  meetup?: string;
}) {
  return (
    <div className="space-y-3 border border-dashed border-skyline/30 bg-mist/40 p-4">
      <label className="flex items-start gap-3 text-sm text-ink">
        <input
          type="checkbox"
          checked={needStay}
          onChange={(event) => setNeedStay(event.target.checked)}
          className="mt-1"
        />
        <span>
          <span className="font-semibold">Stay Near Your Tour</span>
          <span className="block text-ink-soft">
            Also get quotes for a hotel or short stay near{" "}
            {meetup || "the meetup point"}.
          </span>
        </span>
      </label>
      {needStay ? (
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ink">
            Stay notes
          </span>
          <textarea
            name="accommodationNotes"
            rows={3}
            required
            className="w-full border border-ink/15 bg-paper/60 px-3 py-2.5 text-ink outline-none transition focus:border-skyline"
            placeholder="Nights needed, budget, hotel vs apartment, walkable to meetup…"
          />
        </label>
      ) : null}
    </div>
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
