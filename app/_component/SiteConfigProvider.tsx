"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  DEFAULT_SITE_CONFIG,
  mergeSiteConfig,
  type SiteConfig,
} from "@/app/lib/site-config-defaults";
import { ApiService } from "@/app/lib/api-client";

type SiteConfigContextValue = {
  config: SiteConfig;
  loading: boolean;
  refresh: () => Promise<void>;
};

const SiteConfigContext = createContext<SiteConfigContextValue>({
  config: DEFAULT_SITE_CONFIG,
  loading: true,
  refresh: async () => undefined,
});

const applyTheme = (config: SiteConfig) => {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  const textScale = `${config.theme.textScale}%`;

  root.style.setProperty("--site-primary", config.theme.primaryColor);
  root.style.setProperty("--site-accent", config.theme.accentColor);
  root.style.setProperty("--site-background", config.theme.backgroundColor);
  root.style.setProperty("--site-foreground", config.theme.foregroundColor);
  root.style.setProperty("--site-muted", config.theme.mutedColor);
  root.style.setProperty("--site-text-scale", textScale);
  root.style.setProperty("--primary", config.theme.primaryColor);
  root.style.setProperty("--ring", config.theme.primaryColor);
  root.style.setProperty("--background", config.theme.backgroundColor);
  root.style.setProperty("--foreground", config.theme.foregroundColor);
  root.style.fontSize = textScale;
};

export function SiteConfigProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const nextConfig = await ApiService.getSiteConfig();
      setConfig(mergeSiteConfig(nextConfig));
    } catch (error) {
      console.error("Unable to load site config:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    applyTheme(config);
  }, [config]);

  const value = useMemo(
    () => ({
      config,
      loading,
      refresh,
    }),
    [config, loading, refresh],
  );

  return (
    <SiteConfigContext.Provider value={value}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export const useSiteConfig = () => useContext(SiteConfigContext);
