"use client";

import { useEffect, useState } from "react";

export default function Countdown({ targetDate }: { targetDate: string }) {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date(targetDate).getTime();
    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTime({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  const items = [
    { label: "Jours", value: time.days },
    { label: "Heures", value: time.hours },
    { label: "Minutes", value: time.minutes },
    { label: "Secondes", value: time.seconds },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-3xl mx-auto">
      {items.map((item) => (
        <div
          key={item.label}
          className="premium-card rounded-2xl p-5 sm:p-6 text-center relative overflow-hidden"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#b7793d] via-[#d9a441] to-[#b7793d] opacity-70" />
          <div className="text-3xl sm:text-4xl font-bold text-[#0f1b2d] tracking-tight">
            {String(item.value).padStart(2, "0")}
          </div>
          <div className="text-xs sm:text-sm text-stone-500 mt-2 uppercase tracking-[0.12em]">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
}
