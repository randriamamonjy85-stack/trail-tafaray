"use client";

import type { SponsorRecord } from "@/lib/sponsors/logic";

export default function SponsorBanner({ sponsors }: { sponsors: SponsorRecord[] }) {
  if (!sponsors.length) return null;

  return (
    <section className="relative border-t border-[#d9a441]/20 bg-gradient-to-r from-[#0f1b2d] via-[#16243a] to-[#0f1b2d] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(600px_120px_at_50%_0%,rgba(217,164,65,0.18),transparent_70%)]" />
      <div className="relative max-w-6xl mx-auto px-4 py-8 sm:py-10">
        <p className="text-center text-[11px] sm:text-xs uppercase tracking-[0.24em] text-[#f0c96b] font-semibold mb-6 font-[family-name:var(--font-display)]">
          Nos sponsors
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {sponsors.map((s) => {
            const inner = (
              <div className="group flex items-center justify-center min-w-[140px] sm:min-w-[160px] h-[84px] sm:h-[92px] px-5 rounded-2xl bg-white/95 border border-[#d9a441]/20 shadow-[0_10px_24px_rgba(0,0,0,0.18)] hover:shadow-[0_16px_30px_rgba(183,121,61,0.25)] hover:-translate-y-0.5 transition-all">
                {s.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.image_url}
                    alt={s.nom}
                    className="max-h-12 sm:max-h-14 max-w-[120px] object-contain"
                  />
                ) : (
                  <span className="text-sm sm:text-base font-semibold text-[#0f1b2d] text-center font-[family-name:var(--font-display)] tracking-wide">
                    {s.nom}
                  </span>
                )}
              </div>
            );
            return s.site_url ? (
              <a
                key={s.id}
                href={s.site_url}
                target="_blank"
                rel="noopener sponsored"
                className="inline-flex"
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
    </section>
  );
}
