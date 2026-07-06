"use client";

import Link from "next/link";
import {
  PricingTable,
  SignedIn,
  SignedOut,
  SignInButton,
} from "@clerk/nextjs";
import { SubscriptionDetailsButton } from "@clerk/nextjs/experimental";

import FeatureUnavailable from "@/app/_component/FeatureUnavailable";
import { useSiteConfig } from "@/app/_component/SiteConfigProvider";
import { PLAN_ORDER } from "@/app/lib/site-config-defaults";
import { Button } from "@/components/ui/button";

export default function PricingPage() {
  const { config } = useSiteConfig();
  const billingEnabled =
    process.env.NEXT_PUBLIC_CLERK_BILLING_ENABLED === "true";
  const pricingFeature = config.features.pricing;

  if (!pricingFeature.enabled) {
    return (
      <FeatureUnavailable
        title={pricingFeature.unavailableTitle}
        message={pricingFeature.unavailableMessage}
      />
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5f9ff]">
      <div className="relative mx-auto max-w-6xl space-y-8 px-4 py-10 md:px-8">
        <div className="flex flex-col gap-3 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
            Billing & Plans
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
            Pick a plan that matches your travel style
          </h1>
          <p className="mx-auto max-w-2xl text-base text-slate-600">
            {config.pricing.billingNote}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {PLAN_ORDER.map((planKey) => {
            const plan = config.pricing.plans[planKey];

            return (
              <div
                key={planKey}
                className="rounded-2xl border bg-white/90 p-5 shadow-sm"
              >
                <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                  {plan.label}
                </p>
                <div className="mt-3 flex items-end gap-1">
                  <span className="text-3xl font-semibold text-slate-900">
                    {config.pricing.currency} {plan.monthlyPrice}
                  </span>
                  <span className="pb-1 text-sm text-slate-500">/ month</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {plan.description}
                </p>
                <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {plan.monthlyCredits} AI credits monthly
                </p>
              </div>
            );
          })}
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
            Billing is disabled. Set NEXT_PUBLIC_CLERK_BILLING_ENABLED=true
            after Clerk billing is configured.
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
