// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/auth";
import { aiService } from "@/app/lib/ai";
import { connectDB } from "@/app/lib/db";
import Conversation from "@/app/lib/models/Conversation";
import Trip from "@/app/lib/models/Trip";
import { reserveCredits, refundCredits } from "@/app/lib/billing";
import { getSiteConfig, unavailableJsonResponse } from "@/app/lib/site-config";

export const runtime = "nodejs";

type AssistantQuestion = {
  question: string;
  options?: string[];
};

type AssistantActivity = {
  name: string;
  image?: string;
  description?: string;
  location?: string;
  time?: string;
  type?: string;
  cost?: number;
  duration?: string;
};

type AssistantTripPlan = {
  title?: string;
  destination?: string;
  duration?: string;
  budget?: string;
  summary?: string;
  images?: string[];
  highlights?: string[];
  places?: Array<{
    name: string;
    description: string;
    image?: string;
    geoCoordinates?: {
      lat: number;
      lng: number;
    };
  }>;
  hotels?: Array<{
    name: string;
    price: string;
    rating: number;
    image?: string;
    contactInfo?: string;
    geoCoordinates?: {
      lat: number;
      lng: number;
    };
  }>;
  startDate?: string;
  endDate?: string;
  days?: Array<{
    day: number;
    title: string;
    activities: Array<string | AssistantActivity>;
  }>;
};

type AssistantPayload = {
  status?: "collecting" | "ready";
  message?: string;
  questions?: AssistantQuestion[];
  tripPlan?: AssistantTripPlan | null;
};

function extractJsonPayload(raw: any): AssistantPayload | null {
  if (!raw) return null;

  // If AI already returned JSON object
  if (typeof raw === "object") {
    return raw as AssistantPayload;
  }

  // If AI returned string
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as AssistantPayload;
    } catch {
      const codeBlockMatch = raw.match(/```json\s*([\s\S]*?)```/i);

      if (codeBlockMatch?.[1]) {
        try {
          return JSON.parse(codeBlockMatch[1]) as AssistantPayload;
        } catch {
          return null;
        }
      }
    }
  }

  return null;
}

function buildOrchestratorPrompt(): string {
  return `
You are an AI travel planner.

Return ONLY valid JSON.

Schema:

{
 "status":"collecting | ready",
 "message":"assistant message",
 "ui":{
   "type":"chips | cards | input | itinerary"
 },
 "questions":[
   {
     "question":"follow up question",
     "options":["option1","option2","option3"]
   }
 ],
 "tripPlan":{
   "title":"Creative and exciting trip title",
   "destination":"City, Country",
   "duration":"e.g., 7 days",
   "budget":"e.g., $2000 USD",
   "summary":"A compelling 2-3 sentence summary of the trip.",
   "images":[
     "https://... (URL for a high-quality image of the destination)",
     "https://... (Another high-quality image)"
   ],
   "highlights":["Top 3-5 highlights of the trip"],
   "places":[
     {
       "name":"Famous Landmark",
       "description":"A short, engaging description of the place.",
       "image":"https://... (URL for a high-quality image of the place)"
       "geoCoordinates": { "lat": 12.34, "lng": 56.78 }
     }
   ],
   "hotels":[
     {
       "name":"Well-known Hotel",
       "price":"e.g., $150/night",
       "rating":4.5,
       "image":"https://... (URL for a high-quality image of the hotel)",
       "contactInfo": "e.g., +1234567890 or website",
       "geoCoordinates": { "lat": 12.34, "lng": 56.78 }
     }
   ],
   "days":[
     {
       "day":1,
       "title":"Arrival and Exploration",
       "activities":[
         {
           "name":"Activity Name",
           "image":"https://...",
           "description":"Short description of the activity.",
           "type":"e.g., dining, sightseeing, activity",
           "time":"e.g., 02:00 PM"
         }
       ]
     }
   ]
 }
}

Rules:

If information missing:
status="collecting"

Ask ONE best question
Provide clickable options

If enough info:
status="ready"
Return tripPlan
Include 3-4 hotels, popular activities for the destination, and image URLs for the trip, places, hotels, and activities. Ensure all image URLs are high-quality and relevant.
`;
}

