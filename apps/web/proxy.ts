import { NextResponse, type NextRequest } from "next/server";

import { isSupabaseConfigured } from "./lib/env";
import { updateSession } from "./lib/supabase/middleware";

const protectedRoutes = [
  "/dashboard",
  "/leads",
  "/follow-ups",
  "/documents",
  "/invoices",
  "/imports",
  "/settings",
];

function isProtectedRoute(pathname: string) {
  return protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function redirectWithSession(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";

  const redirectResponse = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { response, user } = await updateSession(request);

  if (!isSupabaseConfigured()) {
    return response;
  }

  if (pathname === "/") {
    return redirectWithSession(
      request,
      response,
      user ? "/dashboard" : "/login",
    );
  }

  if (!user && isProtectedRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);

    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });

    return redirectResponse;
  }

  if (user && pathname === "/login") {
    return redirectWithSession(request, response, "/dashboard");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
