import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";

import PlanTripClient from "./PlanTripClient";

const Loading = () => (
  <div className="min-h-screen bg-[#f5f9ff] p-4 md:p-8">
    <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
    <div className="mt-4 h-4 w-64 animate-pulse rounded bg-slate-200" />
    <div className="mt-8 grid gap-4 md:grid-cols-2">
      <div className="h-80 animate-pulse rounded-2xl bg-white/80" />
      <div className="h-80 animate-pulse rounded-2xl bg-white/80" />
    </div>
  </div>
);

export default async function Page() {
  const { has } = await auth();
  const hasPremiumPlan = has({ plan: "starter" }) || has({ plan: "pro" });

  return (
    <Suspense fallback={<Loading />}>
      <PlanTripClient hasPremiumPlan={hasPremiumPlan} />
    </Suspense>
  );
}
