import { createUser, deleteUser } from "@/app/lib/actions/user.action";
import { clerkClient, UserJSON, WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

export async function POST(req: Request) {
  const payload = await req.text();
  const headerPayload = await headers();

  const wh = new Webhook(process.env.WEBHOOK_SECRET!);
  let event;

  try {
    event = wh.verify(payload, {
      "svix-id": headerPayload.get("svix-id")!,
      "svix-timestamp": headerPayload.get("svix-timestamp")!,
      "svix-signature": headerPayload.get("svix-signature")!,
    }) as WebhookEvent;
  } catch {
    return new Response("Invalid webhook", { status: 400 });
  }

  const { type, data } = event;

  const userData = data as UserJSON;

  if(!data.id) return;

  const userObj = {
    clerkId: data.id,
    email: userData.email_addresses[0].email_address,
    name: `${userData.first_name ?? ""} ${userData.last_name ?? ""}`,
    image: userData.image_url,
  };

  if (type === "user.created") {
    const newUser = await createUser(userObj);
    if (newUser) {
      await (await clerkClient()).users.updateUserMetadata(data.id, {
        privateMetadata: {
          userId: newUser?._id,
        },
      });
    }
    return NextResponse.json({
      message: "User Created Sucessfully",
      user: newUser,
      status: 200,
    });
  }

  if (type === "user.deleted" && data?.id) {
    await deleteUser(data.id);
  }

  return new Response("OK", { status: 200 });
}
