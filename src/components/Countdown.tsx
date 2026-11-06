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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
      {items.map((item) => (
        <div key={item.label} className="bg-stone-100 rounded-2xl p-6 border border-stone-200">
          <div className="text-4xl font-bold text-[#1F2C3F]">{String(item.value).padStart(2, "0")}</div>
          <div className="text-sm text-[#A1532D] mt-1">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
