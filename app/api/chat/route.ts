// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { aiService } from '@/app/lib/ai';
import { connectDB } from '@/app/lib/db';
import Conversation from '@/app/lib/models/Conversation';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    await connectDB();

    const { message, conversationId, tripId } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Find or create conversation
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        clerkUserId: user.clerkUserId,
      });
    }

    if (!conversation) {
      conversation = new Conversation({
        userId: user._id,
        clerkUserId: user.clerkUserId,
        title: `Chat ${new Date().toLocaleDateString()}`,
        messages: [],
        tripId: tripId || null,
        context: { tripId },
        isActive: true,
      });
    }

    // Add user message
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
    });

    // Get AI response
    const aiResponse = await aiService.chat(
      conversation.messages.map((msg:any) => ({
        role: msg.role,
        content: msg.content,
      })),
      conversation.context
    );

    // Add AI response
    conversation.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
    });

    // Update conversation title if it's the first message
    if (conversation.messages.length === 2) {
      const titlePrompt = `Generate a short title (max 5 words) for a chat about: ${message}`;
      const titleResponse = await aiService.chat([
        { role: 'system', content: 'Generate a short, descriptive title.' },
        { role: 'user', content: titlePrompt }
      ]);
      conversation.title = titleResponse.replace(/["']/g, '').substring(0, 50);
    }

    conversation.updatedAt = new Date();
    await conversation.save();

    // Generate suggestions based on conversation
    const suggestions = await generateSuggestions(conversation.messages);

    return NextResponse.json({
      success: true,
      response: aiResponse,
      conversationId: conversation._id,
      suggestions,
      conversationTitle: conversation.title,
    });

  } catch (error: any) {
    console.error('Chat error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process message',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

async function generateSuggestions(messages: any[]): Promise<string[]> {
  // Simple suggestion generation based on conversation context
  const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
  
  const suggestionMap: Record<string, string[]> = {
    'destination': ['What is your budget?', 'How many travelers?', 'What dates are you considering?'],
    'budget': ['What type of accommodation?', 'Any specific activities?', 'Transportation preferences?'],
    'dates': ['Duration of stay?', 'Flexible with dates?', 'Season preferences?'],
    'activities': ['Adventure or relaxation?', 'Cultural experiences?', 'Food preferences?'],
  };

  const defaultSuggestions = [
    'Add more activities',
    'Change accommodation',
    'Adjust budget',
    'Extend trip duration',
    'Add dietary restrictions',
  ];

  // Check for keywords in last message
  for (const [keyword, suggestions] of Object.entries(suggestionMap)) {
    if (lastMessage.includes(keyword)) {
      return suggestions;
    }
  }

  return defaultSuggestions;
}