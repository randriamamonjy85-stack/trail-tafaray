"use client";

import type { SponsorRecord } from "@/lib/sponsors/logic";

export default function SponsorBanner({ sponsors }: { sponsors: SponsorRecord[] }) {
  if (!sponsors.length) return null;

  return (
    <div className="border-t border-stone-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <p className="text-[10px] uppercase tracking-widest text-stone-400 text-center mb-3">
          Nos sponsors
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {sponsors.map((s) => {
            const inner = s.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={s.image_url}
                alt={s.nom}
                className="max-h-10 sm:max-h-12 max-w-[120px] object-contain opacity-90 hover:opacity-100 transition"
              />
            ) : (
              <span className="text-sm font-medium text-stone-600">{s.nom}</span>
            );
            return s.site_url ? (
              <a
                key={s.id}
                href={s.site_url}
                target="_blank"
                rel="noopener sponsored"
                className="inline-flex items-center justify-center"
                onClick={() => {
                  fetch("/api/sponsors/track", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: s.id, kind: "click" }),
                  }).catch(() => {});
                }}
              >
                {inner}
              </a>
            ) : (
              <div key={s.id} className="inline-flex">
                {inner}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
