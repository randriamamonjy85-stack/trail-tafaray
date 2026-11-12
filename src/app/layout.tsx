import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SponsorsPublic from "@/components/sponsors/SponsorsPublic";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Trail Tafaray | Association",
  description:
    "Site officiel de l'Association Trail Tafaray. Inscriptions en ligne pour les courses de trail et VTT.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${playfair.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-transparent text-stone-900 antialiased">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SponsorsPublic />
        <SiteFooter />
      </body>
    </html>
  );
}
