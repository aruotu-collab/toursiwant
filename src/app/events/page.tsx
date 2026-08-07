import { permanentRedirect } from "next/navigation";

/** Legacy events board — product is now trip templates. */
export default function EventsPage() {
  permanentRedirect("/");
}
