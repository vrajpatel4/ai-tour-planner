import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/auth";
import { connectDB } from "@/app/lib/db";
import Trip from "@/app/lib/models/Trip";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth();
    await connectDB();
    const { id } = await context.params;

    const trip = await Trip.findOne({
      _id: id,
      clerkUserId: user.clerkId,
    }).select("-__v");

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, trip });
  } catch (error) {
    console.error("Get trip error:", error);
    return NextResponse.json({ error: "Failed to fetch trip" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth();
    await connectDB();
    const { id } = await context.params;
    const body = await request.json();

    const trip = await Trip.findOneAndUpdate(
      { _id: id, clerkUserId: user.clerkId },
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select("-__v");

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, trip });
  } catch (error) {
    console.error("Update trip error:", error);
    return NextResponse.json({ error: "Failed to update trip" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth();
    await connectDB();
    const { id } = await context.params;

    const deleted = await Trip.findOneAndDelete({
      _id: id,
      clerkUserId: user.clerkId,
    });

    if (!deleted) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete trip error:", error);
    return NextResponse.json({ error: "Failed to delete trip" }, { status: 500 });
  }
}
