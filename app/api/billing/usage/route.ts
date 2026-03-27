import { NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/auth";
import { ensureBillingState, PLAN_DEFINITIONS } from "@/app/lib/billing";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAuth();
    const billing = await ensureBillingState(user);
    const plan = PLAN_DEFINITIONS[billing.planKey];

    return NextResponse.json({
      success: true,
      planKey: billing.planKey,
      planLabel: plan.label,
      creditLimit: billing.limit,
      creditsUsed: billing.used,
      creditsRemaining: billing.remaining,
      resetAt: billing.resetAt ? billing.resetAt.toISOString() : null,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json(
      { error: errorMessage },
      { status: errorMessage === "Authentication required" ? 401 : 500 },
    );
  }
}
