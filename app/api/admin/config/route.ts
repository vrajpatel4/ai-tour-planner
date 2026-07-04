import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/app/lib/admin";
import { getSiteConfig, updateSiteConfig } from "@/app/lib/site-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const config = await getSiteConfig();

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Admin access required";

    return NextResponse.json(
      { error: message },
      { status: message === "Authentication required" ? 401 : 403 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const config = await updateSiteConfig(body?.config ?? body, admin.email);

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update site config";
    const status =
      message === "Authentication required"
        ? 401
        : message === "Admin access required"
          ? 403
          : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
