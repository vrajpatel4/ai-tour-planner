import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing",
  "/trips/public(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/config",
  "/api/public/(.*)",
  "/api/health", // Keep health public for Vercel/Monitoring
  "/api/webhooks/(.*)", // Webhooks are usually public but verified via signatures
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
