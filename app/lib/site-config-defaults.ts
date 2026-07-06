export type FeatureKey =
  | "aiPlanner"
  | "tripLibrary"
  | "pricing"
  | "maps"
  | "publicSharing"
  | "exports";

export type PlanKey = "free" | "starter" | "pro";

export type FeatureControl = {
  enabled: boolean;
  label: string;
  unavailableTitle: string;
  unavailableMessage: string;
};

export type ThemeConfig = {
  brandName: string;
  tagline: string;
  logoImageUrl: string;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  foregroundColor: string;
  mutedColor: string;
  heroImageUrl: string;
  backgroundImageUrl: string;
  textScale: number;
};

export type HomeConfig = {
  badgeText: string;
  heroTitle: string;
  heroAccent: string;
  subtitle: string;
  promptPlaceholder: string;
  ctaLabel: string;
  signedOutHint: string;
  trustText: string;
  recommendationsTitle: string;
  footerText: string;
};

export type AIConfig = {
  plannerSystemPrompt: string;
  responseGuidelines: string;
  temperature: number;
  maxTokens: number;
  saveGeneratedTrips: boolean;
  suggestedOptions: string[];
};

export type PricingPlanConfig = {
  label: string;
  monthlyPrice: number;
  monthlyCredits: number;
  description: string;
  ctaLabel: string;
};

export type PricingConfig = {
  currency: string;
  billingNote: string;
  plans: Record<PlanKey, PricingPlanConfig>;
};

export type DataConfig = {
  defaultCurrency: string;
  retentionDays: number;
  collectTripImages: boolean;
  analyticsEnabled: boolean;
};

export type SiteStatusConfig = {
  maintenanceMode: boolean;
  headline: string;
  message: string;
  supportUrl: string;
  expectedBackAt: string;
};

export type SiteConfig = {
  version: number;
  updatedAt: string;
  status: SiteStatusConfig;
  features: Record<FeatureKey, FeatureControl>;
  theme: ThemeConfig;
  home: HomeConfig;
  ai: AIConfig;
  pricing: PricingConfig;
  data: DataConfig;
};

export const FEATURE_ORDER: FeatureKey[] = [
  "aiPlanner",
  "tripLibrary",
  "pricing",
  "maps",
  "publicSharing",
  "exports",
];

export const PLAN_ORDER: PlanKey[] = ["free", "starter", "pro"];

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  version: 1,
  updatedAt: "2026-01-01T00:00:00.000Z",
  status: {
    maintenanceMode: false,
    headline: "TravelMate AI is getting a quick upgrade",
    message:
      "We are improving the trip planning experience. Please check back shortly.",
    supportUrl: "",
    expectedBackAt: "",
  },
  features: {
    aiPlanner: {
      enabled: true,
      label: "AI trip planner",
      unavailableTitle: "AI planning is temporarily unavailable",
      unavailableMessage:
        "We are tuning the planner right now. Your saved trips remain available.",
    },
    tripLibrary: {
      enabled: true,
      label: "Trip library",
      unavailableTitle: "Trip library is under maintenance",
      unavailableMessage:
        "Saved trips are paused while we finish a maintenance update.",
    },
    pricing: {
      enabled: true,
      label: "Pricing and billing",
      unavailableTitle: "Plans are being refreshed",
      unavailableMessage:
        "Plan changes are paused while pricing is being updated.",
    },
    maps: {
      enabled: true,
      label: "Map previews",
      unavailableTitle: "Map previews are offline",
      unavailableMessage:
        "Map previews are temporarily disabled. The itinerary details still work.",
    },
    publicSharing: {
      enabled: true,
      label: "Public trip sharing",
      unavailableTitle: "Public sharing is paused",
      unavailableMessage:
        "Public trip links are temporarily disabled for maintenance.",
    },
    exports: {
      enabled: true,
      label: "PDF exports",
      unavailableTitle: "PDF export is paused",
      unavailableMessage:
        "PDF downloads are temporarily disabled while export tools are updated.",
    },
  },
  theme: {
    brandName: "TravelMate AI",
    tagline: "Your smart travel companion",
    logoImageUrl: "",
    primaryColor: "#0f766e",
    accentColor: "#f59e0b",
    backgroundColor: "#f7fbff",
    foregroundColor: "#0f172a",
    mutedColor: "#64748b",
    heroImageUrl:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=2200&auto=format&fit=crop",
    backgroundImageUrl: "",
    textScale: 100,
  },
  home: {
    badgeText: "AI powered travel assistant",
    heroTitle: "Plan your next trip",
    heroAccent: "with smarter AI",
    subtitle:
      "Tell us your destination, budget, duration, and travel style. TravelMate AI builds a practical itinerary tailored to you.",
    promptPlaceholder:
      "Example: 5 days in Paris under INR 80,000 with cafes, museums, and romantic places",
    ctaLabel: "Generate my travel plan",
    signedOutHint: "Login is required before generating a plan.",
    trustText: "Trusted by travelers planning smarter journeys.",
    recommendationsTitle: "Popular AI recommendations",
    footerText: "2026 TravelMate AI. Your smart travel companion.",
  },
  ai: {
    plannerSystemPrompt:
      "Act as a premium travel planner. Prefer realistic routes, local experiences, clear budgets, and practical day-by-day pacing.",
    responseGuidelines:
      "Keep responses warm, concise, and decision-oriented. Ask one clear follow-up question when details are missing.",
    temperature: 0.7,
    maxTokens: 1000,
    saveGeneratedTrips: true,
    suggestedOptions: ["India", "Maldives", "Dubai", "Bali", "Thailand"],
  },
  pricing: {
    currency: "INR",
    billingNote:
      "Prices can be edited here for your own pricing presentation. Clerk plan IDs still come from the Clerk dashboard.",
    plans: {
      free: {
        label: "Free",
        monthlyPrice: 0,
        monthlyCredits: 10,
        description: "Try AI trip planning with basic monthly credits.",
        ctaLabel: "Start free",
      },
      starter: {
        label: "Starter",
        monthlyPrice: 499,
        monthlyCredits: 60,
        description: "For regular travelers who want more planning room.",
        ctaLabel: "Upgrade to Starter",
      },
      pro: {
        label: "Pro",
        monthlyPrice: 1499,
        monthlyCredits: 200,
        description: "For power users planning detailed multi-city trips.",
        ctaLabel: "Go Pro",
      },
    },
  },
  data: {
    defaultCurrency: "INR",
    retentionDays: 365,
    collectTripImages: true,
    analyticsEnabled: false,
  },
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const asString = (value: unknown, fallback: string) =>
  typeof value === "string" ? value : fallback;

