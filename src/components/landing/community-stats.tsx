"use client";

import { useEffect, useRef, useState } from "react";

function useCountUp(target: number, duration = 1.2) {
  const [v, setV] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(target * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return v;
}

export function CommunityStats() {
  const trips = useCountUp(12840);
  const people = useCountUp(48200);
  const km = useCountUp(920000);

  return (
    <section className="border-y border-terrain-stone/30 bg-terrain-mist py-16 dark:border-terrain-surface/40 dark:bg-terrain-night">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-4 text-center sm:grid-cols-3 sm:px-6">
        <div>
          <p className="font-display text-4xl font-black text-trail sm:text-5xl">{trips.toLocaleString()}+</p>
          <p className="mt-1 text-sm text-foreground/70">Trips planned</p>
        </div>
        <div>
          <p className="font-display text-4xl font-black text-sky sm:text-5xl">{people.toLocaleString()}+</p>
          <p className="mt-1 text-sm text-foreground/70">Adventurers</p>
        </div>
        <div>
          <p className="font-display text-4xl font-black text-summit sm:text-5xl">{km.toLocaleString()}+</p>
          <p className="mt-1 text-sm text-foreground/70">Kilometers planned</p>
        </div>
      </div>
    </section>
  );
}
