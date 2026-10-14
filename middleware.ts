import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Protect admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      const loginUrl = new URL("/admin/login", request.url)
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    const role = (session.user as { role?: string }).role
    if (role !== "admin" && role !== "collaborateur") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      const loginUrl = new URL("/connexion", request.url)
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Protect vendor dashboard
  if (request.nextUrl.pathname.startsWith("/dashboard/vendeur")) {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      const loginUrl = new URL("/connexion", request.url)
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    const role = (session.user as { role?: string }).role
    if (role !== "vendor" && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  // Protect pro dashboard
  if (request.nextUrl.pathname.startsWith("/dashboard/pro")) {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      const loginUrl = new URL("/connexion", request.url)
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    const role = (session.user as { role?: string }).role
    if (role !== "vendor" && role !== "admin" && role !== "collaborateur") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
  ],
}