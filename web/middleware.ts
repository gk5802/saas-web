// /apps/web/middleware.ts
// Next.js middleware — सभी API responses में सुरक्षा हेडर जोड़ता है
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * यह middleware प्रत्येक अनुरोध पर सुरक्षा हेडर सेट करेगा।
 * Hindi comments: नीचे दिए गए headers को आवश्यकता अनुसार एडजस्ट करें
 */
export function middleware(req: NextRequest) {
  // NextResponse.next() से हम response object बना कर headers जोड़ सकते हैं
  const res = NextResponse.next();

  // सुरक्षा सम्बन्धी बुनियादी headers
  res.headers.set("Referrer-Policy", "no-referrer");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Permissions-Policy", "geolocation=(), camera=()");
  // Content-Security-Policy (बहुत सख्त; जरूरत के अनुसार संसाधन जोड़ें)
  res.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'self';"
  );
  // HSTS - production only. विकास में careful रहें।
  if (process.env.NODE_ENV === "production") {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  return res;
}

/**
 * केवल API routes पर यह middleware लागू होगा। आवश्यकता अनुसार मार्ग बदलें।
 */
export const config = {
  matcher: "/api/:path*",
};
