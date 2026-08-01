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
    default: "ToursIWant — The live market for tours you want",
    template: "%s · ToursIWant",
  },
  description:
    "The tourism intelligence platform for New York tours. See what's being planned, request quotes, and join groups — today or months ahead.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "ToursIWant",
    title: "ToursIWant — The live market for tours you want",
    description:
      "The tourism intelligence platform for New York tours. See what's being planned, request quotes, and join groups — today or months ahead.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ToursIWant — The live market for tours you want",
    description:
      "The tourism intelligence platform for New York tours. See what's being planned, request quotes, and join groups — today or months ahead.",
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
      <body className="min-h-full bg-paper font-sans text-ink antialiased">
        <SiteHeader />
        <div className="flex min-h-full flex-1 flex-col">{children}</div>
        <SiteFooter />
        <VisitBeacon />
        {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      </body>
    </html>
  );
}
