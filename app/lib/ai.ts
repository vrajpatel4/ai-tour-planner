// app/lib/ai.ts
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AIPreferences {
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  travelers: number;
  interests: string[];
  pace: 'relaxed' | 'moderate' | 'fast';
  accommodation: 'budget' | 'mid-range' | 'luxury';
  dietaryRestrictions?: string[];
}

export interface Activity {
  time: string;
  name: string;
  type: 'dining' | 'sightseeing' | 'activity' | 'transport' | 'accommodation' | 'leisure';
  description: string;
  location?: string;
  cost?: number;
  duration?: string;
}

export interface DayPlan {
  day: number;
  title: string;
  date: string;
  activities: Activity[];
}

export interface TripPlan {
  title: string;
  summary: string;
  destination: string;
  days: DayPlan[];
  totalCost: number;
  recommendations: string[];
  weatherAdvice: string;
  packingList: string[];
}

class OpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY! || "API_KEY",
    });
  }

  async generateItinerary(preferences: AIPreferences): Promise<TripPlan> {
    const systemPrompt = `You are an expert travel planner. Create detailed, realistic itineraries based on user preferences.
    
    Format your response as valid JSON with this structure:
    {
      "title": "Creative trip title",
      "summary": "2-3 sentence summary",
      "destination": "Destination name",
      "days": [
        {
          "day": 1,
          "title": "Day title",
          "date": "YYYY-MM-DD",
          "activities": [
            {
              "time": "HH:MM AM/PM",
              "name": "Activity name",
              "type": "dining|sightseeing|activity|transport|accommodation|leisure",
              "description": "Detailed description",
              "location": "Specific location if applicable",
              "cost": 50,
              "duration": "2 hours"
            }
          ]
        }
      ],
      "totalCost": 1000,
      "recommendations": ["Tip 1", "Tip 2"],
      "weatherAdvice": "Weather-related advice",
      "packingList": ["Item 1", "Item 2"]
    }

    Important: Return ONLY valid JSON, no additional text.`;

    const userPrompt = `Create a ${preferences.travelers}-person trip to ${preferences.destination} 
    from ${preferences.startDate} to ${preferences.endDate} with a budget of ${preferences.budget}.
    
    Preferences:
    - Pace: ${preferences.pace}
    - Accommodation: ${preferences.accommodation}
    - Interests: ${preferences.interests.join(', ')}
    ${preferences.dietaryRestrictions ? `- Dietary restrictions: ${preferences.dietaryRestrictions.join(', ')}` : ''}
    
    Make the itinerary practical and enjoyable. Include a mix of activities, meals, and relaxation time.`;

    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      if (!content) throw new Error('No response from AI');

      return JSON.parse(content);
    } catch (error) {
      console.error('OpenAI Error:', error);
      throw new Error('Failed to generate itinerary');
    }
  }

  async chatResponse(messages: Array<{role: string, content: string}>, context?: any): Promise<string> {
    const systemMessage = {
      role: "system",
      content: `You are a helpful travel assistant. Help users plan trips, suggest destinations, 
      create itineraries, and answer travel questions. Be enthusiastic and detailed.
      
      Current context: ${JSON.stringify(context || {})}`
    };

    const response = await (this.client.chat.completions as any).create({
      model: "gpt-4-turbo-preview",
      messages: [systemMessage, ...messages],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0].message.content || 'I apologize, but I encountered an error.';
  }
}

// Factory pattern for multiple AI providers
export class AIService {
  private provider: 'openai' | 'gemini';
  private openai: OpenAIService;
  private gemini: any;

  constructor(provider: 'openai' | 'gemini' = 'openai') {
    this.provider = provider;
    this.openai = new OpenAIService();
    
    if (provider === 'gemini' && process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
      this.gemini = genAI.getGenerativeModel({ model: "gemini-pro" });
    }
  }

  async generateItinerary(preferences: AIPreferences): Promise<TripPlan> {
    if (this.provider === 'openai') {
      return this.openai.generateItinerary(preferences);
    } else {
      // Implement Gemini fallback
      return this.openai.generateItinerary(preferences);
    }
  }

  async chat(messages: Array<{role: string, content: string}>, context?: any): Promise<string> {
    if (this.provider === 'openai') {
      return this.openai.chatResponse(messages, context);
    } else {
      // Implement Gemini fallback
      return this.openai.chatResponse(messages, context);
    }
  }
}

export const aiService = new AIService('openai');