import { permanentRedirect } from "next/navigation";

/** Legacy custom request desk — product is now trip templates. */
export default function RequestPage() {
  permanentRedirect("/");
}
