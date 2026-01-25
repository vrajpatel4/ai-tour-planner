import { connectDB } from "@/app/lib/db";
import User from "@/app/lib/models/User";
import { headers } from "next/headers";
import { Webhook } from "svix";

export async function POST(req: Request) {
  const payload = await req.text();
  const headerPayload = headers();

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  let event;

  try {
    event = wh.verify(payload, {
      "svix-id": (await headerPayload).get("svix-id")!,
      "svix-timestamp": (await headerPayload).get("svix-timestamp")!,
      "svix-signature": (await headerPayload).get("svix-signature")!,
    });
  } catch {
    return new Response("Invalid webhook", { status: 400 });
  }

  const { type, data } = event as any;

  await connectDB();

   if (type === "user.created") {
    await User.create({
      clerkId: data.id,
      email: data.email_addresses[0].email_address,
      name: `${data.first_name ?? ""} ${data.last_name ?? ""}`,
      image: data.image_url,
    });
  }

  if (type === "user.deleted") {
    await User.deleteOne({ clerkId: data.id });
  }

  return new Response("OK", { status: 200 });

}
