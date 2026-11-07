import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Image from "next/image";
import SiteFooter from "@/components/SiteFooter";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Trail Tafaray | Association",
  description:
    "Site officiel de l'Association Trail Tafaray. Inscriptions en ligne pour les courses de trail et VTT.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900 antialiased">
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <a href="/" className="flex items-center gap-3">
                <Image
                  src="/logo-tafaray.png"
                  alt="Logo Trail Tafaray"
                  width={40}
                  height={40}
                  className="h-10 w-auto"
                />
                <span className="text-xl font-bold tracking-tight text-[#1F2C3F]">
                  Trail Tafaray
                </span>
              </a>
              <nav className="hidden md:flex space-x-6 text-sm">
                <a href="/evenements" className="text-stone-700 hover:text-[#A1532D]">
                  Événements
                </a>
                <a href="/courses" className="text-stone-700 hover:text-[#A1532D]">
                  Courses
                </a>
                <a href="/inscription" className="text-stone-700 hover:text-[#A1532D]">
                  Inscription
                </a>
                <a href="/resultats" className="text-stone-700 hover:text-[#A1532D]">
                  Résultats
                </a>
                <a href="/galerie" className="text-stone-700 hover:text-[#A1532D]">
                  Galerie
                </a>
                <a href="/documents" className="text-stone-700 hover:text-[#A1532D]">
                  Documents
                </a>
                <a href="/partenaires" className="text-stone-700 hover:text-[#A1532D]">
                  Partenaires
                </a>
                <a href="/contact" className="text-stone-700 hover:text-[#A1532D]">
                  Contact
                </a>
              </nav>
              <a
                href="/inscription"
                className="bg-[#A1532D] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#8a4526]"
              >
                S&apos;inscrire
              </a>
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