export async function POST(request: NextRequest) {
  let creditReservation:
    | (Awaited<ReturnType<typeof reserveCredits>> & { allowed?: boolean })
    | null = null;
  let creditUserId: string | null = null;

  try {
    const config = await getSiteConfig();
    const unavailableResponse = unavailableJsonResponse(config, "aiPlanner");
    if (unavailableResponse) return unavailableResponse;

    const user = await requireAuth();
    await connectDB();
    creditUserId = String(user._id);

    const { message, conversationId, tripId } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 },
      );
    }

    creditReservation = await reserveCredits(user, 1);

    if (!creditReservation.allowed) {
      return NextResponse.json(
        {
          error:
            "You've reached your monthly prompt limit. Upgrade to continue or wait for your credits to reset.",
          code: "OUT_OF_CREDITS",
          planKey: creditReservation.planKey,
          resetAt: creditReservation.resetAt
            ? new Date(creditReservation.resetAt).toISOString()
            : null,
        },
        { status: 402 },
      );
    }

    // Find or create conversation
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        clerkUserId: user.clerkId,
      });
    }

    if (!conversation) {
      conversation = new Conversation({
        userId: user._id,
        clerkUserId: user.clerkId,
        title: `Chat ${new Date().toLocaleDateString()}`,
        messages: [],
        tripId: tripId || null,
        context: { tripId },
        isActive: true,
      });
    }

    // Add user message
    conversation.messages.push({
      role: "user",
      content: message,
      timestamp: new Date(),
    });

    const orchestratedMessages = [
      { role: "system" as const, content: buildOrchestratorPrompt() },
      ...conversation.messages.map(
        (msg: { role: string; content: string }) => ({
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
        }),
      ),
    ];

    // Get AI response
    const rawAiResponse = await aiService.chat(
      orchestratedMessages,
      conversation.context,
    );
    const structured = extractJsonPayload(rawAiResponse);
    const aiResponse =
      structured?.message ||
      (typeof rawAiResponse === "string"
        ? rawAiResponse
        : "I generated a response.");

    // Add AI response
    conversation.messages.push({
      role: "assistant",
      content: aiResponse,
      timestamp: new Date(),
    });

    // Update conversation title if it's the first message
    if (conversation.messages.length === 2) {
      const titlePrompt = `Generate a short title (max 5 words) for a chat about: ${message}`;
      const titleResponse = await aiService.chat([
        { role: "system", content: "Generate a short, descriptive title." },
        { role: "user", content: titlePrompt },
      ]);
      const title =
        typeof titleResponse === "string"
          ? titleResponse
          : titleResponse?.message || "Trip Chat";

      conversation.title = title.replace(/["']/g, "").substring(0, 50);
    }

    conversation.updatedAt = new Date();
    
    let savedTripId = conversation.tripId;

    if (structured?.tripPlan) {
      const tripPayload = buildTripPayload(structured.tripPlan);

      if (tripPayload) {
        structured.tripPlan = buildTripPlanResponse(
          structured.tripPlan,
          tripPayload,
        );

        if (savedTripId) {
          const updatedTrip = await Trip.findOneAndUpdate(
            { _id: savedTripId, clerkUserId: user.clerkId },
            { ...tripPayload, updatedAt: new Date() },
            { new: true, runValidators: true },
          );

          if (!updatedTrip) {
            const createdTrip = await Trip.create({
              ...tripPayload,
              userId: user._id,
              clerkUserId: user.clerkId,
            });
            savedTripId = createdTrip._id;
          }
        } else {
          const createdTrip = await Trip.create({
            ...tripPayload,
            userId: user._id,
            clerkUserId: user.clerkId,
          });
          savedTripId = createdTrip._id;
        }

        if (savedTripId && String(savedTripId) !== String(conversation.tripId)) {
          conversation.tripId = savedTripId;
          conversation.context = {
            ...(conversation.context || {}),
            tripId: savedTripId,
          };
        }
      }
    }

    await conversation.save();

    // Generate suggestions based on conversation
    const suggestions =
      structured?.questions?.[0]?.options?.filter(Boolean) ||
      (await generateSuggestions(conversation.messages));

    return NextResponse.json({
      success: true,
      response: aiResponse,
      conversationId: conversation._id,
      tripId: savedTripId || conversation.tripId || null,
      suggestions,
      ai: structured,
      conversationTitle: conversation.title,
      tripGenerated: Boolean(structured?.tripPlan),
    });
  } catch (error: unknown) {
    if (creditReservation?.allowed && creditUserId) {
      await refundCredits(creditUserId, 1);
    }

    console.error("Chat error:", error);
    const errorMessage = error instanceof Error ? error.message : undefined;
    console.error("Chat errorMessage:", errorMessage);

    return NextResponse.json(
      {
        error: "Failed to process message",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 },
    );
  }
}

type ChatMessage = { role?: string; content?: string };

