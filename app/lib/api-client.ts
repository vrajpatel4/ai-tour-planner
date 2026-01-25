// app/lib/api-client.ts
const API_BASE = '/api';

export const apiClient = {
  // Authentication
  async getCurrentUser() {
    const response = await fetch(`${API_BASE}/auth/me`);
    return response.json();
  },

  // Chat
  async sendMessage(message: string, conversationId?: string, tripId?: string) {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, conversationId, tripId }),
    });
    return response.json();
  },

  // Trips
  async generateTrip(data: any) {
    const response = await fetch(`${API_BASE}/trips/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async getTrips(status?: string, page = 1, limit = 10) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status) params.append('status', status);

    const response = await fetch(`${API_BASE}/trips?${params.toString()}`);
    return response.json();
  },

  async getTrip(id: string) {
    const response = await fetch(`${API_BASE}/trips/${id}`);
    return response.json();
  },

  async updateTrip(id: string, data: any) {
    const response = await fetch(`${API_BASE}/trips/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async deleteTrip(id: string) {
    const response = await fetch(`${API_BASE}/trips/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  // Activities
  async updateActivity(tripId: string, activityId: string, data: any) {
    const response = await fetch(`${API_BASE}/trips/${tripId}/activities/${activityId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },
};