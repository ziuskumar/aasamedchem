import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;

    const path = req.nextUrl.pathname;

    // ADMIN ROUTES
    if (
      path.startsWith("/admin") &&
      token?.role !== "admin"
    ) {
      return NextResponse.redirect(
        new URL("/", req.url)
      );
    }

    // SELLER ROUTES
    if (
      path.startsWith("/seller") &&
      token?.role !== "seller"
    ) {
      return NextResponse.redirect(
        new URL("/", req.url)
      );
    }

    // BUYER ROUTES
    if (
      path.startsWith("/buyer") &&
      token?.role !== "buyer"
    ) {
      return NextResponse.redirect(
        new URL("/", req.url)
      );
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/seller/:path*",
    "/buyer/:path*",
  ],
};