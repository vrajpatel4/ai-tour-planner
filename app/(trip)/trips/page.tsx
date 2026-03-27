"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Calendar,
  MapPin,
  RefreshCw,
  Wallet,
} from "lucide-react";

import { ApiService } from "@/app/lib/api-client";
import { Button } from "@/components/ui/button";

type TripListItem = {
  _id: string;
  title?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  status?: string;
  createdAt?: string;
  images?: string[];
  hotels?: Array<{
    name?: string;
    price?: string;
    rating?: number;
    image?: string;
    contactInfo?: string;
  }>;
  places?: Array<{
    name?: string;
    image?: string;
  }>;
};

type TripsResponse = {
  success: boolean;
  trips: TripListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const formatDateRange = (start?: string, end?: string) => {
  if (!start && !end) return "Dates not set";
  if (start && end) {
    return `${dateFormatter.format(new Date(start))} - ${dateFormatter.format(
      new Date(end),
    )}`;
  }
  if (start) return `${dateFormatter.format(new Date(start))} - ?`;
  return `? - ${dateFormatter.format(new Date(end as string))}`;
};

const formatStatus = (status?: string) =>
  status ? status.replace(/_/g, " ") : "unknown";

const formatBudget = (budget?: number) => {
  if (budget === null || budget === undefined) return "-";
  return budget.toLocaleString();
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

export default function RecentTripsPage() {
  const { data, isLoading, isError, error, refetch } = useQuery<
    TripsResponse,
    Error
  >({
    queryKey: ["trips", "recent"],
    queryFn: () => ApiService.getTrips(undefined, 1, 20) as Promise<TripsResponse>,
  });

  const trips = data?.trips ?? [];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5f9ff]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-20 h-96 w-96 rounded-full bg-cyan-300/35 blur-3xl" />
        <div className="absolute top-20 right-0 h-80 w-80 rounded-full bg-blue-300/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl p-4 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Recent Trips
            </p>
            <h1 className="text-3xl font-semibold text-slate-900">
              Your Trip Library
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Your recent trip plans are saved in the Trips collection. You can
              view your recent trips list and open any trip to see full details.
            </p>
          </div>

          <Button asChild variant="outline" className="self-start">
            <Link href="/plan-trip-new">Create New Trip</Link>
          </Button>
        </div>

        <div className="mt-6 grid gap-4">
          {isLoading && (
            <div className="rounded-2xl border bg-white/80 p-6 text-sm text-slate-500">
              Loading your recent trips...
            </div>
          )}

          {isError && (
            <div className="rounded-2xl border bg-white/80 p-6 text-sm text-slate-600">
              <p className="font-medium text-slate-800">
                Unable to load trips.
              </p>
              <p className="mt-1">{error.message}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => refetch()}
              >
                <RefreshCw />
                Try Again
              </Button>
            </div>
          )}

          {!isLoading && !isError && trips.length === 0 && (
            <div className="rounded-2xl border bg-white/80 p-6 text-sm text-slate-600">
              <p className="font-medium text-slate-800">No trips yet.</p>
              <p className="mt-1">
                Create a trip to start building your travel history.
              </p>
            </div>
          )}

          {!isLoading &&
            !isError &&
            trips.map((trip) => (
              <div
                key={trip._id}
                className="rounded-2xl border bg-white/90 p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-4">
                    {(() => {
                      const coverImage = normalizeImageUrl(
                        trip.images?.find(Boolean),
                        trip.destination ? `${trip.destination} travel` : "travel",
                        `${trip._id}-cover`,
                      );

                      return (
                        <img
                          src={coverImage}
                          alt={trip.title || "Trip cover"}
                          className="h-16 w-24 rounded-xl object-cover"
                          onError={handleImageError(
                            buildImageUrl("travel", `${trip._id}-cover`),
                          )}
                        />
                      );
                    })()}
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        {trip.title || "Untitled trip"}
                      </h2>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        {formatStatus(trip.status)}
                      </p>
                    </div>
                  </div>

                  <Button asChild variant="outline" size="sm">
                    <Link href={`/trips/${trip._id}`}>
                      Open Trip
                      <ArrowUpRight />
                    </Link>
                  </Button>
                </div>

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <div className="flex items-center gap-2 text-slate-700">
                    <MapPin size={14} />
                    <span>{trip.destination || "Destination not set"}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700">
                    <Calendar size={14} />
                    <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700">
                    <Wallet size={14} />
                    <span>Budget: {formatBudget(trip.budget)}</span>
                  </div>
                </div>

                {trip.hotels?.length ? (
                  <div className="mt-3 text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">
                      Hotels:
                    </span>{" "}
                    {trip.hotels
                      .filter((hotel) => hotel?.name)
                      .slice(0, 2)
                      .map((hotel, index) => (
                        <span key={`${hotel.name}-${index}`}>
                          {hotel.name}
                          {hotel.rating !== undefined
                            ? ` (${hotel.rating})`
                            : ""}
                          {hotel.price ? ` - ${hotel.price}` : ""}
                          {hotel.contactInfo ? ` (${hotel.contactInfo})` : ""}
                          {index < Math.min(2, trip.hotels!.length) - 1
                            ? ", "
                            : ""}
                        </span>
                      ))}
                  </div>
                ) : null}

                {trip.places?.length ? (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-slate-700">
                      Places:
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {trip.places.slice(0, 4).map((place, index) => {
                        const placeSeed = `${trip._id}-${place.name || index}`;
                        const placeImage = normalizeImageUrl(
                          place.image,
                          place.name && trip.destination
                            ? `${place.name} ${trip.destination}`
                            : trip.destination
                              ? `${trip.destination} sightseeing`
                              : "travel destination",
                          placeSeed,
                        );

                        return (
                          <div
                            key={`${place.name ?? "place"}-${index}`}
                            className="h-12 w-12 overflow-hidden rounded-lg border"
                            title={place.name || "Place"}
                          >
                            <img
                              src={placeImage}
                              alt={place.name || "Place"}
                              className="h-full w-full object-cover"
                              onError={handleImageError(
                                buildImageUrl("travel destination", placeSeed),
                              )}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {trip.createdAt && (
                  <p className="mt-3 text-xs text-slate-500">
                    Created {dateFormatter.format(new Date(trip.createdAt))}
                  </p>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
