import axios from "axios";
import { withTryCatch } from "@/app/lib/try-catch";
import {
  mergeSiteConfig,
  type SiteConfig,
} from "@/app/lib/site-config-defaults";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "/api"
  // "https://lamiaceous-cristi-semidramatically.ngrok-free.dev/api";

const http = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

type SiteConfigResponse = {
  success?: boolean;
  config?: unknown;
  message?: string;
};

const readSiteConfig = (payload: SiteConfigResponse): SiteConfig => {
  if (!payload || typeof payload !== "object" || !("config" in payload)) {
    throw new Error("Configuration API returned an unexpected response");
  }

  return mergeSiteConfig(payload.config);
};

export const ApiService = {
  getSiteConfig() {
    return withTryCatch(
      async () => readSiteConfig((await http.get<SiteConfigResponse>("/config")).data),
      "Failed to fetch site configuration"
    );
  },

  getAdminSiteConfig() {
    return withTryCatch(
      async () =>
        readSiteConfig((await http.get<SiteConfigResponse>("/admin/config")).data),
      "Failed to fetch admin configuration"
    );
  },

  updateSiteConfig(config: SiteConfig) {
    return withTryCatch(
      async () =>
        (
          await http.post<SiteConfigResponse & { success: boolean }>(
            "/admin/config",
            config
          )
        ).data,
      "Failed to save site configuration"
    );
  },

  getCurrentUser() {
    return withTryCatch(
      async () => (await http.get("/auth/me")).data,
      "Failed to fetch current user"
    );
  },

  getBillingUsage() {
    return withTryCatch(
      async () => (await http.get("/billing/usage")).data,
      "Failed to fetch billing usage"
    );
  },

  sendMessage(message: string, conversationId?: string, tripId?: string) {
    return withTryCatch(
      async () =>
        (await http.post("/chat", { message, conversationId, tripId })).data,
      "Failed to send chat message"
    );
  },

  generateTrip(data: Record<string, unknown>) {
    return withTryCatch(
      async () => (await http.post("/trips/generate", data)).data,
      "Failed to generate trip"
    );
  },

  getTrips(status?: string, page = 1, limit = 10) {
    return withTryCatch(
      async () =>
        (
          await http.get("/trips", {
            params: { status, page, limit },
          })
        ).data,
      "Failed to fetch trips"
    );
  },

  getTrip(id: string) {
    return withTryCatch(
      async () => (await http.get(`/trips/${id}`)).data,
      "Failed to fetch trip"
    );
  },

  getPublicTrip<TResponse = unknown>(id: string) {
    return withTryCatch(
      async () => (await http.get<TResponse>(`/public/trips/${id}`)).data,
      "Failed to fetch shared trip"
    );
  },

  updateTrip(id: string, data: Record<string, unknown>) {
    return withTryCatch(
      async () => (await http.put(`/trips/${id}`, data)).data,
      "Failed to update trip"
    );
  },

  deleteTrip(id: string) {
    return withTryCatch(
      async () => (await http.delete(`/trips/${id}`)).data,
      "Failed to delete trip"
    );
  },

  updateActivity(
    tripId: string,
    activityId: string,
    data: Record<string, unknown>
  ) {
    return withTryCatch(
      async () =>
        (await http.put(`/trips/${tripId}/activities/${activityId}`, data))
          .data,
      "Failed to update activity"
    );
  },
};

export const apiClient = ApiService;
