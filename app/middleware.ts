import {
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    const authObj = await auth();
    if(!authObj.isAuthenticated){
        new Response("Unauthorized", { status: 401 });
    }
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
