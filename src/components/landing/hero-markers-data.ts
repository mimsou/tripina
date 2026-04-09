/** Normalized positions (0–100) for hero pins and journey SVG — centers of avatars. */
export type HeroMarkerDef = {
  leftPct: number;
  topPct: number;
  imageSrc: string;
  label: string;
};

export const HERO_MARKERS: HeroMarkerDef[] = [
  {
    leftPct: 22,
    topPct: 18,
    imageSrc:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop&crop=face&auto=format&q=80",
    label: "Maya",
  },
  {
    leftPct: 58,
    topPct: 42,
    imageSrc:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop&crop=face&auto=format&q=80",
    label: "Jordan",
  },
  {
    leftPct: 72,
    topPct: 28,
    imageSrc:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=128&h=128&fit=crop&crop=face&auto=format&q=80",
    label: "Sofia",
  },
  {
    leftPct: 38,
    topPct: 62,
    imageSrc:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&h=128&fit=crop&crop=face&auto=format&q=80",
    label: "Alex",
  },
];

/** Smooth path through markers (viewBox 0 0 100 100). */
export function heroJourneyPathD(): string {
  const [a, b, c, d] = HERO_MARKERS;
  return `M ${a.leftPct} ${a.topPct} Q ${(a.leftPct + b.leftPct) / 2} ${(a.topPct + b.topPct) / 2 - 4} ${b.leftPct} ${b.topPct} Q ${(b.leftPct + c.leftPct) / 2 + 2} ${(b.topPct + c.topPct) / 2} ${c.leftPct} ${c.topPct} Q ${(c.leftPct + d.leftPct) / 2} ${(c.topPct + d.topPct) / 2 + 6} ${d.leftPct} ${d.topPct}`;
}
