import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/lib/admin";
import { updateSiteConfig } from "@/app/lib/site-config";

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const admin = await requireAdmin();
    
    const body = await request.json();
    
    // Update the site configuration
    const updatedConfig = await updateSiteConfig(body, admin.email);
    
    return NextResponse.json({ 
      success: true, 
      config: updatedConfig,
      message: "Configuration updated successfully" 
    });
  } catch (error) {
    console.error("Error updating site config:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to update configuration" 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin();
    
    // Return the current configuration
    const { getSiteConfig } = await import("@/app/lib/site-config");
    const config = await getSiteConfig();
    
    return NextResponse.json({ config });
  } catch (error) {
    console.error("Error fetching site config:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to fetch configuration" 
      },
      { status: 500 }
    );
  }
}