"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Compass, Map, Share2 } from "lucide-react";
import { useEffect, useRef } from "react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const steps = [
  {
    title: "Map your adventure",
    body: "Drop stops, sketch routes, and feel the terrain before you go.",
    icon: Map,
  },
  {
    title: "Invite your crew",
    body: "Share a magic link, email, or WhatsApp — approvals stay in sync.",
    icon: Share2,
  },
  {
    title: "Walk it together",
    body: "Keep the timeline aligned with live stats and a shared story.",
    icon: Compass,
  },
];

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !sectionRef.current || !trackRef.current) return;

    const section = sectionRef.current;
    const track = trackRef.current;

    const ctx = gsap.context(() => {
      gsap.to(track, {
        x: () => -(track.scrollWidth - window.innerWidth + 64),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${Math.max(track.scrollWidth - window.innerWidth + 64, 100)}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen overflow-hidden bg-terrain-stone/40 py-20 dark:bg-terrain-deep/80"
    >
      <div className="mb-10 px-4 text-center sm:px-6">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
        <p className="mt-2 text-foreground/70">Three beats. One unforgettable outing.</p>
      </div>
      <div className="overflow-x-auto px-4 pb-8 sm:px-6 md:overflow-visible">
        <div
          ref={trackRef}
          className="flex w-max gap-8 px-2 md:w-auto md:min-w-0 md:gap-12"
          style={{ willChange: "transform" }}
        >
          {steps.map((s, i) => (
            <article
              key={s.title}
              className="flex w-[min(100vw-3rem,380px)] shrink-0 flex-col rounded-lg border border-terrain-stone/50 bg-snow/90 p-8 shadow-card dark:border-terrain-surface/50 dark:bg-terrain-surface/60 md:w-[360px]"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-trail/15 text-trail">
                <s.icon className="h-6 w-6" aria-hidden />
              </div>
              <span className="font-mono text-xs text-foreground/50">0{i + 1}</span>
              <h3 className="font-display mt-2 text-xl font-bold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/75">{s.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
