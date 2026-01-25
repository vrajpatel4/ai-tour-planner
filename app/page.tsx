"use client";

import { useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Stars } from "lucide-react";
import { Card, Carousel } from "@/components/ui/apple-cards-carousel";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user } = useUser();
  const [query, setQuery] = useState("");
  const { openSignIn } = useClerk();

  const handleGenerate = () => {
    if (!user) {
      openSignIn()
      return;
    }

    console.log("Send to AI:", query);
  };

  const DummyContent = () => {
    return (
      <>
        {[...new Array(3).fill(1)].map((_, index) => {
          return (
            <div
              key={"dummy-content" + index}
              className="bg-[#F5F5F7] dark:bg-neutral-800 p-8 md:p-14 rounded-3xl mb-4"
            >
              <p className="text-neutral-600 dark:text-neutral-400 text-base md:text-2xl font-sans max-w-3xl mx-auto">
                <span className="font-bold text-neutral-700 dark:text-neutral-200">
                  The first rule of Apple club is that you boast about Apple
                  club.
                </span>{" "}
                Keep a journal, quickly jot down a grocery list, and take
                amazing class notes. Want to convert those notes to text? No
                problem. Langotiya jeetu ka mara hua yaar is ready to capture
                every thought.
              </p>
              <img
                src="https://assets.aceternity.com/macbook.png"
                alt="Macbook mockup from Aceternity UI"
                height="500"
                width="500"
                className="md:w-1/2 md:h-1/2 h-full w-full mx-auto object-contain"
              />
            </div>
          );
        })}
      </>
    );
  };

  const suggestedPlaces = [
    {
      category: "Artificial Intelligence",
      title: "You can do more with AI.",
      src: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?q=80&w=3556&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      content: <DummyContent />,
    },
    {
      category: "Productivity",
      title: "Enhance your productivity.",
      src: "https://images.unsplash.com/photo-1531554694128-c4c6665f59c2?q=80&w=3387&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      content: <DummyContent />,
    },
    {
      category: "Product",
      title: "Launching the new Apple Vision Pro.",
      src: "https://images.unsplash.com/photo-1713869791518-a770879e60dc?q=80&w=2333&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      content: <DummyContent />,
    },

    {
      category: "Product",
      title: "Maps for your iPhone 15 Pro Max.",
      src: "https://images.unsplash.com/photo-1599202860130-f600f4948364?q=80&w=2515&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      content: <DummyContent />,
    },
    {
      category: "iOS",
      title: "Photography just got better.",
      src: "https://images.unsplash.com/photo-1602081957921-9137a5d6eaee?q=80&w=2793&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      content: <DummyContent />,
    },
    {
      category: "Hiring",
      title: "Hiring for a Staff Software Engineer",
      src: "https://images.unsplash.com/photo-1511984804822-e16ba72f5848?q=80&w=2048&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      content: <DummyContent />,
    },
  ];

  const cards = suggestedPlaces.map((card, index) => (
    <Card key={card.title} card={card} index={index} />
  ));

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-100 via-white to-white relative overflow-hidden">
      {/* Animated Background Shapes */}
      <div className="absolute top-10 -left-10 w-60 h-60 bg-sky-200 rounded-full blur-3xl opacity-40" />
      <div className="absolute bottom-10 right-0 w-72 h-72 bg-blue-200 rounded-full blur-3xl opacity-40" />

      {/* Hero Section */}
      <section className="text-center mt-6 px-5 md:px-20 relative z-10">
        <div className="flex justify-center">
          <div className="flex items-center gap-2 px-4 py-2 bg-white shadow rounded-full mb-4 border">
            <Stars className="text-yellow-500" size={18} />
            <p className="text-sm font-medium">AI Powered Travel Assistant</p>
          </div>
        </div>

        <h2 className="text-4xl md:text-6xl font-bold leading-tight">
          Plan Your Next Trip
          <span className="text-sky-600"> Effortlessly With AI</span>
        </h2>

        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Tell us your dream destination, budget, duration or travel style. Our
          AI builds the smartest travel plan tailored just for you.
        </p>

        {/* Glass Card */}
        <div className="max-w-3xl mx-auto mt-8 bg-white/70 backdrop-blur-xl border shadow-xl rounded-2xl p-6">
          <Textarea
            placeholder="Example: 5 days trip to Paris under ₹80,000 with cafes, museums & romantic places"
            className="h-32 text-lg"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <Button
            onClick={handleGenerate}
            className="w-full mt-4 bg-sky-600 hover:bg-sky-700 text-lg h-12"
          >
            ✈️ Generate My Travel Plan
          </Button>

          {!user && (
            <p className="text-center text-sm text-gray-500 mt-2">
              Login required before generating a plan.
            </p>
          )}
        </div>

        {/* Trust Section */}
        <p className="mt-6 text-gray-500">Trusted by travelers worldwide 🌍</p>
      </section>

      {/* Suggested Places */}
      <section className="mt-16 px-8 relative z-10">
        <h3 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <MapPin className="text-red-500" />
          Popular AI Recommendations
        </h3>

        <div>
          <Carousel initialScroll={40} items={cards} />
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-20 py-10 text-center text-gray-500">
        © 2025 TravelMate AI — Your Smart Travel Companion
      </footer>
    </main>
  );
}
