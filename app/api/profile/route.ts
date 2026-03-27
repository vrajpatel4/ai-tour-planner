import { connectDB } from "@/app/lib/db";
import User from "@/app/lib/models/User";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";


export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  await connectDB();

  const user = await User.findOne({ clerkId: userId });

  return Response.json(user);
}
