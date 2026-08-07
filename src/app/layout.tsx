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
    default: "ToursIWant — Start with a trip that already works",
    template: "%s · ToursIWant",
  },
  description:
    "Proven trip templates for countries, multi-country routes, and right-now plans from your hotel. Make them yours — then book optional experiences.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "ToursIWant",
    title: "ToursIWant — Start with a trip that already works",
    description:
      "Proven trip templates for countries, multi-country routes, and right-now plans from your hotel. Make them yours — then book optional experiences.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ToursIWant — Start with a trip that already works",
    description:
      "Proven trip templates for countries, multi-country routes, and right-now plans from your hotel. Make them yours — then book optional experiences.",
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
