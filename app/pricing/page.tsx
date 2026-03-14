"use client";

import Link from "next/link";
import {
  PricingTable,
  SignedIn,
  SignedOut,
  SignInButton,
} from "@clerk/nextjs";
import { SubscriptionDetailsButton } from "@clerk/nextjs/experimental";
import { Button } from "@/components/ui/button";

export default function PricingPage() {
  const billingEnabled =
    process.env.NEXT_PUBLIC_CLERK_BILLING_ENABLED === "true";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5f9ff]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-20 h-96 w-96 rounded-full bg-cyan-300/35 blur-3xl" />
        <div className="absolute top-20 right-0 h-80 w-80 rounded-full bg-blue-300/30 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl space-y-8 px-4 py-10 md:px-8">
        <div className="flex flex-col gap-3 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
            Billing & Plans
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
            Pick a plan that matches your travel style
          </h1>
          <p className="text-base text-slate-600">
            Upgrade anytime to unlock more AI prompts and premium trip planning.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/plan-trip-new">Start planning</Link>
          </Button>
          <SignedOut>
            <SignInButton mode="modal">
              <Button>Sign in to subscribe</Button>
            </SignInButton>
          </SignedOut>
          {billingEnabled && (
            <SignedIn>
              <SubscriptionDetailsButton>
                <Button variant="outline">Manage subscription</Button>
              </SubscriptionDetailsButton>
            </SignedIn>
          )}
        </div>

        {!billingEnabled && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Billing is disabled. Enable billing in Clerk and set
            NEXT_PUBLIC_CLERK_BILLING_ENABLED=true to show subscription plans.
          </div>
        )}

        {billingEnabled && (
          <div className="rounded-3xl border bg-white/90 p-6 shadow-lg">
            <PricingTable
              for="user"
              newSubscriptionRedirectUrl="/plan-trip-new"
            />
          </div>
        )}
      </div>
    </div>
  );
}