type TripCreatePayload = {
  title: string;
  description?: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  budget: number;
  travelers: number;
  status: "draft";
  images?: string[];
  highlights?: string[];
  places?: Array<{
    name: string;
    description: string;
    image: string;
    geoCoordinates?: {
      lat: number;
      lng: number;
    };
  }>;
  hotels?: Array<{
    name: string;
    price: string;
    rating: number;
    image: string;
    contactInfo?: string;
    geoCoordinates?: {
      lat: number;
      lng: number;
    };
  }>;
  days: Array<{
    dayNumber: number;
    title: string;
    date: Date;
    activities: Array<{
      name: string;
      type: string;
      time?: string;
      description?: string;
      location?: string;
      cost?: number;
      duration?: string;
      image?: string;
      status: "planned";
    }>;
  }>;
  totalCost: number;
};

const parseBudgetValue = (budget?: string) => {
  if (!budget) return null;
  const match = budget.match(/[\d,.]+/);
  if (!match) return null;
  const numeric = Number(match[0].replace(/,/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
};

const parseDurationDays = (duration?: string) => {
  if (!duration) return null;
  const match = duration.match(/(\d+)/);
  if (!match) return null;
  const days = Number(match[1]);
  return Number.isFinite(days) && days > 0 ? days : null;
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

const ensureImageUrl = (value?: string, query?: string, seed?: string) =>
  value || (query ? buildImageUrl(query, seed) : undefined);

const allowedActivityTypes = new Set([
  "dining",
  "sightseeing",
  "activity",
  "transport",
  "accommodation",
  "leisure",
  "shopping",
  "cultural",
  "wellness",
]);

const normalizeActivityType = (value?: string) =>
  value && allowedActivityTypes.has(value) ? value : "activity";

const normalizeActivity = (
  activity: string | AssistantActivity,
  destination: string,
) => {
  if (typeof activity === "string") {
    return {
      name: activity,
      type: "activity",
      image: ensureImageUrl(
        undefined,
        `${activity} ${destination}`,
        `${destination}-${activity}`,
      ),
    };
  }

  return {
    name: activity.name,
    type: normalizeActivityType(activity.type),
    time: activity.time,
    description: activity.description,
    location: activity.location,
    cost: activity.cost,
    duration: activity.duration,
    image: ensureImageUrl(
      activity.image,
      `${activity.name} ${destination}`,
      `${destination}-${activity.name}`,
    ),
  };
};

const buildTripPayload = (
  tripPlan: AssistantTripPlan,
): TripCreatePayload | null => {
  const destination = tripPlan.destination?.trim();
  if (!destination) return null;

  const title =
    tripPlan.title?.trim() || (destination ? `${destination} Trip` : "Trip");

  const budgetValue = parseBudgetValue(tripPlan.budget) ?? 0;
  const daysFromPlan = tripPlan.days?.length || 0;
  const parsedDuration = parseDurationDays(tripPlan.duration);
  const durationDays =
    parsedDuration !== null && parsedDuration !== undefined
      ? parsedDuration
      : daysFromPlan || 1;

  const parsedStart = tripPlan.startDate ? new Date(tripPlan.startDate) : null;
  const startDate =
    parsedStart && !Number.isNaN(parsedStart.getTime())
      ? parsedStart
      : new Date();

  const parsedEnd = tripPlan.endDate ? new Date(tripPlan.endDate) : null;
  let endDate =
    parsedEnd && !Number.isNaN(parsedEnd.getTime())
      ? parsedEnd
      : new Date(startDate.getTime() + (durationDays - 1) * 86400000);

  if (endDate < startDate) {
    endDate = new Date(startDate.getTime());
  }

  const dayCount = Math.max(durationDays, daysFromPlan || 1);
  const days = (tripPlan.days?.length
    ? tripPlan.days
    : Array.from({ length: dayCount }, (_, index) => ({
        day: index + 1,
        title: `Day ${index + 1}`,
        activities: [],
      }))).map((day, index) => ({
    dayNumber: day.day ?? index + 1,
    title: day.title || `Day ${index + 1}`,
    date: new Date(startDate.getTime() + index * 86400000),
    activities: (day.activities || []).map((activity) => {
      const normalized = normalizeActivity(activity, destination);
      return {
        name: normalized.name,
        type: normalized.type,
        time: normalized.time,
        description: normalized.description,
        location: normalized.location,
        cost: normalized.cost,
        duration: normalized.duration,
        image: normalized.image,
        status: "planned" as const,
      };
    }),
  }));

  const images =
    tripPlan.images && tripPlan.images.length > 0
      ? tripPlan.images
      : [
          buildImageUrl(`${destination} travel`, `${destination}-gallery-1`),
          buildImageUrl(`${destination} landscape`, `${destination}-gallery-2`),
        ];

  const placesFromPlan =
    tripPlan.places?.map((place) => ({
      ...place,
      image:
        ensureImageUrl(
          place.image,
          `${place.name} ${destination}`,
          `${destination}-${place.name}`,
        ) || "",
      geoCoordinates: place.geoCoordinates,
    })) || [];

  const minPlaces = 3;
  const places =
    placesFromPlan.length >= minPlaces
      ? placesFromPlan
      : [
          ...placesFromPlan,
          ...Array.from(
            { length: minPlaces - placesFromPlan.length },
            (_, index) => ({
              name: `Top Place ${placesFromPlan.length + index + 1}`,
              description: `Popular spot in ${destination}.`,
              image: buildImageUrl(
                `${destination} sightseeing`,
                `${destination}-place-${placesFromPlan.length + index + 1}`,
              ),
            }),
          ),
        ];

  const hotelsFromPlan =
    tripPlan.hotels?.map((hotel) => ({
      ...hotel,
      rating:
        typeof hotel.rating === "number"
          ? hotel.rating
          : Number(hotel.rating) || 0,
      image:
        ensureImageUrl(
          hotel.image,
          `${hotel.name} ${destination}`,
          `${destination}-${hotel.name}`,
        ) || "",
      geoCoordinates: hotel.geoCoordinates,
    })) || [];

  const minHotels = 4;
  const hotels =
    hotelsFromPlan.length >= minHotels
      ? hotelsFromPlan
      : [
          ...hotelsFromPlan,
          ...Array.from(
            { length: minHotels - hotelsFromPlan.length },
            (_, index) => ({
              name: `Recommended Hotel ${hotelsFromPlan.length + index + 1}`,
              price: "",
              rating: 4.3,
              image: buildImageUrl(
                `${destination} hotel`,
                `${destination}-hotel-${hotelsFromPlan.length + index + 1}`,
              ),
            }),
          ),
        ];

  return {
    title,
    description: tripPlan.summary,
    destination,
    startDate,
    endDate,
    budget: budgetValue,
    travelers: 1,
    status: "draft",
    images,
    highlights: tripPlan.highlights,
    places,
    hotels,
    days,
    totalCost: budgetValue,
  };
};

const buildTripPlanResponse = (
  rawPlan: AssistantTripPlan,
  payload: TripCreatePayload,
): AssistantTripPlan => {
  const images =
    payload.images?.filter((image): image is string => Boolean(image)) ||
    rawPlan.images;

  const places =
    rawPlan.places?.length
      ? rawPlan.places.map((place) => ({
          ...place,
          image: ensureImageUrl(
            place.image,
            `${place.name} ${rawPlan.destination || payload.destination}`,
            `${payload.destination}-${place.name}`,
          ),
        }))
      : payload.places;

  const hotels =
    rawPlan.hotels?.length
      ? rawPlan.hotels.map((hotel) => ({
          ...hotel,
          image: ensureImageUrl(
            hotel.image,
            `${hotel.name} ${rawPlan.destination || payload.destination}`,
            `${payload.destination}-${hotel.name}`,
          ),
        }))
      : payload.hotels;

  const days =
    rawPlan.days?.length
      ? rawPlan.days
      : payload.days.map((day) => ({
          day: day.dayNumber,
          title: day.title,
          activities: day.activities.map((activity) => activity.name),
        }));

  return {
    ...rawPlan,
    images,
    places,
    hotels,
    days,
  };
};

async function generateSuggestions(messages: ChatMessage[]): Promise<string[]> {
  // Simple suggestion generation based on conversation context
  const lastUserMessage =
    [...messages]
      .reverse()
      .find((msg) => msg.role === "user")
      ?.content?.toLowerCase() || "";

  const suggestionMap: Record<string, string[]> = {
    destination: [
      "What is your budget?",
      "How many travelers?",
      "What dates are you considering?",
    ],
    budget: [
      "What type of accommodation?",
      "Any specific activities?",
      "Transportation preferences?",
    ],
    dates: ["Duration of stay?", "Flexible with dates?", "Season preferences?"],
    activities: [
      "Adventure or relaxation?",
      "Cultural experiences?",
      "Food preferences?",
    ],
  };

  const defaultSuggestions = [
    "Add more activities",
    "Change accommodation",
    "Adjust budget",
    "Extend trip duration",
    "Add dietary restrictions",
  ];

  // Check for keywords in last message
  for (const [keyword, suggestions] of Object.entries(suggestionMap)) {
    if (lastUserMessage.includes(keyword)) {
      return suggestions;
    }
  }

  return defaultSuggestions;
}
