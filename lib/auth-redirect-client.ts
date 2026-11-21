"use client"

export type RoleRedirectAudience = "standard" | "staff"

export type RoleRedirectResult = {
  ok: true
  role: string
  redirectTo: string
}

export async function getServerRoleRedirect(
  audience: RoleRedirectAudience = "standard"
): Promise<RoleRedirectResult> {
  const response = await fetch("/api/auth/role-redirect", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ audience }),
    cache: "no-store",
  })

  const payload = (await response.json().catch(() => null)) as
    | (RoleRedirectResult & {
        error?: { code?: string; message?: string }
      })
    | null

  if (!response.ok || !payload?.ok || !payload.redirectTo) {
    throw new Error(
      payload?.error?.message ??
        "La destination de votre espace ne peut pas être déterminée."
    )
  }

  return payload as RoleRedirectResult
}
