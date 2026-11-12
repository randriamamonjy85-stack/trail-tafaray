"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SponsorRecord } from "@/lib/sponsors/logic";
import { pickRotatedSponsor, sponsorsForPopup } from "@/lib/sponsors/logic";

const SHOWN_KEY = "tt_sponsor_popup_shown";
const ROT_KEY = "tt_sponsor_popup_rot";

export default function SponsorPopup({ sponsors }: { sponsors: SponsorRecord[] }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<SponsorRecord | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    try {
      sessionStorage.setItem(SHOWN_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SHOWN_KEY) === "1") return;
    } catch {
      /* ignore */
    }
    const candidates = sponsorsForPopup(sponsors);
    if (!candidates.length) return;

    let rot = 0;
    try {
      rot = parseInt(sessionStorage.getItem(ROT_KEY) || "0", 10) || 0;
    } catch {
      rot = 0;
    }
    const picked = pickRotatedSponsor(candidates, rot);
    if (!picked) return;

    const t = window.setTimeout(() => {
      setCurrent(picked);
      setOpen(true);
      try {
        sessionStorage.setItem(ROT_KEY, String(rot + 1));
      } catch {
        /* ignore */
      }
      fetch("/api/sponsors/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: picked.id, kind: "view" }),
      }).catch(() => {});
    }, 2500);

    return () => window.clearTimeout(t);
  }, [sponsors]);

  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open || !current) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Publicité ${current.nom}`}
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#0f1b2d]/70 backdrop-blur-sm"
        aria-label="Fermer la publicité"
        onClick={close}
      />
      <div className="relative z-10 w-full max-w-sm bg-gradient-to-b from-white to-[#fffaf3] rounded-3xl shadow-2xl border border-[#d9a441]/25 overflow-hidden">
        <div className="flex justify-between items-center px-5 py-3 border-b border-[#b7793d]/10">
          <span className="text-[11px] uppercase tracking-[0.2em] text-[#b7793d] font-semibold font-[family-name:var(--font-display)]">Sponsor</span>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={close}
            className="text-sm font-medium text-stone-600 hover:text-[#0f1b2d] px-2 py-1 rounded-lg"
          >
            Fermer ✕
          </button>
        </div>
        <div className="p-6 flex flex-col items-center gap-4">
          {current.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={current.image_url} alt={current.nom} className="max-h-28 object-contain" />
          )}
          <p className="font-semibold text-[#0f1b2d] text-center text-xl font-[family-name:var(--font-display)] tracking-tight">
            {current.nom}
          </p>
          {current.site_url && (
            <a
              href={current.site_url}
              target="_blank"
              rel="noopener sponsored"
              className="inline-block bg-gradient-to-r from-[#b7793d] to-[#d9a441] text-[#0f1b2d] text-sm font-semibold px-6 py-2.5 rounded-full hover:brightness-110 shadow-lg shadow-black/10"
              onClick={() => {
                fetch("/api/sponsors/track", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id: current.id, kind: "click" }),
                }).catch(() => {});
              }}
            >
              Découvrir
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
