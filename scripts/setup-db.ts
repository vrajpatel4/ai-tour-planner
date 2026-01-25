// scripts/setup-db.ts
import { connectDB } from '../app/lib/db';
import mongoose from 'mongoose';

async function setupDatabase() {
  try {
    await connectDB();
    console.log('✅ MongoDB connected successfully');
    
    // Create indexes for better performance
    const Trip = mongoose.models.Trip;
    if (Trip) {
      await Trip.collection.createIndex({ clerkUserId: 1, createdAt: -1 });
      await Trip.collection.createIndex({ destination: 1 });
      console.log('✅ Database indexes created');
    }
    
    console.log('✅ Database setup completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();