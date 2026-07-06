import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import Trip from "@/app/lib/models/Trip";
import { getSiteConfig, unavailableJsonResponse } from "@/app/lib/site-config";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: NextRequest, context: RouteContext) {
  try {
    const config = await getSiteConfig();
    const unavailableResponse = unavailableJsonResponse(config, "publicSharing");
    if (unavailableResponse) return unavailableResponse;

    await connectDB();
    const { id } = await context.params;

    const trip = await Trip.findOne({
      _id: id,
      isPublic: true,
    }).select("-__v");

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, trip });
  } catch (error) {
    console.error("Public trip error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trip" },
      { status: 500 },
    );
  }
}
