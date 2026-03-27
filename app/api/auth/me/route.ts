import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
