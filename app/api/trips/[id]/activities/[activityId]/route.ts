import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/auth";
import { connectDB } from "@/app/lib/db";
import Trip from "@/app/lib/models/Trip";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string; activityId: string }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth();
    await connectDB();
    const { id, activityId } = await context.params;
    const updates = await request.json();
    const updateEntries = Object.entries(updates).filter(([key]) => key !== "_id");
    const activitySet: Record<string, unknown> = {};
    for (const [key, value] of updateEntries) {
      activitySet[`days.$[].activities.$[activity].${key}`] = value;
    }
    activitySet.updatedAt = new Date();

    const trip = await Trip.findOneAndUpdate(
      { _id: id, clerkUserId: user.clerkId },
      { $set: activitySet },
      {
        new: true,
        arrayFilters: [{ "activity._id": activityId }],
      }
    ).select("-__v");

    if (!trip) {
      return NextResponse.json({ error: "Trip or activity not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, trip });
  } catch (error) {
    console.error("Update activity error:", error);
    return NextResponse.json(
      { error: "Failed to update activity" },
      { status: 500 }
    );
  }
}
