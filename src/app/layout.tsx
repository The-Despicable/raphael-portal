import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/shell/NavBar";
import { Footer } from "@/components/shell/Footer";
import { AskAiLauncher } from "@/components/assistant/AskAiLauncher";
import { env } from "@/lib/env";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

// Retained for the font utility fallback chain; not used as the primary face.
const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const SITE_TITLE = "Raphael — Open Research & Architecture Portal";
const SITE_DESCRIPTION =
  "Independent documentation of Raphael, an ambitious and unfinished AI security research project: its documented architecture, the papers behind it, its dated readiness assessment, and how to contribute or challenge it.";

export const metadata: Metadata = {
  metadataBase: env.siteUrl ? new URL(env.siteUrl) : undefined,
  title: {
    default: SITE_TITLE,
    template: `%s · Raphael Research Portal`,
  },
  description: SITE_DESCRIPTION,
  applicationName: "Raphael Research Portal",
  keywords: [
    "Raphael",
    "AI security research",
    "agent governance",
    "evidence provenance",
    "reproducibility",
    "security architecture",
  ],
  authors: [{ name: "Raphael Research Portal" }],
  openGraph: {
    type: "website",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    siteName: "Raphael Research Portal",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#04060c",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${geistMono.variable} ${geistSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-void text-ink">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:border focus:border-cyan/50 focus:bg-elevated focus:px-4 focus:py-2 focus:text-[13px] focus:text-ink"
        >
          Skip to content
        </a>
        <NavBar />
        <main id="main" className="flex-1 pt-16">
          {children}
        </main>
        <Footer />
        <AskAiLauncher />
      </body>
    </html>
  );
}