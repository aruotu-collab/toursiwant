import { permanentRedirect } from "next/navigation";

/** Legacy event ride form — product is now trip templates. */
export default function EventRidePage() {
  permanentRedirect("/");
}
