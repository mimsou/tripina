"use client";

import dynamic from "next/dynamic";
import gsap from "gsap";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { HeroMapPin } from "./hero-map-pins";
import { HERO_MARKERS, heroJourneyPathD } from "./hero-markers-data";
import { HeroTerrainFallback } from "./hero-terrain-fallback";

const TerrainScene = dynamic(
  () => import("./terrain-scene").then((m) => m.TerrainScene),
  { ssr: false, loading: () => <HeroTerrainFallback /> },
);

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<(HTMLDivElement | null)[]>([]);
  const journeyPathRef = useRef<SVGPathElement>(null);

  useLayoutEffect(() => {
    const reduce =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (!reduce) {
        const chars = titleRef.current?.querySelectorAll(".hero-char");
        if (chars && chars.length) {
          gsap.fromTo(
            chars,
            { opacity: 0, y: 48 },
            {
              opacity: 1,
              y: 0,
              stagger: 0.028,
              duration: 0.75,
              ease: "power3.out",
            },
          );
        }
        if (subRef.current) {
          gsap.fromTo(
            subRef.current,
            { opacity: 0, y: 16 },
            {
              opacity: 1,
              y: 0,
              duration: 0.55,
              delay: 0.35,
              ease: "power3.out",
            },
          );
        }
        if (ctaRef.current) {
          gsap.fromTo(
            ctaRef.current,
            { opacity: 0, y: 12 },
            {
              opacity: 1,
              y: 0,
              duration: 0.45,
              delay: 0.55,
              ease: "power3.out",
            },
          );
        }
        markersRef.current.forEach((m, i) => {
          if (m) {
            gsap.fromTo(
              m,
              { scale: 0, opacity: 0 },
              {
                scale: 1,
                opacity: 1,
                duration: 0.5,
                delay: 0.4 + i * 0.12,
                ease: "back.out(1.6)",
              },
            );
            const pulse = m.querySelector(".pulse");
            if (pulse) {
              gsap.to(pulse, {
                scale: 1.55,
                opacity: 0,
                duration: 2.2,
                repeat: -1,
                ease: "power1.out",
              });
            }
          }
        });

        const path = journeyPathRef.current;
        if (path) {
          const len = path.getTotalLength();
          path.style.strokeDasharray = `${len}`;
          path.style.strokeDashoffset = `${len}`;
          gsap.to(path, {
            strokeDashoffset: 0,
            duration: 1.35,
            delay: 0.65,
            ease: "power2.inOut",
          });
        }
      } else {
        journeyPathRef.current?.style.setProperty("stroke-dasharray", "none");
        journeyPathRef.current?.style.setProperty("stroke-dashoffset", "0");
      }
    }, sectionRef);

    return () => {
      ctx.revert();
    };
  }, []);

  const title = "Plan your next great escape.";
  const pathD = heroJourneyPathD();

  return (
    <section
      ref={sectionRef}
      className="relative isolate min-h-[min(85vh,920px)] overflow-hidden px-4 pb-24 pt-20 sm:px-6 sm:pb-32 sm:pt-28"
    >
      <span className="sr-only">
        Illustrative portraits on the map are stock photos for demonstration.
      </span>

      <div className="pointer-events-none absolute inset-0 z-0">
        <TerrainScene />
      </div>

      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_85%_60%_at_50%_35%,rgba(248,249,250,0.55)_0%,transparent_55%)] dark:bg-[radial-gradient(ellipse_85%_55%_at_50%_32%,rgba(28,35,51,0.5)_0%,transparent_58%)]" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-transparent via-terrain-mist/55 to-terrain-mist dark:via-terrain-night/45 dark:to-terrain-night" />

      <div className="relative z-[2] mx-auto max-w-5xl text-center">
        <h1
          ref={titleRef}
          className="font-display text-4xl font-black leading-[1.05] tracking-tight text-terrain-night dark:text-terrain-mist sm:text-6xl md:text-7xl"
        >
          {title.split("").map((c, i) => (
            <span key={`${c}-${i}`} className="hero-char inline-block will-change-transform">
              {c === " " ? "\u00a0" : c}
            </span>
          ))}
        </h1>
        <p
          ref={subRef}
          className="mx-auto mt-6 max-w-xl text-lg text-foreground/75 sm:text-xl"
        >
          Build trips together. Share the journey. Live the experience.
        </p>
        <div ref={ctaRef} className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/trip/new">
            <Button variant="primary" className="group min-w-[180px] text-base">
              Start building
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Button>
          </Link>
          <Link href="/explore">
            <Button variant="outline" className="min-w-[140px] text-base">
              Explore trips
            </Button>
          </Link>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 z-[1] hidden md:block">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            ref={journeyPathRef}
            d={pathD}
            fill="none"
            stroke="rgb(232, 93, 4)"
            strokeOpacity={0.28}
            strokeWidth={0.35}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            className="dark:stroke-[rgb(251,133,0)]"
          />
        </svg>
        {HERO_MARKERS.map((marker, i) => (
          <HeroMapPin
            key={`${marker.label}-${i}`}
            ref={(el) => {
              markersRef.current[i] = el;
            }}
            marker={marker}
            index={i}
          />
        ))}
      </div>
    </section>
  );
}
