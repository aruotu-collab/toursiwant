import { redirect } from "next/navigation";

/** Scorecard-first product: home opens the destination scorecard hub. */
export default function HomePage() {
  redirect("/scorecard");
}
