import { NextRequest, NextResponse } from "next/server";

const PROTECTED = [
  "/dashboard",
  "/exam",
  "/results",
];

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("en_token")?.value;

  // Admin routes — require token, redirect to /admin/login if missing
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));

  if (isProtected && !token) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|api/|.*\\.(?:jpg|jpeg|png|gif|svg|webp|ico|woff|woff2|ttf|otf|eot|css|js|map)$).*)",
  ],
};
