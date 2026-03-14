"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ApiService } from "@/app/lib/api-client";
import ChatBox, { UiMessage } from "../plan-trip-new/_component/ChatBox";

type TripPlan = {
  title?: string;
  destination?: string;
  duration?: string;
  budget?: string;
  summary?: string;
  highlights?: string[];
  days?: { day: number; title: string; activities: string[] }[];
};

type Response = {
  success: boolean;
  response: string;
  conversationId?: string;
  suggestions?: string[];
  ai?: {
    status?: "collecting" | "ready";
    message?: string;
    questions?: { question: string; options?: string[] }[];
    tripPlan?: TripPlan;
  };
};

export default function PlanTripPage() {
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      id: "init",
      role: "assistant",
      content: "Hi! Tell me where you'd like to travel.",
      options: ["Bali", "Dubai", "Maldives", "Thailand"],
    },
  ]);

  const [input, setInput] = useState("");
  const [tripPlan, setTripPlan] = useState<TripPlan | null>(null);
  const [conversationId, setConversationId] = useState<string>();

  const sendMutation = useMutation<Response, Error, string>({
    mutationFn: (text) =>
      ApiService.sendMessage(text, conversationId) as Promise<Response>,

    onSuccess: (res) => {
      setConversationId(res.conversationId);

      const options =
        res.ai?.questions?.flatMap((q) => q.options || []) ||
        res.suggestions ||
        [];

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: res.ai?.message || res.response,
          options,
        },
      ]);

      if (res.ai?.tripPlan) {
        setTripPlan(res.ai.tripPlan);
      }
    },
  });

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    setMessages((p) => [
      ...p,
      { id: crypto.randomUUID(), role: "user", content: text },
    ]);

    setInput("");

    sendMutation.mutate(text);
  };

  return (
    <div className="p-6 grid md:grid-cols-2 gap-6 min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <ChatBox
        messages={messages}
        input={input}
        loading={sendMutation.isPending}
        onInputChange={setInput}
        onSend={() => sendMessage(input)}
        onOptionSelect={sendMessage}
      />

      <TripPanel tripPlan={tripPlan} />
    </div>
  );
}

function TripPanel({ tripPlan }: { tripPlan: TripPlan | null }) {
  if (!tripPlan)
    return (
      <div className="rounded-3xl border bg-white p-6">
        <h2 className="text-lg font-semibold mb-2">Trip Plan</h2>
        <p className="text-sm text-gray-500">
          Your itinerary will appear here after AI collects details.
        </p>
      </div>
    );

  return (
    <div className="rounded-3xl border bg-white p-6 space-y-4">
      <h2 className="text-xl font-semibold">{tripPlan.title}</h2>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <Info label="Destination" value={tripPlan.destination} />
        <Info label="Duration" value={tripPlan.duration} />
        <Info label="Budget" value={tripPlan.budget} />
      </div>

      {tripPlan.summary && (
        <p className="text-sm text-gray-600">{tripPlan.summary}</p>
      )}

      {tripPlan.highlights?.length && (
        <div className="flex flex-wrap gap-2">
          {tripPlan.highlights.map((h) => (
            <span
              key={h}
              className="px-2 py-1 text-xs bg-slate-100 rounded-full"
            >
              {h}
            </span>
          ))}
        </div>
      )}

      {tripPlan.days?.map((day) => (
        <div key={day.day} className="border rounded-xl p-3">
          <h4 className="font-medium">
            Day {day.day} — {day.title}
          </h4>

          <ul className="text-sm mt-2 list-disc pl-5">
            {day.activities.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-medium">{value || "-"}</div>
    </div>
  );
}