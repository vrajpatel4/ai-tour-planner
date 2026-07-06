"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSiteConfig } from "./SiteConfigProvider";

export default function MaintenanceGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { config } = useSiteConfig();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (!config.status.maintenanceMode || isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <main
      className="grid min-h-screen place-items-center px-4 py-12 text-[var(--site-foreground)]"
      style={{
        backgroundColor: config.theme.backgroundColor,
        backgroundImage: config.theme.backgroundImageUrl
          ? `linear-gradient(rgba(247, 251, 255, 0.88), rgba(247, 251, 255, 0.95)), url(${config.theme.backgroundImageUrl})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <section className="w-full max-w-2xl text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border bg-white shadow-sm">
          <Settings size={24} style={{ color: config.theme.primaryColor }} />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          {config.theme.brandName}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
          {config.status.headline}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
          {config.status.message}
        </p>

        {(config.status.expectedBackAt || config.status.supportUrl) && (
          <div className="mx-auto mt-6 flex max-w-xl flex-wrap flex-col items-center justify-center gap-3 text-sm text-slate-600">
            {config.status.expectedBackAt && (
              <span className="inline-flex items-center gap-2 rounded-full border bg-white/90 px-3 py-1">
                <Clock size={14} />
                Back around {config.status.expectedBackAt}
              </span>
            )}
            {config.status.supportUrl && (
              <Button asChild variant="outline" size="sm">
                <Link href={config.status.supportUrl}>Contact support</Link>
              </Button>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
