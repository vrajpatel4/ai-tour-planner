"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { MapPin, Stars } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import FeatureUnavailable from "@/app/_component/FeatureUnavailable";
import { useSiteConfig } from "@/app/_component/SiteConfigProvider";
import { Button } from "@/components/ui/button";
import { Card, Carousel } from "@/components/ui/apple-cards-carousel";
import { Textarea } from "@/components/ui/textarea";

type DestinationCard = {
  category: string;
  title: string;
  src: string;
  description: string;
};

const DESTINATION_CARDS: Record<string, DestinationCard> = {
  india: {
    category: "India",
    title: "Palaces, food trails, hill stations, and slow cultural days.",
    src: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?q=80&w=1600&auto=format&fit=crop",
    description:
      "Blend classic landmarks with local markets, food walks, and realistic transfer times.",
  },
  maldives: {
    category: "Maldives",
    title: "Easy island days with lagoons, reefs, and sunset dinners.",
    src: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?q=80&w=1600&auto=format&fit=crop",
    description:
      "Plan villa stays, snorkeling windows, ferry or seaplane transfers, and quiet downtime.",
  },
  dubai: {
    category: "Dubai",
    title: "City views, desert evenings, shopping, and family-friendly stops.",
    src: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1600&auto=format&fit=crop",
    description:
      "Balance iconic attractions with practical budgets, commute times, and dining options.",
  },
  bali: {
    category: "Bali",
    title: "Rice terraces, beaches, temples, cafes, and wellness days.",
    src: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1600&auto=format&fit=crop",
    description:
      "Shape your route around Ubud, beach towns, waterfalls, and relaxed recovery time.",
  },
  thailand: {
    category: "Thailand",
    title: "Street food, island hopping, temples, and night markets.",
    src: "https://images.unsplash.com/photo-1508009603885-50cf7c579365?q=80&w=1600&auto=format&fit=crop",
    description:
      "Choose the right mix of Bangkok, beaches, culture, nightlife, and travel pace.",
  },
  paris: {
    category: "Paris",
    title: "Museums, cafes, river walks, neighborhoods, and day trips.",
    src: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1600&auto=format&fit=crop",
    description:
      "Turn a classic Paris idea into a day-by-day plan with reservations and gentle pacing.",
  },
};

const fallbackDestination = (name: string): DestinationCard => ({
  category: name,
  title: `Plan a practical, memorable ${name} itinerary with AI.`,
  src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop",
  description:
    "Use your budget, dates, interests, and travel style to build a route that feels realistic.",
});

function DestinationContent({ card }: { card: DestinationCard }) {
  return (
    <div className="space-y-5">
      <p className="mx-auto max-w-3xl text-base leading-7 text-neutral-600 dark:text-neutral-300 md:text-xl">
        {card.description}
      </p>
      <Image
        src={card.src}
        alt={card.title}
        height={520}
        width={820}
        className="mx-auto aspect-video w-full max-w-3xl rounded-2xl object-cover"
      />
    </div>
  );
}

export default function Home() {
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const { config } = useSiteConfig();
  const [query, setQuery] = useState("");
  const router = useRouter();

  const plannerFeature = config.features.aiPlanner;
  const plannerEnabled = plannerFeature.enabled;

  const handleGenerate = () => {
    if (!plannerEnabled) return;

    if (!user) {
      openSignIn();
      return;
    }

    const encoded = encodeURIComponent(query.trim());
    router.push(encoded ? `/plan-trip-new?q=${encoded}` : "/plan-trip-new");
  };

  const suggestedPlaces = config.ai.suggestedOptions.slice(0, 6).map((place) => {
    const key = place.trim().toLowerCase();
    return DESTINATION_CARDS[key] || fallbackDestination(place);
  });

  const cards = suggestedPlaces.map((card, index) => (
    <Card
      key={card.category}
      card={{ ...card, content: <DestinationContent card={card} /> }}
      index={index}
    />
  ));

  return (
    <main
      className="min-h-screen bg-[var(--site-background)] text-[var(--site-foreground)]"
      style={{
        backgroundImage: config.theme.backgroundImageUrl
          ? `linear-gradient(rgba(247, 251, 255, 0.9), rgba(247, 251, 255, 0.96)), url(${config.theme.backgroundImageUrl})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <section className="mx-auto max-w-6xl px-5 pb-8 pt-8 md:px-8 md:pt-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-white/85 px-4 py-2 shadow-sm">
              <Stars className="text-amber-500" size={18} />
              <p className="text-sm font-medium">{config.home.badgeText}</p>
            </div>

            <h2 className="mt-5 max-w-4xl text-4xl font-bold leading-tight md:text-6xl">
              {config.home.heroTitle}
              <span className="text-[var(--site-primary)]">
                {" "}
                {config.home.heroAccent}
              </span>
            </h2>

            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              {config.home.subtitle}
            </p>
          </div>

          <div className="rounded-2xl border bg-white/82 p-5 shadow-xl backdrop-blur">
            {!plannerEnabled && (
              <FeatureUnavailable
                compact
                title={plannerFeature.unavailableTitle}
                message={plannerFeature.unavailableMessage}
              />
            )}

            <Textarea
              placeholder={config.home.promptPlaceholder}
              className="mt-4 h-32 text-base"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              disabled={!plannerEnabled}
            />

            <Button
              onClick={handleGenerate}
              disabled={!plannerEnabled}
              className="mt-4 h-12 w-full text-base"
            >
              {config.home.ctaLabel}
            </Button>

            {!user && plannerEnabled && (
              <p className="mt-2 text-center text-sm text-slate-500">
                {config.home.signedOutHint}
              </p>
            )}
          </div>
        </div>

        <p className="mt-6 text-sm text-slate-500">{config.home.trustText}</p>
      </section>

      <section className="px-5 pb-12 md:px-8">
        <div className="mx-auto max-w-7xl">
          <h3 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
            <MapPin className="text-red-500" />
            {config.home.recommendationsTitle}
          </h3>

          <Carousel initialScroll={40} items={cards} />
        </div>
      </section>

      <footer className="py-8 text-center text-sm text-slate-500">
        {config.home.footerText}
      </footer>
    </main>
  );
}
