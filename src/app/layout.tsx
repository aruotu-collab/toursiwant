import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, Manrope } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
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

export const metadata: Metadata = {
  title: {
    default: "ToursIWant — The live market for tours you want",
    template: "%s · ToursIWant",
  },
  description:
    "The tourism intelligence platform for New York tours. See what's being planned, request quotes, and join groups — today or months ahead.",
  metadataBase: new URL("https://toursiwant.com"),
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
      </body>
    </html>
  );
}
