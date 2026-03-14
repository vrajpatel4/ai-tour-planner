// app/api/trips/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { connectDB } from '@/app/lib/db';
import Trip from '@/app/lib/models/Trip';

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const query: Record<string, string> = { clerkUserId: user.clerkId };
    if (status) query.status = status;

    const trips = await Trip.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-__v')
      .lean();

    const total = await Trip.countDocuments(query);

    return NextResponse.json({
      success: true,
      trips,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Get trips error:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    await connectDB();

    const body = await request.json();
    const { title, destination, startDate, endDate, budget = 0, travelers = 1 } = body;

    if (!title || !destination || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Title, destination, start date and end date are required' },
        { status: 400 }
      );
    }

    const trip = await Trip.create({
      userId: user._id,
      clerkUserId: user.clerkId,
      title,
      destination,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      budget,
      travelers,
      status: "draft",
      days: [],
    });

    return NextResponse.json({ success: true, trip }, { status: 201 });
  } catch (error) {
    console.error('Create trip error:', error);
    return NextResponse.json(
      { error: 'Failed to create trip' },
      { status: 500 }
    );
  }
}
