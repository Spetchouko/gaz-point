"use client"

import type { PublicSignupRole } from "@/lib/auth-routing"

export async function requestSocialSignupIntent(
  role: PublicSignupRole
): Promise<void> {
  const response = await fetch("/api/auth/social-signup-intent", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mode: "signup", role }),
    cache: "no-store",
    credentials: "same-origin",
  })

  if (!response.ok) {
    throw new Error(
      "L'inscription avec Google ne peut pas être démarrée. Veuillez réessayer."
    )
  }
}
