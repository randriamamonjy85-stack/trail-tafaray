import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Image from "next/image";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Trail Tafaray | Association",
  description: "Site officiel de l'Association Trail Tafaray. Inscriptions en ligne pour les courses de trail et VTT.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900 antialiased">
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <a href="/" className="flex items-center gap-3">
                <Image src="/logo-tafaray.png" alt="Logo Trail Tafaray" width={40} height={40} className="h-10 w-auto" />
                <span className="text-xl font-bold tracking-tight text-[#1F2C3F]">Trail Tafaray</span>
              </a>
              <nav className="hidden md:flex space-x-8">
                <a href="/evenements" className="text-stone-700 hover:text-[#A1532D]">Événements</a>
                <a href="/courses" className="text-stone-700 hover:text-[#A1532D]">Courses</a>
                <a href="/inscription" className="text-stone-700 hover:text-[#A1532D]">Inscription</a>
                <a href="/resultats" className="text-stone-700 hover:text-[#A1532D]">Résultats</a>
                <a href="/partenaires" className="text-stone-700 hover:text-[#A1532D]">Partenaires</a>
                <a href="/contact" className="text-stone-700 hover:text-[#A1532D]">Contact</a>
              </nav>
              <a href="/inscription" className="bg-[#A1532D] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#8a4526]">
                S'inscrire
              </a>
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="bg-[#1F2C3F] text-stone-300 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-white font-semibold mb-4">Trail Tafaray</h3>
                <p className="text-sm">Association organisatrice d'événements trail et VTT à Anjeva, Madagascar.</p>
              </div>
              <div>
                <h4 className="text-white font-medium mb-3">Navigation</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="/evenements" className="hover:text-white">Événements</a></li>
                  <li><a href="/courses" className="hover:text-white">Courses</a></li>
                  <li><a href="/inscription" className="hover:text-white">Inscription</a></li>
                  <li><a href="/resultats" className="hover:text-white">Résultats</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-medium mb-3">Légal</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="/mentions-legales" className="hover:text-white">Mentions légales</a></li>
                  <li><a href="/confidentialite" className="hover:text-white">Politique de confidentialité</a></li>
                  <li><a href="/reglement" className="hover:text-white">Règlement</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-medium mb-3">Contact</h4>
                <p className="text-sm">Anjeva, Madagascar</p>
                <p className="text-sm mt-2">contact@trailtafaray.mg</p>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-stone-700 text-center text-sm">
              © {new Date().getFullYear()} Association Trail Tafaray. Tous droits réservés.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}