import { NextResponse } from "next/server"
import { getApprovedAvis } from "@/lib/avis"

export const dynamic = "force-dynamic"

/** Liste publique des seuls avis validés par l'administration. */
export async function GET() {
  return NextResponse.json(
    { avis: await getApprovedAvis() },
    { headers: { "Cache-Control": "no-store" } }
  )
}
