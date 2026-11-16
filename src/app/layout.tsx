import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import SmoothScroll from "@/components/layout/SmoothScroll";
import OnboardingModal from "@/components/onboarding/OnboardingModal";

export const metadata: Metadata = {
  title: "Rattafy — Visual Exam-Prep & Flashcard Study Environment",
  description:
    "Turn giant Word docs and past papers into structured, unit-wise swipeable cards. Built for high-retention university exam mastery.",
  applicationName: "Rattafy",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Rattafy",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-black text-foreground antialiased selection:bg-accent-blue/30 selection:text-white">
        <SmoothScroll>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
          </div>
          <OnboardingModal />
        </SmoothScroll>
      </body>
    </html>
  );
}