const asBoolean = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

const asNumber = (
  value: unknown,
  fallback: number,
  min?: number,
  max?: number,
) => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const withMin = min === undefined ? parsed : Math.max(min, parsed);
  return max === undefined ? withMin : Math.min(max, withMin);
};

const mergeFeature = (
  value: unknown,
  fallback: FeatureControl,
): FeatureControl => {
  if (!isRecord(value)) return fallback;
  return {
    enabled: asBoolean(value.enabled, fallback.enabled),
    label: asString(value.label, fallback.label),
    unavailableTitle: asString(
      value.unavailableTitle,
      fallback.unavailableTitle,
    ),
    unavailableMessage: asString(
      value.unavailableMessage,
      fallback.unavailableMessage,
    ),
  };
};

const mergePlan = (
  value: unknown,
  fallback: PricingPlanConfig,
): PricingPlanConfig => {
  if (!isRecord(value)) return fallback;
  return {
    label: asString(value.label, fallback.label),
    monthlyPrice: asNumber(value.monthlyPrice, fallback.monthlyPrice, 0),
    monthlyCredits: Math.round(
      asNumber(value.monthlyCredits, fallback.monthlyCredits, 0),
    ),
    description: asString(value.description, fallback.description),
    ctaLabel: asString(value.ctaLabel, fallback.ctaLabel),
  };
};

