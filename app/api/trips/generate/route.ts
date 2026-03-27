// app/api/trips/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { aiService, AIPreferences } from '@/app/lib/ai';
import { connectDB } from '@/app/lib/db';
import Trip from '@/app/lib/models/Trip';
import { reserveCredits, refundCredits } from "@/app/lib/billing";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let creditReservation:
    | (Awaited<ReturnType<typeof reserveCredits>> & { allowed?: boolean })
    | null = null;
  let creditUserId: string | null = null;

  try {
    const user = await requireAuth();
    await connectDB();
    creditUserId = String(user._id);

    const body = await request.json();
    const {
      destination,
      startDate,
      endDate,
      budget,
      travelers = 1,
      interests = [],
      pace = 'moderate',
      accommodation = 'mid-range',
      dietaryRestrictions = [],
    } = body;

    // Validate required fields
    if (!destination || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Destination, start date, and end date are required' },
        { status: 400 }
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

    // Prepare preferences for AI
    const preferences: AIPreferences = {
      destination,
      startDate,
      endDate,
      budget: budget || 1000,
      travelers,
      interests: interests || ['sightseeing', 'food', 'culture'],
      pace,
      accommodation,
      dietaryRestrictions,
    };

    // Generate itinerary using AI
    const aiPlan = await aiService.generateItinerary(preferences);

    const start = new Date(startDate);
    const end = new Date(endDate);


    // Create trip in database
    const trip = new Trip({
      userId: user._id,
      clerkUserId: user.clerkId,
      title: aiPlan.title || `${destination} Trip`,
      description: aiPlan.summary,
      destination,
      startDate: start,
      endDate: end,
      budget: budget || aiPlan.totalCost || 1000,
      travelers,
      status: 'draft',
      preferences: {
        interests,
        pace,
        accommodation,
        dietaryRestrictions,
      },
      days: aiPlan.days.map((day, index) => ({
        dayNumber: index + 1,
        title: day.title,
        date: new Date(start.getTime() + index * 24 * 60 * 60 * 1000),
        activities: day.activities.map(activity => ({
          time: activity.time,
          name: activity.name,
          type: activity.type,
          description: activity.description,
          location: activity.location,
          cost: activity.cost,
          duration: activity.duration,
          status: 'planned',
        })),
      })),
      totalCost: aiPlan.totalCost || 0,
      tags: [...interests, pace, accommodation],
    });

    await trip.save();

    // Return formatted response
    return NextResponse.json({
      success: true,
      trip: {
        id: trip._id,
        title: trip.title,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        budget: trip.budget,
        travelers: trip.travelers,
        status: trip.status,
        days: trip.days,
        totalCost: trip.totalCost,
        aiRecommendations: aiPlan.recommendations,
        weatherAdvice: aiPlan.weatherAdvice,
        packingList: aiPlan.packingList,
      },
    });

  } catch (error: unknown) {
    if (creditReservation?.allowed && creditUserId) {
      await refundCredits(creditUserId, 1);
    }

    console.error('Trip generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate trip';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}
