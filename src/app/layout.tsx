import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, Manrope } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
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
    default: "ToursIWant — The scorecard for things to do",
    template: "%s · ToursIWant",
  },
  description:
    "Rank what’s worth doing in a city with the ToursIWant Scorecard. Shortlist places, build a trip, and save it to My trips.",
  alternates: {
    canonical: "/scorecard",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: `${siteUrl}/scorecard`,
    siteName: "ToursIWant",
    title: "ToursIWant — The scorecard for things to do",
    description:
      "Rank what’s worth doing in a city with the ToursIWant Scorecard. Shortlist places, build a trip, and save it to My trips.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ToursIWant — The scorecard for things to do",
    description:
      "Rank what’s worth doing in a city with the ToursIWant Scorecard. Shortlist places, build a trip, and save it to My trips.",
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
      <body className="min-h-full max-w-full overflow-x-hidden bg-paper font-sans text-ink antialiased">
        <SiteHeader />
        <div className="flex min-h-full w-full max-w-full flex-1 flex-col overflow-x-clip">
          {children}
        </div>
        <SiteFooter />
        <VisitBeacon />
        {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      </body>
    </html>
  );
}
