import mongoose from "mongoose";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function setupDatabase() {
  try {
    const { connectDB } = await import("../app/lib/db");
    await connectDB();
    console.log("MongoDB connected successfully");

    const Trip = mongoose.models.Trip;
    if (Trip) {
      await Trip.collection.createIndex({ clerkUserId: 1, createdAt: -1 });
      await Trip.collection.createIndex({ destination: 1 });
      console.log("Database indexes created");
    }

    console.log("Database setup completed");
  } catch (error) {
    console.error("Database setup failed:", error);
    process.exitCode = 1;
  }
}

setupDatabase();
