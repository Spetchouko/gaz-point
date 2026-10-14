import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { email?: string; otp?: string }
      | null

    const email = body?.email?.toLowerCase().trim()
    const otp = body?.otp?.trim()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: { message: "Email invalide." } }, { status: 400 })
    }

    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return NextResponse.json({ error: { message: "Code invalide." } }, { status: 400 })
    }

    // Use Better Auth's verifyOTP method
    const result = await auth.api.verifyEmailOTP({
      body: { email, otp },
    })

    // verifyEmailOTP returns { status: boolean; token: string; user: ... } on success
    // or throws on error
    if (!result || result.status === false) {
      return NextResponse.json(
        { error: { message: "Code invalide ou expiré." } },
        { status: 400 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[verify-email] error:", err)
    return NextResponse.json(
      { error: { message: "Une erreur inattendue est survenue." } },
      { status: 500 }
    )
  }
}