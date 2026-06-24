import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isBaseProtectedRoute = createRouteMatcher([
  '/onboarding(.*)',
  '/analytics(.*)',
  '/dashboard(.*)',
  '/community(.*)',
  '/profile(.*)',
]);

const isGameRoute = createRouteMatcher([
  '/games(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl;
  const pathname = url.pathname;

  // List of paths that migrated under /dashboard
  const migratedPaths = ['/analytics', '/community', '/profile'];
  
  // If the path starts with any migrated route and does NOT start with /dashboard
  const isMigrated = migratedPaths.some(path => pathname.startsWith(path) && !pathname.startsWith('/dashboard'));

  if (isMigrated) {
    const newUrl = new URL(`/dashboard${pathname}${url.search}`, req.url);
    return NextResponse.redirect(newUrl);
  }

  if (isBaseProtectedRoute(req) && !isGameRoute(req)) {
    const authObj = await auth();
    if (!authObj.userId) {
      return authObj.redirectToSignIn();
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
