// Runs before every request (Next.js 16 renamed "middleware" to "proxy").
// Signed-out visitors can only reach the landing page and the Clerk sign-in /
// sign-up pages; everything else redirects to /sign-in.
//
// This is the first lock, not the only one: every page also checks the user
// on the server, and the database enforces Row Level Security.
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
