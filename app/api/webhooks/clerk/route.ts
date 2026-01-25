import { createUser, deleteUser } from "@/app/lib/actions/user.action";
import { connectDB } from "@/app/lib/db";
import User from "@/app/lib/models/User";
import { clerkClient, WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

export async function POST(req: Request) {
  const payload = await req.text();
  const headerPayload = headers();

  const wh = new Webhook(process.env.WEBHOOK_SECRET!);
  let event;

  try {
    event = wh.verify(payload, {
      "svix-id": (await headerPayload).get("svix-id")!,
      "svix-timestamp": (await headerPayload).get("svix-timestamp")!,
      "svix-signature": (await headerPayload).get("svix-signature")!,
    }) as WebhookEvent;
  } catch {
    return new Response("Invalid webhook", { status: 400 });
  }

  const { type, data } = event;

  const userObj = {
    clerkId: data.id,
    email: data.email_addresses[0].email_address,
    name: `${data.first_name ?? ""} ${data.last_name ?? ""}`,
    image: data.image_url,
  };

  if (type === "user.created") {
    const newUser = await createUser(userObj);
    if (newUser) {
      (await clerkClient()).users.updateUserMetadata(data.id, {
        privateMetadata: {
          userId: newUser?._id,
        },
      });
    }
    return NextResponse.json({
      message: "User Created Sucessfully",
      user: newUser,
      status : 200
    });
  }

  if (type === "user.deleted" && data?.id) {
    await deleteUser(data.id);
  }

  return new Response("OK", { status: 200 });
}
