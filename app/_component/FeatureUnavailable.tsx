"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";

type FeatureUnavailableProps = {
  title: string;
  message: string;
  actionHref?: string;
  actionLabel?: string;
  compact?: boolean;
};

export default function FeatureUnavailable({
  title,
  message,
  actionHref = "/",
  actionLabel = "Back home",
  compact = false,
}: FeatureUnavailableProps) {
  return (
    <div
      className={
        compact
          ? "rounded-lg border bg-white/90 p-4 text-sm shadow-sm"
          : "grid min-h-[calc(100vh-72px)] place-items-center bg-[var(--site-background)] px-4 py-12 text-[var(--site-foreground)]"
      }
    >
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border bg-white shadow-sm">
          {compact ? <AlertTriangle size={20} /> : <Wrench size={22} />}
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight md:text-3xl">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">
          {message}
        </p>
        {!compact && (
          <Button asChild className="mt-6">
            <Link href={actionHref}>
              <ArrowLeft />
              {actionLabel}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
