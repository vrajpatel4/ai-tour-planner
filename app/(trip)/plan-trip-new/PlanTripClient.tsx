"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  Compass,
  DollarSign,
  Contact,
  MapPin,
  MoonStar,
  Star,
  Hotel,
  Map,
} from "lucide-react";
import Link from "next/link";

import ChatBox, { type UiMessage } from "./_component/ChatBox";
import FeatureUnavailable from "@/app/_component/FeatureUnavailable";
import { useSiteConfig } from "@/app/_component/SiteConfigProvider";
import { ApiService } from "@/app/lib/api-client";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";

const TripMap = dynamic(() => import("./_component/TripMap"), {
  ssr: false,
  loading: () => <div className="h-64 w-full bg-slate-100 animate-pulse rounded-xl" />,
});

type AssistantTripPlan = {
  title?: string;
  destination?: string;
  duration?: string;
  budget?: string;
  summary?: string;

  images?: string[];

  highlights?: string[];

  places?: {
    name: string;
    description: string;
    image: string;
    geoCoordinates?: {
      lat: number;
      lng: number;
    };
  }[];

  hotels?: {
    name: string;
    price: string;
    rating: number;
    image: string;
    contactInfo?: string;
    geoCoordinates?: {
      lat: number;
      lng: number;
    };
  }[];

  days?: Array<{
    day: number;
    title: string;
    activities: Array<
      | string
      | {
          name: string;
          image?: string;
          description?: string;
        }
    >;
  }>;
};

const hashSeed = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash.toString();
};

const buildImageUrl = (query: string, seed?: string) => {
  const stableSeed = hashSeed(seed || query);
  return `https://picsum.photos/seed/${stableSeed}/800/600`;
};

const normalizeImageUrl = (
  url: string | undefined,
  fallbackQuery: string,
  seed: string,
) => {
  if (!url) return buildImageUrl(fallbackQuery, seed);
  if (
    url.includes("source.unsplash.com") ||
    url.includes("loremflickr.com")
  ) {
    return buildImageUrl(fallbackQuery, seed);
  }
  return url;
};

const handleImageError =
  (fallback: string) =>
  (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = fallback;
  };

type SendMessageResponse = {
  success: boolean;
  response: string;
  suggestions?: string[];
  conversationId?: string;
  tripGenerated?: boolean;
  ai?: {
    status?: "collecting" | "ready";
    message?: string;
    questions?: Array<{ question: string; options?: string[] }>;
    tripPlan?: AssistantTripPlan | null;
  } | null;
};

type BillingUsageResponse = {
  success: boolean;
  planKey: string;
  planLabel: string;
  creditLimit: number;
  creditsUsed: number;
  creditsRemaining: number;
  resetAt: string | null;
};

type PlanTripClientProps = {
  hasPremiumPlan: boolean;
};

