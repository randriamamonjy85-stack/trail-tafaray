"use client";

import Image from "next/image";
import { useState } from "react";

const links = [
  { href: "/evenements", label: "Événements" },
  { href: "/courses", label: "Courses" },
  { href: "/inscription", label: "Inscription" },
  { href: "/resultats", label: "Résultats" },
  { href: "/galerie", label: "Galerie" },
  { href: "/documents", label: "Documents" },
  { href: "/partenaires", label: "Partenaires" },
  { href: "/contact", label: "Contact" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-stone-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <a href="/" className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Image
              src="/logo-tafaray.png"
              alt="Logo Trail Tafaray"
              width={40}
              height={40}
              className="h-9 w-auto shrink-0"
            />
            <span className="text-lg sm:text-xl font-bold tracking-tight text-[#1F2C3F] truncate">
              Trail Tafaray
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-6 text-sm">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-stone-700 hover:text-[#A1532D] transition-colors relative after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-[#A1532D] hover:after:w-full after:transition-all"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="/inscription"
              className="hidden sm:inline-flex bg-[#A1532D] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#8a4526] transition"
            >
              S&apos;inscrire
            </a>
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg border border-stone-200 text-[#1F2C3F]"
              aria-label="Menu"
              onClick={() => setOpen((v) => !v)}
            >
              <span className="block w-5 space-y-1.5">
                <span className={`block h-0.5 bg-current transition ${open ? "rotate-45 translate-y-2" : ""}`} />
                <span className={`block h-0.5 bg-current transition ${open ? "opacity-0" : ""}`} />
                <span className={`block h-0.5 bg-current transition ${open ? "-rotate-45 -translate-y-2" : ""}`} />
              </span>
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-stone-100 bg-white px-4 py-3 space-y-1 shadow-md">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="block py-2.5 text-stone-800 hover:text-[#A1532D] font-medium"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <a
            href="/inscription"
            className="block mt-2 text-center bg-[#A1532D] text-white py-2.5 rounded-full font-medium"
            onClick={() => setOpen(false)}
          >
            S&apos;inscrire
          </a>
        </div>
      )}
    </header>
  );
}