export function mergeSiteConfig(value?: unknown): SiteConfig {
  const source = isRecord(value) ? value : {};
  const status = isRecord(source.status) ? source.status : {};
  const theme = isRecord(source.theme) ? source.theme : {};
  const home = isRecord(source.home) ? source.home : {};
  const ai = isRecord(source.ai) ? source.ai : {};
  const pricing = isRecord(source.pricing) ? source.pricing : {};
  const pricingPlans = isRecord(pricing.plans) ? pricing.plans : {};
  const data = isRecord(source.data) ? source.data : {};
  const features = isRecord(source.features) ? source.features : {};

  return {
    version: Math.round(asNumber(source.version, DEFAULT_SITE_CONFIG.version, 1)),
    updatedAt: asString(source.updatedAt, DEFAULT_SITE_CONFIG.updatedAt),
    status: {
      maintenanceMode: asBoolean(
        status.maintenanceMode,
        DEFAULT_SITE_CONFIG.status.maintenanceMode,
      ),
      headline: asString(status.headline, DEFAULT_SITE_CONFIG.status.headline),
      message: asString(status.message, DEFAULT_SITE_CONFIG.status.message),
      supportUrl: asString(
        status.supportUrl,
        DEFAULT_SITE_CONFIG.status.supportUrl,
      ),
      expectedBackAt: asString(
        status.expectedBackAt,
        DEFAULT_SITE_CONFIG.status.expectedBackAt,
      ),
    },
    features: FEATURE_ORDER.reduce(
      (next, key) => ({
        ...next,
        [key]: mergeFeature(features[key], DEFAULT_SITE_CONFIG.features[key]),
      }),
      {} as Record<FeatureKey, FeatureControl>,
    ),
    theme: {
      brandName: asString(theme.brandName, DEFAULT_SITE_CONFIG.theme.brandName),
      tagline: asString(theme.tagline, DEFAULT_SITE_CONFIG.theme.tagline),
      logoImageUrl: asString(
        theme.logoImageUrl,
        DEFAULT_SITE_CONFIG.theme.logoImageUrl,
      ),
      primaryColor: asString(
        theme.primaryColor,
        DEFAULT_SITE_CONFIG.theme.primaryColor,
      ),
      accentColor: asString(
        theme.accentColor,
        DEFAULT_SITE_CONFIG.theme.accentColor,
      ),
      backgroundColor: asString(
        theme.backgroundColor,
        DEFAULT_SITE_CONFIG.theme.backgroundColor,
      ),
      foregroundColor: asString(
        theme.foregroundColor,
        DEFAULT_SITE_CONFIG.theme.foregroundColor,
      ),
      mutedColor: asString(theme.mutedColor, DEFAULT_SITE_CONFIG.theme.mutedColor),
      heroImageUrl: asString(
        theme.heroImageUrl,
        DEFAULT_SITE_CONFIG.theme.heroImageUrl,
      ),
      backgroundImageUrl: asString(
        theme.backgroundImageUrl,
        DEFAULT_SITE_CONFIG.theme.backgroundImageUrl,
      ),
      textScale: asNumber(theme.textScale, DEFAULT_SITE_CONFIG.theme.textScale, 85, 120),
    },
    home: {
      badgeText: asString(home.badgeText, DEFAULT_SITE_CONFIG.home.badgeText),
      heroTitle: asString(home.heroTitle, DEFAULT_SITE_CONFIG.home.heroTitle),
      heroAccent: asString(home.heroAccent, DEFAULT_SITE_CONFIG.home.heroAccent),
      subtitle: asString(home.subtitle, DEFAULT_SITE_CONFIG.home.subtitle),
      promptPlaceholder: asString(
        home.promptPlaceholder,
        DEFAULT_SITE_CONFIG.home.promptPlaceholder,
      ),
      ctaLabel: asString(home.ctaLabel, DEFAULT_SITE_CONFIG.home.ctaLabel),
      signedOutHint: asString(
        home.signedOutHint,
        DEFAULT_SITE_CONFIG.home.signedOutHint,
      ),
      trustText: asString(home.trustText, DEFAULT_SITE_CONFIG.home.trustText),
      recommendationsTitle: asString(
        home.recommendationsTitle,
        DEFAULT_SITE_CONFIG.home.recommendationsTitle,
      ),
      footerText: asString(home.footerText, DEFAULT_SITE_CONFIG.home.footerText),
    },
    ai: {
      plannerSystemPrompt: asString(
        ai.plannerSystemPrompt,
        DEFAULT_SITE_CONFIG.ai.plannerSystemPrompt,
      ),
      responseGuidelines: asString(
        ai.responseGuidelines,
        DEFAULT_SITE_CONFIG.ai.responseGuidelines,
      ),
      temperature: asNumber(
        ai.temperature,
        DEFAULT_SITE_CONFIG.ai.temperature,
        0,
        1.5,
      ),
      maxTokens: Math.round(
        asNumber(ai.maxTokens, DEFAULT_SITE_CONFIG.ai.maxTokens, 200, 4000),
      ),
      saveGeneratedTrips: asBoolean(
        ai.saveGeneratedTrips,
        DEFAULT_SITE_CONFIG.ai.saveGeneratedTrips,
      ),
      suggestedOptions: Array.isArray(ai.suggestedOptions)
        ? ai.suggestedOptions
            .filter((item): item is string => typeof item === "string")
            .slice(0, 12)
        : DEFAULT_SITE_CONFIG.ai.suggestedOptions,
    },
    pricing: {
      currency: asString(pricing.currency, DEFAULT_SITE_CONFIG.pricing.currency),
      billingNote: asString(
        pricing.billingNote,
        DEFAULT_SITE_CONFIG.pricing.billingNote,
      ),
      plans: PLAN_ORDER.reduce(
        (next, key) => ({
          ...next,
          [key]: mergePlan(
            pricingPlans[key],
            DEFAULT_SITE_CONFIG.pricing.plans[key],
          ),
        }),
        {} as Record<PlanKey, PricingPlanConfig>,
      ),
    },
    data: {
      defaultCurrency: asString(
        data.defaultCurrency,
        DEFAULT_SITE_CONFIG.data.defaultCurrency,
      ),
      retentionDays: Math.round(
        asNumber(
          data.retentionDays,
          DEFAULT_SITE_CONFIG.data.retentionDays,
          1,
        ),
      ),
      collectTripImages: asBoolean(
        data.collectTripImages,
        DEFAULT_SITE_CONFIG.data.collectTripImages,
      ),
      analyticsEnabled: asBoolean(
        data.analyticsEnabled,
        DEFAULT_SITE_CONFIG.data.analyticsEnabled,
      ),
    },
  };
}

export function getFeatureUnavailableCopy(
  config: SiteConfig,
  featureKey: FeatureKey,
) {
  const feature = config.features[featureKey];
  return {
    title: feature.unavailableTitle,
    message: feature.unavailableMessage,
  };
}