const PlanTripClient = ({ hasPremiumPlan }: PlanTripClientProps) => {
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      id: "init-1",
      role: "assistant",
      content:
        "Tell me your destination, budget, duration and travel style. I'll build your perfect trip.",
      options: ["India", "Maldives", "Dubai", "Bali", "Thailand"],
    },
  ]);
  const searchParams = useSearchParams();
  const query = searchParams.get("q");

  const [tripPlan, setTripPlan] = useState<AssistantTripPlan | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(1);
  const sentQueryRef = useRef<string | null>(null);
  const { user } = useUser();
  const userName = user?.fullName;
  const queryClient = useQueryClient();
  const { config } = useSiteConfig();
  const plannerFeature = config.features.aiPlanner;
  const mapsFeature = config.features.maps;

  const billingQuery = useQuery<BillingUsageResponse, Error>({
    queryKey: ["billing-usage"],
    queryFn: () => ApiService.getBillingUsage() as Promise<BillingUsageResponse>,
    enabled: Boolean(user),
  });

  const creditsRemaining = billingQuery.data?.creditsRemaining;
  const creditLimit = billingQuery.data?.creditLimit;
  const planLabel = billingQuery.data?.planLabel;
  const planKey = billingQuery.data?.planKey;
  const resetAt = billingQuery.data?.resetAt
    ? new Date(billingQuery.data.resetAt)
    : null;
  const resetLabel = resetAt
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(resetAt)
    : null;
  const used = billingQuery.data?.creditsUsed ?? 0;
  const usagePct =
    creditLimit && creditLimit > 0
      ? Math.min(100, Math.round((used / creditLimit) * 100))
      : 0;
  const isChatDisabled =
    typeof creditsRemaining === "number" && creditsRemaining <= 0;
  const disabledMessage = isChatDisabled
    ? resetLabel
      ? `You've used all your prompts. Credits reset on ${resetLabel}.`
      : "You've used all your prompts. Upgrade to continue."
    : undefined;
  const planCtaLabel = (planKey || "free") === "free" ? "Upgrade" : "Manage";

  const sendMessageMutation = useMutation<
    SendMessageResponse,
    Error,
    { message: string; conversationId?: string }
  >({
    mutationFn: (variables) =>
      ApiService.sendMessage(
        variables.message,
        variables.conversationId,
      ) as Promise<SendMessageResponse>,

    onSuccess: (res) => {
      if (!res?.success) return;

      setConversationId(res.conversationId);

      const optionsFromQuestions =
        res.ai?.questions?.flatMap((q) => q.options || []) || [];

      const options = optionsFromQuestions.length
        ? optionsFromQuestions
        : res.suggestions || [];

      const assistantText = res.ai?.message || res.response;

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: assistantText,
          options,
        },
      ]);

      if (res.ai?.tripPlan) {
        setTripPlan(res.ai.tripPlan);
      }

      queryClient.invalidateQueries({ queryKey: ["billing-usage"] });
    },
    onError: (error) => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: error.message || "Something went wrong. Please try again.",
        },
      ]);
    },
  });

  const loading = sendMessageMutation.isPending;

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    if (isChatDisabled) {
      const disabledText = resetLabel
        ? `You're out of prompts for this month. Credits reset on ${resetLabel}.`
        : "You're out of prompts for this month. Upgrade to continue.";
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: disabledText,
        },
      ]);
      return;
    }

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: text.trim() },
    ]);

    setInput("");

    sendMessageMutation.mutate({
      message: text.trim(),
      conversationId,
    });
  }, [conversationId, isChatDisabled, resetLabel, sendMessageMutation]);

  const title = useMemo(
    () => tripPlan?.title || "Trip Plan",
    [tripPlan?.title],
  );

  const galleryImages = useMemo(() => {
    const provided = (tripPlan?.images || []).filter(Boolean);
    if (provided.length && tripPlan?.destination) {
      return provided.map((image, index) =>
        normalizeImageUrl(
          image,
          `${tripPlan.destination} travel`,
          `${tripPlan.destination}-gallery-${index + 1}`,
        ),
      );
    }
    if (tripPlan?.destination) {
      return [
        buildImageUrl(
          `${tripPlan.destination} travel`,
          `${tripPlan.destination}-gallery-1`,
        ),
        buildImageUrl(
          `${tripPlan.destination} sightseeing`,
          `${tripPlan.destination}-gallery-2`,
        ),
      ];
    }
    return [];
  }, [tripPlan]);

  useEffect(() => {
    if (!query) return;
    if (sentQueryRef.current === query) return;
    const timeout = window.setTimeout(() => {
      sentQueryRef.current = query;
      sendMessage(query);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [query, sendMessage]);

  if (!plannerFeature.enabled) {
    return (
      <FeatureUnavailable
        title={plannerFeature.unavailableTitle}
        message={plannerFeature.unavailableMessage}
      />
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5f9ff]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-20 h-96 w-96 rounded-full bg-cyan-300/35 blur-3xl" />
        <div className="absolute top-20 right-0 h-80 w-80 rounded-full bg-blue-300/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl" />
      </div>

      <div className="relative p-4 md:p-8">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-1 text-3xl font-semibold"><p className="text-blue-500">Hello,</p>{userName}</h1>
            <p className="text-lg text-slate-600">
              I am your AI Trip assistant
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Your recent trip plans are saved in the Trips collection. You can
              view your recent trips list and open any trip to see full details.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/trips">Recent Trips</Link>
            </Button>
            <div className="rounded-full border px-3 py-1 text-xs">
              Smart Planning
            </div>
          </div>
        </div>

        {user && (
          <div className="mb-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border bg-white/80 p-4 shadow-sm md:col-span-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-700">Prompt credits</span>
                <span className="font-semibold text-slate-900">
                  {billingQuery.isLoading || !creditLimit
                    ? "--"
                    : `${creditsRemaining} left`}
                </span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"
                  style={{ width: `${usagePct}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-slate-500">
                {billingQuery.isLoading
                  ? "Loading your billing details..."
                  : `Used ${used} of ${creditLimit ?? 0} · Reset ${
                      resetLabel || "soon"
                    }`}
              </div>
            </div>

            <div className="rounded-2xl border bg-white/80 p-4 shadow-sm">
              <div className="text-xs text-slate-500">Current plan</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">
                {planLabel || "Free"}
              </div>
              <Button asChild size="sm" className="mt-3 w-full">
                <Link href="/pricing">{planCtaLabel} plan</Link>
              </Button>
              <p className="mt-2 text-[11px] text-slate-500">
                Change your plan or manage subscription.
              </p>
            </div>
          </div>
        )}

        {hasPremiumPlan ? (
          <div className="mb-6 rounded-2xl border bg-white/80 p-4 text-sm text-slate-700 shadow-sm">
            Premium tools unlocked: interactive map view and enhanced trip
            exploration.
          </div>
        ) : (
          <div className="mb-6 rounded-2xl border bg-white/80 p-4 text-sm text-slate-600 shadow-sm">
            Unlock premium map view and extended itinerary tools with a Starter
            or Pro plan.
            <div className="mt-3">
              <Button asChild size="sm">
                <Link href="/pricing">Upgrade</Link>
              </Button>
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <ChatBox
            messages={messages}
            input={input}
            loading={loading}
            onInputChange={setInput}
            onSend={() => sendMessage(input)}
            onOptionSelect={(option) => sendMessage(option)}
            disabled={isChatDisabled}
            disabledMessage={disabledMessage}
          />

          <div className="rounded-3xl border bg-white/80 backdrop-blur p-5 space-y-5 shadow-lg">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-semibold">{title}</h2>

              <div className="text-xs bg-black text-white px-3 py-1 rounded-lg">
                {tripPlan ? "Ready" : "Collecting"}
              </div>
            </div>

            {!tripPlan && (
              <div className="text-center py-8 text-slate-500">
                <Compass className="mx-auto mb-2" />
                Complete chat prompts to generate itinerary
              </div>
            )}

            {tripPlan && (
              <div className="space-y-5">
                {galleryImages.length > 0 && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {galleryImages.map((img, index) => (
                      <img
                        key={`${img}-${index}`}
                        src={img}
                        alt={`${tripPlan.destination || "Trip"} image ${index + 1}`}
                        className="rounded-xl h-40 object-cover w-full"
                        onError={handleImageError(
                          buildImageUrl(
                            "travel",
                            `${tripPlan.destination || "trip"}-gallery-fallback`,
                          ),
                        )}
                      />
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                  <div className="p-3 rounded-xl bg-cyan-50 border">
                    <MapPin size={14} />
                    <div>{tripPlan.destination}</div>
                  </div>

                  <div className="p-3 rounded-xl bg-indigo-50 border">
                    <MoonStar size={14} />
                    <div>{tripPlan.duration}</div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50 border">
                    <DollarSign size={14} />
                    <div>{tripPlan.budget}</div>
                  </div>
                </div>

                {tripPlan.summary && (
                  <div className="p-3 border rounded-xl text-sm">
                    {tripPlan.summary}
                  </div>
                )}

                {!!tripPlan.highlights?.length && (
                  <div className="flex flex-wrap gap-2">
                    {tripPlan.highlights.map((h) => (
                      <span
                        key={h}
                        className="text-xs bg-slate-100 px-2 py-1 rounded-full"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                )}

                {!!tripPlan.places?.length && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                      <Map size={16} />
                      Places to Visit
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {tripPlan.places.map((place) => {
                        const placeSeed = `${tripPlan.destination || "trip"}-${place.name}`;
                        const placeImage = normalizeImageUrl(
                          place.image,
                          place.name && tripPlan.destination
                            ? `${place.name} ${tripPlan.destination}`
                            : tripPlan.destination
                              ? `${tripPlan.destination} travel`
                              : "travel destination",
                          placeSeed,
                        );

                        return (
                        <div
                          key={place.name}
                          className="rounded-xl border overflow-hidden"
                        >
                          <img
                            src={placeImage}
                            alt={place.name}
                            className="h-28 w-full object-cover"
                            onError={handleImageError(
                              buildImageUrl("travel destination", placeSeed),
                            )}
                          />

                          <div className="p-2">
                            <div className="font-medium text-sm">
                              {place.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {place.description}
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!!tripPlan.places?.length && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                      <Map size={16} />
                      Map View
                    </div>
                    {hasPremiumPlan && mapsFeature.enabled ? (
                      <TripMap
                        places={tripPlan.places || []}
                        hotels={tripPlan.hotels || []}
                        className="h-56 sm:h-64 rounded-xl z-0 overflow-hidden relative"
                      />
                    ) : !mapsFeature.enabled ? (
                      <FeatureUnavailable
                        compact
                        title={mapsFeature.unavailableTitle}
                        message={mapsFeature.unavailableMessage}
                      />
                    ) : (
                      <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-600">
                        Map view is available on Starter and Pro plans.
                        <div className="mt-3">
                          <Button asChild size="sm">
                            <Link href="/pricing">Upgrade</Link>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!!tripPlan.hotels?.length && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                      <Hotel size={16} />
                      Recommended Hotels
                    </div>

                    <div className="grid gap-3">
                      {tripPlan.hotels.map((hotel) => {
                        const hotelSeed = `${tripPlan.destination || "trip"}-${hotel.name}`;
                        const hotelImage = normalizeImageUrl(
                          hotel.image,
                          hotel.name && tripPlan.destination
                            ? `${hotel.name} ${tripPlan.destination}`
                            : tripPlan.destination
                              ? `${tripPlan.destination} hotel`
                              : "hotel",
                          hotelSeed,
                        );

                        return (
                        <div
                          key={hotel.name}
                          className="flex gap-3 border rounded-xl p-2"
                        >
                          <img
                            src={hotelImage}
                            alt={hotel.name}
                            className="h-16 w-20 object-cover rounded-md"
                            onError={handleImageError(
                              buildImageUrl("hotel", hotelSeed),
                            )}
                          />

                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {hotel.name}
                            </div>

                            <div className="flex items-center text-xs text-yellow-500">
                              <Star size={12} /> {hotel.rating}
                            </div>

                            <div className="text-xs text-slate-500">
                              {hotel.price}
                            </div>
                            {hotel.contactInfo && (
                              <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                <Contact size={12} />
                                {hotel.contactInfo}
                              </div>
                            )}
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!!tripPlan.days?.length && (
                  <div>
                    <div className="text-sm font-medium mb-2">
                      Day by Day Plan
                    </div>

                    {tripPlan.days.map((day) => {
                      const open = expandedDay === day.day;

                      return (
                        <div
                          key={day.day}
                          className="border rounded-xl mb-2 overflow-hidden"
                        >
                          <Button
                            variant="ghost"
                            className="w-full justify-between"
                            onClick={() =>
                              setExpandedDay((p) =>
                                p === day.day ? null : day.day,
                              )
                            }
                          >
                            <span>
                              Day {day.day}: {day.title}
                            </span>

                            {open ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </Button>

                          {open && (
                            <div className="p-4 space-y-4">
                              {day.activities.map((activity, index) => {
                                if (typeof activity === "string") {
                                  return (
                                    <div key={`${activity}-${index}`} className="text-sm list-item list-inside">
                                      {activity}
                                    </div>
                                  );
                                }

                                const activitySeed = `${tripPlan.destination || "trip"}-${day.day}-${activity.name}`;
                                const activityImage =
                                  activity.image ||
                                  (activity.name && tripPlan.destination
                                    ? buildImageUrl(
                                        `${activity.name} ${tripPlan.destination}`,
                                        activitySeed,
                                      )
                                    : buildImageUrl("travel activity", activitySeed));

                                return (
                                  <div key={`${activity.name}-${index}`} className="flex gap-3 items-start">
                                    <img
                                      src={activityImage}
                                      alt={activity.name}
                                      className="h-16 w-20 object-cover rounded-md"
                                      onError={handleImageError(buildImageUrl("travel activity", activitySeed))}
                                    />
                                    <div className="flex-1">
                                      <div className="font-medium text-sm">{activity.name}</div>
                                      {activity.description && <p className="text-xs text-slate-500 mt-1">{activity.description}</p>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanTripClient;
