"use client";

import React, { useMemo, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  RefreshCw,
  Users,
  Wallet,
} from "lucide-react";

import { ApiService } from "@/app/lib/api-client";
import { Button } from "@/components/ui/button";

type Activity = {
  time?: string;
  name?: string;
  type?: string;
  description?: string;
  location?: string;
  cost?: number;
  duration?: string;
  image?: string;
  status?: string;
};

type TripDay = {
  dayNumber?: number;
  title?: string;
  date?: string;
  activities?: Activity[];
};

type Place = {
  name?: string;
  description?: string;
  image?: string;
};

type Hotel = {
  name?: string;
  price?: string;
  rating?: number;
  image?: string;
};

type TripDetail = {
  _id: string;
  title?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  travelers?: number;
  status?: string;
  description?: string;
  images?: string[];
  highlights?: string[];
  places?: Place[];
  hotels?: Hotel[];
  totalCost?: number;
  days?: TripDay[];
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type TripResponse = {
  success: boolean;
  trip: TripDetail;
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

const formatBudget = (budget?: number) => {
  if (budget === null || budget === undefined) return "-";
  return budget.toLocaleString();
};

const formatStatus = (status?: string) =>
  status ? status.replace(/_/g, " ") : "unknown";

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

export default function TripDetailsPage() {
  const params = useParams();
  const tripId =
    typeof params?.id === "string" ? params.id : params?.id?.[0];
  const [copied, setCopied] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery<
    TripResponse,
    Error
  >({
    queryKey: ["trip", tripId],
    queryFn: () => ApiService.getTrip(tripId as string) as Promise<TripResponse>,
    enabled: Boolean(tripId),
  });

  const trip = data?.trip;
  const days = trip?.days
    ? [...trip.days].sort(
        (a, b) => (a.dayNumber ?? 0) - (b.dayNumber ?? 0),
      )
    : [];

  const galleryImages = useMemo(() => {
    const provided = (trip?.images || []).filter(Boolean);
    if (provided.length && trip?._id) {
      return provided.map((image, index) =>
        normalizeImageUrl(
          image,
          trip.destination
            ? `${trip.destination} travel`
            : "travel",
          `${trip._id}-gallery-${index + 1}`,
        ),
      );
    }
    if (trip?.destination) {
      return [
        buildImageUrl(
          `${trip.destination} travel`,
          `${trip._id}-gallery-1`,
        ),
        buildImageUrl(
          `${trip.destination} sightseeing`,
          `${trip._id}-gallery-2`,
        ),
      ];
    }
    return [];
  }, [trip?.destination, trip?.images, trip?._id]);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined" || !tripId) return "";
    return `${window.location.origin}/trips/public/${tripId}`;
  }, [tripId]);

  const updateTripMutation = useMutation<
    TripResponse,
    Error,
    { isPublic: boolean }
  >({
    mutationFn: (payload) =>
      ApiService.updateTrip(tripId as string, payload) as Promise<TripResponse>,
    onSuccess: (response) => {
      queryClient.setQueryData(["trip", tripId], response);
    },
  });

  const handleTogglePublic = () => {
    if (!trip) return;
    updateTripMutation.mutate({ isPublic: !trip.isPublic });
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    if (!shareUrl) return;
    const text = encodeURIComponent(
      `Check out my trip plan: ${shareUrl}`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleDownloadPdf = async () => {
    const contentToCapture = document.getElementById("pdf-content-wrapper");
    if (!contentToCapture || isDownloadingPdf) return;

    setIsDownloadingPdf(true);

    // Add a style tag to hide elements with 'no-pdf' class during capture
    const style = document.createElement("style");
    style.innerHTML = ".no-pdf { display: none !important; }";
    document.head.appendChild(style);

    try {
      const canvas = await html2canvas(contentToCapture, {
        scale: 2, // Higher resolution for better quality
        useCORS: true, // Needed for external images
        backgroundColor: "#f5f9ff", // Match page background
        windowWidth: 1200, // Use a fixed width for consistent layout
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: "a4",
        hotfixes: ["px_scaling"],
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / pdfWidth;
      const imgHeight = canvasHeight / ratio;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(
        `trip-to-${trip?.destination?.replace(/\s+/g, "-") || "trip"}.pdf`,
      );
    } catch (e) {
      console.error("Error generating PDF:", e);
    } finally {
      document.head.removeChild(style);
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5f9ff]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-20 h-96 w-96 rounded-full bg-cyan-300/35 blur-3xl" />
        <div className="absolute top-20 right-0 h-80 w-80 rounded-full bg-blue-300/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl" />
      </div>

      <div
        id="pdf-content-wrapper"
        className="relative mx-auto max-w-5xl space-y-6 p-4 md:p-8"
      >
        <div className="no-pdf flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/trips">
              <ArrowLeft />
              Back to trips
            </Link>
          </Button>

          <span className="rounded-full border bg-white/80 px-3 py-1 text-xs uppercase tracking-wide text-slate-600">
            {formatStatus(trip?.status)}
          </span>
        </div>

        {isLoading && (
          <div className="rounded-2xl border bg-white/80 p-6 text-sm text-slate-500">
            Loading trip details...
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border bg-white/80 p-6 text-sm text-slate-600">
            <p className="font-medium text-slate-800">
              Unable to load this trip.
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

        {!isLoading && !isError && !trip && (
          <div className="rounded-2xl border bg-white/80 p-6 text-sm text-slate-600">
            Trip not found.
          </div>
        )}

        {!isLoading && !isError && trip && (
          <>
            <div className="rounded-3xl border bg-white/90 p-6 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-slate-900">
                    {trip.title || "Untitled trip"}
                  </h1>
                  <p className="text-sm text-slate-600">
                    {trip.destination || "Destination not set"}
                  </p>
                </div>

                {trip.createdAt && (
                  <p className="text-xs text-slate-500">
                    Created {dateFormatter.format(new Date(trip.createdAt))}
                  </p>
                )}
              </div>

              <div className="mt-5 grid gap-3 text-sm sm:grid-cols-4">
                <InfoCard
                  icon={<MapPin size={14} />}
                  label="Destination"
                  value={trip.destination || "-"}
                />
                <InfoCard
                  icon={<Calendar size={14} />}
                  label="Dates"
                  value={formatDateRange(trip.startDate, trip.endDate)}
                />
                <InfoCard
                  icon={<Wallet size={14} />}
                  label="Budget"
                  value={formatBudget(trip.budget)}
                />
                <InfoCard
                  icon={<Users size={14} />}
                  label="Travelers"
                  value={trip.travelers?.toString() || "-"}
                />
              </div>

              {trip.description && (
                <p className="mt-4 text-sm text-slate-600">
                  {trip.description}
                </p>
              )}

              {trip.totalCost !== undefined && (
                <p className="mt-3 text-sm text-slate-600">
                  Total cost: {formatBudget(trip.totalCost)}
                </p>
              )}
            </div>

            <div className="no-pdf rounded-3xl border bg-white/90 p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Sharing & Export
                  </h2>
                  <p className="text-sm text-slate-600">
                    Make the trip public to share a link, or download a PDF.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={handleTogglePublic}
                    disabled={updateTripMutation.isPending}
                  >
                    {trip.isPublic ? "Make Private" : "Make Public"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDownloadPdf}
                    disabled={isDownloadingPdf}
                  >
                    {isDownloadingPdf ? "Downloading..." : "Download PDF"}
                  </Button>
                </div>
              </div>

              {trip.isPublic ? (
                <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center">
                  <div className="flex-1 rounded-xl border py-2 text-xs text-slate-600 bg-slate-50">
                    <p className="mx-3 overflow-hidden">{shareUrl}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyLink}
                    >
                      {copied ? "Copied" : "Copy Link"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleShareWhatsApp}
                    >
                      Share on WhatsApp
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-xs text-slate-500">
                  Public link is off. Enable public to share this trip.
                </p>
              )}
            </div>

            {galleryImages.length ? (
              <div className="rounded-3xl border bg-white/90 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  Trip Gallery
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {galleryImages.map((image, index) => (
                    <img
                      key={`${image}-${index}`}
                      src={image}
                      alt={`Trip image ${index + 1}`}
                      className="h-40 w-full rounded-2xl object-cover"
                      onError={handleImageError(
                        buildImageUrl("travel", `${trip?._id}-gallery-fallback`),
                      )}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {trip.highlights?.length ? (
              <div className="rounded-3xl border bg-white/90 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  Highlights
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {trip.highlights.map((highlight, index) => (
                    <span
                      key={`${highlight}-${index}`}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {trip.places?.length ? (
              <div className="rounded-3xl border bg-white/90 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  Places to Visit
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {trip.places.map((place, index) => {
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
                      className="overflow-hidden rounded-2xl border bg-white"
                    >
                        {placeImage ? (
                          <img
                            src={placeImage}
                            alt={place.name || "Place"}
                            className="h-32 w-full object-cover"
                            onError={handleImageError(
                              buildImageUrl("travel destination", placeSeed),
                            )}
                          />
                        ) : (
                          <div className="flex h-32 items-center justify-center bg-slate-50 text-xs text-slate-400">
                            Image unavailable
                          </div>
                        )}
                      <div className="p-3">
                        <p className="text-sm font-semibold text-slate-900">
                          {place.name || "Place"}
                        </p>
                        {place.description && (
                          <p className="mt-1 text-xs text-slate-600">
                            {place.description}
                          </p>
                        )}
                      </div>
                    </div>
                      );
                    })}
                </div>
              </div>
            ) : null}

            {trip.hotels?.length ? (
              <div className="rounded-3xl border bg-white/90 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  Recommended Hotels
                </h2>
                <div className="mt-4 space-y-3">
                  {trip.hotels.map((hotel, index) => {
                    const hotelSeed = `${trip._id}-${hotel.name || index}`;
                    const hotelImage = normalizeImageUrl(
                      hotel.image,
                      hotel.name && trip.destination
                        ? `${hotel.name} ${trip.destination}`
                        : trip.destination
                          ? `${trip.destination} hotel`
                          : "hotel",
                      hotelSeed,
                    );

                    return (
                    <div
                      key={`${hotel.name ?? "hotel"}-${index}`}
                      className="flex flex-wrap items-center gap-3 rounded-2xl border bg-white p-3"
                    >
                      {hotelImage ? (
                        <img
                          src={hotelImage}
                          alt={hotel.name || "Hotel"}
                          className="h-16 w-24 rounded-xl object-cover"
                          onError={handleImageError(
                            buildImageUrl("hotel", hotelSeed),
                          )}
                        />
                      ) : (
                        <div className="flex h-16 w-24 items-center justify-center rounded-xl bg-slate-50 text-[10px] text-slate-400">
                          No image
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900">
                          {hotel.name || "Hotel"}
                        </p>
                        <div className="mt-1 text-xs text-slate-500">
                          {hotel.price && <span>{hotel.price}</span>}
                          {hotel.rating !== undefined && (
                            <span> - Rating: {hotel.rating}</span>
                          )}
                        </div>
                      </div>
                    </div>
                      );
                    })}
                </div>
              </div>
            ) : null}

            <div className="rounded-3xl border bg-white/90 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Day by Day Plan
              </h2>
              {days.length === 0 && (
                <p className="mt-2 text-sm text-slate-600">
                  No itinerary details yet.
                </p>
              )}

              <div className="mt-4 space-y-4">
                {days.map((day, index) => (
                  <div key={`${day.dayNumber ?? index}`} className="rounded-2xl border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Day {day.dayNumber ?? index + 1}:{" "}
                          {day.title || "Untitled day"}
                        </p>
                        {day.date && (
                          <p className="text-xs text-slate-500">
                            {dateFormatter.format(new Date(day.date))}
                          </p>
                        )}
                      </div>
                    </div>

                    {day.activities && day.activities.length > 0 ? (
                      <ul className="mt-3 space-y-2 text-sm text-slate-700">
                        {day.activities.map((activity, activityIndex) => {
                          const activitySeed = `${trip._id}-${day.dayNumber ?? index}-${activity.name || activityIndex}`;
                          const activityImage = normalizeImageUrl(
                            activity.image,
                            activity.name && trip.destination
                              ? `${activity.name} ${trip.destination}`
                              : trip.destination
                                ? `${trip.destination} activity`
                                : "activity",
                            activitySeed,
                          );

                          return (
                          <li
                            key={`${activity.name ?? "activity"}-${activityIndex}`}
                            className="rounded-xl bg-slate-50 p-3"
                          >
                            <div className="flex flex-wrap items-start gap-3">
                              {activityImage ? (
                                <img
                                  src={activityImage}
                                  alt={activity.name || "Activity"}
                                  className="h-16 w-24 rounded-xl object-cover"
                                  onError={handleImageError(
                                    buildImageUrl("activity", activitySeed),
                                  )}
                                />
                              ) : (
                                <div className="flex h-16 w-24 items-center justify-center rounded-xl bg-white text-[10px] text-slate-400">
                                  No image
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="font-medium text-slate-900">
                                    {activity.name || "Activity"}
                                  </span>
                                  {activity.time && (
                                    <span className="text-xs text-slate-500">
                                      {activity.time}
                                    </span>
                                  )}
                                </div>

                                <div className="mt-1 text-xs text-slate-500">
                                  {activity.location && (
                                    <span>
                                      Location: {activity.location}
                                    </span>
                                  )}
                                  {activity.duration && (
                                    <span> - {activity.duration}</span>
                                  )}
                                  {activity.cost !== undefined && (
                                    <span> - Cost: {activity.cost}</span>
                                  )}
                                  {activity.type && (
                                    <span> - {activity.type}</span>
                                  )}
                                </div>

                                {activity.description && (
                                  <p className="mt-2 text-xs text-slate-600">
                                    {activity.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm text-slate-600">
                        No activities planned for this day.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-sm font-medium text-slate-900">{value}</div>
    </div>
  );
}
