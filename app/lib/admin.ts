import { currentUser } from "@clerk/nextjs/server";

type ClerkMetadata = Record<string, unknown>;

const splitEmails = (value?: string) =>
  (value || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

const hasAdminRole = (metadata?: ClerkMetadata | null) =>
  metadata?.role === "admin" || metadata?.isAdmin === true;

export async function requireAdmin() {
  const user = await currentUser();
  console.log(user,"user1111111111")

  if (!user) {
    throw new Error("Authentication required");
  }

  const primaryEmail =
    user.emailAddresses
      .find((email) => email.id === user.primaryEmailAddressId)
      ?.emailAddress.toLowerCase() ||
    user.emailAddresses[0]?.emailAddress.toLowerCase() ||
    "";

  const allowedEmails = splitEmails(process.env.ADMIN_EMAILS);
  const publicMetadata = user.publicMetadata as ClerkMetadata;
  const privateMetadata = user.privateMetadata as ClerkMetadata;
  const metadataAllowsAdmin =
    hasAdminRole(publicMetadata) || hasAdminRole(privateMetadata);
  const emailAllowsAdmin = allowedEmails.includes(primaryEmail);
  const localDevFallback =
    process.env.NODE_ENV !== "production" && allowedEmails.length === 0;

  if (!metadataAllowsAdmin && !emailAllowsAdmin && !localDevFallback) {
    throw new Error("Admin access required");
  }

  return {
    clerkId: user.id,
    email: primaryEmail,
    name: user.fullName || user.username || primaryEmail || "Admin",
  };
}
