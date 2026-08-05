import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, Manrope } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { VisitBeacon } from "@/components/VisitBeacon";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://www.toursiwant.com";

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
const searchConsoleVerification =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ToursIWant — We compare the tours. You choose the experience.",
    template: "%s · ToursIWant",
  },
  description:
    "Tour Intelligence: we analyse Viator inventory and show which tours best fit your budget, travellers and priorities — then you book with confidence.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "ToursIWant",
    title: "ToursIWant — We compare the tours. You choose the experience.",
    description:
      "Tell us what matters. We’ll compare available tours and show the strongest choices.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ToursIWant — We compare the tours. You choose the experience.",
    description:
      "Tell us what matters. We’ll compare available tours and show the strongest choices.",
  },
  verification: searchConsoleVerification
    ? { google: searchConsoleVerification }
    : undefined,
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full`}
    >
      <body className="min-h-full bg-[#070f18] font-sans text-white antialiased">
        <div className="flex min-h-full flex-1 flex-col">{children}</div>
        <VisitBeacon />
        {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      </body>
    </html>
  );
}
