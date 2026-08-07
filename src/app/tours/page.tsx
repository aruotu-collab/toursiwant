import { permanentRedirect } from "next/navigation";

/** Legacy Find tours — product is now trip templates. */
export default function ToursPage() {
  permanentRedirect("/");
}
