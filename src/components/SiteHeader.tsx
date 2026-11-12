"use client";

import Image from "next/image";
import { useState } from "react";

const links = [
  { href: "/evenements", label: "Événements" },
  { href: "/courses", label: "Courses" },
  { href: "/inscription", label: "Inscription" },
  { href: "/resultats", label: "Résultats" },
  { href: "/certificat", label: "Mon certificat" },
  { href: "/galerie", label: "Galerie" },
  { href: "/documents", label: "Documents" },
  { href: "/partenaires", label: "Partenaires" },
  { href: "/contact", label: "Contact" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0f1b2d]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-[72px]">
          <a href="/" className="flex items-center gap-3 min-w-0 group">
            <div className="rounded-xl bg-white/10 p-1.5 ring-1 ring-white/15 group-hover:bg-white/15 transition">
              <Image
                src="/logo-tafaray.png"
                alt="Logo Trail Tafaray"
                width={40}
                height={40}
                className="h-8 w-auto shrink-0"
              />
            </div>
            <span className="text-lg sm:text-xl font-semibold tracking-tight text-white truncate">
              Trail Tafaray
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-7 text-sm">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-stone-200/90 hover:text-white transition-colors relative after:absolute after:left-0 after:-bottom-1.5 after:h-px after:w-0 after:bg-[#d9a441] hover:after:w-full after:transition-all"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="/inscription"
              className="hidden sm:inline-flex bg-gradient-to-r from-[#b7793d] to-[#d9a441] text-[#0f1b2d] px-5 py-2.5 rounded-full text-sm font-semibold hover:brightness-110 transition shadow-lg shadow-black/20"
            >
              S&apos;inscrire
            </a>
            <button
              type="button"
              className="lg:hidden p-2.5 rounded-xl border border-white/15 text-white bg-white/5"
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
        <div className="lg:hidden border-t border-white/10 bg-[#0f1b2d]/95 backdrop-blur-xl px-4 py-3 space-y-1">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="block py-2.5 text-stone-200 hover:text-white font-medium"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <a
            href="/inscription"
            className="block mt-3 text-center bg-gradient-to-r from-[#b7793d] to-[#d9a441] text-[#0f1b2d] py-2.5 rounded-full font-semibold"
            onClick={() => setOpen(false)}
          >
            S&apos;inscrire
          </a>
        </div>
      )}
    </header>
  );
}
