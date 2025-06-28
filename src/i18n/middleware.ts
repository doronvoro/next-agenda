import createIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './config';
import { updateSession } from "@/lib/supabase/server/middleware";
import { type NextRequest, NextResponse } from "next/server";

const intlMiddleware = createIntlMiddleware({
  // A list of all locales that are supported
  locales: locales,
  
  // Used when no locale matches
  defaultLocale: defaultLocale,
  
  // Always show the locale in the URL
  localePrefix: 'always'
});

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Debug logs for middleware
  console.log("🔍 Middleware Debug:");
  console.log("Pathname:", pathname);
  console.log("URL:", request.url);
  console.log("Headers:", Object.fromEntries(request.headers.entries()));
  
  // Skip middleware for static assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    console.log("⏭️ Skipping middleware for:", pathname);
    return NextResponse.next();
  }
  
  // Handle internationalization first
  console.log("🌐 Processing intl middleware for:", pathname);
  const intlResponse = intlMiddleware(request);
  
  // If intl middleware returns a response, return it
  if (intlResponse) {
    console.log("✅ Intl middleware returned response for:", pathname);
    return intlResponse;
  }
  
  // Then handle Supabase session
  console.log("🔐 Processing Supabase session for:", pathname);
  return await updateSession(request);
}

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
}; 