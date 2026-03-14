// app/lib/auth.ts
import { auth, currentUser } from '@clerk/nextjs/server';
import { connectDB } from './db';
import User from './models/User';

export async function getCurrentUser() {
  try {
    await connectDB();
    
    const { userId } = await auth();
    if (!userId) return null;
    
    const clerkUser = await currentUser();
    if (!clerkUser) return null;
    
    // Find or create user in MongoDB
    let user = await User.findOne({ clerkId: userId });

    if (!user) {
      user = await User.create({
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.username || 'User',
        avatar: clerkUser.imageUrl,
        preferences: {}
      });
    }

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}
