"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Send,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Sparkles,
  Hotel,
  UtensilsCrossed,
  Navigation,
  Star,
  Download,
  Share2,
  ThumbsUp,
  MessageSquare,
  Bookmark,
  Clock,
  TrendingUp,
  AlertCircle,
  Check,
  ChevronRight,
  ChevronDown,
  Zap,
  Globe,
  Sun,
  Umbrella,
} from "lucide-react";
import { apiClient } from "@/app/lib/api-client";
import { useUser } from "@clerk/nextjs";
import { initialItineraryData } from "@/constants/dummyData";

export default function TripPage() {
  const [messages, setMessages] = useState([
    {
      from: "ai",
      text: "Hello! I'm your AI travel assistant. I can help you plan the perfect trip. Just tell me where you want to go, your dates, budget, and what kind of experience you're looking for! 🌍✨",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestions: [
        "Plan a beach vacation",
        "Weekend getaway ideas",
        "Budget backpacking trip",
        "Family-friendly destinations"
      ]
    },
  ]);
  const [query, setQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState("itinerary");
  const [showResults, setShowResults] = useState(false);
  const [planGenerated, setPlanGenerated] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number>(0);
  const [itineraryData,setItineraryData] = useState(initialItineraryData)
  const [currentConversationId,setCurrentConversationId] = useState("")

  // const handleSend = async () => {
  //   if (!query.trim()) return;
    
  //   const userMessage = {
  //     from: "user",
  //     text: query,
  //     timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  //   };
    
  //   setMessages([...messages, userMessage]);
  //   setQuery("");
  //   setLoading(true);

  //   setTimeout(() => {
  //     const aiResponse = {
  //       from: "ai",
  //       text: "Perfect! I've analyzed your preferences and created a comprehensive 5-day itinerary for Goa. I've included beachfront accommodations, exciting water activities, cultural experiences, and delicious dining options - all within your budget of ₹30,000. Check out the detailed plan on the right! 🏖️☀️",
  //       timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  //       suggestions: [
  //         "Add more activities",
  //         "Change accommodation",
  //         "Adjust budget",
  //         "Extend trip duration"
  //       ]
  //     };
      
  //     setMessages((prev) => [...prev, aiResponse]);
  //     setLoading(false);
  //     setShowResults(true);
  //     setPlanGenerated(true);
  //   }, 2000);
  // };

  const handleSuggestionClick = (suggestion:string) => {
    setQuery(suggestion);
  };

  const toggleDay = (dayIndex:number) => {
    setExpandedDay(expandedDay === dayIndex ? 0 : dayIndex);
  };

  const { isSignedIn } = useUser();
  const [loading, setLoading] = useState(false);
  const [_userTrips, setUserTrips] = useState<any[]>([]);

  // Fetch user trips on load
  useEffect(() => {
    if (isSignedIn) {
      fetchUserTrips();
    }
  }, [isSignedIn]);

  const fetchUserTrips = async () => {
    try {
      const response = await apiClient.getTrips();
      if (response.success) {
        setUserTrips(response.trips);
      }
    } catch (error) {
      console.error("Failed to fetch trips:", error);
    }
  };

  const handleSend = async () => {
    if (!query.trim()) return;
    
    // Add user message to UI immediately
    const userMessage = {
      from: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    setMessages((prevState:any) => {
      return [
        ...prevState,
        userMessage
      ]
    });
    setQuery("");
    setLoading(true);

    try {
      // Send to backend API
      const response = await apiClient.sendMessage(query, currentConversationId);
      
      if (response.success) {
        const aiResponse = {
          from: "ai",
          text: response.response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestions: response.suggestions || []
        };
        
        setMessages((prev) => [...prev, aiResponse]);
        setCurrentConversationId(response.conversationId);
        
        // Check if AI generated a trip
        if (response.tripGenerated) {
          setShowResults(true);
          fetchUserTrips(); // Refresh trips list
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      // Fallback to mock response
      const aiResponse = {
        from: "ai",
        text: "Perfect! I've analyzed your preferences and created a comprehensive 5-day itinerary for Goa. I've included beachfront accommodations, exciting water activities, cultural experiences, and delicious dining options - all within your budget of ₹30,000. Check out the detailed plan on the right! 🏖️☀️",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestions: [
          "Add more activities",
          "Change accommodation",
          "Adjust budget",
          "Extend trip duration"
        ]
      };
      setMessages((prev) => [...prev, aiResponse]);
      setShowResults(true);
    } finally {
      setLoading(false);
    }
  };

  // Generate trip from form
  const handleGenerateTrip = async (tripData: any) => {
    try {
      setLoading(true);
      const response = await apiClient.generateTrip(tripData);
      
      if (response.success) {
        // Update UI with generated trip
        setItineraryData(response.trip.days);
        setShowResults(true);
        fetchUserTrips();
      }
    } catch (error) {
      console.error("Trip generation error:", error);
      alert("Failed to generate trip. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    {
      icon: "🏖️",
      title: "Beach Escape",
      prompt: "Plan a 5-day beach vacation to Goa for 2 people under ₹30,000"
    },
    {
      icon: "🏔️",
      title: "Mountain Adventure",
      prompt: "Weekend mountain getaway in Himachal Pradesh for adventure lovers"
    },
    {
      icon: "🎒",
      title: "Solo Backpacking",
      prompt: "2-week solo backpacking trip across Thailand on a tight budget"
    },
    {
      icon: "👨‍👩‍👧‍👦",
      title: "Family Vacation",
      prompt: "7-day family trip to Kerala with kids, budget ₹50,000"
    },
    {
      icon: "💑",
      title: "Romantic Getaway",
      prompt: "Luxury honeymoon package to Maldives for 5 days"
    },
    {
      icon: "🏛️",
      title: "Cultural Tour",
      prompt: "Historical and cultural tour of Rajasthan for 10 days"
    }
  ];

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Travel Planner
            </h1>
          </div>
          <p className="text-muted-foreground">
            Your intelligent travel companion - Plan smarter, travel better ✈️
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* LEFT SIDE — CHAT */}
          <div className="lg:col-span-1">
            <Card className="h-[calc(100vh-150px)] shadow-2xl rounded-2xl overflow-hidden border-2 border-blue-100">
              <CardHeader className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white pb-4">
                <div className="flex justify-between items-center">
                  <div className="flex gap-3 items-center">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-lg">
                        Travel Assistant
                      </CardTitle>
                      <CardDescription className="text-blue-100 text-xs">
                        Powered by AI
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-white/25 text-white border-0">
                    <span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse" />
                    Online
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-0 flex flex-col h-[calc(100vh-300px)]">
                {/* Sample Prompts - Show only when no plan generated */}
                {!planGenerated && (
                  <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
                    <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-600" />
                      Quick Start Ideas
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {samplePrompts.map((prompt, i) => (
                        <Button
                          key={i}
                          size="sm"
                          variant="outline"
                          className="h-auto py-2 px-3 flex flex-col items-start gap-1 hover:bg-white hover:border-blue-300 transition-all"
                          onClick={() => handleSuggestionClick(prompt.prompt)}
                        >
                          <span className="text-lg">{prompt.icon}</span>
                          <span className="text-xs font-medium">{prompt.title}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chat Window */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg, i) => (
                      <div key={i} className="space-y-2">
                        <div
                          className={`flex gap-3 ${
                            msg.from === "user" ? "flex-row-reverse" : ""
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md flex-shrink-0 ${
                              msg.from === "user"
                                ? "bg-gradient-to-r from-blue-600 to-blue-700"
                                : "bg-gradient-to-r from-purple-500 to-pink-500"
                            }`}
                          >
                            {msg.from === "user" ? (
                              <Users className="w-4 h-4 text-white" />
                            ) : (
                              <Sparkles className="w-4 h-4 text-white" />
                            )}
                          </div>

                          <div
                            className={`max-w-[85%] p-3 shadow-md rounded-2xl ${
                              msg.from === "user"
                                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-tr-none"
                                : "bg-white border border-gray-200 rounded-tl-none"
                            }`}
                          >
                            <p className="text-sm leading-relaxed">{msg.text}</p>
                            <p
                              className={`text-[10px] mt-2 ${
                                msg.from === "user"
                                  ? "text-blue-200"
                                  : "text-gray-400"
                              }`}
                            >
                              {msg.timestamp}
                            </p>
                          </div>
                        </div>

                        {/* AI Suggestions */}
                        {msg.from === "ai" && msg.suggestions && (
                          <div className="ml-11 flex flex-wrap gap-2">
                            {msg.suggestions.map((suggestion, idx) => (
                              <Button
                                key={idx}
                                size="sm"
                                variant="outline"
                                className="text-xs h-7 hover:bg-blue-50 hover:border-blue-300"
                                onClick={() => handleSuggestionClick(suggestion)}
                              >
                                {suggestion}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {loading && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-md">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.15s]" />
                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.3s]" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t bg-white">
                  <div className="flex gap-2">
                    <Textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Describe your dream trip..."
                      className="min-h-[60px] resize-none focus:ring-2 focus:ring-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={loading || !query.trim()}
                      className="px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 self-end"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Press Enter to send • Shift + Enter for new line
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN - Trip Details */}
          <div className="lg:col-span-2 space-y-6">
            {!showResults ? (
              // Welcome Screen
              <Card className="border-2 border-dashed border-blue-200 shadow-xl rounded-2xl overflow-hidden">
                <CardContent className="p-12 text-center">
                  <div className="max-w-md mx-auto space-y-6">
                    <div className="p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                      <Globe className="w-12 h-12 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-2">Start Planning Your Adventure</h2>
                      <p className="text-muted-foreground">
                        Tell me about your travel preferences in the chat, and I'll create a personalized itinerary just for you!
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-left">
                      {[
                        { icon: MapPin, text: "Destination suggestions" },
                        { icon: Calendar, text: "Perfect timing advice" },
                        { icon: DollarSign, text: "Budget optimization" },
                        { icon: Star, text: "Personalized experiences" }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                          <item.icon className="w-5 h-5 text-blue-600" />
                          <span className="text-sm">{item.text}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4">
                      <p className="text-sm text-muted-foreground mb-3">Try asking:</p>
                      <div className="space-y-2">
                        {[
                          "Plan a romantic getaway for my anniversary",
                          "Best destinations for solo travel in Asia",
                          "Family vacation ideas under ₹50,000"
                        ].map((example, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            className="w-full justify-start text-left"
                            onClick={() => handleSuggestionClick(example)}
                          >
                            <ChevronRight className="w-4 h-4 mr-2" />
                            {example}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              // Trip Plan
              <>
                {/* Trip Overview Card */}
                <Card className="border-2 shadow-2xl rounded-2xl overflow-hidden">
                  <div className="relative h-56 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800')] bg-cover bg-center mix-blend-overlay" />
                    <div className="absolute bottom-6 left-6 right-6 text-white">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h1 className="text-3xl font-bold mb-2">Goa Beach Paradise</h1>
                          <p className="text-blue-100">5 Days • 4 Nights • 2 Travelers</p>
                        </div>
                        <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          AI Optimized
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm font-medium">Dec 15-20, 2024</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                          <DollarSign className="w-4 h-4" />
                          <span className="text-sm font-medium">₹24,500 total</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                          <Users className="w-4 h-4" />
                          <span className="text-sm font-medium">Couple Trip</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                          <Sun className="w-4 h-4" />
                          <span className="text-sm font-medium">28-32°C</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-4 gap-4 p-6 bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">15</div>
                      <div className="text-xs text-muted-foreground">Activities</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">4</div>
                      <div className="text-xs text-muted-foreground">Hotels</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-pink-600">12</div>
                      <div className="text-xs text-muted-foreground">Restaurants</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">26%</div>
                      <div className="text-xs text-muted-foreground">Savings</div>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="grid grid-cols-4 mb-6">
                        <TabsTrigger value="itinerary" className="gap-2">
                          <Calendar className="w-4 h-4" />
                          Itinerary
                        </TabsTrigger>
                        <TabsTrigger value="hotels" className="gap-2">
                          <Hotel className="w-4 h-4" />
                          Stays
                        </TabsTrigger>
                        <TabsTrigger value="activities" className="gap-2">
                          <Navigation className="w-4 h-4" />
                          Activities
                        </TabsTrigger>
                        <TabsTrigger value="budget" className="gap-2">
                          <DollarSign className="w-4 h-4" />
                          Budget
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="itinerary" className="space-y-4">
                        <div className="space-y-3">
                          {itineraryData.map((item, i) => (
                            <div key={i} className="border rounded-lg overflow-hidden">
                              <button
                                onClick={() => toggleDay(i)}
                                className="w-full px-4 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex flex-col items-center">
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center font-bold text-lg">
                                    {item.day}
                                  </div>
                                  <span className="text-xs text-muted-foreground mt-1">Day</span>
                                </div>
                                <div className="text-left flex-1">
                                  <h3 className="font-semibold text-base">{item.title}</h3>
                                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                    <Clock className="w-3 h-3" />
                                    {item.activities.length} activities planned
                                  </p>
                                </div>
                                <ChevronDown
                                  className={`w-5 h-5 text-gray-400 transition-transform ${
                                    expandedDay === i ? "rotate-180" : ""
                                  }`}
                                />
                              </button>
                              
                              {expandedDay === i && (
                                <div className="px-4 pb-4 space-y-3 border-t">
                                  {item.activities.map((activity, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg hover:shadow-md transition-shadow mt-3"
                                    >
                                      <span className="text-2xl">{activity.icon}</span>
                                      <div className="flex-1">
                                        <div className="font-medium text-sm">{activity.name}</div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                          {activity.time}
                                        </div>
                                      </div>
                                      <Badge variant="outline" className="text-xs">
                                        {activity.type}
                                      </Badge>
                                    </div>
                                  ))}
                                  <div className="flex gap-2 mt-4 pt-3 border-t">
                                    <Button variant="outline" size="sm" className="flex-1">
                                      <Bookmark className="w-3 h-3 mr-2" />
                                      Save Day
                                    </Button>
                                    <Button variant="outline" size="sm" className="flex-1">
                                      <Share2 className="w-3 h-3 mr-2" />
                                      Share
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="hotels">
                        <div className="grid md:grid-cols-2 gap-4">
                          {[
                            {
                              name: "Sea View Resort",
                              price: "₹3,200",
                              rating: "4.5",
                              reviews: "342",
                              features: ["Beachfront", "Pool", "Breakfast", "WiFi"],
                              image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400",
                              highlight: "Best Value"
                            },
                            {
                              name: "Boutique Heritage Hotel",
                              price: "₹2,800",
                              rating: "4.7",
                              reviews: "198",
                              features: ["Historic", "Garden", "Bicycle", "Parking"],
                              image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400",
                              highlight: "Unique Stay"
                            },
                            {
                              name: "Modern Apartment",
                              price: "₹4,500",
                              rating: "4.8",
                              reviews: "267",
                              features: ["Kitchen", "2 Bedrooms", "Balcony", "Netflix"],
                              image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400",
                              highlight: "Luxury"
                            },
                            {
                              name: "Beach Hut Paradise",
                              price: "₹1,900",
                              rating: "4.3",
                              reviews: "156",
                              features: ["On Beach", "Traditional", "Host", "AC"],
                              image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400",
                              highlight: "Budget Pick"
                            },
                          ].map((hotel, i) => (
                            <Card key={i} className="overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-1">
                              <div className="relative h-48">
                                <img
                                  src={hotel.image}
                                  alt={hotel.name}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute top-3 left-3">
                                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                                    {hotel.highlight}
                                  </Badge>
                                </div>
                                <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full font-semibold text-sm">
                                  {hotel.price}/night
                                </div>
                              </div>
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                  <h3 className="font-semibold">{hotel.name}</h3>
                                  <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400"/>
                                                                        <span className="text-sm font-medium">{hotel.rating}</span>
                                    <span className="text-xs text-muted-foreground">({hotel.reviews})</span>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {hotel.features.map((feature, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {feature}
                                    </Badge>
                                  ))}
                                </div>
                                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                                  <Bookmark className="w-4 h-4 mr-2" />
                                  Book Now
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="activities">
                        <div className="space-y-4">
                          {[
                            {
                              name: "Scuba Diving",
                              price: "₹3,500",
                              duration: "3-4 hours",
                              rating: "4.9",
                              icon: "🤿",
                              description: "Explore vibrant coral reefs and marine life",
                              highlight: "Best Seller"
                            },
                            {
                              name: "Dolphin Watching",
                              price: "₹1,200",
                              duration: "2 hours",
                              rating: "4.7",
                              icon: "🐬",
                              description: "Morning cruise to spot dolphins in their natural habitat",
                              highlight: "Family Friendly"
                            },
                            {
                              name: "Spice Plantation Tour",
                              price: "₹800",
                              duration: "3 hours",
                              rating: "4.5",
                              icon: "🌿",
                              description: "Guided tour of traditional spice farms with lunch",
                              highlight: "Cultural"
                            },
                            {
                              name: "Sunset Cruise",
                              price: "₹2,500",
                              duration: "2.5 hours",
                              rating: "4.8",
                              icon: "🌅",
                              description: "Romantic cruise with drinks and music",
                              highlight: "Couples"
                            },
                          ].map((activity, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow">
                              <div className="text-3xl">{activity.icon}</div>
                              <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                  <h3 className="font-semibold">{activity.name}</h3>
                                  <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0">
                                    {activity.highlight}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                                <div className="flex gap-4 text-sm">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {activity.duration}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    {activity.rating}
                                  </span>
                                  <span className="flex items-center gap-1 font-semibold text-blue-600">
                                    <DollarSign className="w-3 h-3" />
                                    {activity.price} per person
                                  </span>
                                </div>
                              </div>
                              <Button variant="outline" size="sm">
                                Book
                              </Button>
                            </div>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="budget">
                        <div className="space-y-6">
                          <div className="grid md:grid-cols-3 gap-4">
                            <Card>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">Total Budget</span>
                                  <DollarSign className="w-4 h-4 text-green-600" />
                                </div>
                                <div className="text-2xl font-bold">₹30,000</div>
                                <div className="text-xs text-green-600 mt-1">+15% saved</div>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">Estimated Cost</span>
                                  <TrendingUp className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="text-2xl font-bold">₹24,500</div>
                                <div className="text-xs text-blue-600 mt-1">Within budget</div>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">Savings</span>
                                  <Check className="w-4 h-4 text-purple-600" />
                                </div>
                                <div className="text-2xl font-bold">₹5,500</div>
                                <div className="text-xs text-purple-600 mt-1">AI optimized</div>
                              </CardContent>
                            </Card>
                          </div>

                          <div className="space-y-3">
                            <h3 className="font-semibold">Cost Breakdown</h3>
                            {[
                              { category: "Accommodation", amount: "₹12,000", percent: 49 },
                              { category: "Activities", amount: "₹6,500", percent: 27 },
                              { category: "Food & Dining", amount: "₹4,000", percent: 16 },
                              { category: "Transport", amount: "₹2,000", percent: 8 },
                            ].map((item, i) => (
                              <div key={i} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>{item.category}</span>
                                  <span className="font-medium">{item.amount}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
                                    style={{ width: `${item.percent}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle className="w-5 h-5 text-blue-600" />
                              <h4 className="font-semibold">Budget Tips</h4>
                            </div>
                            <ul className="space-y-2 text-sm">
                              <li className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-600" />
                                Book activities in advance for 15% discount
                              </li>
                              <li className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-600" />
                                Use local transport instead of taxis
                              </li>
                              <li className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-green-600" />
                                Eat at local restaurants for authentic & cheaper food
                              </li>
                            </ul>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90">
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Plan
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Customize
                  </Button>
                </div>

                {/* Weather & Tips */}
                <div className="grid md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Sun className="w-4 h-4" />
                        Weather Forecast
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { day: "Day 1", temp: "32°C", icon: "☀️", desc: "Sunny" },
                          { day: "Day 2", temp: "30°C", icon: "⛅", desc: "Partly Cloudy" },
                          { day: "Day 3", temp: "29°C", icon: "🌦️", desc: "Light Rain" },
                          { day: "Day 4", temp: "31°C", icon: "☀️", desc: "Sunny" },
                          { day: "Day 5", temp: "28°C", icon: "🌤️", desc: "Mostly Sunny" },
                        ].map((weather, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-sm">{weather.day}</span>
                            <span className="text-2xl">{weather.icon}</span>
                            <span className="font-medium">{weather.temp}</span>
                            <span className="text-sm text-muted-foreground">{weather.desc}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="md:col-span-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        AI Travel Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Umbrella className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium mb-1">Monsoon Season</h4>
                            <p className="text-sm text-muted-foreground">
                              Pack light rain gear. Most water activities are closed June-September.
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <UtensilsCrossed className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="font-medium mb-1">Local Delicacies</h4>
                            <p className="text-sm text-muted-foreground">
                              Must try: Goan fish curry, Bebinca dessert, Feni local drink.
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="p-2 bg-pink-100 rounded-lg">
                            <Navigation className="w-5 h-5 text-pink-600" />
                          </div>
                          <div>
                            <h4 className="font-medium mb-1">Getting Around</h4>
                            <p className="text-sm text-muted-foreground">
                              Rent a scooter for best flexibility. Ola/Uber available in major areas.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>AI Travel Planner • All recommendations are AI-generated and should be verified before booking</p>
        </div>
      </div>
    </div>
  );
}