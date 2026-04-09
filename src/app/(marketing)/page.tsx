import { CommunityStats } from "@/components/landing/community-stats";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <CommunityStats />
      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <h2 className="font-display text-3xl font-bold sm:text-4xl">Explore public trips</h2>
        <p className="mt-3 text-foreground/70">
          Discover routes curated by the community — from ridgelines to city nights.
        </p>
        <div className="mt-8">
          <Link href="/explore">
            <Button variant="outline" className="text-base">
              Open the gallery
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
