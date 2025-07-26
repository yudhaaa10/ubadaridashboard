"use server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.NEXT_PUBLIC_JWT_SECRET);

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

async function isTokenExpired(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload.exp! * 1000 < Date.now();
  } catch {
    return true; // token corrupt/invalid/expired
  }
}

export async function middleware(request: NextRequest) {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("authToken")?.value;

  if (!authToken || (await isTokenExpired(authToken))) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("authToken");
    return response;
  }

  // Define protected routes
  const protectedRoutes = [
    "/admin",
    "/admin/pesanan",
    "/admin/produk",
    "/admin/pengaturan",
  ];

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // If accessing a protected route
  if (isProtectedRoute) {
    // In a real application, you would validate this token with your backend.
    // For this example, we'll just check if it exists.
    const isAuthenticated = !!authToken;

    if (!isAuthenticated) {
      // If not authenticated, redirect to login page
      const response = NextResponse.redirect(new URL("/login", request.url));
      // Optionally, clear the cookie if it was somehow malformed or expired on client
      response.cookies.delete("authToken");
      return response;
    }

    // If authenticated, allow the request to proceed
    return NextResponse.next();
  }

  // If accessing the root path and authenticated, redirect to admin dashboard
  if (request.nextUrl.pathname === "/") {
    if (authToken) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  // Allow all other requests to proceed
  return NextResponse.next();
}

// Configure which paths the middleware applies to
export const config = {
  matcher: ["/admin/:path*", "/"], // Apply middleware to /admin and its subpaths, and the root path
};
