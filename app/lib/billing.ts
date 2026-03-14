import { auth } from "@clerk/nextjs/server";
import User from "@/app/lib/models/User";

export type PlanKey = "free" | "starter" | "pro";

export const PLAN_DEFINITIONS: Record<
  PlanKey,
  { clerkPlanId: string; label: string; monthlyCredits: number }
> = {
  free: {
    // Make sure the plan IDs match the Clerk Dashboard plan slugs.
    clerkPlanId: "free",
    label: "Free",
    monthlyCredits: 10,
  },
  starter: {
    clerkPlanId: "starter",
    label: "Starter",
    monthlyCredits: 60,
  },
  pro: {
    clerkPlanId: "pro",
    label: "Pro",
    monthlyCredits: 200,
  },
};

const PLAN_PRIORITY: PlanKey[] = ["pro", "starter", "free"];

const buildNextResetAt = (from: Date) => {
  const next = new Date(from);
  next.setMonth(next.getMonth() + 1);
  return next;
};

export type BillingState = {
  planKey: PlanKey;
  limit: number;
  used: number;
  remaining: number;
  resetAt: Date | null;
};

export async function resolvePlanKey(): Promise<PlanKey> {
  const { userId, has } = await auth();
  if (!userId) return "free";

  for (const planKey of PLAN_PRIORITY) {
    if (planKey === "free") break;
    const planId = PLAN_DEFINITIONS[planKey].clerkPlanId;
    if (has({ plan: planId })) {
      return planKey;
    }
  }

  return "free";
}

export async function ensureBillingState(user: any): Promise<BillingState> {
  const planKey = await resolvePlanKey();
  const limit = PLAN_DEFINITIONS[planKey].monthlyCredits;
  const now = new Date();
  const currentPlan = user?.billing?.plan || "free";

  let used = user?.credits?.used ?? 0;
  let resetAt = user?.credits?.resetAt
    ? new Date(user.credits.resetAt)
    : null;

  const needsReset =
    !resetAt || resetAt <= now || currentPlan !== planKey;

  if (needsReset) {
    used = 0;
    resetAt = buildNextResetAt(now);
  }

  const shouldSave =
    needsReset || currentPlan !== planKey || user?.credits?.used === undefined;

  if (shouldSave) {
    user.billing = {
      ...(user.billing || {}),
      plan: planKey,
      updatedAt: now,
    };
    user.credits = {
      ...(user.credits || {}),
      used,
      resetAt,
    };
    await user.save();
  }

  return {
    planKey,
    limit,
    used,
    remaining: Math.max(0, limit - used),
    resetAt,
  };
}

export async function reserveCredits(user: any, amount = 1) {
  const state = await ensureBillingState(user);

  if (state.remaining < amount) {
    return { allowed: false, ...state };
  }

  user.credits.used = (user.credits?.used ?? 0) + amount;
  await user.save();

  const remaining = Math.max(0, state.limit - user.credits.used);

  return {
    allowed: true,
    planKey: state.planKey,
    limit: state.limit,
    used: user.credits.used,
    remaining,
    resetAt: state.resetAt,
  };
}

export async function refundCredits(userId: string, amount = 1) {
  await User.updateOne(
    { _id: userId, "credits.used": { $gte: amount } },
    { $inc: { "credits.used": -amount } },
  );
}
