"use client";

import Image from "next/image";
import { forwardRef } from "react";
import type { HeroMarkerDef } from "./hero-markers-data";

type PinProps = {
  marker: HeroMarkerDef;
  index: number;
};

export const HeroMapPin = forwardRef<HTMLDivElement, PinProps>(function HeroMapPin(
  { marker, index },
  ref,
) {
  return (
    <div
      ref={ref}
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${marker.leftPct}%`, top: `${marker.topPct}%` }}
    >
      <div className="relative flex flex-col items-center gap-1">
        <div className="relative h-12 w-12 sm:h-14 sm:w-14">
          <span
            className="pulse pointer-events-none absolute inset-[-4px] rounded-full border-2 border-trail/50"
            aria-hidden
          />
          <div className="relative h-full w-full overflow-hidden rounded-full ring-2 ring-trail/45 ring-offset-2 ring-offset-terrain-mist/80 shadow-elevated dark:ring-offset-terrain-night/80">
            <Image
              src={marker.imageSrc}
              alt=""
              fill
              className="object-cover"
              sizes="56px"
              priority={index < 2}
            />
          </div>
        </div>
        <span className="max-w-[4.5rem] truncate text-[10px] font-semibold uppercase tracking-wider text-terrain-night/70 dark:text-terrain-mist/75">
          {marker.label}
        </span>
      </div>
    </div>
  );
});
