import { NextResponse } from "next/server";

import { connectDB } from "./db";
import SiteConfigModel from "./models/SiteConfig";
import {
  DEFAULT_SITE_CONFIG,
  type FeatureKey,
  getFeatureUnavailableCopy,
  mergeSiteConfig,
  type SiteConfig,
} from "./site-config-defaults";

const CONFIG_KEY = "global";

export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    await connectDB();
    const record = await SiteConfigModel.findOne({ key: CONFIG_KEY }).lean<{
      config?: unknown;
    }>();

    return mergeSiteConfig(record?.config);
  } catch (error) {
    console.error("Site config fallback:", error);
    return DEFAULT_SITE_CONFIG;
  }
}

export async function updateSiteConfig(
  nextConfig: unknown,
  updatedBy = "",
): Promise<SiteConfig> {
  await connectDB();

  const config = mergeSiteConfig({
    ...(typeof nextConfig === "object" && nextConfig ? nextConfig : {}),
    updatedAt: new Date().toISOString(),
  });

  await SiteConfigModel.findOneAndUpdate(
    { key: CONFIG_KEY },
    {
      key: CONFIG_KEY,
      config,
      updatedBy,
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
    },
  );

  return config;
}

export function getUnavailablePayload(
  config: SiteConfig,
  featureKey?: FeatureKey,
) {
  if (config.status.maintenanceMode) {
    return {
      error: config.status.headline,
      message: config.status.message,
      code: "SITE_MAINTENANCE",
      expectedBackAt: config.status.expectedBackAt || null,
      supportUrl: config.status.supportUrl || null,
    };
  }

  if (featureKey && !config.features[featureKey].enabled) {
    const copy = getFeatureUnavailableCopy(config, featureKey);
    return {
      error: copy.title,
      message: copy.message,
      code: "FEATURE_UNAVAILABLE",
      feature: featureKey,
    };
  }

  return null;
}

export function unavailableJsonResponse(
  config: SiteConfig,
  featureKey?: FeatureKey,
) {
  const payload = getUnavailablePayload(config, featureKey);
  return payload ? NextResponse.json(payload, { status: 503 }) : null;
}
