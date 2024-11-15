import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Add all protected routes here
const protectedRoutes = ["/dashboard", "/profile", "/tests"];
const authRoutes = ["/auth/login", "/auth/signup"];

export function middleware(request: NextRequest) {
	const token = request.cookies.get("access_token");
	const { pathname } = request.nextUrl;

	// If user is logged in and tries to access auth pages, redirect to dashboard
	if (token && authRoutes.includes(pathname)) {
		return NextResponse.redirect(new URL("/dashboard", request.url));
	}

	// If user is not logged in and tries to access protected routes
	if (!token && protectedRoutes.some((route) => pathname.startsWith(route))) {
		// Store the original path to redirect back after login
		const response = NextResponse.redirect(new URL("/auth/login", request.url));
		response.cookies.set("redirectTo", pathname);
		return response;
	}

	return NextResponse.next();
}

// Configure middleware to run on specific paths
export const config = {
	matcher: [
		// Match all paths except static files and api routes
		"/((?!api|_next/static|_next/image|images|favicon.ico).*)",
	],
};
