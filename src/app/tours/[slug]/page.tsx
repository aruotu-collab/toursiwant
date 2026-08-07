import { permanentRedirect } from "next/navigation";

/** Legacy tour detail — product is now trip templates. */
export default function TourDetailPage() {
  permanentRedirect("/");
}
